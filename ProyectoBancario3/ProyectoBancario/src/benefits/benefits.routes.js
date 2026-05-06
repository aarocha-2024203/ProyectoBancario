'use strict';

import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { listFranchiseBenefits } from './benefits.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Benefits
 *   description: Beneficios exclusivos para clientes del banco
 */

/**
 * @swagger
 * /service:
 *   get:
 *     summary: Obtener beneficios exclusivos del banco
 *     tags: [Benefits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de descuentos y beneficios en tiendas físicas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Por ser usuario de nuestro banco tienes descuentos en tiendas fisicas
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Token JWT inválido o no enviado
 */
router.get('/', validateJWT, listFranchiseBenefits);

export default router;