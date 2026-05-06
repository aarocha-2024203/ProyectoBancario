import Account from '../src/accounts/accounts.model.js';
import Withdrawal from '../src/withdrawal/withdrawal.model.js';
import { convertAmount } from './conversionCurrency.helper.js';

/**
 * Valida la lógica de retiro usando los nuevos formatos del Scrum Master
 */
export const validateWithdrawal = async (amount, accountNumber, userId, requestedCurrency) => {
    
    // 1. Buscar la cuenta usando los nuevos identificadores de String (ACC- y USR-)
    // Esto asegura que la cuenta pertenezca al usuario logueado
    const account = await Account.findOne({ 
        accountNumber: accountNumber, // Formato: ACC-830-001
        userId: userId               // Formato: USR-XXXX
    });
    
    if (!account) {
        throw new Error(`Error: La cuenta ${accountNumber} no existe o no pertenece al usuario ${userId}.`);
    }

    // 2. Verificar si la cuenta está bloqueada o inactiva
    // Validamos contra el campo status que maneja el módulo accountLock
    if (account.status !== 'activa') {
        throw new Error(`Operación denegada. El estado de la cuenta es: ${account.status}.`);
    }

    // 3. Verificación de saldo suficiente
    // Si la solicitud viene en otra moneda, convertir el monto solicitado a la moneda de la cuenta
    let amountToDeduct = Number(amount);
    if (requestedCurrency && requestedCurrency !== account.currencyCode) {
        amountToDeduct = await convertAmount(amount, requestedCurrency, account.currencyCode);
    }

    if (account.balance < amountToDeduct) {
        throw new Error(`Saldo insuficiente. Tu saldo actual es de: ${account.balance}`);
    }

    // 4. Lógica de Límite Diario (Mantenemos la validación de 24 horas)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const withdrawalsToday = await Withdrawal.aggregate([
        {
            $match: {
                accountNumber: accountNumber,
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]);

    const totalWithdrawnToday = withdrawalsToday.length > 0 ? withdrawalsToday[0].totalAmount : 0;

    // Verificar contra el límite diario definido en la cuenta
    if ((totalWithdrawnToday + amount) > account.dailyWithdrawalLimit) {
        throw new Error(`Límite diario excedido. Has alcanzado el tope de retiro para hoy.`);
    }

    // Retornamos la cuenta y el monto a deducir (en la moneda de la cuenta)
    return { account, amountToDeduct };
};