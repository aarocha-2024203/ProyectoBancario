import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { showSuccess, showError } from '../../../shared/utils/toast';
import '../pages/AuthPage.css';

/*
  El backend envía al correo un link como:
  http://localhost:5173/auth/verify-email?token=XXXX

  Esta página lee el token del query param y llama al backend.
*/
const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification, isLoading } = useAuthStore();

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [email, setEmail] = useState('');
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }
    (async () => {
      const result = await verifyEmail(token);
      if (result.success) {
        setStatus('success');
        showSuccess('¡Correo verificado! Ya puedes iniciar sesión.');
        setTimeout(() => navigate('/auth/login'), 3000);
      } else {
        setStatus('error');
        showError(result.message || 'Token inválido o expirado');
      }
    })();
  }, []);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email) { showError('Ingresa tu correo'); return; }
    const result = await resendVerification(email);
    if (result.success) {
      setResendSent(true);
      showSuccess('Correo de verificación reenviado');
    } else {
      showError(result.message || 'Error al reenviar');
    }
  };

  return (
    <div className="auth-page" style={{ justifyContent: 'center' }}>
      <div className="auth-bg">
        <div className="bg-pattern" />
        <div className="bg-overlay" />
      </div>

      <main className="auth-main" style={{ flex: 'none', zIndex: 1 }}>
        <div className="auth-card" style={{ maxWidth: 440, textAlign: 'center' }}>

          {status === 'loading' && (
            <div className="auth-form-container">
              <div className="auth-logo" style={{ margin: '0 auto 1rem' }}>
                <span className="logo-icon">⏳</span>
              </div>
              <h1 className="auth-title">Verificando tu correo...</h1>
              <p className="auth-subtitle">Por favor espera un momento.</p>
              <div style={{ margin: '1.5rem auto' }}>
                <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="auth-form-container">
              <div className="auth-logo" style={{ margin: '0 auto 1rem' }}>
                <span className="logo-icon">✅</span>
              </div>
              <h1 className="auth-title">¡Cuenta verificada!</h1>
              <p className="auth-subtitle">
                Tu correo fue verificado exitosamente. Serás redirigido al login en unos segundos.
              </p>
              <Link to="/auth/login" className="btn-primary" style={{ marginTop: '1.5rem', display: 'block', textDecoration: 'none', textAlign: 'center' }}>
                Ir al inicio de sesión
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="auth-form-container">
              <div className="auth-logo" style={{ margin: '0 auto 1rem' }}>
                <span className="logo-icon">❌</span>
              </div>
              <h1 className="auth-title">Token inválido</h1>
              <p className="auth-subtitle">
                El enlace de verificación es inválido o ha expirado. Puedes solicitar uno nuevo.
              </p>

              {!resendSent ? (
                <form onSubmit={handleResend} className="auth-form" style={{ marginTop: '1.5rem' }}>
                  <div className="field-group">
                    <label className="field-label">Tu correo electrónico</label>
                    <div className="input-wrapper">
                      <span className="input-icon">✉️</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="field-input"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary" disabled={isLoading}>
                    {isLoading ? (
                      <span className="btn-loading"><span className="spinner" /> Enviando...</span>
                    ) : (
                      'Reenviar verificación'
                    )}
                  </button>
                </form>
              ) : (
                <p style={{ color: '#4caf7d', marginTop: '1rem' }}>
                  ✅ Correo reenviado. Revisa tu bandeja.
                </p>
              )}

              <p className="auth-switch" style={{ marginTop: '1rem' }}>
                <Link to="/auth/login" className="link-btn">← Volver al inicio</Link>
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default VerifyEmailPage;
