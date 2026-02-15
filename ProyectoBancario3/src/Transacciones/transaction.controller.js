'use strict';

import Transaction from './transaction.model.js';
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
            .populate({
                path: 'fromAccount',
                populate: {
                    path: 'userId',
                    select: 'name username'
                }
            })
            .populate({
                path: 'toAccount',
                populate: {
                    path: 'userId',
                    select: 'name username'
                }
            })
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
        
        const transaction = await Transaction.findById(id)
            .populate({
                path: 'fromAccount',
                populate: {
                    path: 'userId',
                    select: 'name username'
                }
            })
            .populate({
                path: 'toAccount',
                populate: {
                    path: 'userId',
                    select: 'name username'
                }
            })
            .populate('originalTransactionId');

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
        .populate({
            path: 'fromAccount',
            populate: {
                path: 'userId',
                select: 'name'
            }
        })
        .populate({
            path: 'toAccount',
            populate: {
                path: 'userId',
                select: 'name'
            }
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

// Realizar transferencia
export const createTransfer = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { fromAccountNumber, toAccountNumber, amount, description } = req.body;

        // Validar monto mínimo
        if (amount <= 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser mayor a 0'
            });
        }

        // Validar monto máximo por transferencia
        if (amount > 2000) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: 'No se puede transferir más de Q2000 por transacción'
            });
        }

        // Obtener cuentas
        const fromAccount = await Account.findOne({ 
            accountNumber: fromAccountNumber, 
            isActive: true 
        }).session(session);

        const toAccount = await Account.findOne({ 
            accountNumber: toAccountNumber, 
            isActive: true 
        }).session(session);

        if (!fromAccount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: 'Cuenta origen no encontrada o inactiva'
            });
        }

        if (!toAccount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: 'Cuenta destino no encontrada o inactiva'
            });
        }

        // Validar saldo suficiente
        if (fromAccount.balance < amount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: 'Saldo insuficiente'
            });
        }

        // Validar límite diario
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (fromAccount.lastTransferDate && fromAccount.lastTransferDate >= today) {
            if (fromAccount.dailyTransferTotal + amount > 10000) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    message: 'Has excedido el límite diario de transferencias (Q10,000)'
                });
            }
        } else {
            // Resetear contador diario
            fromAccount.dailyTransferTotal = 0;
        }

        // Actualizar saldos
        fromAccount.balance -= amount;
        fromAccount.dailyTransferTotal += amount;
        fromAccount.lastTransferDate = new Date();

        toAccount.balance += amount;

        await fromAccount.save({ session });
        await toAccount.save({ session });

        // Crear transacción
        const transaction = new Transaction({
            type: 'TRANSFER',
            fromAccount: fromAccount.accountNumber,
            toAccount: toAccount.accountNumber,
            amount,
            description,
            status: 'COMPLETED'
        });

        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: 'Transferencia realizada exitosamente',
            data: {
                transaction,
                fromAccountBalance: fromAccount.balance,
                toAccountBalance: toAccount.balance
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({
            success: false,
            message: 'Error al realizar la transferencia',
            error: error.message
        });
    }
};

// Realizar depósito
export const createDeposit = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { toAccountNumber, amount, description } = req.body;

        // Validar monto
        if (amount <= 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser mayor a 0'
            });
        }

        // Obtener cuenta destino
        const toAccount = await Account.findOne({ 
            accountNumber: toAccountNumber, 
            isActive: true 
        }).session(session);

        if (!toAccount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: 'Cuenta destino no encontrada o inactiva'
            });
        }

        // Actualizar saldo
        toAccount.balance += amount;
        await toAccount.save({ session });

        // Crear transacción
        const transaction = new Transaction({
            type: 'DEPOSIT',
            toAccount: toAccount.accountNumber,
            amount,
            description,
            status: 'COMPLETED'
        });

        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Guardar timestamp para posible reversión
        transaction._createdAt = new Date();

        res.status(201).json({
            success: true,
            message: 'Depósito realizado exitosamente',
            data: {
                transaction,
                toAccountBalance: toAccount.balance,
                revertibleUntil: new Date(Date.now() + 60000) // 1 minuto
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({
            success: false,
            message: 'Error al realizar el depósito',
            error: error.message
        });
    }
};

// Revertir depósito (solo dentro de 1 minuto)
export const reverseDeposit = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { transactionId } = req.params;

        const originalTransaction = await Transaction.findById(transactionId).session(session);

        if (!originalTransaction) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: 'Transacción no encontrada'
            });
        }

        if (originalTransaction.type !== 'DEPOSIT') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden revertir depósitos'
            });
        }

        if (originalTransaction.status === 'REVERSED') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: 'Este depósito ya fue revertido'
            });
        }

        // Verificar tiempo (1 minuto)
        const timeDiff = Date.now() - originalTransaction.createdAt.getTime();
        if (timeDiff > 60000) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: 'Ya no es posible revertir este depósito (máximo 1 minuto)'
            });
        }

        // Obtener cuenta
        const account = await Account.findOne({ 
            accountNumber: originalTransaction.toAccount 
        }).session(session);

        if (!account) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        // Validar saldo suficiente para revertir
        if (account.balance < originalTransaction.amount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: 'Saldo insuficiente para revertir el depósito'
            });
        }

        // Revertir saldo
        account.balance -= originalTransaction.amount;
        await account.save({ session });

        // Marcar transacción original como revertida
        originalTransaction.status = 'REVERSED';
        await originalTransaction.save({ session });

        // Crear transacción de reversión
        const reversalTransaction = new Transaction({
            type: 'REVERSAL',
            toAccount: originalTransaction.toAccount,
            amount: originalTransaction.amount,
            description: `Reversión de depósito: ${originalTransaction.transactionId}`,
            status: 'COMPLETED',
            originalTransactionId: originalTransaction._id
        });

        await reversalTransaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: 'Depósito revertido exitosamente',
            data: {
                reversalTransaction,
                accountBalance: account.balance
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
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
                $lookup: {
                    from: 'accounts',
                    localField: '_id',
                    foreignField: 'accountNumber',
                    as: 'accountInfo'
                }
            },
            {
                $unwind: '$accountInfo'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'accountInfo.userId',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            {
                $unwind: '$userInfo'
            },
            {
                $project: {
                    _id: 0,
                    accountNumber: '$_id',
                    accountType: '$accountInfo.accountType',
                    balance: '$accountInfo.balance',
                    userName: '$userInfo.name',
                    userUsername: '$userInfo.username',
                    transactionCount: 1,
                    totalAmount: 1
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