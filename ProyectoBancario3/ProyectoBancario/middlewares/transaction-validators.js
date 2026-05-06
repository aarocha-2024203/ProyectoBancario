import { body, param } from 'express-validator';
import { checkValidators } from './checkValidators.js';
import { validateJWT } from './validate-JWT.js';
import { requireRole } from './validate-role.js';

const ACCOUNT_NUMBER_REGEX = /^[A-Z]{3}-\d{3}-\d{4}$/;

// Validaciones para crear transaccion
export const validateCreateTransaction = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE', 'USER_ROLE'),
    body()
        .custom((_, { req }) => {
            const source = req.body.sourceAccountNumber || req.body.sourceAccountId;
            const destination = req.body.destinationAccountNumber || req.body.destinationAccountId;

            if (!source) {
                throw new Error('El numero de cuenta origen es requerido');
            }

            if (!destination) {
                throw new Error('El numero de cuenta destino es requerido');
            }

            return true;
        }),
    body('sourceAccountNumber')
        .optional()
        .matches(ACCOUNT_NUMBER_REGEX)
        .withMessage('El numero de cuenta origen debe tener formato ABC-000-0000'),
    body('sourceAccountId')
        .optional()
        .matches(ACCOUNT_NUMBER_REGEX)
        .withMessage('El numero de cuenta origen debe tener formato ABC-000-0000'),
    body('destinationAccountNumber')
        .optional()
        .matches(ACCOUNT_NUMBER_REGEX)
        .withMessage('El numero de cuenta destino debe tener formato ABC-000-0000'),
    body('destinationAccountId')
        .optional()
        .matches(ACCOUNT_NUMBER_REGEX)
        .withMessage('El numero de cuenta destino debe tener formato ABC-000-0000'),
    body('amount')
        .notEmpty()
        .withMessage('El monto es requerido')
        .isFloat({ min: 0 })
        .withMessage('El monto debe ser mayor a 0'),
    body()
        .custom((_, { req }) => {
            if (!req.body.currencyCode && !req.body.currency && !req.body.currencyId) {
                throw new Error('Debes enviar currencyCode (ej: GTQ)');
            }
            return true;
        }),
    body('currencyCode')
        .optional()
        .trim()
        .isLength({ min: 3, max: 3 })
        .withMessage('El codigo de moneda debe tener 3 caracteres')
        .isAlpha()
        .withMessage('El codigo de moneda solo puede contener letras'),
    body('currency')
        .optional()
        .trim()
        .isLength({ min: 3, max: 3 })
        .withMessage('El codigo de moneda debe tener 3 caracteres')
        .isAlpha()
        .withMessage('El codigo de moneda solo puede contener letras'),
    body('currencyId')
        .optional()
        .trim()
        .isLength({ min: 3, max: 3 })
        .withMessage('El codigo de moneda debe tener 3 caracteres')
        .isAlpha()
        .withMessage('El codigo de moneda solo puede contener letras'),
    body()
        .custom((_, { req }) => {
            if (!req.body.executedByUserId && !req.body.userId) {
                throw new Error('Debes enviar executedByUserId o userId');
            }
            return true;
        }),
    body('transactionType')
        .notEmpty()
        .withMessage('El tipo de transaccion es requerido')
        .isIn(['deposito', 'retiro', 'transferencia', 'pago_servicio', 'pago_prestamo'])
        .withMessage('Tipo de transaccion no valido'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripcion no puede exceder 500 caracteres'),
    body('status')
        .optional()
        .isIn(['exitosa', 'pendiente', 'rechazada', 'reversada'])
        .withMessage('Estado de transaccion no valido'),
    body('favorito')
        .optional()
        .isBoolean()
        .withMessage('favorito debe ser true o false'),
    body('alias')
        .optional()
        .isString()
        .withMessage('alias debe ser string')
        .trim()
        .isLength({ max: 80 })
        .withMessage('El alias no puede exceder 80 caracteres'),
    checkValidators,
];

// Validaciones para actualizar transaccion
export const validateUpdateTransaction = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE', 'USER_ROLE'),
    param('id')
        .notEmpty()
        .withMessage('El ID de la transaccion es requerido'),
    body('status')
        .optional()
        .isIn(['exitosa', 'pendiente', 'rechazada', 'reversada'])
        .withMessage('Estado de transaccion no valido'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripcion no puede exceder 500 caracteres'),
    body('favorito')
        .optional()
        .isBoolean()
        .withMessage('favorito debe ser true o false'),
    body('alias')
        .optional()
        .isString()
        .withMessage('alias debe ser string')
        .trim()
        .isLength({ max: 80 })
        .withMessage('El alias no puede exceder 80 caracteres'),
    checkValidators,
];

// Validaciones para obtener/eliminar transaccion especifica
export const validateTransactionById = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE', 'USER_ROLE'),
    param('id')
        .notEmpty()
        .withMessage('El ID de la transaccion es requerido'),
    checkValidators,
];
