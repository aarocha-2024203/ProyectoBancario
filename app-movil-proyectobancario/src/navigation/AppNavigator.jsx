// src/navigation/AppNavigator.jsx
import React, { useEffect, useState, useRef } from 'react';
import AuthStack from './AuthStack.jsx';
import { useAuthStore } from '../shared/store/authStore.js';
import useAuth from '../features/auth/hooks/useAuth.js';
import { LoadingSpinner } from '../shared/components/common/Common.jsx';
import { COLORS } from '../shared/constants/theme.js';
import AdminDashboard from '../features/admin/screens/AdminDashboard.jsx';
import ClientDashboard from '../features/client/screens/ClientDashboard.jsx';

export default function AppNavigator({ deepLink }) {
  const _hasHydrated    = useAuthStore((s) => s._hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user            = useAuthStore((s) => s.user);
  const role            = useAuthStore((s) => s.role);
  const { logout }      = useAuth();

  const [stackKey, setStackKey] = useState(deepLink?.token ?? 'initial');
  const prevToken = useRef(deepLink?.token ?? null);

  useEffect(() => {
    if (!deepLink?.token) return;
    if (deepLink.token === prevToken.current && stackKey !== 'initial') return;
    prevToken.current = deepLink.token;
    setStackKey(deepLink.token);
  }, [deepLink]);

  if (!_hasHydrated) return <LoadingSpinner fullScreen color={COLORS.primary} message="Cargando…" />;

  if (isAuthenticated) {
    const isAdmin = ['ADMIN_ROLE', 'admin', 'ADMIN'].includes(role);
    return isAdmin
      ? <AdminDashboard user={user} logout={logout} />
      : <ClientDashboard user={user} logout={logout} />;
  }

  return (
    <AuthStack
      key={stackKey}
      initialRoute={deepLink?.screen ?? 'Login'}
      initialParams={deepLink ? { token: deepLink.token, autoVerify: deepLink.autoVerify ?? false } : undefined}
    />
  );
}
