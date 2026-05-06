'use strict';

import Deposit from './deposits.model.js';
import Account from '../accounts/accounts.model.js';
import Currency from '../coins/coins.model.js';
import {
    normalizeDepositData,
    validateDepositInput,
    applyDepositBalance,
    applyDepositAmountUpdate,
    applyDepositReversal,
    validateDepositCanBeReverted,
    createDepositTransaction,
    syncDepositTransaction
} from '../../helpers/deposit.helper.js';

const resolveExecutingUserId = (req, payload) =>
    payload.executedByUserId || payload.userId || req.user?.sub || req.user?.userId || '';

const roundToTwoDecimals = (value) => Number(Number(value || 0).toFixed(2));


export const createDeposit = async (req, res) => {
    try {
        const depositData = normalizeDepositData(req.body);
        depositData.executedByUserId = resolveExecutingUserId(req, depositData);

        validateDepositInput(depositData);

        const account = await Account.findOne({ accountNumber: depositData.accountNumber });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        // Permitimos depositos en otra moneda: convertiremos al currency de la cuenta
        const { previousBalance, newBalance } = await applyDepositBalance(account, depositData.amount, depositData.currencyCode);
        account.balance = roundToTwoDecimals(account.balance);
        depositData.previousBalance = roundToTwoDecimals(previousBalance);
        depositData.newBalance = roundToTwoDecimals(newBalance);

        const deposit = new Deposit(depositData);

        await account.save();
        await deposit.save();

        const transaction = await createDepositTransaction({
            deposit,
            accountNumber: account.accountNumber
        });

        deposit.transactionId = transaction._id;
        await deposit.save();

        return res.status(201).json({
            success: true,
            message: 'Deposito realizado exitosamente',
            data: deposit
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Error al crear el deposito',
            error: error.message
        });
    }
};

export const getDeposits = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'exitosa', accountNumber } = req.query;
        const filter = { status };

        if (accountNumber) {
            filter.accountNumber = String(accountNumber).toUpperCase().trim();
        }

        const numericPage = parseInt(page, 10);
        const numericLimit = parseInt(limit, 10);

        const deposits = await Deposit.find(filter)
            .limit(numericLimit)
            .skip((numericPage - 1) * numericLimit)
            .sort({ createdAt: -1 });

        const total = await Deposit.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: deposits,
            pagination: {
                currentPage: numericPage,
                totalPages: Math.ceil(total / numericLimit),
                totalRecords: total,
                limit: numericLimit
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los depositos',
            error: error.message
        });
    }
};

export const getDepositById = async (req, res) => {
    try {
        const { id } = req.params;
        const deposit = await Deposit.findById(id);

        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: 'Deposito no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            data: deposit
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al buscar el deposito',
            error: error.message
        });
    }
};

export const updateDepositAmount = async (req, res) => {
    try {
        const { id } = req.params;
        const newAmount = Number(req.body.amount);
        const executedByUserId = resolveExecutingUserId(req, req.body || {});

        const deposit = await Deposit.findById(id);

        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: 'Deposito no encontrado'
            });
        }

        if (deposit.status === 'reversada') {
            return res.status(400).json({
                success: false,
                message: 'No se puede modificar un deposito reversado'
            });
        }

        if (Number.isNaN(newAmount) || newAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser mayor a 0'
            });
        }

        const account = await Account.findOne({ accountNumber: deposit.accountNumber });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        const { previousBalance, newBalance } = await applyDepositAmountUpdate(
            account,
            deposit.amount,
            newAmount,
            deposit.currencyCode
        );

        account.balance = roundToTwoDecimals(account.balance);
        deposit.amount = roundToTwoDecimals(newAmount);
        deposit.previousBalance = roundToTwoDecimals(previousBalance);
        deposit.newBalance = roundToTwoDecimals(newBalance);
        deposit.executedByUserId = executedByUserId || deposit.executedByUserId;

        await account.save();
        await deposit.save();

        await syncDepositTransaction(deposit.transactionId, {
            amount: deposit.amount,
            previousBalance: deposit.previousBalance,
            newBalance: deposit.newBalance,
            executedByUserId: deposit.executedByUserId,
            description: deposit.description
        });

        return res.status(200).json({
            success: true,
            message: 'Monto del deposito actualizado exitosamente',
            data: deposit
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Error al actualizar el deposito',
            error: error.message
        });
    }
};

export const deleteDeposit = async (req, res) => (
    res.status(405).json({
        success: false,
        message: 'Los depositos no pueden eliminarse. Puedes revertirlos dentro de 1 minuto.'
    })
);

export const revertDeposit = async (req, res) => {
    try {
        const { id } = req.params;
        const executedByUserId = resolveExecutingUserId(req, req.body || {});

        const deposit = await Deposit.findById(id);
        validateDepositCanBeReverted(deposit);

        const account = await Account.findOne({ accountNumber: deposit.accountNumber });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        const { previousBalance, newBalance } = await applyDepositReversal(account, deposit.amount, deposit.currencyCode);

        account.balance = roundToTwoDecimals(account.balance);
        deposit.status = 'reversada';
        deposit.reversedAt = new Date();
        deposit.previousBalance = roundToTwoDecimals(previousBalance);
        deposit.newBalance = roundToTwoDecimals(newBalance);
        deposit.executedByUserId = executedByUserId || deposit.executedByUserId;

        await account.save();
        await deposit.save();

        await syncDepositTransaction(deposit.transactionId, {
            status: 'reversada',
            description: `${deposit.description} (reversado)`,
            previousBalance: deposit.previousBalance,
            newBalance: deposit.newBalance,
            executedByUserId: deposit.executedByUserId
        });

        return res.status(200).json({
            success: true,
            message: 'Deposito reversado exitosamente',
            data: deposit
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Error al revertir el deposito',
            error: error.message
        });
    }
};
