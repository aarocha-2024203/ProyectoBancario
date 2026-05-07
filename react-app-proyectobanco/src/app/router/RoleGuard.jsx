import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../features/auth/store/authStore';

/*
  Uso:
    <RoleGuard allowedRoles={['ADMIN_ROLE']} />

  Si el usuario tiene el rol correcto → renderiza la ruta.
  Si no → redirige a /unauthorized.
*/
const RoleGuard = ({ allowedRoles = [] }) => {
  const { user } = useAuthStore();

  // El rol puede estar en distintas posiciones según el backend
  const roleName =
    user?.role?.roleName ||
    user?.roleName ||
    user?.role ||
    '';

  const hasAccess = allowedRoles.length === 0 || allowedRoles.includes(roleName);
  return hasAccess ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default RoleGuard;
