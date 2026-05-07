import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import '../pages/AuthPage.css';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  return (
    <div className="auth-page" style={{ justifyContent: 'center' }}>
      <div className="auth-bg">
        <div className="bg-pattern" />
        <div className="bg-overlay" />
      </div>
      <main className="auth-main" style={{ flex: 'none', zIndex: 1 }}>
        <div className="auth-card" style={{ maxWidth: 420, textAlign: 'center' }}>
          <div className="auth-logo" style={{ margin: '0 auto 1rem' }}>
            <span className="logo-icon">🚫</span>
          </div>
          <h1 className="auth-title">Sin autorización</h1>
          <p className="auth-subtitle">
            No tienes permisos para acceder a esta sección del sistema bancario.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexDirection: 'column' }}>
            <button className="btn-primary" onClick={() => navigate(-1)}>
              ← Volver atrás
            </button>
            <button
              className="link-btn"
              style={{ fontSize: '.9rem' }}
              onClick={() => { logout(); navigate('/auth/login'); }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UnauthorizedPage;
