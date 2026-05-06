// ============================================================
// ARCHIVO: src/loan/loans.routes.js
// ============================================================
import { Router } from "express";
import { createLoan, getLoans, getLoanById, updateLoan, deleteLoan } from "./loans.controller.js";
import { validateCreateLoan, validateUpdateLoan, validateLoanById } from "../../middlewares/loan-validators.js";
import { validateJWT } from "../../middlewares/validate-JWT.js";
import { requireRole } from "../../middlewares/validate-role.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Loans
 *   description: Gestión de préstamos
 */

/**
 * @swagger
 * /loan/create:
 *   post:
 *     summary: Solicitar un préstamo
 *     tags: [Loans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amount
 *               - termMonths
 *             properties:
 *               userId:
 *                 type: string
 *                 example: uuid-del-usuario
 *               amount:
 *                 type: number
 *                 example: 10000
 *               termMonths:
 *                 type: integer
 *                 example: 12
 *               description:
 *                 type: string
 *                 example: Préstamo para mejoras del hogar
 *     responses:
 *       201:
 *         description: Préstamo creado exitosamente
 *       400:
 *         description: Error de validación
 */
router.post('/create', validateCreateLoan, createLoan);

/**
 * @swagger
 * /loan:
 *   get:
 *     summary: Obtener todos los préstamos (ADMIN / MANAGER / ATM)
 *     tags: [Loans]
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
 *           enum: [solicitado, aprobado, rechazado, pagado]
 *           default: solicitado
 *     responses:
 *       200:
 *         description: Lista de préstamos con paginación
 *       403:
 *         description: Acceso denegado
 */
router.get('/', validateJWT, requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE'), getLoans);

/**
 * @swagger
 * /loan/{id}:
 *   get:
 *     summary: Obtener un préstamo por ID
 *     tags: [Loans]
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
 *         description: Datos del préstamo
 *       403:
 *         description: Este préstamo no te pertenece
 *       404:
 *         description: Préstamo no encontrado
 */
router.get('/:id', validateJWT, validateLoanById, getLoanById);

/**
 * @swagger
 * /loan/{id}:
 *   put:
 *     summary: Actualizar un préstamo
 *     tags: [Loans]
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
 *               status:
 *                 type: string
 *                 enum: [solicitado, aprobado, rechazado, pagado]
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Préstamo actualizado exitosamente
 *       403:
 *         description: Este préstamo no te pertenece
 *       404:
 *         description: Préstamo no encontrado
 */
router.put('/:id', validateJWT, validateUpdateLoan, updateLoan);

/**
 * @swagger
 * /loan/{id}:
 *   delete:
 *     summary: Eliminar un préstamo (ADMIN / MANAGER / ATM)
 *     tags: [Loans]
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
 *         description: Préstamo eliminado exitosamente
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Préstamo no encontrado
 */
router.delete('/:id', validateJWT, requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE'), validateLoanById, deleteLoan);

export default router;