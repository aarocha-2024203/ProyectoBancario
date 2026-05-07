import { useState } from 'react';
import useAuthStore from '../store/authStore';
import { showSuccess, showError } from '../../../shared/utils/toast';

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
      showSuccess('Revisa tu correo para restablecer la contraseña');
    } else {
      showError(result.message || 'Error al enviar el correo');
    }
  };

  if (sent) {
    return (
      <div className="auth-form-container">
        <div className="auth-header">
          <div className="auth-logo">📬</div>
          <h1 className="auth-title">Correo enviado</h1>
          <p className="auth-subtitle">
            Enlace enviado a <strong style={{ color: 'var(--gold-pure)' }}>{email}</strong>.
            Revisa tu bandeja y spam.
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
        <div className="auth-logo">🔑</div>
        <h1 className="auth-title">Recuperar acceso</h1>
        <p className="auth-subtitle">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="field-group">
          <label className="field-label">Correo electrónico</label>
          <div className="input-wrapper">
            <span className="input-icon">✉️</span>
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