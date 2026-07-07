import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../features/auth/store/authStore';
import './Dashboard.css';

const NAV_ADMIN = [
  { section: 'General', items: [
    { key:'overview', label:'Panel General', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg> },
    { key:'users', label:'Usuarios', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  ]},
  { section: 'Finanzas', items: [
    { key:'accounts', label:'Cuentas', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { key:'cards', label:'Tarjetas', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { key:'transactions', label:'Transacciones', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { key:'loans', label:'Préstamos', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { key:'deposits', label:'Depósitos', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { key:'withdrawals', label:'Retiros', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  ]},
  { section: 'Gestión', items: [
    { key:'coins', label:'Monedas', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H9m0 0h5.5a1.5 1.5 0 010 3H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { key:'locks', label:'Cuentas Bloqueadas', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { key:'services', label:'Servicios', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M19.07 4.93A10 10 0 014.93 19.07M4.93 4.93a10 10 0 0114.14 14.14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { key:'statements', label:'Estados de Cuenta', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  ]},
  { section: 'Mi cuenta', items: [
    { key:'profile', label:'Mi Perfil', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/></svg> },
  ]},
];

const NAV_USER = [
  { section: 'Mi cuenta', items: [
    { key:'overview', label:'Mi Panel', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg> },
    { key:'accounts', label:'Mis Cuentas', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { key:'cards', label:'Mis Tarjetas', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { key:'profile', label:'Mi Perfil', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/></svg> },
  ]},
  { section: 'Operaciones', items: [
    { key:'transactions', label:'Transferencias', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { key:'loans', label:'Préstamos', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { key:'deposits', label:'Depósitos', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { key:'withdrawals', label:'Retiros', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { key:'statements', label:'Estado de Cuenta', icon:<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  ]},
];

const DashboardLayout = ({ children, activePage, onNavigate, isAdmin }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const nav = isAdmin ? NAV_ADMIN : NAV_USER;
  const initials = user ? `${(user.username || 'U')[0]}`.toUpperCase() : 'U';

  // ── NUEVO: estado del menú hamburguesa (solo afecta mobile) ──
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/auth/login'); };

  // Al navegar, cerramos el sidebar en mobile (en desktop no tiene efecto visual)
  const handleNavigate = (key) => {
    onNavigate(key);
    setSidebarOpen(false);
  };

  return (
    <div className="dash-shell">
      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" stroke="#060810" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="sidebar-brand">
            <span className="sidebar-brand-name">Kinal Banks</span>
            <span className="sidebar-brand-role">{isAdmin ? 'Administrador' : 'Cliente'}</span>
          </div>
          {/* Botón cerrar, solo visible en mobile */}
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {nav.map(({ section, items }) => (
            <div key={section}>
              <p className="nav-section-label">{section}</p>
              {items.map(({ key, label, icon }) => (
                <button
                  key={key}
                  className={`nav-item ${activePage === key ? 'active' : ''}`}
                  onClick={() => handleNavigate(key)}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay oscuro detrás del sidebar en mobile */}
      <div
        className={`dash-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="dash-main">
        <header className="dash-topbar">
          <div className="topbar-left">
            {/* Botón hamburguesa, solo visible en mobile */}
            <button
              className="btn-hamburger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
            <div>
              <p className="topbar-title">{isAdmin ? 'Panel Administrativo' : 'Mi Banca'}</p>
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-user">
              <span className="topbar-username">{user?.username || 'Usuario'}</span>
              <span className="topbar-role">{isAdmin ? 'Admin' : 'Cliente'}</span>
            </div>
            <div
              className="topbar-avatar"
              onClick={() => handleNavigate('profile')}
              style={{ cursor:'pointer' }}
              title="Ver mi perfil"
            >
              {initials}
            </div>
          </div>
        </header>
        <div className="dash-content">{children}</div>
      </div>
    </div>
  );
};

export default DashboardLayout;