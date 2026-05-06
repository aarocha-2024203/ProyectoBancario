import mongoose from 'mongoose';
import AccountStatement from './accountStatements.model.js';
import Account from '../accounts/accounts.model.js';
import Currency from '../coins/coins.model.js';
import Transaction from '../transaction/transaction.model.js';
import Withdrawal from '../withdrawal/withdrawal.model.js';
import Deposit from '../deposits/deposits.model.js';
import {
    buildStatementSummary,
    generateStatementPdf,
} from '../../helpers/accountStatement.helper.js';
import { sendAccountStatementEmail } from '../../helpers/email-service.js';

// Utilidades internas 

const resolveAccountByCode = async (accountNumber) => {
    const normalized = String(accountNumber || '').toUpperCase().trim();
    return Account.findOne({ accountNumber: normalized });
};

const parseDateRange = (query) => {
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodStart = query.periodStart ? new Date(query.periodStart) : defaultStart;
    const periodEnd = query.periodEnd ? new Date(query.periodEnd) : now;

    if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
        throw new Error('periodStart y periodEnd deben ser fechas validas');
    }
    if (periodStart > periodEnd) {
        throw new Error('periodStart no puede ser mayor que periodEnd');
    }

    return { periodStart, periodEnd };
};

// CRUD

export const createAccountStatement = async (req, res) => {
    try {
        const accountStatementData = req.body;

        if (accountStatementData.accountNumber && !accountStatementData.accountId) {
            const account = await resolveAccountByCode(accountStatementData.accountNumber);
            if (!account) {
                return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
            }
            accountStatementData.accountId = account._id;
        }

        const accountStatement = new AccountStatement(accountStatementData);
        await accountStatement.save();

        res.status(201).json({
            success: true,
            message: 'Estado de cuenta creado exitosamente',
            data: accountStatement,
        });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error al crear el estado de cuenta', error: error.message });
    }
};

export const getAccountStatements = async (req, res) => {
    try {
        const { page = 1, limit = 10, accountId, accountNumber } = req.query;
        const filter = {};

        if (accountId) {
            if (!mongoose.Types.ObjectId.isValid(accountId)) {
                return res.status(400).json({ success: false, message: 'accountId invalido' });
            }
            filter.accountId = new mongoose.Types.ObjectId(accountId);
        }

        if (accountNumber) {
            const account = await resolveAccountByCode(accountNumber);
            if (!account) {
                return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
            }
            filter.accountId = account._id;
        }

        const numericPage = parseInt(page, 10);
        const numericLimit = parseInt(limit, 10);

        const accountStatements = await AccountStatement.find(filter)
            .limit(numericLimit)
            .skip((numericPage - 1) * numericLimit)
            .sort({ createdAt: -1 });

        const total = await AccountStatement.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: accountStatements,
            pagination: {
                currentPage: numericPage,
                totalPages: Math.ceil(total / numericLimit),
                totalRecords: total,
                limit: numericLimit,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al mandar los estados de cuenta', error: error.message });
    }
};

export const updateAccountStatement = async (req, res) => {
    try {
        const { id } = req.params;
        const accountStatement = await AccountStatement.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true },
        );

        if (!accountStatement) {
            return res.status(404).json({ success: false, message: 'Estado de cuenta no encontrado' });
        }

        res.status(200).json({ success: true, message: 'Estado de cuenta actualizado exitosamente', data: accountStatement });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error al actualizar el estado de cuenta', error: error.message });
    }
};

export const deleteAccountStatement = async (req, res) => {
    try {
        const { id } = req.params;
        const accountStatement = await AccountStatement.findByIdAndDelete(id);

        if (!accountStatement) {
            return res.status(404).json({ success: false, message: 'Estado de cuenta no encontrado' });
        }

        res.status(200).json({ success: true, message: 'Estado de cuenta eliminado exitosamente' });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error al eliminar el estado de cuenta', error: error.message });
    }
};

export const getAccountStatementById = async (req, res) => {
    try {
        const { id } = req.params;
        const accountStatement = await AccountStatement.findById(id);

        if (!accountStatement) {
            return res.status(404).json({ success: false, message: 'Estado de cuenta no encontrado' });
        }

        res.status(200).json({ success: true, data: accountStatement });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al buscar el estado de cuenta', error: error.message });
    }
};

// Generación y envío del PDF por correo

