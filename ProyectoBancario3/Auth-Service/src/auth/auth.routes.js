import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import {
    authRateLimit,
    requestLimit,
} from '../../middlewares/request-limit.js';
import { upload, handleUploadError } from '../../helpers/file-upload.js';
import {
    validateRegister,
    validateLogin,
    validateVerifyEmail,
    validateResendVerification,
    validateForgotPassword,
    validateResetPassword,
} from '../../middlewares/validation.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticación
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - username
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Juan Pérez
 *               username:
 *                 type: string
 *                 example: juanperez
 *               email:
 *                 type: string
 *                 example: juan@email.com
 *               password:
 *                 type: string
 *                 example: MiPassword123!
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: El usuario ya existe
 */
router.post(
    '/register',
    authRateLimit,
    upload.single('profilePicture'),
    handleUploadError,
    validateRegister,
    authController.register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailOrUsername
 *               - password
 *             properties:
 *               emailOrUsername:
 *                 type: string
 *                 example: juan@email.com
 *               password:
 *                 type: string
 *                 example: MiPassword123!
 *     responses:
 *       200:
 *         description: Login exitoso, retorna JWT
 *       401:
 *         description: Credenciales inválidas
 *       423:
 *         description: Cuenta bloqueada o desactivada
 */
router.post('/login', authRateLimit, validateLogin, authController.login);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verificar correo electrónico con token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: abc123token
 *     responses:
 *       200:
 *         description: Email verificado exitosamente
 *       400:
 *         description: Token inválido o expirado
 *       404:
 *         description: Usuario no encontrado
 */
router.post(
    '/verify-email',
    requestLimit,
    validateVerifyEmail,
    authController.verifyEmail
);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Reenviar correo de verificación
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: juan@email.com
 *     responses:
 *       200:
 *         description: Correo reenviado exitosamente
 *       400:
 *         description: El correo ya fue verificado
 *       404:
 *         description: Usuario no encontrado
 *       503:
 *         description: Error al enviar el correo
 */
router.post(
    '/resend-verification',
    authRateLimit,
    validateResendVerification,
    authController.resendVerification
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: juan@email.com
 *     responses:
 *       200:
 *         description: Correo de recuperación enviado (siempre retorna 200 por seguridad)
 *       503:
 *         description: Error al enviar el correo
 */
router.post(
    '/forgot-password',
    authRateLimit,
    validateForgotPassword,
    authController.forgotPassword
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña con token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: resetToken123
 *               newPassword:
 *                 type: string
 *                 example: NuevaPassword456!
 *     responses:
 *       200:
 *         description: Contraseña restablecida exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token inválido o expirado
 *       404:
 *         description: Usuario no encontrado
 */
router.post(
    '/reset-password',
    authRateLimit,
    validateResetPassword,
    authController.resetPassword
);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: Token JWT inválido o no enviado
 */
router.get('/profile', validateJWT, authController.getProfile);

/**
 * @swagger
 * /auth/profile-by-id:
 *   post:
 *     summary: Obtener perfil de usuario por ID (uso interno entre microservicios)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: uuid-del-usuario
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       400:
 *         description: userId requerido
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/profile-by-id', authController.getProfileById);

export default router;