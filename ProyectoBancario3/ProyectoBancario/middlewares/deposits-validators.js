import { body, param } from 'express-validator';
import { checkValidators } from './checkValidators.js';
import { validateJWT } from './validate-JWT.js';
import { requireRole } from './validate-role.js';

const ACCOUNT_NUMBER_REGEX = /^[A-Z]{3}-\d{3}-\d{4}$/;

export const validateCreateDeposit = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE', 'USER_ROLE'),
    body('accountNumber')
        .notEmpty()
        .withMessage('El numero de cuenta es requerido')
        .matches(ACCOUNT_NUMBER_REGEX)
        .withMessage('El numero de cuenta debe tener formato ABC-000-0000'),
    body('amount')
        .notEmpty()
        .withMessage('El monto es requerido')
        .isFloat({ min: 0.01 })
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
    body('description')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('La descripcion no puede exceder 200 caracteres'),
    checkValidators
];

export const validateListDeposits = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE', 'USER_ROLE')
];

export const validateUpdateDepositAmount = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE', 'USER_ROLE'),
    param('id')
        .notEmpty()
        .withMessage('El ID del deposito es requerido'),
    body('amount')
        .notEmpty()
        .withMessage('El monto es requerido')
        .isFloat({ min: 0.01 })
        .withMessage('El monto debe ser mayor a 0'),
    checkValidators
];

export const validateDepositById = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE', 'USER_ROLE'),
    param('id')
        .notEmpty()
        .withMessage('El ID del deposito es requerido'),
    checkValidators
];

export const validateRevertDeposit = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE', 'USER_ROLE'),
    param('id')
        .notEmpty()
        .withMessage('El ID del deposito es requerido'),
    checkValidators
];
