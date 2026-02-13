import { UserRole, Role } from '../src/auth/role.model.js';
import { User } from '../src/users/user.model.js';
import { findUserById } from './user-db.js';
import { ALLOWED_ROLES } from './role-constants.js';

/**
 * Helper para cambiar el rol de un usuario
 * @param {string} userId - ID del usuario
 * @param {string} newRoleName - Nombre del nuevo rol (ADMIN_ROLE o USER_ROLE)
 * @returns {Promise<Object>} Usuario actualizado
 */
export const changeUserRole = async (userId, newRoleName) => {
    const transaction = await User.sequelize.transaction();

    try {
        
        if (!ALLOWED_ROLES.includes(newRoleName)) {
            throw new Error(
                `Rol inválido. Los roles permitidos son: ${ALLOWED_ROLES.join(', ')}`
            );
        }

        
        const user = await findUserById(userId);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        
        const newRole = await Role.findOne(
            {
                where: { Name: newRoleName },
            },
            { transaction }
        );

        if (!newRole) {
            throw new Error(`El rol ${newRoleName} no existe en la base de datos`);
        }

        
        await UserRole.destroy(
            {
                where: { UserId: userId },
            },
            { transaction }
        );

        
        await UserRole.create(
            {
                UserId: userId,
                RoleId: newRole.Id,
            },
            { transaction }
        );

        await transaction.commit();

        
        const updatedUser = await findUserById(userId);
        return updatedUser;
    } catch (error) {
        await transaction.rollback();
        console.error('Error cambiando rol de usuario:', error);
        throw error;
    }
};

/**
 * Helper para obtener todos los usuarios (para admin)
 * @returns {Promise<Array>} Lista de usuarios
 */
export const getAllUsers = async () => {
    try {
        const users = await User.findAll({
            include: [
                {
                    model: UserRole,
                    as: 'UserRoles',
                    include: [{ model: Role, as: 'Role' }],
                },
            ],
            order: [['CreatedAt', 'DESC']],
        });

        return users;
    } catch (error) {
        console.error('Error obteniendo todos los usuarios:', error);
        throw new Error('Error al obtener usuarios');
    }
};