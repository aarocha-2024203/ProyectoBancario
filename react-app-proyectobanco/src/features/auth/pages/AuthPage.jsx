import { useState } from 'react';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import ForgotPasswordForm from '../components/ForgotPasswordForm';
import './AuthPage.css';

const VIEWS = { LOGIN: 'login', REGISTER: 'register', FORGOT: 'forgot' };

const Particles = () => (
  <div className="bg-particles">
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={i} className="particle" />
    ))}
  </div>
);

const AuthPage = () => {
  const [view, setView] = useState(VIEWS.LOGIN);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleRegistered = (email) => {
    setRegisteredEmail(email);
    setView(VIEWS.LOGIN);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="bg-canvas" />
        <div className="bg-grid" />
        <Particles />
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
      </div>

      <aside className="auth-branding">
        <div className="branding-content">
          <div className="brand-logo-wrap">
            <div className="brand-logo-ring" />
            <div className="brand-logo-ring-2" />
            <div className="brand-logo-inner">🏦</div>
          </div>
          <p className="brand-eyebrow">Sistema Bancario</p>
          <h2 className="brand-name">
            Banca <strong>Premium</strong><br />sin límites
          </h2>
          <p className="brand-tagline">
            Gestiona tus finanzas con la seguridad y eficiencia que mereces.
            Plataforma certificada de nivel bancario.
          </p>
          <ul className="brand-features">
            {[
              { icon: '⚡', text: 'Transferencias en tiempo real' },
              { icon: '🛡️', text: 'Seguridad bancaria certificada' },
              { icon: '💳', text: 'Gestión de cuentas y tarjetas' },
              { icon: '📊', text: 'Préstamos y estado de cuenta' },
            ].map(({ icon, text }) => (
              <li key={text} className="brand-feature-item">
                <span className="feature-icon">{icon}</span>
                {text}
              </li>
            ))}
          </ul>
          <div className="brand-divider">
            <div className="brand-divider-line" />
            <span className="brand-divider-text">Seguro & Confiable</span>
            <div className="brand-divider-line" />
          </div>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          {registeredEmail && view === VIEWS.LOGIN && (
            <div className="verify-banner">
              📧 Verifica tu correo <strong>{registeredEmail}</strong> para activar tu cuenta.
            </div>
          )}
          {view === VIEWS.LOGIN && (
            <div className="auth-view" key="login">
              <LoginForm
                onSwitchToRegister={() => setView(VIEWS.REGISTER)}
                onSwitchToForgot={() => setView(VIEWS.FORGOT)}
              />
            </div>
          )}
          {view === VIEWS.REGISTER && (
            <div className="auth-view" key="register">
              <RegisterForm
                onSwitchToLogin={() => setView(VIEWS.LOGIN)}
                onRegistered={handleRegistered}
              />
            </div>
          )}
          {view === VIEWS.FORGOT && (
            <div className="auth-view" key="forgot">
              <ForgotPasswordForm onSwitchToLogin={() => setView(VIEWS.LOGIN)} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AuthPage;