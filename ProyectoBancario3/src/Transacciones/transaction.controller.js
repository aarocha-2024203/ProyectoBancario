'use strict';

import Transaction from './transaction.model.js';
import Account from '../Cuenta/cuentas.model.js';
import mongoose from 'mongoose';

// Listar transacciones
export const getTransactions = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            accountId, 
            type,
            startDate,
            endDate 
        } = req.query;
        
        const filter = {};

        if (accountId) {
            filter.$or = [
                { fromAccount: accountId },
                { toAccount: accountId }
            ];
        }

        if (type) filter.type = type;

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const transactions = await Transaction.find(filter)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Transaction.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: transactions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al obtener las transacciones',
            error: error.message
        });
    }
};

// Obtener transacción por ID
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

        res.status(200).json({
            success: true,
            data: transaction
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al obtener la transacción',
            error: error.message
        });
    }
};

// Obtener transacciones por cuenta (últimas 5 para el historial)
export const getLastTransactionsByAccount = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { limit = 5 } = req.query;

        const transactions = await Transaction.find({
            $or: [
                { fromAccount: accountId },
                { toAccount: accountId }
            ],
            status: { $ne: 'REVERSED' }
        })
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: transactions
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al obtener las transacciones de la cuenta',
            error: error.message
        });
    }
};

// Realizar transferencia (SIN transacciones de MongoDB)
export const createTransfer = async (req, res) => {
    try {
        const { fromAccountNumber, toAccountNumber, amount, description } = req.body;

        // Validar monto mínimo
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser mayor a 0'
            });
        }

        // Validar monto máximo por transferencia
        if (amount > 2000) {
            return res.status(400).json({
                success: false,
                message: 'No se puede transferir más de Q2000 por transacción'
            });
        }

        // Obtener cuentas
        const fromAccount = await Account.findOne({ 
            numeroCuenta: fromAccountNumber,
            estado: 'ACTIVA'
        });

        const toAccount = await Account.findOne({ 
            numeroCuenta: toAccountNumber,
            estado: 'ACTIVA'
        });

        if (!fromAccount) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta origen no encontrada o inactiva'
            });
        }

        if (!toAccount) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta destino no encontrada o inactiva'
            });
        }

        // Validar saldo suficiente
        if (fromAccount.saldoDisponible < amount) {
            return res.status(400).json({
                success: false,
                message: 'Saldo insuficiente'
            });
        }

        // Actualizar saldos
        fromAccount.saldo -= amount;
        fromAccount.saldoDisponible -= amount;
        fromAccount.ultimoMovimiento = new Date();

        toAccount.saldo += amount;
        toAccount.saldoDisponible += amount;
        toAccount.ultimoMovimiento = new Date();

        await fromAccount.save();
        await toAccount.save();

        // Crear transacción
        const transaction = new Transaction({
            type: 'TRANSFER',
            fromAccount: fromAccount.numeroCuenta,
            toAccount: toAccount.numeroCuenta,
            amount,
            description,
            status: 'COMPLETED'
        });

        await transaction.save();

        res.status(201).json({
            success: true,
            message: 'Transferencia realizada exitosamente',
            data: {
                transaction,
                fromAccountBalance: fromAccount.saldoDisponible,
                toAccountBalance: toAccount.saldoDisponible
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al realizar la transferencia',
            error: error.message
        });
    }
};

// Realizar depósito (SIN transacciones de MongoDB)
export const createDeposit = async (req, res) => {
    try {
        const { toAccountNumber, amount, description } = req.body;

        // Validar monto
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser mayor a 0'
            });
        }

        // Obtener cuenta destino
        const toAccount = await Account.findOne({ 
            numeroCuenta: toAccountNumber,
            estado: 'ACTIVA'
        });

        if (!toAccount) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta destino no encontrada o inactiva'
            });
        }

        // Actualizar saldo
        toAccount.saldo += amount;
        toAccount.saldoDisponible += amount;
        toAccount.ultimoMovimiento = new Date();
        await toAccount.save();

        // Crear transacción
        const transaction = new Transaction({
            type: 'DEPOSIT',
            toAccount: toAccount.numeroCuenta,
            amount,
            description,
            status: 'COMPLETED'
        });

        await transaction.save();

        res.status(201).json({
            success: true,
            message: 'Depósito realizado exitosamente',
            data: {
                transaction,
                toAccountBalance: toAccount.saldoDisponible,
                revertibleUntil: new Date(Date.now() + 60000) // 1 minuto
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al realizar el depósito',
            error: error.message
        });
    }
};

// Revertir depósito (solo dentro de 1 minuto)
export const reverseDeposit = async (req, res) => {
    try {
        const { transactionId } = req.params;

        const originalTransaction = await Transaction.findById(transactionId);

        if (!originalTransaction) {
            return res.status(404).json({
                success: false,
                message: 'Transacción no encontrada'
            });
        }

        if (originalTransaction.type !== 'DEPOSIT') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden revertir depósitos'
            });
        }

        if (originalTransaction.status === 'REVERSED') {
            return res.status(400).json({
                success: false,
                message: 'Este depósito ya fue revertido'
            });
        }

        // Verificar tiempo (1 minuto)
        const timeDiff = Date.now() - originalTransaction.createdAt.getTime();
        if (timeDiff > 60000) {
            return res.status(400).json({
                success: false,
                message: 'Ya no es posible revertir este depósito (máximo 1 minuto)'
            });
        }

        // Obtener cuenta
        const account = await Account.findOne({ 
            numeroCuenta: originalTransaction.toAccount 
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        // Validar saldo suficiente para revertir
        if (account.saldoDisponible < originalTransaction.amount) {
            return res.status(400).json({
                success: false,
                message: 'Saldo insuficiente para revertir el depósito'
            });
        }

        // Revertir saldo
        account.saldo -= originalTransaction.amount;
        account.saldoDisponible -= originalTransaction.amount;
        account.ultimoMovimiento = new Date();
        await account.save();

        // Marcar transacción original como revertida
        originalTransaction.status = 'REVERSED';
        await originalTransaction.save();

        // Crear transacción de reversión
        const reversalTransaction = new Transaction({
            type: 'REVERSAL',
            toAccount: originalTransaction.toAccount,
            amount: originalTransaction.amount,
            description: `Reversión de depósito: ${originalTransaction.transactionId}`,
            status: 'COMPLETED',
            originalTransactionId: originalTransaction._id
        });

        await reversalTransaction.save();

        res.status(200).json({
            success: true,
            message: 'Depósito revertido exitosamente',
            data: {
                reversalTransaction,
                accountBalance: account.saldoDisponible
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al revertir el depósito',
            error: error.message
        });
    }
};

// Obtener cuentas con más movimientos
export const getAccountsWithMostTransactions = async (req, res) => {
    try {
        const { order = 'desc', limit = 10 } = req.query;

        const pipeline = [
            {
                $match: {
                    status: { $ne: 'REVERSED' },
                    type: { $in: ['TRANSFER', 'PURCHASE', 'PAYMENT'] }
                }
            },
            {
                $group: {
                    _id: '$fromAccount',
                    transactionCount: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            {
                $sort: { transactionCount: order === 'desc' ? -1 : 1 }
            },
            {
                $limit: parseInt(limit)
            }
        ];

        const results = await Transaction.aggregate(pipeline);

        res.status(200).json({
            success: true,
            data: results
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al obtener cuentas con más movimientos',
            error: error.message
        });
    }
};