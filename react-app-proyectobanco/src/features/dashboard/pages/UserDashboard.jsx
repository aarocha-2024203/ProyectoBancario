import { useState, useCallback, useEffect } from 'react';
import DashboardLayout from '../../../shared/components/layout/DashboardLayout';
import { useData } from '../../../shared/hooks/useData';
import { showSuccess, showError } from '../../../shared/utils/toast';
import {
  getAccounts, getCards, getTransactions, getLoans,
  getAccountStatements, createTransaction, createWithdrawal, createDeposit, getAccountsByUser,
} from '../../../shared/api/banking';
import useAuthStore from '../../auth/store/authStore';
import ProfilePage from '../../profile/ProfilePage';

const fmt = (n) => n != null ? Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2 }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-GT') : '—';

const Badge = ({ value }) => {
  const v = (value || '').toLowerCase();
  const cls = ['activa', 'active', 'activo', 'aprobado'].includes(v) ? 'badge-success'
    : ['bloqueada', 'bloqueado', 'rechazado'].includes(v) ? 'badge-danger'
      : v === 'pendiente' ? 'badge-warning' : 'badge-muted';
  return <span className={`badge ${cls}`}>{value || '—'}</span>;
};

const LoadingRows = ({ cols }) => (
  <>{[1, 2, 3].map(i => (<tr key={i}>{Array(cols).fill(0).map((_, j) => (<td key={j}><div className="skeleton" style={{ width: j === 0 ? '60%' : '80%' }} /></td>))}</tr>))}</>
);
const EmptyState = ({ text }) => (
  <tr><td colSpan={99}><div className="empty-state">
    <div className="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" width="32" height="32"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" /><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></div>
    <p className="empty-state-text">{text}</p>
  </div></td></tr>
);
const PlusIcon = () => (<svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>);

