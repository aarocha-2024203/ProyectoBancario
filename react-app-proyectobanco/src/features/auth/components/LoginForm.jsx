import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { showSuccess, showError } from '../../../shared/utils/toast';

const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconEye = ({ open }) => open ? (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
) : (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const LoginForm = ({ onSwitchToRegister, onSwitchToForgot }) => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [form, setForm] = useState({ emailOrUsername: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.emailOrUsername || !form.password) {
      showError('Por favor completa todos los campos');
      return;
    }
    const result = await login(form.emailOrUsername, form.password);
    if (result.success) {
      showSuccess('Bienvenido al sistema bancario');
      const role = result.user?.role || '';
      navigate(role === 'ADMIN_ROLE' ? '/dashboard/admin' : '/dashboard');
    } else {
      showError(result.message || 'Credenciales incorrectas');
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-header">
        <div className="auth-logo">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="auth-title">Acceso seguro</h1>
        <p className="auth-subtitle">Ingresa tus credenciales para continuar</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="field-group">
          <label className="field-label">Correo o usuario</label>
          <div className="input-wrapper">
            <span className="input-icon"><IconMail /></span>
            <input
              name="emailOrUsername"
              type="text"
              value={form.emailOrUsername}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              className="field-input"
              autoComplete="username"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Contraseña</label>
          <div className="input-wrapper">
            <span className="input-icon"><IconLock /></span>
            <input
              name="password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder="Tu contraseña segura"
              className="field-input"
              autoComplete="current-password"
              disabled={isLoading}
            />
            <button type="button" className="toggle-pass"
              onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
              <IconEye open={showPass} />
            </button>
          </div>
        </div>

        <div className="forgot-link">
          <button type="button" className="forgot-link-btn" onClick={onSwitchToForgot}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? (
            <span className="btn-loading"><span className="spinner" /> Verificando...</span>
          ) : 'Iniciar sesión'}
        </button>
      </form>

      <p className="auth-switch">
        ¿No tienes cuenta?{' '}
        <button className="link-btn" onClick={onSwitchToRegister}>Regístrate aquí</button>
      </p>
    </div>
  );
};

export default LoginForm;