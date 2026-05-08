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

          {/* Logo */}
          <div className="brand-logo-wrap">
            <div className="brand-logo-ring" />
            <div className="brand-logo-ring-2" />
            <div className="brand-logo-inner">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <p className="brand-eyebrow">Kinal Banks</p>
          <h2 className="brand-name">
            Banca <strong>Premium</strong><br />sin límites
          </h2>
          <p className="brand-tagline">
            La plataforma bancaria más segura y eficiente de Guatemala.
            Gestiona tu patrimonio con la confianza de tecnología de nivel mundial.
          </p>

          {/* Features */}
          <ul className="brand-features">
            {[
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: 'Transferencias instantáneas',
                desc: 'Mueve tu dinero en tiempo real, sin esperas ni comisiones ocultas.'
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: 'Seguridad certificada',
                desc: 'Cifrado de grado bancario con autenticación de doble factor.'
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                    <rect x="2" y="5" width="20" height="14" rx="2" stroke="#c8a951" strokeWidth="1.5"/>
                    <path d="M2 10h20" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ),
                title: 'Gestión de cuentas',
                desc: 'Controla tus cuentas, tarjetas y movimientos desde un solo lugar.'
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: 'Préstamos y créditos',
                desc: 'Accede a financiamiento personalizado con tasas competitivas.'
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                    <path d="M18 20V10M12 20V4M6 20v-6" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: 'Análisis financiero',
                desc: 'Visualiza tu historial, gastos e inversiones con reportes detallados.'
              },
            ].map(({ icon, title, desc }) => (
              <li key={title} className="brand-feature-item">
                <span className="feature-icon">{icon}</span>
                <div className="feature-text">
                  <span className="feature-title">{title}</span>
                  <span className="feature-desc">{desc}</span>
                </div>
              </li>
            ))}
          </ul>

          {/* Stats */}
          <div className="brand-stats">
            <div className="stat-item">
              <span className="stat-number">99.9%</span>
              <span className="stat-label">Disponibilidad</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">256-bit</span>
              <span className="stat-label">Cifrado SSL</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Soporte</span>
            </div>
          </div>

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
              Verifica tu correo <strong>{registeredEmail}</strong> para activar tu cuenta.
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