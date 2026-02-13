import { ADMIN_ROLE } from '../helpers/role-constants.js';

export const isAdmin = async (req, res, next) => {
    try {
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No hay usuario autenticado',
            });
        }

        const userRoles = req.user.UserRoles || [];
        const hasAdminRole = userRoles.some(
            (userRole) => userRole.Role?.Name === ADMIN_ROLE
        );

        if (!hasAdminRole) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Se requiere rol de administrador.',
            });
        }

        next();
    } catch (error) {
        console.error('Error verificando rol de administrador:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};