import { Router } from "express";
import { createAccount, getAccounts, updateAccount, deleteAccount, changeAccountStatus, getAccountByAccountNumber } from "./accounts.controller.js";
import { validateCreateAccount, validateUpdateAccount, validateAccountById, validateReadAccountById } from "../../middlewares/accounts-validators.js";
import { validateJWT } from "../../middlewares/validate-JWT.js";
import { requireRole } from "../../middlewares/validate-role.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Gestión de cuentas bancarias
 */

/**
 * @swagger
 * /accounts/create:
 *   post:
 *     summary: Crear una nueva cuenta bancaria
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - currencyCode
 *               - monthlyIncome
 *               - address
 *               - jobName
 *             properties:
 *               userId:
 *                 type: string
 *                 example: uuid-del-usuario
 *               currencyCode:
 *                 type: string
 *                 example: GTQ
 *               monthlyIncome:
 *                 type: number
 *                 example: 5000
 *               address:
 *                 type: string
 *                 example: Zona 10, Guatemala
 *               jobName:
 *                 type: string
 *                 example: Ingeniero
 *     responses:
 *       201:
 *         description: Cuenta creada exitosamente
 *       400:
 *         description: Datos inválidos o ingreso mensual insuficiente
 *       404:
 *         description: Usuario o moneda no encontrada
 */
router.post('/create', validateJWT, validateCreateAccount, createAccount);

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Obtener todas las cuentas (ADMIN / MANAGER)
 *     tags: [Accounts]
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
 *           enum: [activa, inactiva, bloqueada]
 *           default: activa
 *     responses:
 *       200:
 *         description: Lista de cuentas con paginación
 *       403:
 *         description: Acceso denegado, se requiere ADMIN_ROLE o MANAGER_ROLE
 */
router.get('/', validateJWT, requireRole('ADMIN_ROLE', 'MANAGER_ROLE'), getAccounts);

/**
 * @swagger
 * /accounts/{accountNumber}:
 *   get:
 *     summary: Obtener una cuenta por número de cuenta
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *         example: ACC-123-456
 *     responses:
 *       200:
 *         description: Datos de la cuenta
 *       403:
 *         description: Esta cuenta no te pertenece
 *       404:
 *         description: Cuenta no encontrada
 */
router.get('/:accountNumber', validateJWT, validateReadAccountById, getAccountByAccountNumber);

/**
 * @swagger
 * /accounts/{accountNumber}:
 *   put:
 *     summary: Actualizar datos de una cuenta
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *         example: ACC-123-456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               jobName:
 *                 type: string
 *               monthlyIncome:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cuenta actualizada exitosamente
 *       400:
 *         description: Error de validación
 *       403:
 *         description: No tienes permiso para modificar esta cuenta
 *       404:
 *         description: Cuenta no encontrada
 */
router.put('/:accountNumber', validateJWT, validateUpdateAccount, updateAccount);

/**
 * @swagger
 * /accounts/{accountNumber}:
 *   delete:
 *     summary: Eliminar una cuenta bancaria
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *         example: ACC-123-456
 *     responses:
 *       200:
 *         description: Cuenta eliminada exitosamente
 *       404:
 *         description: Cuenta no encontrada
 */
router.delete('/:accountNumber', validateJWT, validateAccountById, deleteAccount);

/**
 * @swagger
 * /accounts/{accountNumber}/status:
 *   patch:
 *     summary: Cambiar el estado de una cuenta
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *         example: ACC-123-456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [activa, inactiva, bloqueada]
 *                 example: bloqueada
 *     responses:
 *       200:
 *         description: Estado cambiado exitosamente
 *       400:
 *         description: Estado no permitido
 *       404:
 *         description: Cuenta no encontrada
 */
router.patch('/:accountNumber/status', validateJWT, validateAccountById, changeAccountStatus);

export default router;