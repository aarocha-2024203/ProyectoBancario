import Account from './accounts.model.js';
import {
    validateMinimumIncome,
    generateAccountNumber,
    validateUniqueAccountNumber,
    validateAccountHolderData
} from '../../helpers/account.helper.js';
import Currency from '../coins/coins.model.js';

const getUserById = async (userId) => {
    try {
        console.log('Llamando a auth-service para usuario:', userId);

        const response = await fetch(
            `${process.env.AUTH_SERVICE_URL}/api/v1/auth/profile-by-id`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId })
            }
        );

        console.log('Respuesta auth-service status:', response.status);

        if (!response.ok) {
            const text = await response.text();
            console.log('Respuesta auth-service body:', text);
            return null;
        }

        const data = await response.json();
        console.log('Usuario encontrado:', JSON.stringify(data));

        return data.success ? data.data : null;

    } catch (err) {
        console.error('ERROR en getUserById:', err.message);
        return null;
    }
};

const normalizeCurrencyCode = (accountData) => (
    accountData.currencyCode || accountData.currency || accountData.currencyId || ''
).toUpperCase().trim();

const resolveRequesterUserId = (req) => (
    req.user?.sub || req.user?.userId || req.userId || ''
);

const validateExistingCurrencyCode = async (currencyCode) => {
    const currency = await Currency.findOne({ code: currencyCode, status: 'activa' });
    if (!currency) {
        throw new Error(`La moneda ${currencyCode} no existe o esta inactiva`);
    }
};

export const createAccount = async (req, res) => {
    try {
        console.log('=== CREATE ACCOUNT ===');
        console.log('Body:', JSON.stringify(req.body, null, 2));

        const accountData = req.body;
        accountData.currencyCode = normalizeCurrencyCode(accountData);
        console.log('Currency:', accountData.currencyCode);

        await validateExistingCurrencyCode(accountData.currencyCode);
        console.log('Moneda OK');

        console.log('Buscando usuario:', accountData.userId);
        const user = await getUserById(accountData.userId);
        console.log('Usuario:', JSON.stringify(user));

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        accountData.name = user.name || user.Name;
        accountData.username = user.username || user.Username;
        console.log('Name:', accountData.name, 'Username:', accountData.username);

        validateAccountHolderData(accountData);
        validateMinimumIncome(accountData.monthlyIncome);
        accountData.accountNumber = generateAccountNumber();

        let retries = 0;
        const maxRetries = 10;

        while (retries < maxRetries) {
            try {
                await validateUniqueAccountNumber(accountData.accountNumber);
                break;
            } catch (error) {
                if (error.message !== 'El numero de cuenta ya existe') throw error;
                retries += 1;
                accountData.accountNumber = generateAccountNumber();
            }
        }

        if (retries === maxRetries) throw new Error('No se pudo generar un numero de cuenta unico');

        const account = new Account(accountData);
        await account.save();
        console.log('Cuenta creada:', account.accountNumber);

        res.status(201).json({
            success: true,
            message: 'Cuenta creada exitosamente',
            data: account
        });

    } catch (error) {
        console.error('ERROR createAccount:', error.message);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getAccounts = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'activa' } = req.query;
        const filter = { status };
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 }
        };

        const accounts = await Account.find(filter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort(options.sort);
        const total = await Account.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: accounts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las cuentas',
            error: error.message
        });
    }
};

export const updateAccount = async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const accountData = req.body;
        const requesterRole = req.user?.role;
        const requesterUserId = resolveRequesterUserId(req);

        if (requesterRole === 'USER_ROLE') {
            const allowedFieldsForUser = ['name', 'address', 'jobName', 'monthlyIncome'];
            const payloadKeys = Object.keys(accountData);
            const blockedFields = payloadKeys.filter((field) => !allowedFieldsForUser.includes(field));

            if (blockedFields.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Como USER_ROLE solo puedes editar: name, address, jobName, monthlyIncome',
                    blockedFields
                });
            }
        }

        if (accountData.currencyCode || accountData.currency || accountData.currencyId) {
            accountData.currencyCode = normalizeCurrencyCode(accountData);
            await validateExistingCurrencyCode(accountData.currencyCode);
        }

        delete accountData.username;
        validateAccountHolderData(accountData, { partial: true });

        if (accountData.monthlyIncome !== undefined) {
            validateMinimumIncome(accountData.monthlyIncome);
        }

        const account = await Account.findOne({ accountNumber });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        if (requesterRole === 'USER_ROLE' && String(account.userId) !== String(requesterUserId)) {
            return res.status(403).json({
                success: false,
                message: 'Esta cuenta no te pertenece'
            });
        }

        const updated = await Account.findOneAndUpdate(
            { accountNumber },
            accountData,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cuenta actualizada exitosamente',
            data: updated
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar la cuenta',
            error: error.message
        });
    }
};

export const deleteAccount = async (req, res) => {
    try {
        const { accountNumber } = req.params;

        const account = await Account.findOneAndDelete({ accountNumber });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cuenta eliminada exitosamente'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al eliminar la cuenta',
            error: error.message
        });
    }
};

export const getAccountByAccountNumber = async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const requesterRole = req.user?.role;
        const requesterUserId = resolveRequesterUserId(req);

        const account = await Account.findOne({ accountNumber });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        if (requesterRole === 'USER_ROLE' && String(account.userId) !== String(requesterUserId)) {
            return res.status(403).json({
                success: false,
                message: 'Esta cuenta no te pertenece'
            });
        }

        res.status(200).json({
            success: true,
            data: account
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al buscar la cuenta',
            error: error.message
        });
    }
};

export const changeAccountStatus = async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const { status } = req.body;

        const allowedStatus = ['activa', 'inactiva', 'bloqueada'];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado no permitido'
            });
        }

        const account = await Account.findOneAndUpdate(
            { accountNumber },
            { status },
            { new: true }
        );

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: `Cuenta ${status} correctamente`,
            data: account
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado',
            error: error.message
        });
    }
};

export const getAccountsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const requesterRole   = req.user?.role;
        const requesterUserId = req.user?.sub || req.user?.userId || req.userId || '';

        if (requesterRole === 'USER_ROLE' && userId !== requesterUserId) {
            return res.status(403).json({
                success: false,
                message: 'No puedes ver las cuentas de otro usuario'
            });
        }

        const accounts = await Account.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: accounts
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las cuentas del usuario',
            error: error.message
        });
    }
};