import { Router } from "express";
import { createCurrency, getCurrencies, updateCurrency, deleteCurrency, getCurrencyById, changeCurrencyStatus } from "./coins.controller.js";
import { validateCoinById, validateCreateCoin, validateUpdateCoin } from "../../middlewares/coins-validators.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Coins
 *   description: Gestión de monedas y divisas
 */

/**
 * @swagger
 * /coins/create:
 *   post:
 *     summary: Crear una nueva moneda
 *     tags: [Coins]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - symbol
 *               - exchangeRate
 *             properties:
 *               name:
 *                 type: string
 *                 example: Quetzal
 *               code:
 *                 type: string
 *                 example: GTQ
 *               symbol:
 *                 type: string
 *                 example: Q
 *               exchangeRate:
 *                 type: number
 *                 example: 1.0
 *     responses:
 *       201:
 *         description: Moneda creada exitosamente
 *       400:
 *         description: Error de validación
 */
router.post('/create', validateCreateCoin, createCurrency);

/**
 * @swagger
 * /coins:
 *   get:
 *     summary: Obtener todas las monedas activas
 *     tags: [Coins]
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
 *           enum: [activa, inactiva]
 *           default: activa
 *     responses:
 *       200:
 *         description: Lista de monedas con paginación
 */
router.get('/', getCurrencies);

/**
 * @swagger
 * /coins/{id}:
 *   get:
 *     summary: Obtener una moneda por ID
 *     tags: [Coins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos de la moneda
 *       404:
 *         description: Moneda no encontrada
 */
router.get('/:id', validateCoinById, getCurrencyById);

/**
 * @swagger
 * /coins/{id}:
 *   put:
 *     summary: Actualizar una moneda
 *     tags: [Coins]
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
 *               name:
 *                 type: string
 *               exchangeRate:
 *                 type: number
 *               symbol:
 *                 type: string
 *     responses:
 *       200:
 *         description: Moneda actualizada exitosamente
 *       404:
 *         description: Moneda no encontrada
 */
router.put('/:id', validateUpdateCoin, updateCurrency);

/**
 * @swagger
 * /coins/{id}:
 *   delete:
 *     summary: Eliminar una moneda
 *     tags: [Coins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Moneda eliminada exitosamente
 *       404:
 *         description: Moneda no encontrada
 */
router.delete('/:id', validateCoinById, deleteCurrency);

/**
 * @swagger
 * /coins/{id}/status:
 *   patch:
 *     summary: Cambiar estado de una moneda
 *     tags: [Coins]
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
 *                 enum: [activa, inactiva]
 *                 example: inactiva
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       400:
 *         description: Estado no permitido
 *       404:
 *         description: Moneda no encontrada
 */
router.patch('/:id/status', changeCurrencyStatus);

export default router;