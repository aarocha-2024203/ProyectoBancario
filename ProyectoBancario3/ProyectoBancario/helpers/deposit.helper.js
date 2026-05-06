'use strict';

import Transaction from '../src/transaction/transaction.model.js';
import { convertAmount } from './conversionCurrency.helper.js';

const ACCOUNT_NUMBER_REGEX = /^[A-Z]{3}-\d{3}-\d{4}$/;
const MAX_REVERT_WINDOW_MS = 60 * 1000;

export const normalizeDepositData = (payload = {}) => {
    const normalized = { ...payload };

    normalized.accountNumber = String(
        normalized.accountNumber || normalized.destinationAccountNumber || ''
    ).toUpperCase().trim();

    normalized.currencyCode = String(
        normalized.currencyCode || normalized.currency || normalized.currencyId || ''
    ).toUpperCase().trim();

    normalized.executedByUserId = String(
        normalized.executedByUserId || normalized.userId || ''
    ).trim();

    normalized.amount = Number(normalized.amount);

    return normalized;
};

export const validateDepositInput = (depositData) => {
    if (!ACCOUNT_NUMBER_REGEX.test(depositData.accountNumber)) {
        throw new Error('El numero de cuenta debe tener formato ABC-000-0000');
    }

    if (!depositData.currencyCode || !/^[A-Z]{3}$/.test(depositData.currencyCode)) {
        throw new Error('El codigo de moneda debe tener formato ABC');
    }

    if (!depositData.executedByUserId) {
        throw new Error('El usuario que ejecuta el deposito es requerido');
    }

    if (Number.isNaN(depositData.amount) || depositData.amount <= 0) {
        throw new Error('El monto debe ser mayor a 0');
    }
};

export const applyDepositBalance = async (account, amount, depositCurrency) => {
    const previousBalance = Number(account.balance) || 0;
    /* Aquí verificamos si la moneda del depósito es diferente a la moneda de la cuenta
     si es diferente, convertimos el monto a la moneda de la cuenta */
    const creditAmount = depositCurrency && depositCurrency !== account.currencyCode
        ? await convertAmount(amount, depositCurrency, account.currencyCode)
        : Number(amount);

    const newBalance = previousBalance + Number(creditAmount);

    account.balance = newBalance;

    return { previousBalance, newBalance };
};

export const applyDepositAmountUpdate = async (account, previousAmount, newAmount, depositCurrency) => {
    const currentBalance = Number(account.balance) || 0;
    /* Si la moneda del depósito es diferente a la moneda de la cuenta,
    convertimos el monto anterior a la moneda de la cuenta*/
    const prevConverted = depositCurrency && depositCurrency !== account.currencyCode
        ? await convertAmount(previousAmount, depositCurrency, account.currencyCode)
        : Number(previousAmount);
    // Convertimos al nuevo monto
    // Hacemos lo mismo pero con el nuevo monto actualizado
    const newConverted = depositCurrency && depositCurrency !== account.currencyCode
        ? await convertAmount(newAmount, depositCurrency, account.currencyCode)
        : Number(newAmount);

    const delta = Number(newConverted) - Number(prevConverted);

    if (Number.isNaN(delta)) {
        throw new Error('El monto no es valido');
    }

    const updatedBalance = currentBalance + delta;

    if (updatedBalance < 0) {
        throw new Error('No hay saldo suficiente para reducir el deposito');
    }

    account.balance = updatedBalance;

    return {
        previousBalance: currentBalance,
        newBalance: updatedBalance
    };
};

export const applyDepositReversal = async (account, depositAmount, depositCurrency) => {
    const currentBalance = Number(account.balance) || 0;
    const reversalAmount = depositCurrency && depositCurrency !== account.currencyCode
        ? await convertAmount(depositAmount, depositCurrency, account.currencyCode)
        : Number(depositAmount);

    if (currentBalance < reversalAmount) {
        throw new Error('No se puede revertir: el saldo actual es insuficiente');
    }

    const newBalance = currentBalance - reversalAmount;
    account.balance = newBalance;

    return {
        previousBalance: currentBalance,
        newBalance
    };
};

export const validateDepositCanBeReverted = (deposit) => {
    if (!deposit) {
        throw new Error('Deposito no encontrado');
    }

    if (deposit.status === 'reversada') {
        throw new Error('El deposito ya fue reversado');
    }

    const createdAt = new Date(deposit.createdAt).getTime();
    const now = Date.now();
    const elapsed = now - createdAt;

    if (elapsed > MAX_REVERT_WINDOW_MS) {
        throw new Error('El deposito solo puede revertirse dentro del primer minuto');
    }
};

export const createDepositTransaction = async ({ deposit, accountNumber }) => {
    const transaction = await Transaction.create({
        sourceAccountNumber: accountNumber,
        destinationAccountNumber: accountNumber,
        transactionType: 'deposito',
        amount: deposit.amount,
        currencyCode: deposit.currencyCode,
        transactionDate: deposit.createdAt || new Date(),
        description: deposit.description,
        status: deposit.status,
        previousBalance: deposit.previousBalance,
        newBalance: deposit.newBalance,
        executedByUserId: deposit.executedByUserId
    });

    return transaction;
};

export const syncDepositTransaction = async (transactionId, patchData) => {
    if (!transactionId) return null;

    return Transaction.findByIdAndUpdate(
        transactionId,
        patchData,
        { new: true, runValidators: true }
    );
};
