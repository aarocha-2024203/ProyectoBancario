// ============================================================
// ARCHIVO: src/accountLock/accountLock.routes.js
// ============================================================
import { Router } from "express";
import { createAccountLock, getAccountLocks, getAccountLockById, updateAccountLock, deleteAccountLock } from "./accountLock.controller.js";
import { validateCreateAccountLock, validateUpdateAccountLock, validateAccountLockById } from "../../middlewares/accountLock-validators.js";
import { validateJWT } from "../../middlewares/validate-JWT.js";
import { requireRole } from "../../middlewares/validate-role.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AccountLocks
 *   description: Gestión de bloqueos de cuentas
 */

/**
 * @swagger
 * /accountLocks/create:
 *   post:
 *     summary: Bloquear una cuenta
 *     tags: [AccountLocks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountNumber
 *               - reason
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 example: ACC-123-456
 *               reason:
 *                 type: string
 *                 example: Actividad sospechosa detectada
 *     responses:
 *       201:
 *         description: Cuenta bloqueada exitosamente
 *       400:
 *         description: Error de validación
 */
router.post('/create', validateCreateAccountLock, createAccountLock);

/**
 * @swagger
 * /accountLocks:
 *   get:
 *     summary: Obtener todos los bloqueos de cuentas (ADMIN / MANAGER / ATM)
 *     tags: [AccountLocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [bloqueado, desbloqueado]
 *           default: bloqueado
 *     responses:
 *       200:
 *         description: Lista de bloqueos con paginación
 *       403:
 *         description: Acceso denegado
 */
router.get('/', validateJWT, requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE'), getAccountLocks);

/**
 * @swagger
 * /accountLocks/{id}:
 *   get:
 *     summary: Obtener un bloqueo por ID
 *     tags: [AccountLocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del bloqueo
 *       404:
 *         description: Bloqueo no encontrado
 */
router.get('/:id', validateJWT, validateAccountLockById, getAccountLockById);

/**
 * @swagger
 * /accountLocks/{id}:
 *   put:
 *     summary: Actualizar un bloqueo de cuenta
 *     tags: [AccountLocks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [bloqueado, desbloqueado]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bloqueo actualizado exitosamente
 *       404:
 *         description: Bloqueo no encontrado
 */
router.put('/:id', validateUpdateAccountLock, updateAccountLock);

/**
 * @swagger
 * /accountLocks/{id}:
 *   delete:
 *     summary: Eliminar un bloqueo de cuenta
 *     tags: [AccountLocks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bloqueo eliminado exitosamente
 *       404:
 *         description: Bloqueo no encontrado
 */
router.delete('/:id', validateAccountLockById, deleteAccountLock);

export default router;