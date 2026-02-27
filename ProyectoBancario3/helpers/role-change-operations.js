// helpers/role-change-operations.js

import crypto from 'crypto';
import { User } from '../src/users/user.model.js';
import { Role, UserRole, UserRoleChange } from '../src/auth/role.model.js';
import { sendRoleChangeTokenEmail } from './email-service.js';

// Correo del admin hardcodeado — mismo que en admin-seed.js
const ADMIN_EMAIL = 'josealejandrovirulaarocha@gmail.com';

/**
 * Genera un token seguro para cambio de rol y lo envía al correo del admin.
 *
 * @param {string} adminId       - ID del admin autenticado (viene del JWT)
 * @param {string} targetUserId  - ID del usuario al que se le cambiará el rol
 * @param {string} newRole       - Nuevo rol (ADMIN_ROLE | USER_ROLE)
 */
export const requestRoleChangeHelper = async (adminId, targetUserId, newRole) => {
  // 1. Verificar que quien hace la petición existe y tiene ADMIN_ROLE
  const admin = await User.findOne({
    where: { Id: adminId, Status: true },
    include: [
      {
        model: UserRole,
        as: 'UserRoles',
        include: [{ model: Role, as: 'Role' }],
      },
    ],
  });

  if (!admin) throw new Error('Administrador no encontrado.');

  const isAdmin = admin.UserRoles?.some((ur) => ur.Role?.Name === 'ADMIN_ROLE');
  if (!isAdmin) throw new Error('No tienes permisos para realizar esta acción.');

  // 2. Verificar que el usuario objetivo existe y está activo
  const targetUser = await User.findOne({
    where: { Id: targetUserId, Status: true },
  });
  if (!targetUser) throw new Error('Usuario objetivo no encontrado.');

  // 3. Verificar que el usuario no tenga ya ese rol
  const currentUserRole = await UserRole.findOne({
    where: { UserId: targetUserId },
    include: [{ model: Role, as: 'Role' }],
  });

  if (currentUserRole?.Role?.Name === newRole) {
    throw new Error(`El usuario ya tiene el rol ${newRole}.`);
  }

  // 4. Generar token:
  //    - rawToken (hex 64 chars) → viaja por email al admin
  //    - tokenHash (sha256)      → se almacena en BD
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

  // 5. Guardar o actualizar en user_role_changes (upsert sobre UserId)
  await UserRoleChange.upsert({
    UserId: targetUserId,
    RoleChangeToken: tokenHash,
    RoleChangeTokenExpiry: expiresAt,
    PendingRole: newRole,
  });

  // 6. El token siempre se envía al correo del admin principal (admin-seed.js)
  const emailSent = await sendRoleChangeTokenEmail({
    adminEmail: ADMIN_EMAIL,
    adminName: `${admin.Name} ${admin.Surname}`,
    targetUsername: targetUser.Username,
    token: rawToken,
    newRole,
    expiresAt,
  });

  if (!emailSent) throw new Error('No se pudo enviar el email con el token.');

  return {
    success: true,
    message: 'Token de cambio de rol enviado al correo del administrador. Expira en 15 minutos.',
    data: {
      targetUserId,
      pendingRole: newRole,
      expiresAt,
    },
  };
};

/**
 * Verifica el token recibido por email y ejecuta el cambio de rol.
 *
 * @param {string} token - Token en texto plano recibido por email
 */
export const verifyRoleChangeHelper = async (token) => {
  // 1. Hashear el token recibido para compararlo con el guardado en BD
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // 2. Buscar el registro en user_role_changes con ese hash
  const roleChangeRecord = await UserRoleChange.findOne({
    where: { RoleChangeToken: tokenHash },
    include: [{ model: User, as: 'User' }],
  });

  if (!roleChangeRecord) {
    throw new Error('Token inválido o ya fue utilizado.');
  }

  // 3. Verificar expiración
  if (new Date() > new Date(roleChangeRecord.RoleChangeTokenExpiry)) {
    await roleChangeRecord.update({
      RoleChangeToken: null,
      RoleChangeTokenExpiry: null,
      PendingRole: null,
    });
    throw new Error('El token ha expirado. Solicita uno nuevo.');
  }

  const { PendingRole: newRole, User: targetUser } = roleChangeRecord;
  if (!newRole) throw new Error('No hay un cambio de rol pendiente para este token.');

  // 4. Obtener el registro del rol en la tabla roles
  const roleRecord = await Role.findOne({ where: { Name: newRole } });
  if (!roleRecord) throw new Error(`El rol ${newRole} no existe en la base de datos.`);

  // 5. Reemplazar rol: eliminar el viejo e insertar el nuevo
  await UserRole.destroy({ where: { UserId: targetUser.Id } });
  await UserRole.create({ UserId: targetUser.Id, RoleId: roleRecord.Id });

  // 6. Limpiar el token (un solo uso)
  await roleChangeRecord.update({
    RoleChangeToken: null,
    RoleChangeTokenExpiry: null,
    PendingRole: null,
  });

  return {
    success: true,
    message: `Rol actualizado exitosamente a ${newRole}.`,
    data: {
      userId: targetUser.Id,
      username: targetUser.Username,
      newRole,
    },
  };
};