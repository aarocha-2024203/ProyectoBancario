import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../features/auth/store/authStore';

/*
  Envuelve rutas que requieren sesión activa.
  Si no hay token → redirige a /auth/login.
*/
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />;
};

export default ProtectedRoute;
