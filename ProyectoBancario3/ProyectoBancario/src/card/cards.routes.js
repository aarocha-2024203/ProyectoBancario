import { Router } from 'express';
import {
    createCard, getCards, updateCard, deleteCard,
    getCardById, changeCardStatus, getMyCards
} from './cards.controller.js';
import { validateCreateCard, validateUpdateCard, validateCardById, validateReadCardById } from '../../middlewares/card-validators.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';

const router = Router();

// Usuario ve sus propias tarjetas
router.get('/my', validateJWT, getMyCards);

/**
 * @swagger
 * tags:
 *   name: Cards
 *   description: Gestión de tarjetas bancarias
 */

/**
 * @swagger
 * /cards/create:
 *   post:
 *     summary: Crear una nueva tarjeta
 *     tags: [Cards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - cardType
 *             properties:
 *               userId:
 *                 type: string
 *                 example: uuid-del-usuario
 *               cardType:
 *                 type: string
 *                 enum: [debito, credito]
 *                 example: debito
 *               franchise:
 *                 type: string
 *                 example: VISA
 *     responses:
 *       201:
 *         description: Tarjeta creada exitosamente
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/create', validateCreateCard, createCard);

/**
 * @swagger
 * /cards:
 *   get:
 *     summary: Obtener todas las tarjetas (solo ADMIN)
 *     tags: [Cards]
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
 *           enum: [activa, bloqueada, cancelada, vencida]
 *           default: activa
 *     responses:
 *       200:
 *         description: Lista de tarjetas con paginación
 *       403:
 *         description: Solo ADMIN puede ver todas las tarjetas
 */
router.get('/', validateJWT, requireRole('ADMIN_ROLE'), getCards);

/**
 * @swagger
 * /cards/{id}:
 *   get:
 *     summary: Obtener una tarjeta por ID
 *     tags: [Cards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos de la tarjeta
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: No puedes ver esta tarjeta
 *       404:
 *         description: Tarjeta no encontrada
 */
router.get('/:id', validateReadCardById, getCardById);

/**
 * @swagger
 * /cards/{id}:
 *   put:
 *     summary: Actualizar datos de una tarjeta
 *     tags: [Cards]
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
 *               userId:
 *                 type: string
 *               cardType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tarjeta actualizada exitosamente
 *       404:
 *         description: Tarjeta o usuario no encontrado
 */
router.put('/:id', validateUpdateCard, updateCard);

/**
 * @swagger
 * /cards/{id}:
 *   delete:
 *     summary: Eliminar una tarjeta
 *     tags: [Cards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tarjeta eliminada exitosamente
 *       404:
 *         description: Tarjeta no encontrada
 */
router.delete('/:id', validateCardById, deleteCard);

/**
 * @swagger
 * /cards/{id}/status:
 *   patch:
 *     summary: Cambiar estado de una tarjeta
 *     tags: [Cards]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [activa, bloqueada, cancelada, vencida]
 *                 example: bloqueada
 *     responses:
 *       200:
 *         description: Estado de tarjeta actualizado
 *       400:
 *         description: Estado no permitido
 *       404:
 *         description: Tarjeta no encontrada
 */
router.patch('/:id/status', changeCardStatus);

export default router;