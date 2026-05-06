// ============================================================
// ARCHIVO: src/notifications/notifications.routes.js
// ============================================================
import { Router } from "express";
import { createNotification, getNotifications, getNotificationById, updateNotification, deleteNotification, changeNotificationStatus } from "./notifications.controller.js";
import { validateCreateNotification, validateUpdateNotification, validateNotificationById } from "../../middlewares/notifications-validators.js";
import { validateJWT } from "../../middlewares/validate-JWT.js";
import { requireRole } from "../../middlewares/validate-role.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestión de notificaciones
 */

/**
 * @swagger
 * /notifications/create:
 *   post:
 *     summary: Crear una notificación
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - message
 *               - type
 *             properties:
 *               userId:
 *                 type: string
 *                 example: uuid-del-usuario
 *               message:
 *                 type: string
 *                 example: Se realizó una transferencia de Q200.00
 *               type:
 *                 type: string
 *                 example: transaccion
 *     responses:
 *       201:
 *         description: Notificación creada exitosamente
 */
router.post('/create', validateCreateNotification, createNotification);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Obtener todas las notificaciones (ADMIN / MANAGER / ATM)
 *     tags: [Notifications]
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
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 *       403:
 *         description: Acceso denegado
 */
router.get('/', validateJWT, requireRole('ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE'), getNotifications);

/**
 * @swagger
 * /notifications/{id}:
 *   get:
 *     summary: Obtener una notificación por ID
 *     tags: [Notifications]
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
 *         description: Datos de la notificación
 *       404:
 *         description: Notificación no encontrada
 */
router.get('/:id', validateJWT, validateNotificationById, getNotificationById);

/**
 * @swagger
 * /notifications/{id}:
 *   put:
 *     summary: Actualizar una notificación
 *     tags: [Notifications]
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
 *               message:
 *                 type: string
 *               read:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Notificación actualizada
 *       404:
 *         description: Notificación no encontrada
 */
router.put('/:id', validateUpdateNotification, updateNotification);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Eliminar una notificación
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notificación eliminada exitosamente
 *       404:
 *         description: Notificación no encontrada
 */
router.delete('/:id', validateNotificationById, deleteNotification);

/**
 * @swagger
 * /notifications/{id}/status:
 *   patch:
 *     summary: Cambiar estado de una notificación (leída/no leída)
 *     tags: [Notifications]
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
 *                 example: leida
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       404:
 *         description: Notificación no encontrada
 */
router.patch('/:id/status', validateJWT, validateNotificationById, changeNotificationStatus);

export default router;