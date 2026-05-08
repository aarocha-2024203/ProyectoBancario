import { useState, useEffect } from 'react';
import useAuthStore from '../auth/store/authStore';
import { getProfile, forgotPassword } from '../../shared/api/auth';
import { showSuccess, showError } from '../../shared/utils/toast';

const ProfilePage = () => {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingReset, setSendingReset] = useState(false);
  const [tab, setTab] = useState('info');

  useEffect(() => {
    setProfile(null);
    setLoading(true);
    getProfile()
      .then(({ data }) => {
        const p = data?.data || data;
        setProfile(p);
      })
      .catch(() => showError('Error al cargar el perfil'))
      .finally(() => setLoading(false));
  }, []);

  const handleForgotPassword = async () => {
    const email = profile?.email || profile?.Email;
    if (!email) { showError('No se encontró el correo'); return; }
    setSendingReset(true);
    try {
      await forgotPassword(email);
      showSuccess(`Enlace de recuperación enviado a ${email}`);
    } catch { showError('Error al enviar el correo'); }
    finally { setSendingReset(false); }
  };

  const p = profile;
  const name     = p?.name     || p?.Name     || '—';
  const surname  = p?.surname  || p?.Surname  || '—';
  const username = p?.username || p?.Username || '—';
  const email    = p?.email    || p?.Email    || '—';
  const phone    = p?.phone    || p?.Phone    || p?.UserProfile?.Phone || p?.userProfile?.phone || '—';
  const status   = (p?.status  ?? p?.Status)  ? 'Activo' : 'Inactivo';
  const role     = user?.role === 'ADMIN_ROLE' ? 'Administrador' : 'Cliente';
  const initials = `${(name[0] || 'U')}${(surname[0] || '')}`.toUpperCase();

  const card = {
    background: 'rgba(15,30,53,0.7)',
    border: '1px solid rgba(200,169,81,0.12)',
    borderRadius: 16,
    overflow: 'hidden',
  };

  const tabBtn = (key, label, svgPath) => (
    <button key={key} onClick={() => setTab(key)} style={{
      padding: '.8rem 1.1rem', fontSize: '.82rem',
      color: tab === key ? 'var(--gold-pure)' : 'var(--muted)',
      cursor: 'pointer', background: 'none', border: 'none',
      borderBottom: `2px solid ${tab === key ? 'var(--gold-pure)' : 'transparent'}`,
      fontFamily: "'Outfit',sans-serif", transition: 'all .2s',
      display: 'flex', alignItems: 'center', gap: '.4rem', whiteSpace: 'nowrap',
    }}>
      <svg viewBox="0 0 24 24" fill="none" width="14" height="14">{svgPath}</svg>
      {label}
    </button>
  );

  const InfoRow = ({ label, value, mono }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.85rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '.88rem', color: 'var(--white)', fontFamily: mono ? 'monospace' : 'inherit', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>{value}</span>
    </div>
  );

  const Badge = ({ value }) => {
    const isActive = value === 'Activo';
    return (
      <span style={{
        padding: '.2rem .75rem', borderRadius: 20, fontSize: '.75rem', fontWeight: 500,
        background: isActive ? 'rgba(76,175,125,0.12)' : 'rgba(224,92,92,0.12)',
        border: `1px solid ${isActive ? 'rgba(76,175,125,0.25)' : 'rgba(224,92,92,0.25)'}`,
        color: isActive ? '#4caf7d' : '#e05c5c',
      }}>{value}</span>
    );
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <span style={{ display: 'inline-block', width: 32, height: 32, border: '2px solid rgba(200,169,81,0.2)', borderTopColor: 'var(--gold-pure)', borderRadius: '50%', animation: 'spin .65s linear infinite' }} />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mi Perfil</h1>
          <p className="page-subtitle">Información de tu cuenta bancaria</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Sidebar ── */}
        <div style={{ ...card, padding: '2rem', textAlign: 'center' }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg,#8a7035,#c8a951)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Cormorant Garamond',serif", fontSize: '1.8rem', fontWeight: 700,
            color: '#060810', margin: '0 auto 1.1rem',
            boxShadow: '0 0 28px rgba(200,169,81,0.25), 0 0 0 3px rgba(200,169,81,0.1)',
          }}>{initials}</div>

          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.2rem', fontWeight: 600, color: 'var(--white)', marginBottom: '.25rem' }}>
            {name} {surname}
          </p>
          <p style={{ fontSize: '.72rem', color: 'var(--gold-pure)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: '.35rem' }}>{role}</p>
          <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>@{username}</p>

          <Badge value={status} />

          {/* Info rápida */}
          <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
            {[
              { label: 'Correo', value: email },
              { label: 'Teléfono', value: phone },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.55rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</span>
                <span style={{ fontSize: '.78rem', color: 'var(--white)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Botón logout */}
          <button onClick={() => { logout(); }} style={{
            marginTop: '1.5rem', width: '100%', padding: '.65rem',
            background: 'none', border: '1px solid rgba(224,92,92,0.15)',
            color: 'rgba(224,92,92,0.7)', borderRadius: 8,
            fontFamily: "'Outfit',sans-serif", fontSize: '.82rem',
            cursor: 'pointer', transition: 'all .2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(224,92,92,0.08)'; e.currentTarget.style.color = '#e05c5c'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(224,92,92,0.7)'; }}
          >
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Cerrar sesión
          </button>
        </div>

        {/* ── Panel tabs ── */}
        <div style={card}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(200,169,81,0.08)', padding: '0 1.5rem', overflowX: 'auto' }}>
            {tabBtn('info', 'Información', <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>)}
            {tabBtn('security', 'Seguridad', <><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>)}
          </div>

          <div style={{ padding: '2rem' }}>

            {/* ── TAB INFO ── */}
            {tab === 'info' && (
              <div>
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.15rem', color: 'var(--white)', marginBottom: '.35rem' }}>Datos personales</p>
                <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: '1.75rem' }}>Información registrada en tu cuenta bancaria.</p>

                <InfoRow label="Nombre completo" value={`${name} ${surname}`} />
                <InfoRow label="Nombre de usuario" value={`@${username}`} mono />
                <InfoRow label="Correo electrónico" value={email} />
                <InfoRow label="Teléfono" value={phone} />
                <InfoRow label="Rol" value={role} />
                <InfoRow label="Estado de cuenta" value={status} />

                {/* Aviso */}
                <div style={{
                  marginTop: '1.5rem',
                  background: 'rgba(200,169,81,0.05)',
                  border: '1px solid rgba(200,169,81,0.15)',
                  borderRadius: 10, padding: '1rem 1.25rem',
                  display: 'flex', gap: '.75rem', alignItems: 'flex-start',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16" style={{ flexShrink: 0, marginTop: 2 }}>
                    <circle cx="12" cy="12" r="10" stroke="#c8a951" strokeWidth="1.5"/>
                    <path d="M12 8v4M12 16h.01" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p style={{ fontSize: '.8rem', color: 'rgba(200,169,81,0.8)', lineHeight: 1.6, margin: 0 }}>
                    Para modificar tus datos personales como nombre o correo, comunícate con un administrador del sistema bancario.
                  </p>
                </div>
              </div>
            )}

            {/* ── TAB SEGURIDAD ── */}
            {tab === 'security' && (
              <div>
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.15rem', color: 'var(--white)', marginBottom: '.35rem' }}>Seguridad de la cuenta</p>
                <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: '1.75rem' }}>Opciones de seguridad disponibles para tu cuenta.</p>

                {/* Card cambio de contraseña */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12, padding: '1.5rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem',
                }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(200,169,81,0.1)', border: '1px solid rgba(200,169,81,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <rect x="3" y="11" width="18" height="11" rx="2" stroke="#c8a951" strokeWidth="1.5"/>
                        <path d="M7 11V7a5 5 0 0110 0v4" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: '.9rem', fontWeight: 500, color: 'var(--white)', marginBottom: '.25rem' }}>Cambiar contraseña</p>
                      <p style={{ fontSize: '.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                        Recibirás un enlace de recuperación en <strong style={{ color: 'var(--gold-pure)' }}>{email}</strong> para establecer una nueva contraseña.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleForgotPassword}
                    disabled={sendingReset}
                    style={{
                      padding: '.65rem 1.25rem',
                      background: 'linear-gradient(135deg,#b8942e,#c8a951)',
                      color: '#060810', border: 'none', borderRadius: 8,
                      fontFamily: "'Outfit',sans-serif", fontSize: '.82rem', fontWeight: 600,
                      cursor: sendingReset ? 'not-allowed' : 'pointer',
                      opacity: sendingReset ? .6 : 1,
                      display: 'flex', alignItems: 'center', gap: '.5rem',
                      transition: 'all .2s', whiteSpace: 'nowrap',
                    }}
                  >
                    {sendingReset
                      ? <span style={{ display: 'inline-block', width: 13, height: 13, border: '2px solid rgba(6,8,16,.3)', borderTopColor: '#060810', borderRadius: '50%', animation: 'spin .65s linear infinite' }} />
                      : <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5"/><path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    }
                    Enviar enlace
                  </button>
                </div>

                {/* Card sesión */}
                <div style={{
                  background: 'rgba(224,92,92,0.04)',
                  border: '1px solid rgba(224,92,92,0.1)',
                  borderRadius: 12, padding: '1.5rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: '1rem',
                }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(224,92,92,0.1)', border: '1px solid rgba(224,92,92,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: '.9rem', fontWeight: 500, color: 'var(--white)', marginBottom: '.25rem' }}>Cerrar sesión</p>
                      <p style={{ fontSize: '.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                        Cierra tu sesión activa de forma segura en este dispositivo.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    style={{
                      padding: '.65rem 1.25rem',
                      background: 'rgba(224,92,92,0.1)', color: '#e05c5c',
                      border: '1px solid rgba(224,92,92,0.2)', borderRadius: 8,
                      fontFamily: "'Outfit',sans-serif", fontSize: '.82rem', fontWeight: 600,
                      cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(224,92,92,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(224,92,92,0.1)'}
                  >
                    Cerrar sesión
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;