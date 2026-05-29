import { useState, useEffect } from 'react';
import { getAccountsByUser } from '../../../../shared/api/banking';
import useAuthStore from '../../../auth/store/authStore';
import Badge from '../../shared/Badge';
import LoadingRows from '../../shared/LoadingRows';
import EmptyState from '../../shared/EmptyState';
import { fmt, fmtDate } from '../../shared/formatters';

const UserOverview = () => {
  const { user } = useAuthStore();
  const [myAccounts,   setMyAccounts]   = useState([]);
  const [myCards,      setMyCards]      = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingAcc,   setLoadingAcc]   = useState(true);
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingTx,    setLoadingTx]    = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const token = JSON.parse(localStorage.getItem('bancario-auth'))?.state?.token;

    getAccountsByUser(user.id)
      .then(res => { const d = res.data?.data || res.data || []; setMyAccounts(Array.isArray(d) ? d : []); })
      .catch(() => setMyAccounts([]))
      .finally(() => setLoadingAcc(false));

    fetch(`http://localhost:3006/api/v1/cards/my?_t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setMyCards(Array.isArray(d?.data) ? d.data : []))
      .catch(() => setMyCards([]))
      .finally(() => setLoadingCards(false));

    fetch(`http://localhost:3006/api/v1/transaction/my?_t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setTransactions(Array.isArray(d?.data) ? d.data : []))
      .catch(() => setTransactions([]))
      .finally(() => setLoadingTx(false));
  }, [user?.id]);

  const myBalance  = myAccounts.reduce((s, a) => s + Number(a.balance || 0), 0);
  const bloqueadas = myAccounts.filter(a => a.status === 'bloqueada');
  const inactivas  = myAccounts.filter(a => a.status === 'inactiva');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Buen día, {user?.username || 'Cliente'}</h1>
          <p className="page-subtitle">Resumen de tu cuenta bancaria</p>
        </div>
      </div>

      {/* Balance destacado */}
      <div style={{ background: 'linear-gradient(135deg,rgba(200,169,81,0.1),rgba(200,169,81,0.04))', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 20, padding: '2rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'radial-gradient(circle,rgba(200,169,81,0.06) 0%,transparent 70%)', borderRadius: '50%' }}/>
        <p style={{ fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.15em', color: 'var(--gold-dim)', marginBottom: '.5rem', fontWeight: 600 }}>Balance total</p>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '3rem', fontWeight: 600, color: 'var(--white)', lineHeight: 1 }}>
          Q {loadingAcc ? '...' : fmt(myBalance)}
        </p>
        <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginTop: '.5rem' }}>
          {loadingAcc ? '...' : `${myAccounts.length} cuenta${myAccounts.length !== 1 ? 's' : ''} registrada${myAccounts.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Mis cuentas',    value: loadingAcc   ? '...' : myAccounts.length,
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/><path d="M9 22V12h6v10" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/></svg> },
          { label: 'Mis tarjetas',   value: loadingCards ? '...' : myCards.length,
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="2" y="5" width="20" height="14" rx="2" stroke="#c8a951" strokeWidth="1.5"/><path d="M2 10h20" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/></svg> },
          { label: 'Cuentas activas', value: loadingAcc  ? '...' : myAccounts.filter(a => a.status === 'activa').length,
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round"/><path d="M22 4L12 14.01l-3-3" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round"/></svg> },
          { label: 'Movimientos',    value: loadingTx    ? '...' : transactions.length,
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Avisos */}
      {!loadingAcc && bloqueadas.length > 0 && (
        <div style={{ background: 'rgba(224,92,92,0.06)', border: '1px solid rgba(224,92,92,0.2)', borderRadius: 10, padding: '1rem 1.25rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16" style={{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2" stroke="#e05c5c" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <p style={{ fontSize: '.82rem', color: 'rgba(224,92,92,0.9)', lineHeight: 1.5, margin: 0 }}>
            Tienes <strong>{bloqueadas.length}</strong> cuenta{bloqueadas.length > 1 ? 's' : ''} bloqueada{bloqueadas.length > 1 ? 's' : ''}. Contacta al administrador.
          </p>
        </div>
      )}
      {!loadingAcc && inactivas.length > 0 && (
        <div style={{ background: 'rgba(107,127,163,0.06)', border: '1px solid rgba(107,127,163,0.2)', borderRadius: 10, padding: '1rem 1.25rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" stroke="#6b7fa3" strokeWidth="1.5"/><path d="M12 8v4M12 16h.01" stroke="#6b7fa3" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <p style={{ fontSize: '.82rem', color: 'rgba(107,127,163,0.9)', lineHeight: 1.5, margin: 0 }}>
            Tienes <strong>{inactivas.length}</strong> cuenta{inactivas.length > 1 ? 's' : ''} inactiva{inactivas.length > 1 ? 's' : ''}. Contacta al administrador.
          </p>
        </div>
      )}

      {/* Tabla cuentas */}
      {!loadingAcc && myAccounts.length > 0 && (
        <div className="table-card" style={{ marginTop: '1.5rem' }}>
          <div className="table-header">
            <span className="table-title">Mis cuentas bancarias</span>
            <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
              {myAccounts.filter(a => a.status === 'activa').length} activa{myAccounts.filter(a => a.status === 'activa').length !== 1 ? 's' : ''}
              {bloqueadas.length > 0 && <span style={{ color: '#e05c5c', marginLeft: '.5rem' }}>· {bloqueadas.length} bloqueada{bloqueadas.length !== 1 ? 's' : ''}</span>}
            </span>
          </div>
          <table className="data-table">
            <thead><tr><th>N° Cuenta</th><th>Tipo</th><th>Balance</th><th>Moneda</th><th>Límite diario</th><th>Estado</th></tr></thead>
            <tbody>
              {myAccounts.map((a, i) => (
                <tr key={i} style={{ opacity: a.status === 'inactiva' ? .6 : 1 }}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--gold-pure)', fontSize: '.85rem' }}>{a.accountNumber || '—'}</td>
                  <td><Badge value={a.accountType}/></td>
                  <td style={{ fontWeight: 500, color: a.status === 'bloqueada' ? 'var(--muted)' : 'var(--white)' }}>Q {fmt(a.balance)}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{a.currencyCode || 'GTQ'}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>Q {fmt(a.dailyWithdrawalLimit || 0)}</td>
                  <td><Badge value={a.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Últimos movimientos */}
      <div className="table-card" style={{ marginTop: '1.5rem' }}>
        <div className="table-header"><span className="table-title">Últimos movimientos</span></div>
        <table className="data-table">
          <thead><tr><th>Tipo</th><th>Origen</th><th>Destino</th><th>Monto</th><th>Fecha</th></tr></thead>
          <tbody>
            {loadingTx ? <LoadingRows cols={5}/> : transactions.slice(0, 5).map((t, i) => (
              <tr key={i}>
                <td><Badge value={t.transactionType || t.TransactionType}/></td>
                <td style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--gold-pure)' }}>{t.sourceAccountId || t.SourceAccountId || '—'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--gold-pure)' }}>{t.destinationAccountId || t.DestinationAccountId || '—'}</td>
                <td style={{ fontWeight: 500 }}>Q {fmt(t.amount || t.Amount)}</td>
                <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{fmtDate(t.createdAt || t.date)}</td>
              </tr>
            ))}
            {!loadingTx && transactions.length === 0 && <EmptyState text="Sin movimientos recientes"/>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserOverview;
