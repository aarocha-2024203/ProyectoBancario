import Transaction from './transaction.model.js';
import Account from '../accounts/accounts.model.js';
import {
    normalizeTransactionData,
    validateAccountNumberFormat,
    validateCurrencyForTransaction,
    applyTransactionBalances,
    validateTransferLimits
} from '../../helpers/transaction.helper.js';

const roundToTwoDecimals = (value) => Number(Number(value || 0).toFixed(2));
const FORBIDDEN_TRANSACTION_MESSAGE = 'Esta transaccion no te pertenece';

const getRequesterContext = (req) => ({
    role: req.user?.role,
    userId: req.user?.sub || req.user?.userId || req.userId || ''
});

const validateSourceAccountOwnership = async (req, sourceAccountNumber) => {
    const { role, userId } = getRequesterContext(req);

    if (role === 'ADMIN_ROLE') {
        return { allowed: true };
    }

    const sourceAccount = await Account.findOne({ accountNumber: sourceAccountNumber });
    if (!sourceAccount) {
        return { allowed: false, notFound: true };
    }

    if (String(sourceAccount.userId) !== String(userId)) {
        return { allowed: false, notFound: false };
    }

    return { allowed: true };
};

//agregar
export const createTransaction = async (req, res) => {
    try {
        const transactionData = normalizeTransactionData(req.body);
        const { sourceAccountNumber, destinationAccountNumber } = transactionData;
        const requesterRole = req.user?.role;
        const requesterUserId = req.user?.sub || req.user?.userId || req.userId || '';

        // Forzar que el ejecutor sea el usuario autenticado (no confiar en el cliente)
        transactionData.executedByUserId = requesterUserId;

        validateAccountNumberFormat(sourceAccountNumber, 'sourceAccountNumber');
        validateAccountNumberFormat(destinationAccountNumber, 'destinationAccountNumber');

        if (!transactionData.executedByUserId) {
            throw new Error('El usuario que ejecuta la transaccion es requerido');
        }

        if (sourceAccountNumber === destinationAccountNumber && transactionData.transactionType === 'transferencia') {
            throw new Error('La cuenta origen y destino no pueden ser la misma en una transferencia');
        }

        const [sourceAccount, destinationAccount] = await Promise.all([
            Account.findOne({ accountNumber: sourceAccountNumber }),
            Account.findOne({ accountNumber: destinationAccountNumber })
        ]);

        if (!sourceAccount || !destinationAccount) {
            return res.status(404).json({
                success: false,
                message: 'Una o ambas cuentas no existen'
            });
        }

        await validateCurrencyForTransaction(transactionData.currencyCode, sourceAccount, destinationAccount);

        // Si el solicitante es un usuario normal, asegurar que la cuenta origen le pertenece
        if (requesterRole === 'USER_ROLE') {
            if (String(sourceAccount.userId) !== String(requesterUserId)) {
                // Intentar obtener una cuenta propia para mostrar en el mensaje, si existe
                const ownAccount = await Account.findOne({ userId: requesterUserId });
                const ownAccountNumber = ownAccount ? ownAccount.accountNumber : 'ACC-000-0000';

                return res.status(403).json({
                    success: false,
                    message: `esta cuenta no te pertenece la tuya es ${ownAccountNumber}`
                });
            }
        }

        // Valida reglas de negocio para transferencias:
        // maximo por operacion (Q2000), saldo disponible y limite diario (Q10000).
        await validateTransferLimits({
            transactionType: transactionData.transactionType,
            sourceAccountNumber,
            amount: Number(transactionData.amount),
            sourceAccount
        });

        const { previousBalance, newBalance } = await applyTransactionBalances({
            transactionType: transactionData.transactionType,
            amount: Number(transactionData.amount),
            sourceAccount,
            destinationAccount,
            transactionCurrency: transactionData.currencyCode
        });

        sourceAccount.balance = roundToTwoDecimals(sourceAccount.balance);
        destinationAccount.balance = roundToTwoDecimals(destinationAccount.balance);
        transactionData.previousBalance = roundToTwoDecimals(previousBalance);
        transactionData.newBalance = roundToTwoDecimals(newBalance);

        await Promise.all([
            sourceAccount.save(),
            destinationAccount.save()
        ]);

        const transaction = new Transaction(transactionData);
        await transaction.save();

        res.status(201).json({
            success: true,
            message: 'TransacciÃ³n creada exitosamente',
            data: transaction
        })

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear la transacciÃ³n',
            error: error.message
        })
    }
}

