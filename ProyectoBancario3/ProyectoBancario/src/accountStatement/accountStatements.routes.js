import { Router } from 'express';
import {
    createAccountStatement,
    getAccountStatements,
    updateAccountStatement,
    deleteAccountStatement,
    getAccountStatementById,
    downloadAccountStatementPdfByAccountNumber, getMyAccountStatements,
} from './accountStatements.controller.js';
import {
    validateCreateAccountStatement,
    validateUpdateAccountStatement,
    validateAccountStatementById,
    validateAccountStatementByAccountNumber,
} from '../../middlewares/accountStatement-validators.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AccountStatements
 *   description: Estados de cuenta bancaria
 */

/**
 * @swagger
 * /accountStatements/create:
 *   post:
 *     summary: Crear un estado de cuenta
 *     tags: [AccountStatements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 example: ACC-123-456
 *               periodStart:
 *                 type: string
 *                 format: date
 *                 example: 2025-01-01
 *               periodEnd:
 *                 type: string
 *                 format: date
 *                 example: 2025-01-31
 *     responses:
 *       201:
 *         description: Estado de cuenta creado exitosamente
 *       404:
 *         description: Cuenta no encontrada
 */
router.post('/create', validateCreateAccountStatement, createAccountStatement);

/**
 * @swagger
 * /accountStatements:
 *   get:
 *     summary: Obtener lista de estados de cuenta
 *     tags: [AccountStatements]
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
 *         name: accountNumber
 *         schema:
 *           type: string
 *         description: Filtrar por número de cuenta
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: Filtrar por ID de cuenta (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Lista de estados de cuenta con paginación
 */
router.get('/', getAccountStatements);

/**
 * @swagger
 * /accountStatements/account/{accountNumber}/pdf:
 *   get:
 *     summary: Generar y enviar PDF del estado de cuenta por correo
 *     tags: [AccountStatements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *         example: ACC-123-456
 *       - in: query
 *         name: periodStart
 *         schema:
 *           type: string
 *           format: date
 *         description: Inicio del período (por defecto inicio del mes actual)
 *       - in: query
 *         name: periodEnd
 *         schema:
 *           type: string
 *           format: date
 *         description: Fin del período (por defecto hoy)
 *     responses:
 *       200:
 *         description: PDF generado y enviado al correo del usuario autenticado
 *       401:
 *         description: No autenticado o sin correo en el token
 *       403:
 *         description: Esta cuenta no te pertenece
 *       404:
 *         description: Cuenta no encontrada
 */
router.get('/account/:accountNumber/pdf', validateJWT, validateAccountStatementByAccountNumber, downloadAccountStatementPdfByAccountNumber);
// Estados de cuenta del usuario autenticado
router.get('/my', validateJWT, getMyAccountStatements);
/**
 * @swagger
 * /accountStatements/{id}:
 *   get:
 *     summary: Obtener un estado de cuenta por ID
 *     tags: [AccountStatements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del estado de cuenta
 *       404:
 *         description: Estado de cuenta no encontrado
 */
router.get('/:id', validateAccountStatementById, getAccountStatementById);

/**
 * @swagger
 * /accountStatements/{id}:
 *   put:
 *     summary: Actualizar un estado de cuenta
 *     tags: [AccountStatements]
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
 *     responses:
 *       200:
 *         description: Estado de cuenta actualizado
 *       404:
 *         description: Estado de cuenta no encontrado
 */
router.put('/:id', validateUpdateAccountStatement, updateAccountStatement);

/**
 * @swagger
 * /accountStatements/{id}:
 *   delete:
 *     summary: Eliminar un estado de cuenta
 *     tags: [AccountStatements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado de cuenta eliminado
 *       404:
 *         description: Estado de cuenta no encontrado
 */
router.delete('/:id', validateAccountStatementById, deleteAccountStatement);

export default router;