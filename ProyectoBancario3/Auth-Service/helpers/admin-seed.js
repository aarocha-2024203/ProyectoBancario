import { User, UserProfile, UserEmail, UserPasswordReset } from '../src/users/user.model.js';
import { Role, UserRole } from '../src/auth/role.model.js';
import { ADMIN_ROLE } from './role-constants.js';
import { hashPassword } from '../utils/password-utils.js';

export const seedDefaultAdmin = async () => {
    try {
        const DEFAULT_ADMINS = [
            {
                email: 'proyectobancario3@gmail.com',
                password: 'admin',
                username: 'sistemabancarioadmin',
                name: 'Admin',
                surname: 'Sistema Bancario',
            },
            
        ];

        // Asegurar que existe el rol ADMIN
        const [adminRole] = await Role.findOrCreate({
            where: { Name: ADMIN_ROLE },
            defaults: { Name: ADMIN_ROLE },
        });

        for (const admin of DEFAULT_ADMINS) {
            let user = await User.findOne({ where: { Email: admin.email } });

            if (!user) {
                const hashed = await hashPassword(admin.password);
                user = await User.create({
                    Name: admin.name,
                    Surname: admin.surname,
                    Username: admin.username,
                    Email: admin.email,
                    Password: hashed,
                    Status: true,
                });

                await UserProfile.create({
                    UserId: user.Id,
                    Phone: '00000000',
                    ProfilePicture: '',
                });

                await UserEmail.create({
                    UserId: user.Id,
                    EmailVerified: true
                });

                await UserPasswordReset.create({
                    UserId: user.Id
                });

                await UserRole.create({
                    UserId: user.Id,
                    RoleId: adminRole.Id
                });

                console.log(`Admin creado exitosamente: ${admin.email}`);
                continue;
            }

            // Asegurar estado activo
            await User.update({ Status: true }, { where: { Id: user.Id } });

            // Asignar rol si no lo tiene
            const existing = await UserRole.findOne({
                where: { UserId: user.Id, RoleId: adminRole.Id },
            });

            if (!existing) {
                await UserRole.create({
                    UserId: user.Id,
                    RoleId: adminRole.Id
                });
                console.log(`Rol ADMIN asignado a usuario existente: ${admin.email}`);
            } else {
                console.log(`Admin ya existe: ${admin.email}`);
            }
        }
    } catch (err) {
        console.error('Error creando admin por defecto:', err);
        throw err;
    }
};
