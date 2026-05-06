import { Router } from "express";
import { createTransaction, getTransactions, getFavorites, updateTransaction, deleteTransaction, getTransactionById } from "./transaction.controller.js";
import { validateCreateTransaction, validateUpdateTransaction, validateTransactionById } from "../../middlewares/transaction-validators.js";
import { validateJWT } from "../../middlewares/validate-JWT.js";
import { requireRole } from "../../middlewares/validate-role.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Gestión de transacciones bancarias
 */

/**
 * @swagger
 * /transaction/create:
 *   post:
 *     summary: Crear una nueva transacción (transferencia)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sourceAccountNumber
 *               - destinationAccountNumber
 *               - amount
 *               - currencyCode
 *               - transactionType
 *             properties:
 *               sourceAccountNumber:
 *                 type: string
 *                 example: ACC-111-001
 *               destinationAccountNumber:
 *                 type: string
 *                 example: ACC-222-002
 *               amount:
 *                 type: number
 *                 example: 200.00
 *               currencyCode:
 *                 type: string
 *                 example: GTQ
 *               transactionType:
 *                 type: string
 *                 enum: [transferencia, pago]
 *                 example: transferencia
 *               description:
 *                 type: string
 *                 example: Pago de alquiler
 *               favorito:
 *                 type: boolean
 *                 example: false
 *               alias:
 *                 type: string
 *                 example: Cuenta amigo
 *     responses:
 *       201:
 *         description: Transacción creada exitosamente
 *       400:
 *         description: Error de validación (monto excede límite, saldo insuficiente, etc.)
 *       403:
 *         description: La cuenta origen no te pertenece
 *       404:
 *         description: Una o ambas cuentas no existen
 */
router.post('/create', validateJWT, validateCreateTransaction, createTransaction);

/**
 * @swagger
 * /transaction:
 *   get:
 *     summary: Obtener todas las transacciones (solo ADMIN)
 *     tags: [Transactions]
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
 *           enum: [exitosa, fallida]
 *           default: exitosa
 *     responses:
 *       200:
 *         description: Lista de transacciones con paginación
 *       403:
 *         description: Solo ADMIN puede ver todas las transacciones
 */
router.get('/', validateJWT, requireRole('ADMIN_ROLE'), getTransactions);

/**
 * @swagger
 * /transaction/favorites:
 *   get:
 *     summary: Obtener cuentas favoritas del usuario autenticado
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cuentas favoritas (número de cuenta, nombre y alias)
 *       401:
 *         description: Usuario no autenticado
 */
router.get('/favorites', validateJWT, requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE', 'USER_ROLE'), getFavorites);

/**
 * @swagger
 * /transaction/{id}:
 *   get:
 *     summary: Obtener una transacción por ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la transacción (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Datos de la transacción
 *       403:
 *         description: Esta transacción no te pertenece
 *       404:
 *         description: Transacción no encontrada
 */
router.get('/:id', validateJWT, validateTransactionById, getTransactionById);

/**
 * @swagger
 * /transaction/{id}:
 *   put:
 *     summary: Actualizar una transacción (favorito y alias)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
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
 *               favorito:
 *                 type: boolean
 *                 example: true
 *               alias:
 *                 type: string
 *                 example: Mamá
 *     responses:
 *       200:
 *         description: Transacción actualizada exitosamente
 *       403:
 *         description: Esta transacción no te pertenece
 *       404:
 *         description: Transacción no encontrada
 */
router.put('/:id', validateJWT, validateUpdateTransaction, updateTransaction);

/**
 * @swagger
 * /transaction/{id}:
 *   delete:
 *     summary: Eliminar una transacción
 *     tags: [Transactions]
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
 *         description: Transacción eliminada exitosamente
 *       403:
 *         description: Esta transacción no te pertenece
 *       404:
 *         description: Transacción no encontrada
 */
router.delete('/:id', validateJWT, validateTransactionById, deleteTransaction);

export default router;