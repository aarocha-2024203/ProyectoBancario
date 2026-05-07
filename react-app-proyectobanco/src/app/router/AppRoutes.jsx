import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';

import AuthPage from '../../features/auth/pages/AuthPage';
import VerifyEmailPage from '../../features/auth/pages/VerifyEmailPage';
import ResetPasswordPage from '../../features/auth/pages/ResetPasswordPage';
import UnauthorizedPage from '../../features/auth/pages/UnauthorizedPage';

const DashboardAdmin = () => (
  <div style={{ padding: '2rem', color: '#fff', background: '#0a1628', minHeight: '100vh' }}>
    <h1>🛡️ Dashboard Admin</h1>
    <p>Bienvenido administrador.</p>
  </div>
);
const DashboardUser = () => (
  <div style={{ padding: '2rem', color: '#fff', background: '#0a1628', minHeight: '100vh' }}>
    <h1>🏦 Dashboard Usuario</h1>
    <p>Bienvenido.</p>
  </div>
);

const AppRoutes = () => (
  <Routes>
    {/* ── Públicas ── */}
    <Route path="/auth/login" element={<AuthPage />} />

    {/* Rutas con prefijo /auth/ */}
    <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
    <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

    {/* Alias directos para los links que llegan por correo */}
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />

    <Route path="/unauthorized" element={<UnauthorizedPage />} />

    {/* ── Protegidas ── */}
    <Route element={<ProtectedRoute />}>
      <Route element={<RoleGuard allowedRoles={['ADMIN_ROLE']} />}>
        <Route path="/dashboard/admin" element={<DashboardAdmin />} />
      </Route>
      <Route path="/dashboard" element={<DashboardUser />} />
    </Route>

    {/* ── Raíz ── */}
    <Route path="/" element={<Navigate to="/auth/login" replace />} />
    <Route path="*" element={<Navigate to="/auth/login" replace />} />
  </Routes>
);

export default AppRoutes;