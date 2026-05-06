import { body, param } from 'express-validator';
import { checkValidators } from './checkValidators.js';
import { validateJWT } from './validate-JWT.js';
import { requireRole } from './validate-role.js';

// Validaciones para crear tarjeta
export const validateCreateCard = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE'),
    body('userId')
        .notEmpty()
        .withMessage('El userId es requerido')
        .matches(/^usr_[A-Za-z0-9]+$/)
        .withMessage('Formato de userId invalido'),
    body('cardType')
        .notEmpty()
        .withMessage('El tipo de tarjeta es requerido')
        .isIn(['debito', 'credito'])
        .withMessage('Tipo de tarjeta no valida'),
    body('cvv')
        .notEmpty()
        .withMessage('El CVV es requerido')
        .matches(/^\d{3,4}$/)
        .withMessage('El CVV debe tener 3 o 4 digitos'),
    body('expirationDate')
        .notEmpty()
        .withMessage('La fecha de vencimiento es requerida')
        .isISO8601()
        .withMessage('La fecha debe estar en formato ISO8601'),
    body('pin')
        .notEmpty()
        .withMessage('El PIN es requerido')
        .matches(/^\d{4}$/)
        .withMessage('El PIN debe tener 4 digitos'),
    body('status')
        .optional()
        .isIn(['activa', 'bloqueada', 'vencida', 'cancelada'])
        .withMessage('Estado de tarjeta no valido'),
    body('cardNumber')
        .optional()
        .custom(() => {
            throw new Error('No se permite enviar cardNumber, se genera automaticamente');
        }),
    checkValidators,
];

// Validaciones para actualizar tarjeta
export const validateUpdateCard = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE'),
    param('id')
        .notEmpty()
        .withMessage('El ID de la tarjeta es requerido'),
    body('userId')
        .optional()
        .matches(/^usr_[A-Za-z0-9]+$/)
        .withMessage('Formato de userId invalido'),
    body('cardType')
        .optional()
        .isIn(['debito', 'credito'])
        .withMessage('Tipo de tarjeta no valida'),
    body('cvv')
        .optional()
        .matches(/^\d{3,4}$/)
        .withMessage('El CVV debe tener 3 o 4 digitos'),
    body('expirationDate')
        .optional()
        .isISO8601()
        .withMessage('La fecha debe estar en formato ISO8601'),
    body('pin')
        .optional()
        .matches(/^\d{4}$/)
        .withMessage('El PIN debe tener 4 digitos'),
    body('status')
        .optional()
        .isIn(['activa', 'bloqueada', 'vencida', 'cancelada'])
        .withMessage('Estado de tarjeta no valido'),
    body('cardNumber')
        .optional()
        .custom(() => {
            throw new Error('No se permite actualizar cardNumber');
        }),
    checkValidators,
];

// Validaciones para obtener/eliminar tarjeta especifica
export const validateCardById = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE'),
    param('id')
        .notEmpty()
        .withMessage('El ID de la tarjeta es requerido'),
    checkValidators,
];

// Validacion para buscar tarjeta por ID (sin restriccion de rol)
export const validateReadCardById = [
    validateJWT,
    param('id')
        .notEmpty()
        .withMessage('El ID de la tarjeta es requerido'),
    checkValidators,
];
