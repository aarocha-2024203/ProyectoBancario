import { body, param } from 'express-validator';
import { checkValidators } from './checkValidators.js';
import { validateJWT } from './validate-JWT.js';
import { requireRole } from './validate-role.js';

// Validaciones para crear bloqueo de cuenta (account lock)
export const validateCreateAccountLock = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE'),
    body('accountId')
        .notEmpty()
        .withMessage('El ID de la cuenta es requerido')
        .matches(/^ACC-\d{3}-\d{4}$/)
        .withMessage('El ID de la cuenta debe tener el formato ACC-000-0000'),
    body('userId')
        .notEmpty()
        .withMessage('El ID del usuario es requerido')
        .matches(/^usr_/)
        .withMessage('El ID del usuario debe empezar con usr_'),
    body('lockReason')
        .trim()
        .notEmpty()
        .withMessage('El motivo del bloqueo es requerido')
        .isIn(['fraude', 'deuda', 'seguridad', 'solicitud_cliente', 'inactividad'])
        .withMessage('Motivo de bloqueo no válido'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),
    body('unlockDate')
        .optional()
        .isISO8601()
        .withMessage('La fecha de desbloqueo debe ser válida'),
    body('lockedBy')
        .optional()
        .matches(/^usr_/)
        .withMessage('El ID del bloqueador debe empezar con usr_'),
    body('automatic')
        .optional()
        .isBoolean()
        .withMessage('El campo automatic debe ser un booleano'),
    body('failedAttempts')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Los intentos fallidos deben ser un número mayor o igual a 0'),
    checkValidators,
];

// Validaciones para actualizar bloqueo de cuenta
export const validateUpdateAccountLock = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE'),
    param('id')
        .notEmpty()
        .withMessage('El ID del bloqueo es requerido')
        .isMongoId()
        .withMessage('El ID del bloqueo no es válido'),
    body('lockReason')
        .optional()
        .trim()
        .isIn(['fraude', 'deuda', 'seguridad', 'solicitud_cliente', 'inactividad'])
        .withMessage('Motivo de bloqueo no válido'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),
    body('unlockDate')
        .optional()
        .isISO8601()
        .withMessage('La fecha de desbloqueo debe ser válida'),
    body('unlockedBy')
        .optional()
        .matches(/^usr_/)
        .withMessage('El ID del desbloqueador debe empezar con usr_'),
    body('status')
        .optional()
        .isIn(['bloqueado', 'desbloqueado'])
        .withMessage('Estado no válido'),
    body('failedAttempts')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Los intentos fallidos deben ser un número mayor o igual a 0'),
    checkValidators,
];

// Validaciones para obtener/eliminar un bloqueo específico
export const validateAccountLockById = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE'),
    param('id')
        .notEmpty()
        .withMessage('El ID del bloqueo es requerido')
        .isMongoId()
        .withMessage('El ID del bloqueo no es válido'),
    checkValidators,
];
