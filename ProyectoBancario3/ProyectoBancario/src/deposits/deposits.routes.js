'use strict';

import { Router } from 'express';
import {
    createDeposit,
    getDeposits,
    getDepositById,
    updateDepositAmount,
    deleteDeposit,
    revertDeposit
} from './deposits.controller.js';
import {
    validateCreateDeposit,
    validateListDeposits,
    validateUpdateDepositAmount,
    validateDepositById,
    validateRevertDeposit
} from '../../middlewares/deposits-validators.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Deposits
 *   description: Gestión de depósitos bancarios
 */

/**
 * @swagger
 * /deposits/create:
 *   post:
 *     summary: Realizar un depósito
 *     tags: [Deposits]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountNumber
 *               - amount
 *               - currencyCode
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 example: ACC-123-456
 *               amount:
 *                 type: number
 *                 example: 500.00
 *               currencyCode:
 *                 type: string
 *                 example: GTQ
 *               description:
 *                 type: string
 *                 example: Depósito inicial
 *               executedByUserId:
 *                 type: string
 *                 example: uuid-del-usuario
 *     responses:
 *       201:
 *         description: Depósito realizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Cuenta no encontrada
 */
router.post('/create', validateCreateDeposit, createDeposit);

/**
 * @swagger
 * /deposits:
 *   get:
 *     summary: Obtener lista de depósitos
 *     tags: [Deposits]
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
 *           enum: [exitosa, reversada]
 *           default: exitosa
 *       - in: query
 *         name: accountNumber
 *         schema:
 *           type: string
 *         description: Filtrar por número de cuenta
 *     responses:
 *       200:
 *         description: Lista de depósitos con paginación
 */
router.get('/', validateListDeposits, getDeposits);

/**
 * @swagger
 * /deposits/{id}:
 *   get:
 *     summary: Obtener un depósito por ID
 *     tags: [Deposits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del depósito (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Datos del depósito
 *       404:
 *         description: Depósito no encontrado
 */
router.get('/:id', validateDepositById, getDepositById);

/**
 * @swagger
 * /deposits/{id}:
 *   put:
 *     summary: Actualizar el monto de un depósito
 *     tags: [Deposits]
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
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 750.00
 *     responses:
 *       200:
 *         description: Monto actualizado exitosamente
 *       400:
 *         description: No se puede modificar un depósito reversado o monto inválido
 *       404:
 *         description: Depósito o cuenta no encontrada
 */
router.put('/:id', validateUpdateDepositAmount, updateDepositAmount);

/**
 * @swagger
 * /deposits/{id}:
 *   delete:
 *     summary: Eliminar depósito (no permitido, use revert)
 *     tags: [Deposits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       405:
 *         description: Los depósitos no pueden eliminarse, use el endpoint de reversión
 */
router.delete('/:id', validateDepositById, deleteDeposit);

/**
 * @swagger
 * /deposits/{id}/revert:
 *   patch:
 *     summary: Revertir un depósito (solo dentro del primer minuto)
 *     tags: [Deposits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Depósito reversado exitosamente
 *       400:
 *         description: El depósito ya fue reversado o el tiempo límite expiró
 *       404:
 *         description: Depósito o cuenta no encontrada
 */
router.patch('/:id/revert', validateRevertDeposit, revertDeposit);

export default router;