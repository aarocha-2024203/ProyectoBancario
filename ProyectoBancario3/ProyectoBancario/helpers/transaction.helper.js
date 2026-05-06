import Currency from '../src/coins/coins.model.js';
import Transaction from '../src/transaction/transaction.model.js';
import { convertAmount } from './conversionCurrency.helper.js';


const ACCOUNT_NUMBER_REGEX = /^[A-Z]{3}-\d{3}-\d{4}$/;
//Monto maximo de una trasnferencia
const MAX_TRANSFER_PER_OPERATION = 2000;
//Monto total de trasferencias por un dia
const MAX_TRANSFER_PER_DAY = 10000;

export const normalizeTransactionData = (transactionData) => {
    const normalized = { ...transactionData };

    //Normaliza el numero de la cuenta
    normalized.sourceAccountNumber = (
        normalized.sourceAccountNumber || normalized.sourceAccountId || ''
    ).toUpperCase().trim();

    //Normaliza el numero de la cuenta destino
    normalized.destinationAccountNumber = (
        normalized.destinationAccountNumber || normalized.destinationAccountId || ''
    ).toUpperCase().trim();

    //Normaliza el codigo de la moneda
    normalized.currencyCode = (
        normalized.currencyCode || normalized.currency || normalized.currencyId || ''
    ).toUpperCase().trim();

    // Normaliza el tipo de transacción a minúsculas para comparaciones consistentes
    normalized.transactionType = (
        normalized.transactionType || normalized.type || ''
    ).toLowerCase().trim();

    normalized.executedByUserId = normalized.executedByUserId || normalized.userId || '';
    normalized.favorito =
        normalized.favorito === true ||
        normalized.favorito === 'true' ||
        normalized.favorito === 1 ||
        normalized.favorito === '1';
    normalized.alias = String(normalized.alias || '').trim();
    if (!normalized.favorito) {
        normalized.alias = '';
    }

    return normalized;
};

//validamos que el numero de cuenta tenga el formato correcto
export const validateAccountNumberFormat = (accountNumber, fieldName) => {
    if (!ACCOUNT_NUMBER_REGEX.test(accountNumber)) {
        throw new Error(`${fieldName} debe tener formato ABC-000-0000`);
    }
};

//validamos la moneda de la transaccion y que esta coincida con la moneda de las cuentas
export const validateCurrencyForTransaction = async (currencyCode, sourceAccount, destinationAccount) => {
    const currency = await Currency.findOne({ code: currencyCode, status: 'activa' });

    if (!currency) {
        throw new Error(`La moneda ${currencyCode} no existe o esta inactiva`);
    }

    // Permitimos que las cuentas tengan monedas diferentes entre si y con la transaccion.
    // La conversion se aplicara al momento de ajustar saldos.
    return true;
};

export const validateTransferLimits = async ({ transactionType, sourceAccountNumber, amount, sourceAccount }) => {
    if (transactionType !== 'transferencia') {
        return;
    }

    // Regla 1: una transferencia individual no puede superar Q2000.
    if (amount > MAX_TRANSFER_PER_OPERATION) {
        throw new Error('No puede transferir mas de Q2000 en una sola transaccion');
    }

    // Regla 2: no puede transferir mas que el saldo disponible de su cuenta.
    if (Number(sourceAccount.balance) < amount) {
        throw new Error('No puede transferir mas del saldo actual de la cuenta');
    }

    // Regla 3: total diario acumulado de transferencias no puede superar Q10000.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [dailyTransfers] = await Transaction.aggregate([
        {
            $match: {
                sourceAccountNumber,
                transactionType: 'transferencia',
                status: 'exitosa',
                transactionDate: { $gte: startOfDay, $lte: endOfDay }
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$amount' }
            }
        }
    ]);

    const transferredToday = Number(dailyTransfers?.totalAmount || 0);
    const totalWithCurrentTransfer = transferredToday + amount;

    if (totalWithCurrentTransfer > MAX_TRANSFER_PER_DAY) {
        throw new Error('No puede transferir mas de Q10000 en un mismo dia');
    }
};

// Aplica los cambios de saldo a las cuentas involucradas en la transaccion
export const applyTransactionBalances = async ({ transactionType, amount, sourceAccount, destinationAccount, transactionCurrency }) => {
    //Validar que el monto no sea negativo o cero
    if (amount <= 0) {
        throw new Error('El monto debe ser mayor a 0');
    }
    //DEPOSITO
    if (transactionType === 'deposito') {
        // Guardamos el saldo anterior para poder retornarlo
        const previousBalance = destinationAccount.balance;
        // Si la transaccion viene en otra moneda, convertir al currency de la cuenta destino
        const creditAmount = transactionCurrency && transactionCurrency !== destinationAccount.currencyCode
            ? await convertAmount(amount, transactionCurrency, destinationAccount.currencyCode)
            : Number(amount);
        // Sumamos el dinero al saldo de la cuenta destino
        destinationAccount.balance = Number(destinationAccount.balance) + Number(creditAmount);
        // Retornamos el saldo anterior y el nuevo saldo
        return { previousBalance, newBalance: destinationAccount.balance };
    }
    // Guardamos el saldo actual de la cuenta origen
    const sourceBalanceBefore = Number(sourceAccount.balance);

    /*Si la moneda de la transaccion es diferente a la moneda de la cuenta origen,
    convertimos el monto a la moneda de la cuenta origen*/
    const debitAmountInSourceCurrency = transactionCurrency && transactionCurrency !== sourceAccount.currencyCode
        ? await convertAmount(amount, transactionCurrency, sourceAccount.currencyCode)
        : Number(amount);
    // Verificamos que haya suficiente saldo
    if (sourceBalanceBefore < debitAmountInSourceCurrency) {
        throw new Error('Saldo insuficiente en la cuenta origen');
    }
    // Restamos el dinero de la cuenta origen
    sourceAccount.balance = sourceBalanceBefore - Number(debitAmountInSourceCurrency);

    //TRASNFERENCIA, PAGO DE SERVICIO O PAGO DE PRESTAMO
    if (['transferencia', 'pago_servicio', 'pago_prestamo'].includes(transactionType)) {
        /* Determinamos caunto dinero se le acredita a la cuenta destino
        si ambas cuentas tienen la misma moneda, usamos el mismo monto*/
        const creditAmount = sourceAccount.currencyCode === destinationAccount.currencyCode
            ? Number(debitAmountInSourceCurrency)
            // Si son diferentes monedas, convertimos el dinero
            : await convertAmount(debitAmountInSourceCurrency, sourceAccount.currencyCode, destinationAccount.currencyCode);
        // Sumamos el dinero a la cuenta destino
        destinationAccount.balance = Number(destinationAccount.balance) + Number(creditAmount);
    }
    // Retornamos el saldo anterior y el nuevo saldo de la cuenta origen
    return { previousBalance: sourceBalanceBefore, newBalance: sourceAccount.balance };
};
