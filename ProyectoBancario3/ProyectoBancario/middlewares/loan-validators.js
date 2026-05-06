import { body, param } from 'express-validator';
import { checkValidators } from './checkValidators.js';
import { validateJWT } from './validate-JWT.js';
import { requireRole } from './validate-role.js';

// Validaciones para crear préstamo
export const validateCreateLoan = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE', 'USER_ROLE'),
    body('userId')
        .notEmpty()
        .withMessage('El ID del usuario es requerido')
        .matches(/^usr_/)
        .withMessage('El ID del usuario debe empezar con usr_'),
    body('accountNumber')
        .notEmpty()
        .withMessage('El número de cuenta es requerido')
        .matches(/^ACC-\d{3}-\d{4}$/)
        .withMessage('El número de cuenta debe tener el formato ACC-000-0000'),
    body('requestedAmount')
        .notEmpty()
        .withMessage('El monto del préstamo es requerido')
        .isFloat({ min: 0 })
        .withMessage('El monto debe ser mayor a 0'),
    body('termMonths')
        .notEmpty()
        .withMessage('El plazo del préstamo es requerido')
        .isInt({ min: 1 })
        .withMessage('El plazo debe ser un número entero positivo'),
    body('interestRate')
        .notEmpty()
        .withMessage('La tasa de interés es requerida')
        .isFloat({ min: 0 })
        .withMessage('La tasa de interés debe ser un número positivo'),
    body('status')
        .optional()
        .isIn(['solicitado', 'aprobado', 'rechazado', 'desembolsado', 'pagado', 'vencido'])
        .withMessage('Estado de préstamo no válido'),
    checkValidators,
];

// Validaciones para actualizar préstamo
export const validateUpdateLoan = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE', 'USER_ROLE'),
    param('id')
        .notEmpty()
        .withMessage('El ID del préstamo es requerido'),
    body('userId')
        .optional()
        .matches(/^usr_/)
        .withMessage('El ID del usuario debe empezar con usr_'),
    body('accountNumber')
        .optional()
        .matches(/^ACC-\d{3}-\d{4}$/)
        .withMessage('El número de cuenta debe tener el formato ACC-000-0000'),
    body('approvedByUserId')
        .optional()
        .matches(/^usr_/)
        .withMessage('El ID del usuario debe empezar con usr_'),
    body('status')
        .optional()
        .isIn(['solicitado', 'aprobado', 'rechazado', 'desembolsado', 'pagado', 'vencido'])
        .withMessage('Estado de préstamo no válido'),
    body('interestRate')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('La tasa de interés debe ser un número positivo'),
    checkValidators,
];

// Validaciones para obtener/eliminar préstamo específico
export const validateLoanById = [
    validateJWT,
    requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE', 'USER_ROLE'),
    param('id')
        .notEmpty()
        .withMessage('El ID del préstamo es requerido'),
    checkValidators,
];
