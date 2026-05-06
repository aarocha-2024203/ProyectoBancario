import { body, param } from 'express-validator';
import { checkValidators } from './checkValidators.js';
import { validateJWT } from './validate-JWT.js';
import { requireRole } from './validate-role.js';

// Validaciones para crear notificación
export const validateCreateNotification = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE'),
    body('userId')
        .notEmpty()
        .withMessage('El ID del usuario es requerido'),
    body('notificationType')
        .notEmpty()
        .withMessage('El tipo de notificación es requerido')
        .isIn(['alerta', 'confirmacion', 'informativa', 'seguridad'])
        .withMessage('Tipo de notificación no válido'),
    body('message')
        .trim()
        .notEmpty()
        .withMessage('El mensaje es requerido')
        .isLength({ min: 5, max: 1000 })
        .withMessage('El mensaje debe tener entre 5 y 1000 caracteres'),
    body('isRead')
        .optional()
        .isBoolean()
        .withMessage('El estado de lectura debe ser un booleano'),
    checkValidators,
];

// Validaciones para actualizar notificación
export const validateUpdateNotification = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE'),
    param('id')
        .notEmpty()
        .withMessage('El ID de la notificación es requerido'),
    body('isRead')
        .optional()
        .isBoolean()
        .withMessage('El estado de lectura debe ser un booleano'),
    body('message')
        .optional()
        .trim()
        .isLength({ min: 5, max: 1000 })
        .withMessage('El mensaje debe tener entre 5 y 1000 caracteres'),
    checkValidators,
];

// Validaciones para obtener/eliminar notificación específica
export const validateNotificationById = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE'),
    param('id')
        .notEmpty()
        .withMessage('El ID de la notificación es requerido'),
    checkValidators,
];
