import { useState } from 'react';
import useAuthStore from '../store/authStore';
import { showSuccess, showError } from '../../../shared/utils/toast';

const getStrength = (pass) => {
  if (!pass) return 0;
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  return score;
};

const StrengthBar = ({ password }) => {
  const strength = getStrength(password);
  const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const colors = ['', 'active-weak', 'active-medium', 'active-medium', 'active-strong'];
  if (!password) return null;
  return (
    <div>
      <div className="password-strength">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`strength-bar ${i <= strength ? colors[strength] : ''}`} />
        ))}
      </div>
      <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '4px', textAlign: 'right' }}>
        {labels[strength]}
      </p>
    </div>
  );
};

const RegisterForm = ({ onSwitchToLogin, onRegistered }) => {
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({
    name: '', surname: '', username: '',
    email: '', phone: '', password: '', confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.name || !form.surname || !form.username || !form.email || !form.password || !form.phone) {
      showError('Todos los campos son obligatorios'); return false;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      showError('El correo no tiene un formato válido'); return false;
    }
    if (form.password.length < 8) {
      showError('La contraseña debe tener al menos 8 caracteres'); return false;
    }
    if (form.password !== form.confirmPassword) {
      showError('Las contraseñas no coinciden'); return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const { confirmPassword, ...payload } = form;
    const result = await register(payload);
    if (result.success) {
      showSuccess('¡Cuenta creada! Revisa tu correo para verificarla.');
      onRegistered?.(form.email);
    } else {
      showError(result.message || 'Error al registrar la cuenta');
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-header">
        <div className="auth-logo">🏦</div>
        <h1 className="auth-title">Crear cuenta</h1>
        <p className="auth-subtitle">Únete al sistema bancario premium</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="fields-row">
          <div className="field-group">
            <label className="field-label">Nombre</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input name="name" type="text" value={form.name} onChange={handleChange}
                placeholder="Juan" className="field-input" disabled={isLoading} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Apellido</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input name="surname" type="text" value={form.surname} onChange={handleChange}
                placeholder="Pérez" className="field-input" disabled={isLoading} />
            </div>
          </div>
        </div>

        <div className="fields-row">
          <div className="field-group">
            <label className="field-label">Usuario</label>
            <div className="input-wrapper">
              <span className="input-icon">@</span>
              <input name="username" type="text" value={form.username} onChange={handleChange}
                placeholder="juanperez123" className="field-input" disabled={isLoading} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Teléfono</label>
            <div className="input-wrapper">
              <span className="input-icon">📱</span>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                placeholder="42653798" className="field-input" disabled={isLoading} />
            </div>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Correo electrónico</label>
          <div className="input-wrapper">
            <span className="input-icon">✉️</span>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="correo@ejemplo.com" className="field-input" disabled={isLoading} />
          </div>
        </div>

        <div className="fields-row">
          <div className="field-group">
            <label className="field-label">Contraseña</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input name="password" type={showPass ? 'text' : 'password'} value={form.password}
                onChange={handleChange} placeholder="Mínimo 8 caracteres"
                className="field-input" disabled={isLoading} />
              <button type="button" className="toggle-pass"
                onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            <StrengthBar password={form.password} />
          </div>
          <div className="field-group">
            <label className="field-label">Confirmar contraseña</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input name="confirmPassword" type={showPass ? 'text' : 'password'}
                value={form.confirmPassword} onChange={handleChange}
                placeholder="Repite la contraseña" className="field-input" disabled={isLoading} />
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? (
            <span className="btn-loading"><span className="spinner" /> Creando cuenta...</span>
          ) : 'Crear cuenta'}
        </button>
      </form>

      <p className="auth-switch">
        ¿Ya tienes cuenta?{' '}
        <button className="link-btn" onClick={onSwitchToLogin}>Iniciar sesión</button>
      </p>
    </div>
  );
};

export default RegisterForm;