export const downloadAccountStatementPdfByAccountNumber = async (req, res) => {
    try {
        const { accountNumber } = req.params;

        // 1. Resolver cuenta
        const account = await resolveAccountByCode(accountNumber);
        if (!account) {
            return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
        }

        // 1.1 Validar que la cuenta le pertenezca al usuario autenticado
        const requesterUserId = req.user?.sub || req.user?.userId || req.userId || '';
        if (!requesterUserId) {
            return res.status(401).json({
                success: false,
                message: 'No se pudo identificar al usuario autenticado',
            });
        }

        if (String(account.userId) !== String(requesterUserId)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para solicitar el estado de cuenta de esta cuenta',
            });
        }

        // 2. Datos del usuario autenticado viene del token
        const userEmail = req.user?.email;
        const userName = [req.user?.name, req.user?.surname].filter(Boolean).join(' ') || 'Usuario';

        if (!userEmail) {
            return res.status(401).json({
                success: false,
                message: 'No se pudo obtener el correo del usuario autenticado',
            });
        }

        // 3. Rango de fechas
        const { periodStart, periodEnd } = parseDateRange(req.query);

        // 4. Obtener transacciones del período
        const transactions = await Transaction.find({
            status: 'exitosa',
            transactionType: { $ne: 'deposito' },
            transactionDate: { $gte: periodStart, $lte: periodEnd },
            $or: [
                { sourceAccountNumber: account.accountNumber },
                { destinationAccountNumber: account.accountNumber },
            ],
        }).sort({ transactionDate: 1 });

        // 5. Integrar retiros del módulo withdrawal
        const withdrawals = await Withdrawal.find({
            accountNumber: account.accountNumber,
            createdAt: { $gte: periodStart, $lte: periodEnd },
        }).sort({ createdAt: 1 });

        const withdrawalTransactions = withdrawals.map((wd) => ({
            transactionDate: wd.createdAt ?? wd.date,
            transactionType: 'retiro',
            amount: wd.amount,
            currencyCode: wd.currencyCode || account.currencyCode,
            description: wd.description,
            sourceAccountNumber: wd.accountNumber,
            destinationAccountNumber: null,
            status: 'exitosa',
        }));

        // 6. Integrar depósitos
        const deposits = await Deposit.find({
            accountNumber: account.accountNumber,
            status: 'exitosa',
            createdAt: { $gte: periodStart, $lte: periodEnd },
        }).sort({ createdAt: 1 });

        const depositTransactions = deposits.map((dp) => ({
            transactionDate: dp.createdAt ?? dp.date,
            transactionType: 'deposito',
            amount: dp.amount,
            currencyCode: dp.currencyCode,
            description: dp.description,
            sourceAccountNumber: null,
            destinationAccountNumber: dp.accountNumber,
            status: 'exitosa',
        }));

        // 7. Unir y ordenar todos los movimientos
        const allTransactions = [...transactions, ...withdrawalTransactions, ...depositTransactions]
            .sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate));

        // 7.1 Obtener simbolos de moneda para mostrar en PDF
        const activeCurrencies = await Currency.find({ status: 'activa' }).select('code symbol -_id');
        const currencySymbols = activeCurrencies.reduce((acc, currency) => {
            acc[currency.code] = currency.symbol;
            return acc;
        }, {});
        const accountCurrencySymbol = currencySymbols[account.currencyCode] || account.currencyCode || 'GTQ';

        // 8. Construir resumen
        const summary = buildStatementSummary({ account, transactions: allTransactions, periodStart, periodEnd });

        // 9. Persistir el estado de cuenta en BD
        const statement = await AccountStatement.create({
            accountId: account._id,
            periodStart: summary.periodStart,
            periodEnd: summary.periodEnd,
            openingBalance: summary.openingBalance,
            closingBalance: summary.closingBalance,
            totalDeposits: summary.totalDeposits,
            totalWithdrawals: summary.totalWithdrawals,
            totalTransfersSent: summary.totalTransfersSent,
            totalTransfersReceived: summary.totalTransfersReceived,
            interestEarned: summary.interestEarned,
            feesCharged: summary.feesCharged,
        });

        // 10. Generar el PDF en memoria 
        const pdfBuffer = generateStatementPdf({
            account: {
                bankName: account.bankName ?? 'Banco Nacional',
                ownerId: req.user?.sub,
                ownerName: userName,
                accountNumber: account.accountNumber,
                accountType: account.accountType ?? account.type,
                currency: account.currencyCode ?? 'GTQ',
                currencySymbol: accountCurrencySymbol,
            },
            summary,
            currencySymbols,
            transactions: allTransactions.map((tx) => ({
                date: tx.transactionDate,
                transactionType: tx.transactionType,
                amount: tx.amount,
                currencyCode: tx.currencyCode || account.currencyCode,
                description: tx.description,
                sourceAccountNumber: tx.sourceAccountNumber,
                destinationAccountNumber: tx.destinationAccountNumber,
            })),
        });

        // 11. Enviar el PDF por correo al usuario autenticado
        await sendAccountStatementEmail({
            email: userEmail,
            name: userName,
            pdfBuffer,
            accountNumber: account.accountNumber,
            periodStart,
            periodEnd,
        });

        // 12. Responder al cliente con confirmación 
        return res.status(200).json({
            success: true,
            message: `Estado de cuenta enviado correctamente al correo ${userEmail}`,
            data: {
                statementId: statement._id,
                accountNumber: account.accountNumber,
                periodStart,
                periodEnd,
                sentTo: userEmail,
            },
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Error al generar o enviar el estado de cuenta',
            error: error.message,
        });
    }
};
