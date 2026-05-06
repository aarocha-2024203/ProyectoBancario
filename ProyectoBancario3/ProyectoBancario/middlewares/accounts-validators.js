import { body, param } from 'express-validator';
import { checkValidators } from './checkValidators.js';
import { validateJWT } from './validate-JWT.js';
import { requireRole } from './validate-role.js';

// Validaciones para crear cuenta
export const validateCreateAccount = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE'),
    body()
        .custom((_, { req }) => {
            if (!req.body.currencyCode && !req.body.currency && !req.body.currencyId) {
                throw new Error('Debes enviar currencyCode (ej: GTQ)');
            }
            return true;
        }),
    body('accountNumber')
        .optional()
        .matches(/^[A-Z]{3}-\d{3}-\d{4}$/)
        .withMessage('El numero de cuenta debe tener formato ABC-000-0000'),
    body('accountType')
        .notEmpty()
        .withMessage('El tipo de cuenta es requerido')
        .isIn(['ahorro', 'corriente', 'nomina'])
        .withMessage('Tipo de cuenta no valida'),
    body('userId')
        .notEmpty()
        .withMessage('El ID del usuario es requerido'),
    body('dpi')
        .notEmpty()
        .withMessage('El DPI es requerido')
        .matches(/^\d{13}$/)
        .withMessage('El DPI debe tener 13 digitos'),
    body('address')
        .notEmpty()
        .withMessage('La direccion es requerida')
        .isString()
        .withMessage('La direccion debe ser texto'),
    body('phone')
        .notEmpty()
        .withMessage('El celular es requerido')
        .matches(/^\d{8}$/)
        .withMessage('El celular debe tener 8 digitos'),
    body('jobName')
        .notEmpty()
        .withMessage('El nombre del trabajo es requerido')
        .isString()
        .withMessage('El nombre del trabajo debe ser texto'),
    body('monthlyIncome')
        .notEmpty()
        .withMessage('El ingreso mensual es requerido')
        .isFloat({ min: 0 })
        .withMessage('El ingreso mensual debe ser un numero positivo'),
    body('balance')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El balance debe ser un numero positivo'),
    body('currencyCode')
        .optional()
        .trim()
        .isLength({ min: 3, max: 3 })
        .withMessage('El codigo de moneda debe tener 3 caracteres')
        .isAlpha()
        .withMessage('El codigo de moneda solo puede contener letras'),
    body('currency')
        .optional()
        .isLength({ min: 3, max: 3 })
        .withMessage('El codigo de moneda debe tener 3 caracteres')
        .isAlpha()
        .withMessage('El codigo de moneda solo puede contener letras'),
    body('currencyId')
        .optional()
        .isLength({ min: 3, max: 3 })
        .withMessage('El codigo de moneda debe tener 3 caracteres')
        .isAlpha()
        .withMessage('El codigo de moneda solo puede contener letras'),
    checkValidators,
];

// Validaciones para actualizar cuenta
export const validateUpdateAccount = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE', 'USER_ROLE'),
    param('accountNumber')
        .notEmpty()
        .withMessage('El numero de cuenta es requerido')
        .matches(/^[A-Z]{3}-\d{3}-\d{4}$/)
        .withMessage('El numero de cuenta debe tener formato ABC-000-0000'),
    body('accountType')
        .optional()
        .isIn(['ahorro', 'corriente', 'nomina'])
        .withMessage('Tipo de cuenta no valida'),
    body('balance')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El balance debe ser un numero positivo'),
    body('name')
        .optional()
        .isString()
        .withMessage('El nombre debe ser texto'),
    body('dpi')
        .optional()
        .matches(/^\d{13}$/)
        .withMessage('El DPI debe tener 13 digitos'),
    body('address')
        .optional()
        .isString()
        .withMessage('La direccion debe ser texto'),
    body('phone')
        .optional()
        .matches(/^\d{8}$/)
        .withMessage('El celular debe tener 8 digitos'),
    body('jobName')
        .optional()
        .isString()
        .withMessage('El nombre del trabajo debe ser texto'),
    body('monthlyIncome')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El ingreso mensual debe ser un numero positivo'),
    body('currencyCode')
        .optional()
        .trim()
        .isLength({ min: 3, max: 3 })
        .withMessage('El codigo de moneda debe tener 3 caracteres')
        .isAlpha()
        .withMessage('El codigo de moneda solo puede contener letras'),
    body('currency')
        .optional()
        .isLength({ min: 3, max: 3 })
        .withMessage('El codigo de moneda debe tener 3 caracteres')
        .isAlpha()
        .withMessage('El codigo de moneda solo puede contener letras'),
    body('currencyId')
        .optional()
        .isLength({ min: 3, max: 3 })
        .withMessage('El codigo de moneda debe tener 3 caracteres')
        .isAlpha()
        .withMessage('El codigo de moneda solo puede contener letras'),
    checkValidators,
];

// Validaciones para obtener/eliminar cuenta especifica
export const validateAccountById = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE'),
    param('accountNumber')
        .notEmpty()
        .withMessage('El numero de cuenta es requerido')
        .matches(/^[A-Z]{3}-\d{3}-\d{4}$/)
        .withMessage('El numero de cuenta debe tener formato ABC-000-0000'),
    checkValidators,
];

// Validaciones para obtener cuenta por accountNumber (incluye USER_ROLE)
export const validateReadAccountById = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE', 'USER_ROLE'),
    param('accountNumber')
        .notEmpty()
        .withMessage('El numero de cuenta es requerido')
        .matches(/^[A-Z]{3}-\d{3}-\d{4}$/)
        .withMessage('El numero de cuenta debe tener formato ABC-000-0000'),
    checkValidators,
];
