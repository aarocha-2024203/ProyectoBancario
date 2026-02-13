import { changeUserRole, getAllUsers } from '../../helpers/admin-operations.js';
import { buildUserResponse } from '../../utils/user-helpers.js';

/**
 * Controller para cambiar el rol de un usuario
 * PUT /api/v1/admin/users/:id/role
 */
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({
                success: false,
                message: 'El rol es obligatorio',
            });
        }

        // Cambiar el rol del usuario
        const updatedUser = await changeUserRole(id, role);

        return res.status(200).json({
            success: true,
            message: 'Rol actualizado exitosamente',
            user: buildUserResponse(updatedUser),
        });
    } catch (error) {
        console.error('Error en updateUserRole:', error);

        if (error.message.includes('Usuario no encontrado')) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado',
            });
        }

        if (error.message.includes('Rol inválido')) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error al actualizar el rol del usuario',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * Controller para obtener todos los usuarios (solo admin)
 * GET /api/v1/admin/users
 */
export const getUsers = async (req, res) => {
    try {
        const users = await getAllUsers();

        return res.status(200).json({
            success: true,
            message: 'Usuarios obtenidos exitosamente',
            users: users.map((user) => buildUserResponse(user)),
            total: users.length,
        });
    } catch (error) {
        console.error('Error en getUsers:', error);

        return res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};