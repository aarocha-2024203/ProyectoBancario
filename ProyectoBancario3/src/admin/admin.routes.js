import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { isAdmin } from '../../middlewares/is-admin.middleware.js';
import { requestLimit } from '../../middlewares/request-limit.js';
import { validateUpdateUserRole } from '../../middlewares/admin-validation.js';

const router = Router();

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Obtiene todos los usuarios (solo admin)
 *     description: Lista todos los usuarios del sistema
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuarios obtenidos exitosamente
 *       401:
 *         description: Token inválido
 *       403:
 *         description: No tiene permisos de administrador
 */
router.get('/users', validateJWT, isAdmin, requestLimit, adminController.getUsers);

/**
 * @swagger
 * /api/v1/admin/users/{id}/role:
 *   put:
 *     tags: [Admin]
 *     summary: Cambia el rol de un usuario (solo admin)
 *     description: Actualiza el rol de un usuario específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN_ROLE, USER_ROLE]
 *                 description: Nuevo rol del usuario
 *     responses:
 *       200:
 *         description: Rol actualizado exitosamente
 *       400:
 *         description: Errores de validación
 *       401:
 *         description: Token inválido
 *       403:
 *         description: No tiene permisos de administrador
 *       404:
 *         description: Usuario no encontrado
 */
router.put(
    '/users/:id/role',
    validateJWT,
    isAdmin,
    requestLimit,
    validateUpdateUserRole,
    adminController.updateUserRole
);

export default router;