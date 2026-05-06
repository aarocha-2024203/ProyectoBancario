import { body, param } from 'express-validator';
import { checkValidators } from './checkValidators.js';
import { validateJWT } from './validate-JWT.js';
import { requireRole } from './validate-role.js';

// Validaciones para crear monedas (coins)
export const validateCreateCoin = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE'),
    body('name')
        .trim()
        .notEmpty()
        .withMessage('El nombre de la moneda es requerido')
        .isLength({ min: 1, max: 50 })
        .withMessage('El nombre debe tener entre 1 y 50 caracteres'),
    body('code')
        .trim()
        .notEmpty()
        .withMessage('El código de la moneda es requerido')
        .isLength({ min: 1, max: 10 })
        .withMessage('El código debe tener entre 1 y 10 caracteres'),
    body('exchangeRate')
        .notEmpty()
        .withMessage('La tasa de cambio es requerida')
        .isFloat({ min: 0 })
        .withMessage('La tasa de cambio debe ser mayor a 0'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),
    checkValidators,
];

// Validaciones para actualizar monedas (coins)
export const validateUpdateCoin = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE'),
    param('id')
        .notEmpty()
        .withMessage('El ID de la moneda es requerido'),
    body('coinName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('El nombre debe tener entre 1 y 50 caracteres'),
    body('coinCode')
        .optional()
        .trim()
        .isLength({ min: 1, max: 10 })
        .withMessage('El código debe tener entre 1 y 10 caracteres'),
    body('exchangeRate')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('La tasa de cambio debe ser mayor a 0'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),
    checkValidators,
];

// Validaciones para obtener/eliminar une moneda específica
export const validateCoinById = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE'),
    param('id')
        .notEmpty()
        .withMessage('El ID de la moneda es requerido'),
    checkValidators,
];