import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { showSuccess, showError } from '../../../shared/utils/toast';

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
      showSuccess('¡Bienvenido al sistema bancario!');
      const role = result.user?.role || '';
      navigate(role === 'ADMIN_ROLE' ? '/dashboard/admin' : '/dashboard');
    } else {
      showError(result.message || 'Credenciales incorrectas');
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-header">
        <div className="auth-logo">🔐</div>
        <h1 className="auth-title">Bienvenido</h1>
        <p className="auth-subtitle">Ingresa a tu cuenta bancaria</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="field-group">
          <label className="field-label">Correo o usuario</label>
          <div className="input-wrapper">
            <span className="input-icon">✉️</span>
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
            <span className="input-icon">🔒</span>
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
              {showPass ? '🙈' : '👁️'}
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