/* ── Overview cliente ── */
const UserOverview = () => {
  const { user } = useAuthStore();
  const { data: accounts, loading: la } = useData(getAccounts);
  const { data: cards, loading: lc } = useData(getCards);
  const { data: loans, loading: ll } = useData(getLoans);
  const { data: transactions, loading: lt } = useData(getTransactions);

  // Cuentas propias del usuario
  const [myAccounts, setMyAccounts] = useState([]);
  const [loadingMyAcc, setLoadingMyAcc] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getAccountsByUser(user.id)
      .then(res => {
        const d = res.data?.data || res.data || [];
        setMyAccounts(Array.isArray(d) ? d : []);
      })
      .catch(() => setMyAccounts([]))
      .finally(() => setLoadingMyAcc(false));
  }, [user?.id]);

  const myBalance = myAccounts.reduce((s, a) => s + Number(a.balance || 0), 0);
  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance || a.Balance || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Buen día, {user?.username || 'Cliente'}</h1>
          <p className="page-subtitle">Resumen de tu cuenta bancaria</p>
        </div>
      </div>

      {/* Balance destacado — usa el balance real del usuario */}
      <div style={{ background: 'linear-gradient(135deg,rgba(200,169,81,0.1),rgba(200,169,81,0.04))', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 20, padding: '2rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'radial-gradient(circle,rgba(200,169,81,0.06) 0%,transparent 70%)', borderRadius: '50%' }} />
        <p style={{ fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.15em', color: 'var(--gold-dim)', marginBottom: '.5rem', fontWeight: 600 }}>Balance total</p>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '3rem', fontWeight: 600, color: 'var(--white)', lineHeight: 1 }}>
          Q {loadingMyAcc ? '...' : fmt(myBalance)}
        </p>
        <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginTop: '.5rem' }}>
          {loadingMyAcc ? '...' : `${myAccounts.length} cuenta${myAccounts.length !== 1 ? 's' : ''} registrada${myAccounts.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          {
            label: 'Mis cuentas', value: loadingMyAcc ? '...' : myAccounts.length,
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" /><path d="M9 22V12h6v10" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" /></svg>
          },
          {
            label: 'Mis tarjetas', value: lc ? '...' : cards.length,
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="2" y="5" width="20" height="14" rx="2" stroke="#c8a951" strokeWidth="1.5" /><path d="M2 10h20" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" /></svg>
          },
          {
            label: 'Mis préstamos', value: ll ? '...' : loans.length,
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" /></svg>
          },
          {
            label: 'Transacciones', value: lt ? '...' : transactions.length,
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{
            borderColor: s.label === 'Bloqueadas' && !loadingMyAcc && myAccounts.filter(a => a.status === 'bloqueada').length > 0
              ? 'rgba(224,92,92,0.25)' : undefined
          }}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-value" style={{
              color: s.label === 'Bloqueadas' && !loadingMyAcc && myAccounts.filter(a => a.status === 'bloqueada').length > 0
                ? '#e05c5c'
                : s.label === 'Activas' && !loadingMyAcc && myAccounts.filter(a => a.status === 'activa').length > 0
                  ? '#4caf7d' : undefined
            }}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {!loadingMyAcc && myAccounts.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>

          {/* Aviso cuentas bloqueadas */}
          {myAccounts.filter(a => a.status === 'bloqueada').length > 0 && (
            <div style={{
              background: 'rgba(224,92,92,0.06)',
              border: '1px solid rgba(224,92,92,0.2)',
              borderRadius: 10, padding: '1rem 1.25rem',
              marginBottom: '1rem',
              display: 'flex', alignItems: 'center', gap: '.75rem'
            }}>
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16" style={{ flexShrink: 0 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#e05c5c" strokeWidth="1.5" />
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p style={{ fontSize: '.82rem', color: 'rgba(224,92,92,0.9)', lineHeight: 1.5, margin: 0 }}>
                Tienes <strong>{myAccounts.filter(a => a.status === 'bloqueada').length}</strong> cuenta{myAccounts.filter(a => a.status === 'bloqueada').length > 1 ? 's' : ''} bloqueada{myAccounts.filter(a => a.status === 'bloqueada').length > 1 ? 's' : ''}. Contacta al administrador para más información.
              </p>
            </div>
          )}

          {/* Aviso cuentas inactivas */}
          {myAccounts.filter(a => a.status === 'inactiva').length > 0 && (
            <div style={{
              background: 'rgba(107,127,163,0.06)',
              border: '1px solid rgba(107,127,163,0.2)',
              borderRadius: 10, padding: '1rem 1.25rem',
              marginBottom: '1rem',
              display: 'flex', alignItems: 'center', gap: '.75rem'
            }}>
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" stroke="#6b7fa3" strokeWidth="1.5" />
                <path d="M12 8v4M12 16h.01" stroke="#6b7fa3" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p style={{ fontSize: '.82rem', color: 'rgba(107,127,163,0.9)', lineHeight: 1.5, margin: 0 }}>
                Tienes <strong>{myAccounts.filter(a => a.status === 'inactiva').length}</strong> cuenta{myAccounts.filter(a => a.status === 'inactiva').length > 1 ? 's' : ''} inactiva{myAccounts.filter(a => a.status === 'inactiva').length > 1 ? 's' : ''}. Contacta al administrador para reactivarla.
              </p>
            </div>
          )}

          {/* Tabla */}
          <div className="table-card">
            <div className="table-header">
              <span className="table-title">Mis cuentas bancarias</span>
              <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
                {myAccounts.filter(a => a.status === 'activa').length} activa{myAccounts.filter(a => a.status === 'activa').length !== 1 ? 's' : ''}
                {myAccounts.filter(a => a.status === 'bloqueada').length > 0 && (
                  <span style={{ color: '#e05c5c', marginLeft: '.5rem' }}>
                    · {myAccounts.filter(a => a.status === 'bloqueada').length} bloqueada{myAccounts.filter(a => a.status === 'bloqueada').length !== 1 ? 's' : ''}
                  </span>
                )}
                {myAccounts.filter(a => a.status === 'inactiva').length > 0 && (
                  <span style={{ color: 'var(--muted)', marginLeft: '.5rem' }}>
                    · {myAccounts.filter(a => a.status === 'inactiva').length} inactiva{myAccounts.filter(a => a.status === 'inactiva').length !== 1 ? 's' : ''}
                  </span>
                )}
              </span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Cuenta</th><th>Tipo</th><th>Balance</th>
                  <th>Moneda</th><th>Límite diario</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {myAccounts.map((a, i) => (
                  <tr key={i} style={{
                    opacity: a.status === 'inactiva' ? 0.6 : 1,
                    background: a.status === 'bloqueada' ? 'rgba(224,92,92,0.03)' : undefined
                  }}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--gold-pure)', fontSize: '.85rem' }}>
                      {a.accountNumber || '—'}
                    </td>
                    <td><Badge value={a.accountType} /></td>
                    <td style={{ fontWeight: 500, color: a.status === 'bloqueada' ? 'var(--muted)' : 'var(--white)' }}>
                      Q {fmt(a.balance)}
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{a.currencyCode || 'GTQ'}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>Q {fmt(a.dailyWithdrawalLimit || 0)}</td>
                    <td><Badge value={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* Últimas transacciones */}
      <div className="table-card" style={{ marginTop: '1.5rem' }}>
        <div className="table-header"><span className="table-title">Últimos movimientos</span></div>
        <table className="data-table">
          <thead><tr><th>Tipo</th><th>Origen</th><th>Destino</th><th>Monto</th><th>Fecha</th></tr></thead>
          <tbody>
            {lt ? <LoadingRows cols={5} /> : transactions.slice(0, 5).map((t, i) => (
              <tr key={i}>
                <td><Badge value={t.transactionType || t.TransactionType} /></td>
                <td style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--gold-pure)' }}>{t.sourceAccountId || t.SourceAccountId || '—'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--gold-pure)' }}>{t.destinationAccountId || t.DestinationAccountId || '—'}</td>
                <td style={{ fontWeight: 500 }}>Q {fmt(t.amount || t.Amount)}</td>
                <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{fmtDate(t.createdAt || t.date)}</td>
              </tr>
            ))}
            {!lt && transactions.length === 0 && <EmptyState text="Sin movimientos recientes" />}
          </tbody>
        </table>
      </div>
    </div>
  );
};
/* ── Cuentas usuario ── */
const UserAccounts = () => {
  const { user } = useAuthStore();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getAccountsByUser(user.id)
      .then(res => {
        const d = res.data?.data || res.data || [];
        setAccounts(Array.isArray(d) ? d : []);
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const fmt = (n) => Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 });
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-GT') : '—';

  const activas = accounts.filter(a => a.status === 'activa');
  const bloqueadas = accounts.filter(a => a.status === 'bloqueada');
  const inactivas = accounts.filter(a => a.status === 'inactiva');

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
          {
            label: 'Total cuentas', value: loading ? '...' : accounts.length,
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" /><path d="M9 22V12h6v10" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" /></svg>
          },
          {
            label: 'Activas', value: loading ? '...' : activas.length,
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round" /><path d="M22 4L12 14.01l-3-3" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round" /></svg>
          },
          {
            label: 'Bloqueadas', value: loading ? '...' : bloqueadas.length,
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#e05c5c" strokeWidth="1.5" /><path d="M7 11V7a5 5 0 0110 0v4" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round" /></svg>
          },
          {
            label: 'Inactivas', value: loading ? '...' : inactivas.length,
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><circle cx="12" cy="12" r="10" stroke="#6b7fa3" strokeWidth="1.5" /><path d="M8 12h8" stroke="#6b7fa3" strokeWidth="1.5" strokeLinecap="round" /></svg>
          },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{
            borderColor: s.label === 'Bloqueadas' && bloqueadas.length > 0 ? 'rgba(224,92,92,0.3)' : undefined
          }}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-value" style={{
              color: s.label === 'Bloqueadas' && bloqueadas.length > 0 ? '#e05c5c'
                : s.label === 'Activas' && activas.length > 0 ? '#4caf7d' : undefined
            }}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Aviso cuentas bloqueadas */}
      {!loading && bloqueadas.length > 0 && (
        <div style={{
          background: 'rgba(224,92,92,0.06)', border: '1px solid rgba(224,92,92,0.2)',
          borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'flex-start', gap: '.85rem'
        }}>
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18" style={{ flexShrink: 0, marginTop: 2 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="#e05c5c" strokeWidth="1.5" />
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div>
            <p style={{ fontSize: '.85rem', color: '#e05c5c', fontWeight: 500, marginBottom: '.2rem' }}>
              Cuenta{bloqueadas.length > 1 ? 's' : ''} bloqueada{bloqueadas.length > 1 ? 's' : ''}
            </p>
            <p style={{ fontSize: '.78rem', color: 'rgba(224,92,92,0.8)', lineHeight: 1.5 }}>
              Tienes <strong>{bloqueadas.length}</strong> cuenta{bloqueadas.length > 1 ? 's' : ''} bloqueada{bloqueadas.length > 1 ? 's' : ''}.
              No podrás realizar operaciones con ella{bloqueadas.length > 1 ? 's' : ''}. Contacta al administrador del banco para más información.
            </p>
          </div>
        </div>
      )}

      {/* Aviso cuentas inactivas */}
      {!loading && inactivas.length > 0 && (
        <div style={{
          background: 'rgba(107,127,163,0.06)', border: '1px solid rgba(107,127,163,0.2)',
          borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'flex-start', gap: '.85rem'
        }}>
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10" stroke="#6b7fa3" strokeWidth="1.5" />
            <path d="M12 8v4M12 16h.01" stroke="#6b7fa3" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div>
            <p style={{ fontSize: '.85rem', color: 'var(--muted)', fontWeight: 500, marginBottom: '.2rem' }}>
              Cuenta{inactivas.length > 1 ? 's' : ''} inactiva{inactivas.length > 1 ? 's' : ''}
            </p>
            <p style={{ fontSize: '.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              Tienes <strong>{inactivas.length}</strong> cuenta{inactivas.length > 1 ? 's' : ''} inactiva{inactivas.length > 1 ? 's' : ''}.
              Contacta al administrador para reactivarla{inactivas.length > 1 ? 's' : ''}.
            </p>
          </div>
        </div>
      )}

      {/* Sin cuentas */}
      {!loading && accounts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--muted)' }}>
          <svg viewBox="0 0 24 24" fill="none" width="48" height="48"
            style={{ opacity: .15, display: 'block', margin: '0 auto 1rem' }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: '.95rem', marginBottom: '.5rem' }}>No tienes cuentas asignadas</p>
          <p style={{ fontSize: '.82rem' }}>Contacta al administrador para crear tu cuenta bancaria.</p>
        </div>
      )}

      {/* Tarjetas de cuentas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '1.25rem' }}>
        {loading ? [1, 2].map(i => (
          <div key={i} className="stat-card">
            <div className="skeleton" style={{ height: 130 }} />
          </div>
        )) : accounts.map((a, i) => {
          const st = (a.status || '').toLowerCase();
          const isBlocked = st === 'bloqueada';
          const isInactive = st === 'inactiva';
          const borderColor = isBlocked ? 'rgba(224,92,92,0.3)'
            : isInactive ? 'rgba(107,127,163,0.2)'
              : 'rgba(200,169,81,0.18)';
          const glowColor = isBlocked ? 'rgba(224,92,92,0.05)' : 'rgba(200,169,81,0.06)';

          return (
            <div key={i} style={{
              background: 'linear-gradient(135deg,rgba(15,30,53,0.95),rgba(22,40,71,0.85))',
              border: `1px solid ${borderColor}`,
              borderRadius: 16, padding: '1.5rem',
              position: 'relative', overflow: 'hidden',
              opacity: isInactive ? 0.75 : 1,
            }}>
              {/* Orbe */}
              <div style={{
                position: 'absolute', top: -20, right: -20, width: 120, height: 120,
                background: `radial-gradient(circle,${glowColor} 0%,transparent 70%)`,
                borderRadius: '50%'
              }} />

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <p style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', fontWeight: 600, marginBottom: '.2rem' }}>
                    {a.accountType || 'Cuenta'}
                  </p>
                  <p style={{ fontFamily: 'monospace', color: 'var(--gold-pure)', fontSize: '.82rem' }}>
                    {a.accountNumber || '—'}
                  </p>
                </div>
                <span style={{
                  padding: '.2rem .7rem', borderRadius: 20, fontSize: '.68rem', fontWeight: 500,
                  background: isBlocked ? 'rgba(224,92,92,0.12)' : isInactive ? 'rgba(107,127,163,0.1)' : 'rgba(76,175,125,0.12)',
                  border: `1px solid ${isBlocked ? 'rgba(224,92,92,0.25)' : isInactive ? 'rgba(107,127,163,0.2)' : 'rgba(76,175,125,0.25)'}`,
                  color: isBlocked ? '#e05c5c' : isInactive ? 'var(--muted)' : '#4caf7d',
                }}>
                  {a.status || 'activa'}
                </span>
              </div>

              {/* Balance */}
              <p style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: '2rem', fontWeight: 600, lineHeight: 1, marginBottom: '.75rem',
                color: isBlocked ? 'var(--muted)' : 'var(--white)',
              }}>
                {a.currencyCode || 'Q'} {fmt(a.balance)}
              </p>

              {/* Footer info */}
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

              {/* Banner bloqueada */}
              {isBlocked && (
                <div style={{
                  marginTop: '.85rem', padding: '.6rem .85rem',
                  background: 'rgba(224,92,92,0.1)', borderRadius: 8,
                  display: 'flex', alignItems: 'center', gap: '.5rem'
                }}>
                  <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="#e05c5c" strokeWidth="1.5" />
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p style={{ fontSize: '.72rem', color: '#e05c5c', margin: 0 }}>
                    Cuenta bloqueada — contacta al banco
                  </p>
                </div>
              )}

              {/* Banner inactiva */}
              {isInactive && (
                <div style={{
                  marginTop: '.85rem', padding: '.6rem .85rem',
                  background: 'rgba(107,127,163,0.08)', borderRadius: 8,
                  display: 'flex', alignItems: 'center', gap: '.5rem'
                }}>
                  <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                    <circle cx="12" cy="12" r="10" stroke="#6b7fa3" strokeWidth="1.5" />
                    <path d="M8 12h8" stroke="#6b7fa3" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p style={{ fontSize: '.72rem', color: 'var(--muted)', margin: 0 }}>
                    Cuenta inactiva — contacta al banco
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
/* ── Tarjetas usuario ── */
const UserCards = () => {
  const { data, loading } = useData(getCards);
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Mis Tarjetas</h1><p className="page-subtitle">Tus tarjetas de crédito y débito</p></div></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
        {loading ? [1, 2].map(i => <div key={i} className="stat-card"><div className="skeleton" style={{ height: 100 }} /></div>) :
          data.map((c, i) => {
            const isBlocked = (c.status || c.Status || '').toLowerCase() === 'bloqueada';
            return (
              <div key={i} style={{ background: isBlocked ? 'rgba(224,92,92,0.04)' : 'linear-gradient(135deg,rgba(200,169,81,0.08),rgba(15,30,53,0.95))', border: `1px solid ${isBlocked ? 'rgba(224,92,92,0.2)' : 'rgba(200,169,81,0.15)'}`, borderRadius: 16, padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: `radial-gradient(circle,${isBlocked ? 'rgba(224,92,92,0.06)' : 'rgba(200,169,81,0.06)'} 0%,transparent 70%)`, borderRadius: '50%' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)' }}>{c.cardType || c.CardType || 'Tarjeta'}</span>
                  <Badge value={c.status || c.Status || 'activa'} />
                </div>
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.6rem', fontWeight: 600, color: isBlocked ? 'var(--danger)' : 'var(--white)', marginBottom: '.5rem' }}>Q {fmt(c.availableBalance || c.AvailableBalance)}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '.75rem', borderTop: `1px solid ${isBlocked ? 'rgba(224,92,92,0.1)' : 'rgba(200,169,81,0.1)'}` }}>
                  <div><p style={{ fontSize: '.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Vence</p><p style={{ fontSize: '.82rem', color: 'var(--white)' }}>{fmtDate(c.expirationDate || c.ExpirationDate)}</p></div>
                  <div style={{ textAlign: 'right' }}><p style={{ fontSize: '.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>CVV</p><p style={{ fontSize: '.82rem', color: 'var(--white)' }}>***</p></div>
                </div>
              </div>
            );
          })}
        {!loading && data.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>No tienes tarjetas registradas</div>}
      </div>
    </div>
  );
};

/* ── Transferencias usuario ── */
const UserTransactions = () => {
  const { data, loading, reload } = useData(getTransactions);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ sourceAccountId: '', destinationAccountId: '', transactionType: 'transferencia', amount: '', description: '' });
  const [saving, setSaving] = useState(false);
  const handleCreate = async () => {
    setSaving(true);
    try { await createTransaction({ ...form, amount: Number(form.amount) }); showSuccess('Transferencia realizada'); setModal(false); reload(); }
    catch (e) { showError(e?.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };
  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Transferencias</h1><p className="page-subtitle">Historial de movimientos y transferencias</p></div>
        <button className="btn-add" onClick={() => setModal(true)}><PlusIcon />Nueva transferencia</button>
      </div>
      <div className="table-card">
        <div className="table-header"><span className="table-title">Mis movimientos ({data.length})</span></div>
        <table className="data-table">
          <thead><tr><th>Tipo</th><th>Origen</th><th>Destino</th><th>Monto</th><th>Fecha</th></tr></thead>
          <tbody>
            {loading ? <LoadingRows cols={5} /> : data.map((t, i) => (
              <tr key={i}>
                <td><Badge value={t.transactionType || t.TransactionType} /></td>
                <td style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--gold-pure)' }}>{t.sourceAccountId || t.SourceAccountId || '—'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--gold-pure)' }}>{t.destinationAccountId || t.DestinationAccountId || '—'}</td>
                <td style={{ fontWeight: 500 }}>Q {fmt(t.amount || t.Amount)}</td>
                <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{fmtDate(t.createdAt || t.date)}</td>
              </tr>
            ))}
            {!loading && data.length === 0 && <EmptyState text="Sin transacciones" />}
          </tbody>
        </table>
      </div>
      {modal && (<div className="modal-overlay" onClick={() => setModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><span className="modal-title">Nueva Transferencia</span><button className="modal-close" onClick={() => setModal(false)}>✕</button></div>
        <div className="modal-body">
          <div className="modal-fields-row">
            <div className="modal-field"><label className="modal-label">Cuenta origen</label><input className="modal-input" placeholder="ACC-000-0000" value={form.sourceAccountId} onChange={e => setForm(p => ({ ...p, sourceAccountId: e.target.value }))} /></div>
            <div className="modal-field"><label className="modal-label">Cuenta destino</label><input className="modal-input" placeholder="ACC-000-0000" value={form.destinationAccountId} onChange={e => setForm(p => ({ ...p, destinationAccountId: e.target.value }))} /></div>
          </div>
          <div className="modal-fields-row">
            <div className="modal-field"><label className="modal-label">Tipo</label><select className="modal-select" value={form.transactionType} onChange={e => setForm(p => ({ ...p, transactionType: e.target.value }))}><option value="transferencia">Transferencia</option><option value="pago">Pago</option></select></div>
            <div className="modal-field"><label className="modal-label">Monto</label><input className="modal-input" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
          </div>
          <div className="modal-field"><label className="modal-label">Descripción</label><input className="modal-input" placeholder="Descripción opcional" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
        </div>
        <div className="modal-footer"><button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button><button className="btn-save" onClick={handleCreate} disabled={saving}>{saving ? <span className="spin" /> : 'Transferir'}</button></div>
      </div></div>)}
    </div>
  );
};

/* ── Préstamos usuario ── */
const UserLoans = () => {
  const { data, loading } = useData(getLoans);
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Mis Préstamos</h1><p className="page-subtitle">Estado de tus créditos y financiamientos</p></div></div>
      <div className="table-card">
        <div className="table-header"><span className="table-title">Préstamos ({data.length})</span></div>
        <table className="data-table">
          <thead><tr><th>Cuenta</th><th>Solicitado</th><th>Aprobado</th><th>Tasa</th><th>Plazo</th><th>Estado</th></tr></thead>
          <tbody>
            {loading ? <LoadingRows cols={6} /> : data.map((l, i) => (
              <tr key={i}>
                <td style={{ fontFamily: 'monospace', color: 'var(--gold-pure)', fontSize: '.82rem' }}>{l.accountNumber || l.AccountNumber || '—'}</td>
                <td>Q {fmt(l.requestedAmount || l.RequestedAmount)}</td>
                <td style={{ color: 'var(--success)', fontWeight: 500 }}>Q {fmt(l.approvedAmount || l.ApprovedAmount)}</td>
                <td style={{ color: 'var(--muted)' }}>{l.interestRate || l.InterestRate || '—'}%</td>
                <td style={{ color: 'var(--muted)' }}>{l.termMonths || l.TermMonths || '—'} m</td>
                <td><Badge value={l.status || l.Status} /></td>
              </tr>
            ))}
            {!loading && data.length === 0 && <EmptyState text="Sin préstamos activos" />}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── Depósitos usuario ── */
const UserDeposits = () => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ accountNumber: '', amount: '', currencyCode: 'GTQ', description: '' });
  const [saving, setSaving] = useState(false);
  const handleCreate = async () => {
    setSaving(true);
    try { await createDeposit({ ...form, amount: Number(form.amount) }); showSuccess('Depósito realizado'); setModal(false); setForm({ accountNumber: '', amount: '', currencyCode: 'GTQ', description: '' }); }
    catch (e) { showError(e?.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };
  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Depósitos</h1><p className="page-subtitle">Depositar fondos en una cuenta</p></div>
        <button className="btn-add" onClick={() => setModal(true)}><PlusIcon />Nuevo depósito</button>
      </div>
      <div className="table-card"><div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
        <svg viewBox="0 0 24 24" fill="none" width="40" height="40" style={{ opacity: .15, display: 'block', margin: '0 auto 1rem' }}><path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <p style={{ fontSize: '.9rem' }}>Presiona "Nuevo depósito" para acreditar fondos.</p>
      </div></div>
      {modal && (<div className="modal-overlay" onClick={() => setModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><span className="modal-title">Nuevo Depósito</span><button className="modal-close" onClick={() => setModal(false)}>✕</button></div>
        <div className="modal-body">
          <div className="modal-field"><label className="modal-label">N° de Cuenta</label><input className="modal-input" placeholder="ACC-000-0000" value={form.accountNumber} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value }))} /></div>
          <div className="modal-fields-row">
            <div className="modal-field"><label className="modal-label">Monto</label><input className="modal-input" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
            <div className="modal-field"><label className="modal-label">Moneda</label><select className="modal-select" value={form.currencyCode} onChange={e => setForm(p => ({ ...p, currencyCode: e.target.value }))}><option value="GTQ">GTQ</option><option value="USD">USD</option><option value="EUR">EUR</option></select></div>
          </div>
          <div className="modal-field"><label className="modal-label">Descripción</label><input className="modal-input" placeholder="Motivo" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
        </div>
        <div className="modal-footer"><button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button><button className="btn-save" onClick={handleCreate} disabled={saving}>{saving ? <span className="spin" /> : 'Depositar'}</button></div>
      </div></div>)}
    </div>
  );
};
/* ── Retiros usuario ── */
const UserWithdrawals = () => {
  const { user } = useAuthStore();
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);

  // Cargamos las cuentas del usuario para el selector
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getAccountsByUser(user.id)
      .then(res => {
        const d = res.data?.data || res.data || [];
        setAccounts(Array.isArray(d) ? d : []);
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false));
  }, [user?.id]);

  const activeAccounts = accounts.filter(a => (a.status || '').toLowerCase() === 'activa');

  const emptyForm = { accountNumber: '', amount: '' };
  const [form, setForm] = useState(emptyForm);

  const handleCreate = async () => {
    if (!form.accountNumber) { showError('Seleccioná una cuenta'); return; }
    if (!form.amount || Number(form.amount) <= 0) { showError('Ingresá un monto válido'); return; }

    // Validación contra límite diario
    const selectedAccount = accounts.find(a => a.accountNumber === form.accountNumber);
    const limit = Number(selectedAccount?.dailyWithdrawalLimit || 0);
    if (limit > 0 && Number(form.amount) > limit) {
      showError(`El monto excede el límite diario de Q ${fmt(limit)}`);
      return;
    }

    // Validación de saldo suficiente
    const balance = Number(selectedAccount?.balance || 0);
    if (Number(form.amount) > balance) {
      showError('Saldo insuficiente para realizar este retiro');
      return;
    }

    setSaving(true);
    try {
      await createWithdrawal({
        accountNumber: form.accountNumber,
        amount: Number(form.amount),
      });
      showSuccess('Retiro realizado exitosamente');
      setHistory(prev => [
        {
          accountNumber: form.accountNumber,
          amount: Number(form.amount),
          date: new Date().toISOString(),
          id: Date.now(),
        },
        ...prev,
      ]);
      setForm(emptyForm);
      setModal(false);
    } catch (e) {
      showError(e?.response?.data?.message || 'Error al realizar el retiro');
    } finally {
      setSaving(false);
    }
  };

  const selectedAccount = accounts.find(a => a.accountNumber === form.accountNumber);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Retiros</h1>
          <p className="page-subtitle">Retirar fondos de tus cuentas</p>
        </div>
        <button className="btn-add" onClick={() => setModal(true)} disabled={activeAccounts.length === 0}>
          <PlusIcon />
          Nuevo retiro
        </button>
      </div>

      {/* Aviso si no hay cuentas activas */}
      {!loadingAccounts && activeAccounts.length === 0 && (
        <div style={{
          background: 'rgba(224,92,92,0.06)', border: '1px solid rgba(224,92,92,0.18)',
          borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '.75rem',
        }}>
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16" style={{ flexShrink: 0 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="#e05c5c" strokeWidth="1.5" />
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: '.82rem', color: 'rgba(224,92,92,0.9)', margin: 0 }}>
            No tenés cuentas activas disponibles para realizar retiros.
          </p>
        </div>
      )}

      {/* Stats de sesión */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        {[
          { label: 'Retiros en sesión', value: history.length },
          { label: 'Total retirado', value: 'Q ' + fmt(history.reduce((s, r) => s + r.amount, 0)) },
          { label: 'Cuentas activas', value: loadingAccounts ? '...' : activeAccounts.length },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-value" style={{ fontSize: '1.4rem' }}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Historial de sesión */}
      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Retiros realizados en esta sesión</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>N° Cuenta</th>
              <th>Monto retirado</th>
              <th>Fecha / Hora</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
                        <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="empty-state-text">
                      No hay retiros en esta sesión. Presioná "Nuevo retiro" para comenzar.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              history.map((r, i) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--muted)', fontSize: '.78rem' }}>{i + 1}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--gold-pure)', fontSize: '.85rem' }}>
                    {r.accountNumber}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--white)' }}>Q {fmt(r.amount)}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>
                    {new Date(r.date).toLocaleString('es-GT')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Nuevo Retiro</span>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Aviso */}
              <div style={{
                background: 'rgba(224,92,92,0.06)', border: '1px solid rgba(224,92,92,0.15)',
                borderRadius: 8, padding: '.85rem 1rem',
                display: 'flex', gap: '.6rem', alignItems: 'flex-start',
                marginBottom: '1rem',
              }}>
                <svg viewBox="0 0 24 24" fill="none" width="15" height="15" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M12 9v4M12 17h.01" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p style={{ fontSize: '.78rem', color: 'rgba(224,92,92,0.8)', lineHeight: 1.5, margin: 0 }}>
                  El retiro se aplicará de inmediato a tu saldo. Esta acción no se puede deshacer.
                </p>
              </div>

              {/* Selector de cuenta */}
              <div className="modal-field">
                <label className="modal-label">Seleccioná tu cuenta *</label>
                <select
                  className="modal-select"
                  value={form.accountNumber}
                  onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value }))}
                >
                  <option value="">— Elegí una cuenta —</option>
                  {activeAccounts.map(a => (
                    <option key={a.accountNumber} value={a.accountNumber}>
                      {a.accountNumber} — Q {fmt(a.balance)} ({a.accountType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Info de la cuenta seleccionada */}
              {selectedAccount && (
                <div style={{
                  background: 'rgba(200,169,81,0.05)', border: '1px solid rgba(200,169,81,0.12)',
                  borderRadius: 8, padding: '.75rem 1rem', marginBottom: '.5rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ fontSize: '.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Saldo disponible</p>
                    <p style={{ fontSize: '1.1rem', color: 'var(--gold-pure)', fontFamily: "'Cormorant Garamond',serif", fontWeight: 600 }}>
                      Q {fmt(selectedAccount.balance)}
                    </p>
                  </div>
                  {selectedAccount.dailyWithdrawalLimit > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Límite diario</p>
                      <p style={{ fontSize: '.9rem', color: 'var(--white)', fontWeight: 500 }}>
                        Q {fmt(selectedAccount.dailyWithdrawalLimit)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Monto */}
              <div className="modal-field">
                <label className="modal-label">Monto a retirar (Q) *</label>
                <input
                  className="modal-input"
                  type="number"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
              <button
                className="btn-save"
                onClick={handleCreate}
                disabled={saving}
                style={{ background: 'linear-gradient(135deg,#8a7035,#c8a951)' }}
              >
                {saving ? <span className="spin" /> : 'Confirmar retiro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Estado de cuenta usuario ── */
const UserStatements = () => {
  const { data, loading } = useData(getAccountStatements);
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Estado de Cuenta</h1><p className="page-subtitle">Historial de estados de tu cuenta</p></div></div>
      <div className="table-card">
        <div className="table-header"><span className="table-title">Estados ({data.length})</span></div>
        <table className="data-table">
          <thead><tr><th>Cuenta</th><th>Balance inicial</th><th>Balance final</th><th>Fecha</th></tr></thead>
          <tbody>
            {loading ? <LoadingRows cols={4} /> : data.map((s, i) => (
              <tr key={i}>
                <td style={{ fontFamily: 'monospace', color: 'var(--gold-pure)' }}>{s.accountNumber || s.accountId || '—'}</td>
                <td>Q {fmt(s.openingBalance || s.initialBalance || 0)}</td>
                <td style={{ fontWeight: 500, color: 'var(--white)' }}>Q {fmt(s.closingBalance || s.finalBalance || 0)}</td>
                <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{fmtDate(s.createdAt || s.date)}</td>
              </tr>
            ))}
            {!loading && data.length === 0 && <EmptyState text="Sin estados de cuenta" />}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ══ MAIN ══ */
const USER_SECTIONS = {
  overview: UserOverview, accounts: UserAccounts, cards: UserCards,
  transactions: UserTransactions, loans: UserLoans,
  deposits: UserDeposits, withdrawals: UserWithdrawals, statements: UserStatements, profile: ProfilePage,
};

const UserDashboard = () => {
  const [page, setPage] = useState('overview');
  const Section = USER_SECTIONS[page] || UserOverview;
  return (
    <DashboardLayout activePage={page} onNavigate={setPage} isAdmin={false}>
      <Section />
    </DashboardLayout>
  );
};

export default UserDashboard;