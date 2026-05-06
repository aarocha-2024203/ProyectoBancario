// ============================================================
// ARCHIVO: src/withdrawal/withdrawal.routes.js
// ============================================================
import { Router } from 'express';
import { createWithdrawal, getAccountStatement } from './withdrawal.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { withdrawalValidators } from '../../middlewares/withdrawal-validators.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Withdrawals
 *   description: Retiros de cuentas bancarias
 */

/**
 * @swagger
 * /withdrawal:
 *   post:
 *     summary: Realizar un retiro
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountNumber
 *               - amount
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 example: ACC-123-456
 *               amount:
 *                 type: number
 *                 example: 200.00
 *               currencyCode:
 *                 type: string
 *                 example: GTQ
 *     responses:
 *       201:
 *         description: Retiro realizado exitosamente
 *       400:
 *         description: Saldo insuficiente, límite diario excedido o cuenta inactiva
 *       401:
 *         description: No autenticado
 */
router.post('/', [validateJWT, withdrawalValidators], createWithdrawal);

/**
 * @swagger
 * /withdrawal/statement/{id}:
 *   get:
 *     summary: Obtener historial de retiros de una cuenta
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Número de cuenta (ej. ACC-830-001)
 *         example: ACC-123-456
 *     responses:
 *       200:
 *         description: Historial de retiros y saldo actual
 *       403:
 *         description: No tienes permiso para ver el historial de esta cuenta
 */
router.get('/statement/:id', [validateJWT], getAccountStatement);

export default router;