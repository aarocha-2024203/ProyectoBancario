import { check } from 'express-validator';
import { checkValidators } from './checkValidators.js';

/**
 * Validaciones para el proceso de retiro
 * Se asegura de que el body traiga los datos correctos y en el formato esperado
 */
export const withdrawalValidators = [
    // Validar el número de cuenta
    check('accountNumber', 'El número de cuenta es obligatorio').not().isEmpty(),
    check('accountNumber', 'Formato de cuenta inválido. Debe ser: ABC-000-0000').matches(/^[A-Z]{3}-\d{3}-\d{4}$/),
    
    // Validar el monto (amount)
    check('amount', 'El monto es obligatorio').not().isEmpty(),
    check('amount', 'El monto debe ser un número').isNumeric(),
    check('amount', 'El monto debe ser un número positivo (mínimo 1)').isFloat({ min: 1 }),
    
    // Captura y responde con errores si alguna de las validaciones de arriba falla
    checkValidators
];