import useUserAccounts from '../hooks/useUserAccounts';
import { fmt, fmtDate } from '../../shared/formatters';

const UserAccounts = () => {
  const { accounts, loading } = useUserAccounts();

  const activas    = accounts.filter(a => a.status === 'activa');
  const bloqueadas = accounts.filter(a => a.status === 'bloqueada');
  const inactivas  = accounts.filter(a => a.status === 'inactiva');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mis Cuentas</h1>
          <p className="page-subtitle">Estado de todas tus cuentas bancarias</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total cuentas', value: loading ? '...' : accounts.length,
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/><path d="M9 22V12h6v10" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/></svg> },
          { label: 'Activas',       value: loading ? '...' : activas.length,
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round"/><path d="M22 4L12 14.01l-3-3" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round"/></svg> },
          { label: 'Bloqueadas',    value: loading ? '...' : bloqueadas.length,
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#e05c5c" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round"/></svg> },
          { label: 'Inactivas',     value: loading ? '...' : inactivas.length,
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><circle cx="12" cy="12" r="10" stroke="#6b7fa3" strokeWidth="1.5"/><path d="M8 12h8" stroke="#6b7fa3" strokeWidth="1.5" strokeLinecap="round"/></svg> },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ borderColor: s.label === 'Bloqueadas' && bloqueadas.length > 0 ? 'rgba(224,92,92,0.3)' : undefined }}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-value" style={{
              color: s.label === 'Bloqueadas' && bloqueadas.length > 0 ? '#e05c5c'
                : s.label === 'Activas' && activas.length > 0 ? '#4caf7d' : undefined,
            }}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Aviso bloqueadas */}
      {!loading && bloqueadas.length > 0 && (
        <div style={{ background: 'rgba(224,92,92,0.06)', border: '1px solid rgba(224,92,92,0.2)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '.85rem' }}>
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18" style={{ flexShrink: 0, marginTop: 2 }}><rect x="3" y="11" width="18" height="11" rx="2" stroke="#e05c5c" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <div>
            <p style={{ fontSize: '.85rem', color: '#e05c5c', fontWeight: 500, marginBottom: '.2rem' }}>Cuenta{bloqueadas.length > 1 ? 's' : ''} bloqueada{bloqueadas.length > 1 ? 's' : ''}</p>
            <p style={{ fontSize: '.78rem', color: 'rgba(224,92,92,0.8)', lineHeight: 1.5 }}>
              Tienes <strong>{bloqueadas.length}</strong> cuenta{bloqueadas.length > 1 ? 's' : ''} bloqueada{bloqueadas.length > 1 ? 's' : ''}. No podrás realizar operaciones. Contacta al administrador.
            </p>
          </div>
        </div>
      )}

      {/* Aviso inactivas */}
      {!loading && inactivas.length > 0 && (
        <div style={{ background: 'rgba(107,127,163,0.06)', border: '1px solid rgba(107,127,163,0.2)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '.85rem' }}>
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10" stroke="#6b7fa3" strokeWidth="1.5"/><path d="M12 8v4M12 16h.01" stroke="#6b7fa3" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <div>
            <p style={{ fontSize: '.85rem', color: 'var(--muted)', fontWeight: 500, marginBottom: '.2rem' }}>Cuenta{inactivas.length > 1 ? 's' : ''} inactiva{inactivas.length > 1 ? 's' : ''}</p>
            <p style={{ fontSize: '.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              Tienes <strong>{inactivas.length}</strong> cuenta{inactivas.length > 1 ? 's' : ''} inactiva{inactivas.length > 1 ? 's' : ''}. Contacta al administrador para reactivarla{inactivas.length > 1 ? 's' : ''}.
            </p>
          </div>
        </div>
      )}

      {/* Sin cuentas */}
      {!loading && accounts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--muted)' }}>
          <svg viewBox="0 0 24 24" fill="none" width="48" height="48" style={{ opacity: .15, display: 'block', margin: '0 auto 1rem' }}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <p style={{ fontSize: '.95rem', marginBottom: '.5rem' }}>No tienes cuentas asignadas</p>
          <p style={{ fontSize: '.82rem' }}>Contacta al administrador para crear tu cuenta bancaria.</p>
        </div>
      )}

      {/* Tarjetas de cuentas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '1.25rem' }}>
        {loading ? [1, 2].map(i => (
          <div key={i} className="stat-card"><div className="skeleton" style={{ height: 130 }}/></div>
        )) : accounts.map((a, i) => {
          const st         = (a.status || '').toLowerCase();
          const isBlocked  = st === 'bloqueada';
          const isInactive = st === 'inactiva';
          const borderColor = isBlocked ? 'rgba(224,92,92,0.3)' : isInactive ? 'rgba(107,127,163,0.2)' : 'rgba(200,169,81,0.18)';
          const glowColor   = isBlocked ? 'rgba(224,92,92,0.05)' : 'rgba(200,169,81,0.06)';

          return (
            <div key={i} style={{ background: 'linear-gradient(135deg,rgba(15,30,53,0.95),rgba(22,40,71,0.85))', border: `1px solid ${borderColor}`, borderRadius: 16, padding: '1.5rem', position: 'relative', overflow: 'hidden', opacity: isInactive ? 0.75 : 1 }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: `radial-gradient(circle,${glowColor} 0%,transparent 70%)`, borderRadius: '50%' }}/>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <p style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', fontWeight: 600, marginBottom: '.2rem' }}>{a.accountType || 'Cuenta'}</p>
                  <p style={{ fontFamily: 'monospace', color: 'var(--gold-pure)', fontSize: '.82rem' }}>{a.accountNumber || '—'}</p>
                </div>
                <span style={{ padding: '.2rem .7rem', borderRadius: 20, fontSize: '.68rem', fontWeight: 500, background: isBlocked ? 'rgba(224,92,92,0.12)' : isInactive ? 'rgba(107,127,163,0.1)' : 'rgba(76,175,125,0.12)', border: `1px solid ${isBlocked ? 'rgba(224,92,92,0.25)' : isInactive ? 'rgba(107,127,163,0.2)' : 'rgba(76,175,125,0.25)'}`, color: isBlocked ? '#e05c5c' : isInactive ? 'var(--muted)' : '#4caf7d' }}>
                  {a.status || 'activa'}
                </span>
              </div>

              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '2rem', fontWeight: 600, lineHeight: 1, marginBottom: '.75rem', color: isBlocked ? 'var(--muted)' : 'var(--white)' }}>
                {a.currencyCode || 'Q'} {fmt(a.balance)}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '.75rem', borderTop: `1px solid ${borderColor}` }}>
                <div>
                  <p style={{ fontSize: '.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Apertura</p>
                  <p style={{ fontSize: '.78rem', color: 'var(--white)', marginTop: '.15rem' }}>{fmtDate(a.openingDate || a.createdAt)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Límite diario</p>
                  <p style={{ fontSize: '.78rem', color: 'var(--white)', marginTop: '.15rem' }}>Q {fmt(a.dailyWithdrawalLimit || 0)}</p>
                </div>
              </div>

              {isBlocked && (
                <div style={{ marginTop: '.85rem', padding: '.6rem .85rem', background: 'rgba(224,92,92,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#e05c5c" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <p style={{ fontSize: '.72rem', color: '#e05c5c', margin: 0 }}>Cuenta bloqueada — contacta al banco</p>
                </div>
              )}
              {isInactive && (
                <div style={{ marginTop: '.85rem', padding: '.6rem .85rem', background: 'rgba(107,127,163,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><circle cx="12" cy="12" r="10" stroke="#6b7fa3" strokeWidth="1.5"/><path d="M8 12h8" stroke="#6b7fa3" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <p style={{ fontSize: '.72rem', color: 'var(--muted)', margin: 0 }}>Cuenta inactiva — contacta al banco</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserAccounts;