export const getTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'exitosa' } = req.query;
        const filter = { status };
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 }
        }

        const transactions = await Transaction.find(filter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort(options.sort);
        const total = await Transaction.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: transactions,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las transacciones',    
            error: error.message
        })
    }

}

export const getFavorites = async (req, res) => {
    try {
        const requesterUserId = req.user?.sub || req.user?.userId || req.userId || '';

        if (!requesterUserId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        const favoriteTransactions = await Transaction.find(
            {
                executedByUserId: requesterUserId,
                favorito: true,
                destinationAccountNumber: { $nin: [null, ''] }
            },
            { destinationAccountNumber: 1, alias: 1, _id: 0 }
        ).sort({ createdAt: -1 });

        const favoritesByAccount = new Map();
        for (const tx of favoriteTransactions) {
            const accountNumber = tx.destinationAccountNumber;
            if (!accountNumber || favoritesByAccount.has(accountNumber)) {
                continue;
            }

            favoritesByAccount.set(accountNumber, {
                accountNumber,
                alias: String(tx.alias || '').trim()
            });
        }

        const uniqueAccountNumbers = [...favoritesByAccount.keys()];

        if (uniqueAccountNumbers.length === 0) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        const destinationAccounts = await Account.find(
            { accountNumber: { $in: uniqueAccountNumbers } },
            { accountNumber: 1, name: 1, _id: 0 }
        );

        const accountByNumber = new Map(
            destinationAccounts.map((acc) => [acc.accountNumber, acc])
        );

        const favorites = uniqueAccountNumbers.map((accountNumber) => {
            const account = accountByNumber.get(accountNumber);
            const favorite = favoritesByAccount.get(accountNumber);
            return {
                accountNumber,
                name: account?.name || '',
                alias: favorite?.alias || ''
            };
        });

        return res.status(200).json({
            success: true,
            data: favorites
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener favoritos',
            error: error.message
        });
    }
}

export const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const transactionData = { ...req.body };

        const existingTransaction = await Transaction.findById(id);
        if (!existingTransaction) {
            return res.status(404).json({ success: false, message: 'Transacción no encontrada' });
        }

        const ownership = await validateSourceAccountOwnership(req, existingTransaction.sourceAccountNumber);
        if (ownership.notFound) {
            return res.status(404).json({ success: false, message: 'Cuenta origen no encontrada' });
        }
        if (!ownership.allowed) {
            return res.status(403).json({
                success: false,
                message: FORBIDDEN_TRANSACTION_MESSAGE
            });
        }

        if (Object.prototype.hasOwnProperty.call(transactionData, 'favorito')) {
            const favoriteValue =
                transactionData.favorito === true ||
                transactionData.favorito === 'true' ||
                transactionData.favorito === 1 ||
                transactionData.favorito === '1';

            transactionData.favorito = favoriteValue;
            if (!favoriteValue) {
                transactionData.alias = '';
            } else if (Object.prototype.hasOwnProperty.call(transactionData, 'alias')) {
                transactionData.alias = String(transactionData.alias || '').trim();
            }
        } else if (Object.prototype.hasOwnProperty.call(transactionData, 'alias')) {
            const currentFavorite = Boolean(existingTransaction.favorito);
            transactionData.alias = currentFavorite ? String(transactionData.alias || '').trim() : '';
        }

        const transaction = await Transaction.findByIdAndUpdate(
            id,
            transactionData,
            { new: true, runValidators: true }
        );
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transacción no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Transacción actualizada exitosamente',
            data: transaction
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar la transacción',
            error: error.message
        });
    }
}
export const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findById(id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transacción no encontrada'
            })
        }

        const ownership = await validateSourceAccountOwnership(req, transaction.sourceAccountNumber);
        if (ownership.notFound) {
            return res.status(404).json({ success: false, message: 'Cuenta origen no encontrada' });
        }
        if (!ownership.allowed) {
            return res.status(403).json({
                success: false,
                message: FORBIDDEN_TRANSACTION_MESSAGE
            });
        }

        await Transaction.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: 'Transacción eliminada exitosamente'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al eliminar la transacción',
            error: error.message
        })
    }
}
export const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await Transaction.findById(id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transacción no encontrada'
            });
        }

        const ownership = await validateSourceAccountOwnership(req, transaction.sourceAccountNumber);
        if (ownership.notFound) {
            return res.status(404).json({ success: false, message: 'Cuenta origen no encontrada' });
        }
        if (!ownership.allowed) {
            return res.status(403).json({
                success: false,
                message: FORBIDDEN_TRANSACTION_MESSAGE
            });
        }

        res.status(200).json({
            success: true,
            data: transaction
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al buscar la transacción',
            error: error.message
        });
    }
};
