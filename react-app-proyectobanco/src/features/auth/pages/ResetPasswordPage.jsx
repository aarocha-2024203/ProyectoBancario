import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { showSuccess, showError } from '../../../shared/utils/toast';
import '../pages/AuthPage.css';

/*
  El backend envía al correo un link como:
  http://localhost:5173/auth/reset-password?token=XXXX

  Esta página lee el token del query param y permite al usuario
  ingresar una nueva contraseña.
*/
const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword, isLoading } = useAuthStore();

  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) { showError('Token inválido'); return; }
    if (!newPassword || newPassword.length < 8) {
      showError('La contraseña debe tener al menos 8 caracteres'); return;
    }
    if (newPassword !== confirm) {
      showError('Las contraseñas no coinciden'); return;
    }

    const result = await resetPassword(token, newPassword);
    if (result.success) {
      setDone(true);
      showSuccess('¡Contraseña restablecida! Ya puedes iniciar sesión.');
      setTimeout(() => navigate('/auth/login'), 3000);
    } else {
      showError(result.message || 'Error al restablecer la contraseña');
    }
  };

  return (
    <div className="auth-page" style={{ justifyContent: 'center' }}>
      <div className="auth-bg">
        <div className="bg-pattern" />
        <div className="bg-overlay" />
      </div>

      <main className="auth-main" style={{ flex: 'none', zIndex: 1 }}>
        <div className="auth-card" style={{ maxWidth: 440 }}>

          {done ? (
            <div className="auth-form-container" style={{ textAlign: 'center' }}>
              <div className="auth-logo" style={{ margin: '0 auto 1rem' }}>
                <span className="logo-icon">🎉</span>
              </div>
              <h1 className="auth-title">¡Contraseña actualizada!</h1>
              <p className="auth-subtitle">Serás redirigido al login en unos segundos.</p>
              <Link to="/auth/login" className="btn-primary" style={{ marginTop: '1.5rem', display: 'block', textDecoration: 'none', textAlign: 'center' }}>
                Ir al inicio de sesión
              </Link>
            </div>
          ) : (
            <div className="auth-form-container">
              <div className="auth-header">
                <div className="auth-logo"><span className="logo-icon">🔐</span></div>
                <h1 className="auth-title">Nueva contraseña</h1>
                <p className="auth-subtitle">Ingresa tu nueva contraseña para continuar.</p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="field-group">
                  <label className="field-label">Nueva contraseña</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="field-input"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="toggle-pass"
                      onClick={() => setShowPass((v) => !v)}
                      tabIndex={-1}
                    >
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Confirmar contraseña</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="field-input"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={isLoading || !token}>
                  {isLoading ? (
                    <span className="btn-loading"><span className="spinner" /> Guardando...</span>
                  ) : (
                    'Guardar nueva contraseña'
                  )}
                </button>
              </form>

              <p className="auth-switch">
                <Link to="/auth/login" className="link-btn">← Volver al inicio</Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResetPasswordPage;
