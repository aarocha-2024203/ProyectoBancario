import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';
import AuthPage from '../../features/auth/pages/AuthPage';
import VerifyEmailPage from '../../features/auth/pages/VerifyEmailPage';
import ResetPasswordPage from '../../features/auth/pages/ResetPasswordPage';
import UnauthorizedPage from '../../features/auth/pages/UnauthorizedPage';
import AdminDashboard from '../../features/admin/pages/AdminDashboard';
import UserDashboard from '../../features/dashboard/pages/UserDashboard';

const AppRoutes = () => (
  <Routes>
    {/* Públicas */}
    <Route path="/auth/login" element={<AuthPage />} />
    <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
    <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/unauthorized" element={<UnauthorizedPage />} />

    {/* Protegidas */}
    <Route element={<ProtectedRoute />}>
      <Route element={<RoleGuard allowedRoles={['ADMIN_ROLE']} />}>
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
      </Route>
      <Route path="/dashboard" element={<UserDashboard />} />
    </Route>

    <Route path="/" element={<Navigate to="/auth/login" replace />} />
    <Route path="*" element={<Navigate to="/auth/login" replace />} />
  </Routes>
);

export default AppRoutes;