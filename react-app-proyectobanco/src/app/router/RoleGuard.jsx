import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../features/auth/store/authStore';

const RoleGuard = ({ allowedRoles = [] }) => {
  const { user } = useAuthStore();

  const role = user?.role ||
    user?.UserRoles?.[0]?.Role?.Name ||
    user?.roleName ||
    'USER_ROLE';

  const hasAccess = allowedRoles.length === 0 || allowedRoles.includes(role);

  // Si intenta entrar al admin pero tiene rol de usuario → redirige al dashboard
  if (!hasAccess && window.location.pathname.includes('/dashboard/admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  return hasAccess ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default RoleGuard;
