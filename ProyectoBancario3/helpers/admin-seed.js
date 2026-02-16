'use strict';

import { User, UserEmail } from '../src/users/user.model.js';
import { Role, UserRole } from '../src/auth/role.model.js';

export const ensureAdminUser = async () => {
    try {
        const adminEmail = 'josealejandrovirulaarocha@gmail.com';

        // Buscar el usuario por email usando Email (PascalCase)
        const user = await User.findOne({
            where: { Email: adminEmail.toLowerCase() },
            include: [
                { model: UserEmail, as: 'UserEmail' },
                {
                    model: UserRole,
                    as: 'UserRoles',
                    include: [{ model: Role, as: 'Role' }],
                },
            ],
        });

        if (!user) {
            console.log(`⚠️  Usuario ${adminEmail} no encontrado - necesita registrarse primero`);
            return;
        }

        // Buscar el rol ADMIN_ROLE
        const adminRole = await Role.findOne({
            where: { Name: 'ADMIN_ROLE' }
        });

        if (!adminRole) {
            console.error('❌ Rol ADMIN_ROLE no encontrado en la base de datos');
            return;
        }

        // Verificar si ya tiene el rol
        const existingUserRole = await UserRole.findOne({
            where: {
                UserId: user.Id,
                RoleId: adminRole.Id
            }
        });

        if (existingUserRole) {
            console.log(`✅ Usuario ${adminEmail} ya tiene rol ADMIN_ROLE`);
            return;
        }

        // Eliminar roles anteriores del usuario
        await UserRole.destroy({
            where: { UserId: user.Id }
        });

        // Generar ID único de MÁXIMO 16 caracteres
        const timestamp = Date.now().toString(36); // Convierte timestamp a base36
        const random = Math.random().toString(36).substr(2, 5); // 5 caracteres aleatorios
        const userRoleId = `ur_${timestamp}${random}`.substring(0, 16); // Asegura máximo 16 chars

        // Asignar rol ADMIN_ROLE
        await UserRole.create({
            Id: userRoleId,
            UserId: user.Id,
            RoleId: adminRole.Id
        });

        console.log(`✅ Usuario ${adminEmail} promovido a ADMIN_ROLE exitosamente`);

    } catch (error) {
        console.error('❌ Error al asegurar usuario admin:', error.message);
    }
};