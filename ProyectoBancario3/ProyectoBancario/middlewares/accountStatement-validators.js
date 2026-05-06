import { body, param } from 'express-validator';
import { checkValidators } from './checkValidators.js';
import { validateJWT } from './validate-JWT.js';
import { requireRole } from './validate-role.js';

const ACCOUNT_NUMBER_REGEX = /^[A-Z]{3}-\d{3}-\d{4}$/;

// Validaciones para crear estado de cuenta (account statement)
export const validateCreateAccountStatement = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE', 'USER_ROLE'),
    body()
        .custom((_, { req }) => {
            if (!req.body.accountId && !req.body.accountNumber) {
                throw new Error('Debes enviar accountId o accountNumber');
            }
            return true;
        }),
    body('accountNumber')
        .optional()
        .matches(ACCOUNT_NUMBER_REGEX)
        .withMessage('El numero de cuenta debe tener formato ABC-000-0000'),
    body('periodStart')
        .notEmpty()
        .withMessage('La fecha de inicio es requerida')
        .isISO8601()
        .withMessage('La fecha debe ser en formato ISO8601'),
    body('periodEnd')
        .notEmpty()
        .withMessage('La fecha de fin es requerida')
        .isISO8601()
        .withMessage('La fecha debe ser en formato ISO8601'),
    body('totalDeposits')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Total de depositos debe ser un numero positivo'),
    body('totalWithdrawals')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Total de retiros debe ser un numero positivo'),
    checkValidators,
];

// Validaciones para actualizar estado de cuenta
export const validateUpdateAccountStatement = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE', 'USER_ROLE'),
    param('id')
        .notEmpty()
        .withMessage('El ID del estado es requerido'),
    body('totalDeposits')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Total de depositos debe ser un numero positivo'),
    body('totalWithdrawals')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Total de retiros debe ser un numero positivo'),
    checkValidators,
];

// Validaciones para obtener/eliminar estado especifico
export const validateAccountStatementById = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE', 'USER_ROLE'),
    param('id')
        .notEmpty()
        .withMessage('El ID del estado es requerido'),
    checkValidators,
];

export const validateAccountStatementByAccountNumber = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE', 'USER_ROLE'),
    param('accountNumber')
        .notEmpty()
        .withMessage('El numero de cuenta es requerido')
        .matches(ACCOUNT_NUMBER_REGEX)
        .withMessage('El numero de cuenta debe tener formato ABC-000-0000'),
    checkValidators,
];

