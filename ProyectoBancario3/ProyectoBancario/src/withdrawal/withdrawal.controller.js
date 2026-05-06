import Withdrawal from './withdrawal.model.js';
import Account from '../accounts/accounts.model.js';
import { validateWithdrawal } from '../../helpers/withdrawal.helper.js';

const getAuthenticatedUserId = (req) =>
    req.user?.userId || req.user?.sub || req.userId || null;
const roundToTwoDecimals = (value) => Number(Number(value || 0).toFixed(2));

/**
 * CREAR UN NUEVO RETIRO
 */
export const createWithdrawal = async (req, res) => {
    try {
        const { accountNumber, amount, currencyCode } = req.body;
        // Compatibilidad entre formatos de JWT (userId/sub)
        const userId = getAuthenticatedUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'No se pudo identificar el usuario autenticado',
                error: 'MISSING_AUTH_USER_ID'
            });
        }

        // 1. Validar reglas de negocio (Saldo, Límite Diario, Estado de Cuenta)
        const { account, amountToDeduct } = await validateWithdrawal(amount, accountNumber, userId, currencyCode);

        // 2. Crear el registro del retiro
        const withdrawal = new Withdrawal({
            accountNumber,
            amount,
            currencyCode: currencyCode || account.currencyCode,
            userId,
            description: `Retiro de cuenta ${accountNumber}`
        });

        // 3. Actualizar el saldo de la cuenta en la base de datos con 2 decimales
        const updatedBalance = roundToTwoDecimals(Number(account.balance) - Number(amountToDeduct));
        account.balance = updatedBalance;
        await account.save();

        // 4. Guardar el retiro
        await withdrawal.save();

        res.status(201).json({
            success: true,
            message: 'Retiro realizado exitosamente',
            withdrawal
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'No se pudo procesar el retiro',
            error: error.message
        });
    }
};

/**
 * OBTENER HISTORIAL DE RETIROS (ESTADO DE CUENTA)
 */
export const getAccountStatement = async (req, res) => {
    try {
        const { id: accountNumber } = req.params;
        const userId = getAuthenticatedUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'No se pudo identificar el usuario autenticado',
                error: 'MISSING_AUTH_USER_ID'
            });
        }

        // Verificar que la cuenta pertenezca al usuario antes de mostrar historial
        const account = await Account.findOne({ accountNumber, userId });
        
        if (!account) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver el historial de esta cuenta.'
            });
        }

        const history = await Withdrawal.find({ accountNumber }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            accountNumber,
            currentBalance: account.balance,
            history
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener el historial',
            error: error.message
        });
    }
};
