import { body, param, validationResult } from 'express-validator';
import { ALLOWED_ROLES } from '../helpers/role-constants.js';

/**
 * Middleware para procesar resultados de validación
 */
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors.array().map((error) => ({
                field: error.path,
                message: error.msg,
                value: error.value,
            })),
        });
    }
    next();
};

/**
 * Validación para cambiar rol de usuario
 */
export const validateUpdateUserRole = [
    param('id')
        .notEmpty()
        .withMessage('El ID del usuario es obligatorio')
        .isInt({ min: 1 })
        .withMessage('El ID del usuario debe ser un número válido'),

    body('role')
        .trim()
        .notEmpty()
        .withMessage('El rol es obligatorio')
        .isIn(ALLOWED_ROLES)
        .withMessage(
            `El rol debe ser uno de los siguientes: ${ALLOWED_ROLES.join(', ')}`
        ),

    handleValidationErrors,
];