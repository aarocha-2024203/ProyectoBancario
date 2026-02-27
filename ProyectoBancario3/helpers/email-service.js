import nodemailer from 'nodemailer';
import { config } from '../configs/config.js';

// Configurar el transportador de email (aligned with .NET SmtpSettings)
const createTransporter = () => {
  if (!config.smtp.username || !config.smtp.password) {
    console.warn(
      'SMTP credentials not configured. Email functionality will not work.'
    );
    return null;
  }

  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.enableSsl,
    auth: {
      user: config.smtp.username,
      pass: config.smtp.password,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const transporter = createTransporter();

export const sendVerificationEmail = async (email, name, verificationToken) => {
  if (!transporter) {
    throw new Error('SMTP transporter not configured');
  }

  try {
    const frontendUrl = config.app.frontendUrl || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
      to: email,
      subject: 'Verify your email address',
      html: `
        <h2>Welcome ${name}!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href='${verificationUrl}' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
            Verify Email
        </a>
        <p>If you cannot click the link, copy and paste this URL into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, name, resetToken) => {
  if (!transporter) {
    throw new Error('SMTP transporter not configured');
  }

  try {
    const frontendUrl = config.app.frontendUrl || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
      to: email,
      subject: 'Reset your password',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href='${resetUrl}' style='background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
            Reset Password
        </a>
        <p>If you cannot click the link, copy and paste this URL into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email, name) => {
  if (!transporter) {
    throw new Error('SMTP transporter not configured');
  }

  try {
    const mailOptions = {
      from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
      to: email,
      subject: 'Welcome to AuthDotnet!',
      html: `
        <h2>Welcome to AuthDotnet, ${name}!</h2>
        <p>Your account has been successfully verified and activated.</p>
        <p>You can now enjoy all the features of our platform.</p>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Thank you for joining us!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

export const sendPasswordChangedEmail = async (email, name) => {
  if (!transporter) {
    throw new Error('SMTP transporter not configured');
  }

  try {
    const mailOptions = {
      from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
      to: email,
      subject: 'Password Changed Successfully',
      html: `
        <h2>Password Changed</h2>
        <p>Hello ${name},</p>
        <p>Your password has been successfully updated.</p>
        <p>If you didn't make this change, please contact our support team immediately.</p>
        <p>This is an automated email, please do not reply to this message.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending password changed email:', error);
    throw error;
  }
};

/**
 * Envía el token de cambio de rol al correo del administrador principal.
 *
 * @param {object} params
 * @param {string} params.adminEmail       - Correo del admin (josealejandrovirulaarocha@gmail.com)
 * @param {string} params.adminName        - Nombre completo del admin
 * @param {string} params.targetUsername   - Username del usuario afectado
 * @param {string} params.token            - Token en texto plano (64 hex chars)
 * @param {string} params.newRole          - Nuevo rol a asignar
 * @param {Date}   params.expiresAt        - Fecha/hora de expiración
 * @returns {Promise<boolean>}             - true si se envió, false si falló
 */
export const sendRoleChangeTokenEmail = async ({
  adminEmail,
  adminName,
  targetUsername,
  token,
  newRole,
  expiresAt,
}) => {
  if (!transporter) {
    throw new Error('SMTP transporter not configured');
  }

  try {
    const roleLabel = newRole === 'ADMIN_ROLE' ? 'Administrador' : 'Usuario';
    const expiresFormatted = new Date(expiresAt).toLocaleString('es-GT', {
      timeZone: 'America/Guatemala',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const mailOptions = {
      from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
      to: adminEmail,
      subject: '🔐 Token de confirmación — Cambio de rol',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #4f46e5;">Confirmación de cambio de rol</h2>

          <p>Hola <strong>${adminName}</strong>,</p>

          <p>
            Recibimos una solicitud para cambiar el rol del usuario
            <strong>@${targetUsername}</strong> a
            <strong>${roleLabel}</strong>.
          </p>

          <p>Si fuiste tú quien realizó esta acción, usa el siguiente token para confirmarla:</p>

          <div style="
            background: #f5f3ff;
            border-left: 4px solid #4f46e5;
            padding: 16px 20px;
            margin: 24px 0;
            font-family: monospace;
            font-size: 13px;
            word-break: break-all;
            border-radius: 4px;
          ">
            ${token}
          </div>

          <p style="color: #dc2626; font-size: 14px;">
            ⚠️ Este token expira el <strong>${expiresFormatted}</strong>
            y solo puede usarse <strong>una vez</strong>.
          </p>

          <p style="font-size: 14px; color: #6b7280;">
            Si no realizaste esta solicitud, ignora este correo con seguridad.
            Nadie puede completar el cambio sin tu token y tu sesión activa.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            Este es un correo automático, por favor no respondas a este mensaje.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending role change email:', error);
    return false;
  }
};