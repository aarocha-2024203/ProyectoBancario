import { useState } from 'react';
import useAuthStore from '../store/authStore';
import { showSuccess, showError } from '../../../shared/utils/toast';

const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ForgotPasswordForm = ({ onSwitchToLogin }) => {
  const { forgotPassword, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { showError('Ingresa tu correo'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { showError('Correo inválido'); return; }
    const result = await forgotPassword(email);
    if (result.success) {
      setSent(true);
      showSuccess('Enlace de recuperación enviado');
    } else {
      showError(result.message || 'Error al enviar el correo');
    }
  };

  if (sent) {
    return (
      <div className="auth-form-container">
        <div className="auth-header">
          <div className="auth-logo">
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#c8a951" strokeWidth="1.5"/>
              <path d="M22 6l-10 7L2 6" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 12l2 2 4-4" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="auth-title">Correo enviado</h1>
          <p className="auth-subtitle">
            Enlace enviado a <strong style={{ color: 'var(--gold-pure)' }}>{email}</strong>.
            Revisa tu bandeja de entrada y spam.
          </p>
        </div>
        <button className="btn-primary" onClick={onSwitchToLogin} style={{ marginTop: '1rem' }}>
          Volver al inicio de sesión
        </button>
      </div>
    );
  }

  return (
    <div className="auth-form-container">
      <div className="auth-header">
        <div className="auth-logo">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="#c8a951" strokeWidth="1.5"/>
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="auth-title">Recuperar acceso</h1>
        <p className="auth-subtitle">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="field-group">
          <label className="field-label">Correo electrónico</label>
          <div className="input-wrapper">
            <span className="input-icon"><IconMail /></span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com" className="field-input" disabled={isLoading} />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? (
            <span className="btn-loading"><span className="spinner" /> Enviando...</span>
          ) : 'Enviar enlace de recuperación'}
        </button>
      </form>

      <p className="auth-switch">
        <button className="link-btn" onClick={onSwitchToLogin}>← Volver al inicio de sesión</button>
      </p>
    </div>
  );
};

export default ForgotPasswordForm;