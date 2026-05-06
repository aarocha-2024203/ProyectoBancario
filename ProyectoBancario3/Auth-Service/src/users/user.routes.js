import { Router } from 'express';
import {
    changeRole,
    updateUserRole,
    getUserRoles,
    getUsersByRole
} from './user.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de roles de usuarios (solo ADMIN)
 */

/**
 * @swagger
 * /users/{userId}/role:
 *   put:
 *     summary: Actualizar el rol de un usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleName
 *             properties:
 *               roleName:
 *                 type: string
 *                 enum: [ADMIN_ROLE, MANAGER_ROLE, USER_ROLE, ATM_ROLE]
 *                 example: USER_ROLE
 *     responses:
 *       200:
 *         description: Rol actualizado exitosamente
 *       400:
 *         description: Rol no permitido
 *       403:
 *         description: Solo ADMIN puede realizar esta acción
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/:userId/role', ...updateUserRole);

/**
 * @swagger
 * /users/change-role/{userId}:
 *   put:
 *     summary: Cambiar el rol de un usuario (alias de PUT /users/:userId/role)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleName
 *             properties:
 *               roleName:
 *                 type: string
 *                 enum: [ADMIN_ROLE, MANAGER_ROLE, USER_ROLE, ATM_ROLE]
 *                 example: MANAGER_ROLE
 *     responses:
 *       200:
 *         description: Rol cambiado exitosamente
 *       400:
 *         description: Rol no permitido
 *       403:
 *         description: Solo ADMIN puede realizar esta acción
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/change-role/:userId', ...changeRole);

/**
 * @swagger
 * /users/{userId}/roles:
 *   get:
 *     summary: Obtener los roles de un usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de roles del usuario
 *       401:
 *         description: No autenticado
 */
router.get('/:userId/roles', ...getUserRoles);

/**
 * @swagger
 * /users/by-role/{roleName}:
 *   get:
 *     summary: Obtener usuarios por rol (solo ADMIN)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleName
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ADMIN_ROLE, MANAGER_ROLE, USER_ROLE, ATM_ROLE]
 *         description: Nombre del rol
 *     responses:
 *       200:
 *         description: Lista de usuarios con ese rol
 *       400:
 *         description: Rol no permitido
 *       403:
 *         description: Solo ADMIN puede realizar esta acción
 */
router.get('/by-role/:roleName', ...getUsersByRole);

export default router;