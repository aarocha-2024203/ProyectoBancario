import { body, validationResult } from 'express-validator';
import { ALLOWED_ROLES } from '../helpers/role-constants.js';

/**
 * Middleware para procesar resultados de validación
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }
  next();
};

/**
 * Validaciones para el registro de usuario
 */
export const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ max: 25 })
    .withMessage('El nombre no puede tener más de 25 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('surname')
    .trim()
    .notEmpty()
    .withMessage('El apellido es obligatorio')
    .isLength({ max: 25 })
    .withMessage('El apellido no puede tener más de 25 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El apellido solo puede contener letras y espacios'),

  body('username')
    .trim()
    .notEmpty()
    .withMessage('El nombre de usuario es obligatorio')
    .isLength({ max: 50 })
    .withMessage('El nombre de usuario no puede tener más de 50 caracteres'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('El correo electrónico es obligatorio')
    .isEmail()
    .withMessage('El correo electrónico no tiene un formato válido')
    .isLength({ max: 150 })
    .withMessage('El correo electrónico no puede tener más de 150 caracteres'),

  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
    .isLength({ min: 8, max: 255 })
    .withMessage('La contraseña debe tener entre 8 y 255 caracteres'),

  body('phone')
    .notEmpty()
    .withMessage('El número de teléfono es obligatorio')
    .matches(/^\d{8}$/)
    .withMessage('El número de teléfono debe tener exactamente 8 dígitos'),

  handleValidationErrors,
];

/**
 * Validaciones para el login
 */
export const validateLogin = [
  body('emailOrUsername')
    .trim()
    .notEmpty()
    .withMessage('Email o nombre de usuario es requerido'),

  body('password').notEmpty().withMessage('La contraseña es requerida'),

  handleValidationErrors,
];

/**
 * Validaciones para verificación de email
 */
export const validateVerifyEmail = [
  body('token').notEmpty().withMessage('El token de verificación es requerido'),

  handleValidationErrors,
];

/**
 * Validaciones para reenvío de verificación
 */
export const validateResendVerification = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es obligatorio')
    .isEmail()
    .withMessage('Debe proporcionar un email válido'),

  handleValidationErrors,
];

/**
 * Validaciones para forgot password
 */
export const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es obligatorio')
    .isEmail()
    .withMessage('Debe proporcionar un email válido'),

  handleValidationErrors,
];

/**
 * Validaciones para reset password
 */
export const validateResetPassword = [
  body('token').notEmpty().withMessage('El token de recuperación es requerido'),

  body('newPassword')
    .notEmpty()
    .withMessage('La nueva contraseña es obligatoria')
    .isLength({ min: 8 })
    .withMessage('La nueva contraseña debe tener al menos 8 caracteres'),

  handleValidationErrors,
];

/**
 * Validaciones para solicitar cambio de rol
 * POST /api/v1/auth/request-role-change
 */
export const validateRequestRoleChange = [
  body('targetUserId')
    .trim()
    .notEmpty()
    .withMessage('El targetUserId es obligatorio.')
    .isString()
    .withMessage('targetUserId debe ser un string.'),

  body('newRole')
    .trim()
    .notEmpty()
    .withMessage('El newRole es obligatorio.')
    .isIn(ALLOWED_ROLES)
    .withMessage(`newRole debe ser uno de: ${ALLOWED_ROLES.join(', ')}.`),

  handleValidationErrors,
];

/**
 * Validaciones para verificar token de cambio de rol
 * POST /api/v1/auth/verify-role-change
 */
export const validateVerifyRoleChange = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('El token es obligatorio.')
    .isString()
    .withMessage('El token debe ser un string.')
    .isLength({ min: 64, max: 64 })
    .withMessage('Formato de token inválido.'),

  handleValidationErrors,
];

export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(500).json({
        success: false,
        message: 'Debe validar el token primero'
      });
    }

    const { UserRole } = await import('../src/auth/role.model.js');
    const { Role } = await import('../src/auth/role.model.js');

    const userRole = await UserRole.findOne({
      where: { UserId: req.user.Id },
      include: [{ model: Role, as: 'Role' }]
    });

    if (!userRole || userRole.Role?.Name !== 'ADMIN_ROLE') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden realizar esta acción'
      });
    }

    next();
  } catch (error) {
    console.error('Error en isAdmin:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};