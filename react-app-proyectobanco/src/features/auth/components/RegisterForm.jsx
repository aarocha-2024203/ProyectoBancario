import { useState } from 'react';
import useAuthStore from '../store/authStore';
import { showSuccess, showError } from '../../../shared/utils/toast';

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const IconAt = () => (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
      showSuccess('Cuenta creada. Revisa tu correo para verificarla.');
      onRegistered?.(form.email);
    } else {
      showError(result.message || 'Error al registrar la cuenta');
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-header">
        <div className="auth-logo">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="auth-title">Crear cuenta</h1>
        <p className="auth-subtitle">Únete al sistema bancario premium</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="fields-row">
          <div className="field-group">
            <label className="field-label">Nombre</label>
            <div className="input-wrapper">
              <span className="input-icon"><IconUser /></span>
              <input name="name" type="text" value={form.name} onChange={handleChange}
                placeholder="Juan" className="field-input" disabled={isLoading} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Apellido</label>
            <div className="input-wrapper">
              <span className="input-icon"><IconUser /></span>
              <input name="surname" type="text" value={form.surname} onChange={handleChange}
                placeholder="Pérez" className="field-input" disabled={isLoading} />
            </div>
          </div>
        </div>

        <div className="fields-row">
          <div className="field-group">
            <label className="field-label">Usuario</label>
            <div className="input-wrapper">
              <span className="input-icon"><IconAt /></span>
              <input name="username" type="text" value={form.username} onChange={handleChange}
                placeholder="juanperez123" className="field-input" disabled={isLoading} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Teléfono</label>
            <div className="input-wrapper">
              <span className="input-icon"><IconPhone /></span>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                placeholder="42653798" className="field-input" disabled={isLoading} />
            </div>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Correo electrónico</label>
          <div className="input-wrapper">
            <span className="input-icon"><IconMail /></span>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="correo@ejemplo.com" className="field-input" disabled={isLoading} />
          </div>
        </div>

        <div className="fields-row">
          <div className="field-group">
            <label className="field-label">Contraseña</label>
            <div className="input-wrapper">
              <span className="input-icon"><IconLock /></span>
              <input name="password" type={showPass ? 'text' : 'password'} value={form.password}
                onChange={handleChange} placeholder="Mínimo 8 caracteres"
                className="field-input" disabled={isLoading} />
              <button type="button" className="toggle-pass"
                onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
                <IconEye open={showPass} />
              </button>
            </div>
            <StrengthBar password={form.password} />
          </div>
          <div className="field-group">
            <label className="field-label">Confirmar contraseña</label>
            <div className="input-wrapper">
              <span className="input-icon"><IconLock /></span>
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