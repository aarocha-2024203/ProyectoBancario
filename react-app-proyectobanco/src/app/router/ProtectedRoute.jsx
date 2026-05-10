import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../features/auth/store/authStore';

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />;
};

export default ProtectedRoute;