import { useState, useCallback, useEffect } from 'react';
import DashboardLayout from '../../../shared/components/layout/DashboardLayout';
import { useData } from '../../../shared/hooks/useData';
import { showSuccess, showError } from '../../../shared/utils/toast';
import {
  getTransactions, getLoans, getAccountsByUser, createLoan,
  createTransaction, createWithdrawal, createDeposit,
  getDeposits, getStatement, getFavorites,
} from '../../../shared/api/banking';
import useAuthStore from '../../auth/store/authStore';
import ProfilePage from '../../profile/ProfilePage';

const fmt = (n) => n != null ? Number(n).toLocaleString('es-GT',{minimumFractionDigits:2}) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-GT') : '—';

const Badge = ({ value }) => {
  const v = (value||'').toLowerCase();
  const cls = ['activa','active','activo','aprobado'].includes(v) ? 'badge-success'
    : ['bloqueada','bloqueado','rechazado'].includes(v) ? 'badge-danger'
    : v==='pendiente' ? 'badge-warning' : 'badge-muted';
  return <span className={`badge ${cls}`}>{value||'—'}</span>;
};

const LoadingRows = ({cols}) => (
  <>{[1,2,3].map(i=>(<tr key={i}>{Array(cols).fill(0).map((_,j)=>(<td key={j}><div className="skeleton" style={{width:j===0?'60%':'80%'}}/></td>))}</tr>))}</>
);
const EmptyState = ({text}) => (
  <tr><td colSpan={99}><div className="empty-state">
    <div className="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" width="32" height="32"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></div>
    <p className="empty-state-text">{text}</p>
  </div></td></tr>
);
const PlusIcon = () => (<svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);

/* ── Overview cliente ── */
const UserOverview = () => {
  const { user } = useAuthStore();

  const [myAccounts, setMyAccounts]     = useState([]);
  const [myCards, setMyCards]           = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingAcc, setLoadingAcc]     = useState(true);
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingTx, setLoadingTx]       = useState(true);

  useEffect(() => {
  if (!user?.id) return;
  const token = JSON.parse(localStorage.getItem('bancario-auth'))?.state?.token;

  // Cuentas del usuario
  getAccountsByUser(user.id)
    .then(res => {
      const d = res.data?.data || res.data || [];
      setMyAccounts(Array.isArray(d) ? d : []);
    })
    .catch(() => setMyAccounts([]))
    .finally(() => setLoadingAcc(false));

  // Tarjetas del usuario
  fetch(`http://localhost:3006/api/v1/cards/my?_t=${Date.now()}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(d => setMyCards(Array.isArray(d?.data) ? d.data : []))
    .catch(() => setMyCards([]))
    .finally(() => setLoadingCards(false));

  // Transacciones del usuario ← agrega esto
  fetch(`http://localhost:3006/api/v1/transaction/my?_t=${Date.now()}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(d => setTransactions(Array.isArray(d?.data) ? d.data : []))
    .catch(() => setTransactions([]))
    .finally(() => setLoadingTx(false));

}, [user?.id]);

  const myBalance  = myAccounts.reduce((s,a) => s + Number(a.balance||0), 0);
  const bloqueadas = myAccounts.filter(a => a.status === 'bloqueada');
  const inactivas  = myAccounts.filter(a => a.status === 'inactiva');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Buen día, {user?.username||'Cliente'}</h1>
          <p className="page-subtitle">Resumen de tu cuenta bancaria</p>
        </div>
      </div>

      {/* Balance destacado */}
      <div style={{background:'linear-gradient(135deg,rgba(200,169,81,0.1),rgba(200,169,81,0.04))',border:'1px solid rgba(200,169,81,0.2)',borderRadius:20,padding:'2rem',marginBottom:'1.5rem',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,right:0,width:200,height:200,background:'radial-gradient(circle,rgba(200,169,81,0.06) 0%,transparent 70%)',borderRadius:'50%'}}/>
        <p style={{fontSize:'.72rem',textTransform:'uppercase',letterSpacing:'.15em',color:'var(--gold-dim)',marginBottom:'.5rem',fontWeight:600}}>Balance total</p>
        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'3rem',fontWeight:600,color:'var(--white)',lineHeight:1}}>
          Q {loadingAcc ? '...' : fmt(myBalance)}
        </p>
        <p style={{fontSize:'.82rem',color:'var(--muted)',marginTop:'.5rem'}}>
          {loadingAcc ? '...' : `${myAccounts.length} cuenta${myAccounts.length!==1?'s':''} registrada${myAccounts.length!==1?'s':''}`}
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label:'Mis cuentas',   value: loadingAcc?'...':myAccounts.length,
            icon:<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/><path d="M9 22V12h6v10" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/></svg> },
          { label:'Mis tarjetas',  value: loadingCards?'...':myCards.length,
            icon:<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="2" y="5" width="20" height="14" rx="2" stroke="#c8a951" strokeWidth="1.5"/><path d="M2 10h20" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/></svg> },
          { label:'Cuentas activas', value: loadingAcc?'...':myAccounts.filter(a=>a.status==='activa').length,
            icon:<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round"/><path d="M22 4L12 14.01l-3-3" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round"/></svg> },
          { label:'Movimientos',   value: loadingTx?'...':transactions.length,
            icon:<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
        ].map((s,i)=>(
          <div key={i} className="stat-card">
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Avisos */}
      {!loadingAcc && bloqueadas.length > 0 && (
        <div style={{background:'rgba(224,92,92,0.06)',border:'1px solid rgba(224,92,92,0.2)',borderRadius:10,padding:'1rem 1.25rem',marginTop:'1rem',display:'flex',alignItems:'center',gap:'.75rem'}}>
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16" style={{flexShrink:0}}>
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="#e05c5c" strokeWidth="1.5"/>
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p style={{fontSize:'.82rem',color:'rgba(224,92,92,0.9)',lineHeight:1.5,margin:0}}>
            Tienes <strong>{bloqueadas.length}</strong> cuenta{bloqueadas.length>1?'s':''} bloqueada{bloqueadas.length>1?'s':''}. Contacta al administrador.
          </p>
        </div>
      )}

      {!loadingAcc && inactivas.length > 0 && (
        <div style={{background:'rgba(107,127,163,0.06)',border:'1px solid rgba(107,127,163,0.2)',borderRadius:10,padding:'1rem 1.25rem',marginTop:'1rem',display:'flex',alignItems:'center',gap:'.75rem'}}>
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16" style={{flexShrink:0}}>
            <circle cx="12" cy="12" r="10" stroke="#6b7fa3" strokeWidth="1.5"/>
            <path d="M12 8v4M12 16h.01" stroke="#6b7fa3" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p style={{fontSize:'.82rem',color:'rgba(107,127,163,0.9)',lineHeight:1.5,margin:0}}>
            Tienes <strong>{inactivas.length}</strong> cuenta{inactivas.length>1?'s':''} inactiva{inactivas.length>1?'s':''}. Contacta al administrador.
          </p>
        </div>
      )}

      {/* Tabla mis cuentas */}
      {!loadingAcc && myAccounts.length > 0 && (
        <div className="table-card" style={{marginTop:'1.5rem'}}>
          <div className="table-header">
            <span className="table-title">Mis cuentas bancarias</span>
            <span style={{fontSize:'.78rem',color:'var(--muted)'}}>
              {myAccounts.filter(a=>a.status==='activa').length} activa{myAccounts.filter(a=>a.status==='activa').length!==1?'s':''}
              {bloqueadas.length > 0 && <span style={{color:'#e05c5c',marginLeft:'.5rem'}}>· {bloqueadas.length} bloqueada{bloqueadas.length!==1?'s':''}</span>}
              {inactivas.length > 0 && <span style={{color:'var(--muted)',marginLeft:'.5rem'}}>· {inactivas.length} inactiva{inactivas.length!==1?'s':''}</span>}
            </span>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>N° Cuenta</th><th>Tipo</th><th>Balance</th><th>Moneda</th><th>Límite diario</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {myAccounts.map((a,i)=>(
                <tr key={i} style={{opacity:a.status==='inactiva'?.6:1,background:a.status==='bloqueada'?'rgba(224,92,92,0.03)':undefined}}>
                  <td style={{fontFamily:'monospace',color:'var(--gold-pure)',fontSize:'.85rem'}}>{a.accountNumber||'—'}</td>
                  <td><Badge value={a.accountType}/></td>
                  <td style={{fontWeight:500,color:a.status==='bloqueada'?'var(--muted)':'var(--white)'}}>Q {fmt(a.balance)}</td>
                  <td style={{color:'var(--muted)',fontSize:'.82rem'}}>{a.currencyCode||'GTQ'}</td>
                  <td style={{color:'var(--muted)',fontSize:'.82rem'}}>Q {fmt(a.dailyWithdrawalLimit||0)}</td>
                  <td><Badge value={a.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Últimos movimientos */}
      <div className="table-card" style={{marginTop:'1.5rem'}}>
        <div className="table-header"><span className="table-title">Últimos movimientos</span></div>
        <table className="data-table">
          <thead><tr><th>Tipo</th><th>Origen</th><th>Destino</th><th>Monto</th><th>Fecha</th></tr></thead>
          <tbody>
            {loadingTx ? <LoadingRows cols={5}/> : transactions.slice(0,5).map((t,i)=>(
              <tr key={i}>
                <td><Badge value={t.transactionType||t.TransactionType}/></td>
                <td style={{fontFamily:'monospace',fontSize:'.82rem',color:'var(--gold-pure)'}}>{t.sourceAccountId||t.SourceAccountId||'—'}</td>
                <td style={{fontFamily:'monospace',fontSize:'.82rem',color:'var(--gold-pure)'}}>{t.destinationAccountId||t.DestinationAccountId||'—'}</td>
                <td style={{fontWeight:500}}>Q {fmt(t.amount||t.Amount)}</td>
                <td style={{color:'var(--muted)',fontSize:'.82rem'}}>{fmtDate(t.createdAt||t.date)}</td>
              </tr>
            ))}
            {!loadingTx && transactions.length===0 && <EmptyState text="Sin movimientos recientes"/>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── Cuentas usuario ── */
const UserAccounts = () => {
  const { user } = useAuthStore();
  const [accounts, setAccounts]     = useState([]);
  const [loading, setLoading]       = useState(true);
 
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
 
  const fmt     = (n) => Number(n||0).toLocaleString('es-GT', { minimumFractionDigits:2 });
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-GT') : '—';
 
  const activas   = accounts.filter(a => a.status === 'activa');
  const bloqueadas= accounts.filter(a => a.status === 'bloqueada');
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
      <div className="stats-grid" style={{marginBottom:'1.5rem'}}>
        {[
          { label:'Total cuentas', value: loading?'...':accounts.length,
            icon:<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/><path d="M9 22V12h6v10" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/></svg> },
          { label:'Activas', value: loading?'...':activas.length,
            icon:<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round"/><path d="M22 4L12 14.01l-3-3" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round"/></svg> },
          { label:'Bloqueadas', value: loading?'...':bloqueadas.length,
            icon:<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#e05c5c" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round"/></svg> },
          { label:'Inactivas', value: loading?'...':inactivas.length,
            icon:<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><circle cx="12" cy="12" r="10" stroke="#6b7fa3" strokeWidth="1.5"/><path d="M8 12h8" stroke="#6b7fa3" strokeWidth="1.5" strokeLinecap="round"/></svg> },
        ].map((s,i)=>(
          <div key={i} className="stat-card" style={{
            borderColor: s.label==='Bloqueadas'&&bloqueadas.length>0?'rgba(224,92,92,0.3)':undefined
          }}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-value" style={{
              color: s.label==='Bloqueadas'&&bloqueadas.length>0?'#e05c5c'
                : s.label==='Activas'&&activas.length>0?'#4caf7d' : undefined
            }}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>
 
      {/* Aviso cuentas bloqueadas */}
      {!loading && bloqueadas.length > 0 && (
        <div style={{
          background:'rgba(224,92,92,0.06)', border:'1px solid rgba(224,92,92,0.2)',
          borderRadius:12, padding:'1rem 1.25rem', marginBottom:'1.25rem',
          display:'flex', alignItems:'flex-start', gap:'.85rem'
        }}>
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18" style={{flexShrink:0,marginTop:2}}>
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="#e05c5c" strokeWidth="1.5"/>
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div>
            <p style={{fontSize:'.85rem',color:'#e05c5c',fontWeight:500,marginBottom:'.2rem'}}>
              Cuenta{bloqueadas.length>1?'s':''} bloqueada{bloqueadas.length>1?'s':''}
            </p>
            <p style={{fontSize:'.78rem',color:'rgba(224,92,92,0.8)',lineHeight:1.5}}>
              Tienes <strong>{bloqueadas.length}</strong> cuenta{bloqueadas.length>1?'s':''} bloqueada{bloqueadas.length>1?'s':''}.
              No podrás realizar operaciones con ella{bloqueadas.length>1?'s':''}. Contacta al administrador del banco para más información.
            </p>
          </div>
        </div>
      )}
 
      {/* Aviso cuentas inactivas */}
      {!loading && inactivas.length > 0 && (
        <div style={{
          background:'rgba(107,127,163,0.06)', border:'1px solid rgba(107,127,163,0.2)',
          borderRadius:12, padding:'1rem 1.25rem', marginBottom:'1.25rem',
          display:'flex', alignItems:'flex-start', gap:'.85rem'
        }}>
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18" style={{flexShrink:0,marginTop:2}}>
            <circle cx="12" cy="12" r="10" stroke="#6b7fa3" strokeWidth="1.5"/>
            <path d="M12 8v4M12 16h.01" stroke="#6b7fa3" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div>
            <p style={{fontSize:'.85rem',color:'var(--muted)',fontWeight:500,marginBottom:'.2rem'}}>
              Cuenta{inactivas.length>1?'s':''} inactiva{inactivas.length>1?'s':''}
            </p>
            <p style={{fontSize:'.78rem',color:'var(--muted)',lineHeight:1.5}}>
              Tienes <strong>{inactivas.length}</strong> cuenta{inactivas.length>1?'s':''} inactiva{inactivas.length>1?'s':''}.
              Contacta al administrador para reactivarla{inactivas.length>1?'s':''}.
            </p>
          </div>
        </div>
      )}
 
      {/* Sin cuentas */}
      {!loading && accounts.length === 0 && (
        <div style={{textAlign:'center',padding:'4rem 2rem',color:'var(--muted)'}}>
          <svg viewBox="0 0 24 24" fill="none" width="48" height="48"
            style={{opacity:.15,display:'block',margin:'0 auto 1rem'}}>
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p style={{fontSize:'.95rem',marginBottom:'.5rem'}}>No tienes cuentas asignadas</p>
          <p style={{fontSize:'.82rem'}}>Contacta al administrador para crear tu cuenta bancaria.</p>
        </div>
      )}
 
      {/* Tarjetas de cuentas */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:'1.25rem'}}>
        {loading ? [1,2].map(i=>(
          <div key={i} className="stat-card">
            <div className="skeleton" style={{height:130}}/>
          </div>
        )) : accounts.map((a,i) => {
          const st        = (a.status||'').toLowerCase();
          const isBlocked = st === 'bloqueada';
          const isInactive= st === 'inactiva';
          const borderColor = isBlocked  ? 'rgba(224,92,92,0.3)'
            : isInactive ? 'rgba(107,127,163,0.2)'
            : 'rgba(200,169,81,0.18)';
          const glowColor = isBlocked ? 'rgba(224,92,92,0.05)' : 'rgba(200,169,81,0.06)';
 
          return (
            <div key={i} style={{
              background:'linear-gradient(135deg,rgba(15,30,53,0.95),rgba(22,40,71,0.85))',
              border:`1px solid ${borderColor}`,
              borderRadius:16, padding:'1.5rem',
              position:'relative', overflow:'hidden',
              opacity: isInactive ? 0.75 : 1,
            }}>
              {/* Orbe */}
              <div style={{position:'absolute',top:-20,right:-20,width:120,height:120,
                background:`radial-gradient(circle,${glowColor} 0%,transparent 70%)`,
                borderRadius:'50%'}}/>
 
              {/* Header */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem'}}>
                <div>
                  <p style={{fontSize:'.68rem',textTransform:'uppercase',letterSpacing:'.1em',color:'var(--muted)',fontWeight:600,marginBottom:'.2rem'}}>
                    {a.accountType||'Cuenta'}
                  </p>
                  <p style={{fontFamily:'monospace',color:'var(--gold-pure)',fontSize:'.82rem'}}>
                    {a.accountNumber||'—'}
                  </p>
                </div>
                <span style={{
                  padding:'.2rem .7rem',borderRadius:20,fontSize:'.68rem',fontWeight:500,
                  background: isBlocked?'rgba(224,92,92,0.12)':isInactive?'rgba(107,127,163,0.1)':'rgba(76,175,125,0.12)',
                  border:`1px solid ${isBlocked?'rgba(224,92,92,0.25)':isInactive?'rgba(107,127,163,0.2)':'rgba(76,175,125,0.25)'}`,
                  color: isBlocked?'#e05c5c':isInactive?'var(--muted)':'#4caf7d',
                }}>
                  {a.status||'activa'}
                </span>
              </div>
 
              {/* Balance */}
              <p style={{
                fontFamily:"'Cormorant Garamond',serif",
                fontSize:'2rem',fontWeight:600,lineHeight:1,marginBottom:'.75rem',
                color: isBlocked?'var(--muted)':'var(--white)',
              }}>
                {a.currencyCode||'Q'} {fmt(a.balance)}
              </p>
 
              {/* Footer info */}
              <div style={{display:'flex',justifyContent:'space-between',paddingTop:'.75rem',borderTop:`1px solid ${borderColor}`}}>
                <div>
                  <p style={{fontSize:'.62rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.06em'}}>Apertura</p>
                  <p style={{fontSize:'.78rem',color:'var(--white)',marginTop:'.15rem'}}>{fmtDate(a.openingDate||a.createdAt)}</p>
                </div>
                <div style={{textAlign:'right'}}>
                  <p style={{fontSize:'.62rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.06em'}}>Límite diario</p>
                  <p style={{fontSize:'.78rem',color:'var(--white)',marginTop:'.15rem'}}>Q {fmt(a.dailyWithdrawalLimit||0)}</p>
                </div>
              </div>
 
              {/* Banner bloqueada */}
              {isBlocked && (
                <div style={{
                  marginTop:'.85rem',padding:'.6rem .85rem',
                  background:'rgba(224,92,92,0.1)',borderRadius:8,
                  display:'flex',alignItems:'center',gap:'.5rem'
                }}>
                  <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="#e05c5c" strokeWidth="1.5"/>
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p style={{fontSize:'.72rem',color:'#e05c5c',margin:0}}>
                    Cuenta bloqueada — contacta al banco
                  </p>
                </div>
              )}
 
              {/* Banner inactiva */}
              {isInactive && (
                <div style={{
                  marginTop:'.85rem',padding:'.6rem .85rem',
                  background:'rgba(107,127,163,0.08)',borderRadius:8,
                  display:'flex',alignItems:'center',gap:'.5rem'
                }}>
                  <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                    <circle cx="12" cy="12" r="10" stroke="#6b7fa3" strokeWidth="1.5"/>
                    <path d="M8 12h8" stroke="#6b7fa3" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p style={{fontSize:'.72rem',color:'var(--muted)',margin:0}}>
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
  const [cards, setCards]     = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCards = () => {
    setLoading(true);
    const token = JSON.parse(localStorage.getItem('bancario-auth'))?.state?.token;
    fetch(`http://localhost:3006/api/v1/cards/my?_t=${Date.now()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setCards(Array.isArray(d?.data) ? d.data : []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCards(); }, []);

  const activas    = cards.filter(c => c.status === 'activa');
  const bloqueadas = cards.filter(c => c.status === 'bloqueada');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mis Tarjetas</h1>
          <p className="page-subtitle">Tus tarjetas de crédito y débito</p>
        </div>
        <button className="btn-secondary" onClick={loadCards}>
          <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
            <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{marginBottom:'1.5rem'}}>
        {[
          { label:'Total tarjetas', value: loading?'...':cards.length },
          { label:'Activas',        value: loading?'...':activas.length },
          { label:'Bloqueadas',     value: loading?'...':bloqueadas.length },
          { label:'Balance total',  value: loading?'...':'Q '+fmt(activas.reduce((s,c)=>s+Number(c.availableBalance||0),0)) },
        ].map((s,i)=>(
          <div key={i} className="stat-card">
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tarjetas */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'1.25rem'}}>
        {loading ? [1,2].map(i=>(
          <div key={i} className="stat-card">
            <div className="skeleton" style={{height:140}}/>
          </div>
        )) : cards.map((c,i) => {
          const isBlocked = c.status === 'bloqueada';
          const isCredit  = c.cardType === 'credito';
          return (
            <div key={i} style={{
              background: isBlocked
                ? 'linear-gradient(135deg,rgba(80,20,20,0.7),rgba(100,30,30,0.6))'
                : isCredit
                ? 'linear-gradient(135deg,rgba(20,60,40,0.9),rgba(10,80,50,0.8))'
                : 'linear-gradient(135deg,rgba(10,20,70,0.95),rgba(5,15,55,0.9))',
              border:`1px solid ${isBlocked?'rgba(224,92,92,0.25)':'rgba(200,169,81,0.2)'}`,
              borderRadius:16, padding:'1.5rem',
              position:'relative', overflow:'hidden', minHeight:180,
              display:'flex', flexDirection:'column', justifyContent:'space-between',
            }}>
              <div style={{position:'absolute',top:-20,right:-20,width:120,height:120,
                background:`radial-gradient(circle,${isBlocked?'rgba(224,92,92,0.06)':'rgba(200,169,81,0.06)'} 0%,transparent 70%)`,
                borderRadius:'50%'}}/>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <p style={{fontSize:'.68rem',textTransform:'uppercase',letterSpacing:'.12em',color:'rgba(255,255,255,0.45)',marginBottom:'.2rem'}}>
                    {isCredit?'Crédito':'Débito'} · {c.franchise||'—'}
                  </p>
                  <p style={{fontFamily:'monospace',color:'rgba(255,255,255,0.7)',fontSize:'.85rem'}}>
                    {c.cardNumber ? `···· ${c.cardNumber.slice(-4)}` : '—'}
                  </p>
                </div>
                <Badge value={c.status||'activa'}/>
              </div>

              <p style={{
                fontFamily:"'Cormorant Garamond',serif",
                fontSize:'1.8rem', fontWeight:600,
                color: isBlocked?'rgba(255,255,255,0.4)':'rgba(255,255,255,0.95)',
                margin:'.75rem 0',
              }}>
                Q {fmt(c.availableBalance)}
              </p>

              <div style={{display:'flex',justifyContent:'space-between',paddingTop:'.75rem',
                borderTop:`1px solid ${isBlocked?'rgba(224,92,92,0.15)':'rgba(255,255,255,0.08)'}`}}>
                <div>
                  <p style={{fontSize:'.6rem',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',letterSpacing:'.08em'}}>Vence</p>
                  <p style={{fontSize:'.8rem',color:'rgba(255,255,255,0.7)',marginTop:'.1rem'}}>{fmtDate(c.expirationDate)}</p>
                </div>
                {isCredit && c.creditLimit && (
                  <div style={{textAlign:'right'}}>
                    <p style={{fontSize:'.6rem',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',letterSpacing:'.08em'}}>Límite</p>
                    <p style={{fontSize:'.8rem',color:'rgba(255,255,255,0.7)',marginTop:'.1rem'}}>Q {fmt(c.creditLimit)}</p>
                  </div>
                )}
                <div style={{textAlign:'right'}}>
                  <p style={{fontSize:'.6rem',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',letterSpacing:'.08em'}}>CVV</p>
                  <p style={{fontSize:'.82rem',color:'rgba(255,255,255,0.6)',marginTop:'.1rem'}}>•••</p>
                </div>
              </div>

              {isBlocked && (
                <div style={{marginTop:'.75rem',padding:'.5rem .75rem',background:'rgba(224,92,92,0.1)',borderRadius:8,display:'flex',alignItems:'center',gap:'.5rem'}}>
                  <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="#e05c5c" strokeWidth="1.5"/>
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p style={{fontSize:'.72rem',color:'#e05c5c'}}>Tarjeta bloqueada — contacta al banco</p>
                </div>
              )}
            </div>
          );
        })}

        {!loading && cards.length === 0 && (
          <div style={{gridColumn:'1/-1',textAlign:'center',padding:'3rem',color:'var(--muted)'}}>
            <svg viewBox="0 0 24 24" fill="none" width="40" height="40"
              style={{opacity:.12,display:'block',margin:'0 auto 1rem'}}>
              <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p>No tienes tarjetas asignadas.</p>
            <p style={{fontSize:'.82rem',marginTop:'.5rem'}}>Contacta al administrador para solicitar una tarjeta.</p>
          </div>
        )}
      </div>
    </div>
  );
};
/* ── Transferencias usuario ── */
const UserTransactions = () => {
  const { user }              = useAuthStore();
  const [data, setData]       = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [tab, setTab]         = useState('all'); // 'all' | 'favorites'
  const [saving, setSaving]   = useState(false);
  const [myAccounts, setMyAccounts] = useState([]);
  const [form, setForm]       = useState({
    sourceAccountId:      '',
    destinationAccountId: '',
    transactionType:      'transferencia',
    amount:               '',
    currencyId:           'GTQ',
    description:          '',
    favorito:             false,
    alias:                '',
  });

  const loadData = () => {
    setLoading(true);
    const token = JSON.parse(localStorage.getItem('bancario-auth'))?.state?.token;

    // Transacciones del usuario — usa fetch directo para evitar 403 silencioso
    fetch(`http://localhost:3006/api/v1/transaction/my?_t=${Date.now()}`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(d => setData(Array.isArray(d?.data) ? d.data : []))
  .catch(() => setData([]))
  .finally(() => setLoading(false));

    // Favoritos
    getFavorites()
      .then(res => setFavorites(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(() => setFavorites([]));

    // Cuentas activas del usuario para el selector
    if (user?.id) {
      getAccountsByUser(user.id)
        .then(res => {
          const d = res.data?.data || res.data || [];
          setMyAccounts(Array.isArray(d) ? d.filter(a=>a.status==='activa') : []);
        })
        .catch(() => setMyAccounts([]));
    }
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const handleCreate = async () => {
    if (!form.sourceAccountId)      { showError('La cuenta origen es obligatoria'); return; }
    if (!form.destinationAccountId) { showError('La cuenta destino es obligatoria'); return; }
    if (form.sourceAccountId === form.destinationAccountId) { showError('Las cuentas no pueden ser iguales'); return; }
    if (!form.amount || Number(form.amount) <= 0) { showError('El monto debe ser mayor a 0'); return; }
    if (Number(form.amount) > 2000) { showError('El máximo por transferencia es Q 2,000.00'); return; }

    setSaving(true);
    try {
      await createTransaction({
        sourceAccountId:      form.sourceAccountId,
        destinationAccountId: form.destinationAccountId,
        transactionType:      form.transactionType,
        amount:               Number(form.amount),
        currencyId:           form.currencyId,
        description:          form.description,
        favorito:             form.favorito,
        alias:                form.favorito ? form.alias : '',
        userId:               user?.id,
      });
      showSuccess('Transferencia realizada exitosamente');
      setModal(false);
      setForm({ sourceAccountId:'', destinationAccountId:'', transactionType:'transferencia', amount:'', currencyId:'GTQ', description:'', favorito:false, alias:'' });
      loadData();
    } catch(e) {
      showError(e?.response?.data?.error || e?.response?.data?.message || 'Error al realizar la transferencia');
    } finally { setSaving(false); }
  };

  const useFavorite = (fav) => {
    setForm(p => ({ ...p, destinationAccountId: fav.accountNumber, alias: fav.alias||'' }));
    setModal(true);
  };

  const TabBtn = ({ k, label, count }) => (
    <button onClick={()=>setTab(k)} style={{
      padding:'.75rem 1.1rem', fontSize:'.82rem',
      color: tab===k ? 'var(--gold-pure)' : 'var(--muted)',
      cursor:'pointer', background:'none', border:'none',
      borderBottom:`2px solid ${tab===k?'var(--gold-pure)':'transparent'}`,
      fontFamily:"'Outfit',sans-serif", transition:'all .2s',
      display:'flex', alignItems:'center', gap:'.4rem',
    }}>
      {label}
      {count > 0 && (
        <span style={{padding:'.1rem .45rem',borderRadius:20,fontSize:'.68rem',fontWeight:700,background:'rgba(200,169,81,0.15)',color:'var(--gold-pure)',border:'1px solid rgba(200,169,81,0.2)'}}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Transferencias</h1><p className="page-subtitle">Historial de movimientos y transferencias</p></div>
        <button className="btn-add" onClick={()=>setModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Nueva transferencia
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{marginBottom:'1.25rem'}}>
        {[
          { label:'Total transferencias', value: loading?'...':data.length },
          { label:'Monto total', value: loading?'...':'Q '+fmt(data.reduce((s,t)=>s+Number(t.amount||0),0)) },
          { label:'Favoritos guardados', value: favorites.length },
          { label:'Cuentas activas', value: myAccounts.length },
        ].map((s,i)=>(
          <div key={i} className="stat-card">
            <div className="stat-card-value" style={{fontSize:'1.2rem'}}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="table-card">
        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'1px solid rgba(200,169,81,0.08)',padding:'0 1.5rem'}}>
          <TabBtn k="all"       label="Mis transferencias" count={data.length}/>
          <TabBtn k="favorites" label="Favoritos"           count={favorites.length}/>
        </div>

        {/* Tabla transferencias */}
        {tab === 'all' && (
          <>
            <div className="table-header">
              <span className="table-title">Historial ({data.length})</span>
              <button className="btn-secondary" onClick={loadData}>
                <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                  <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Actualizar
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Tipo</th><th>Origen</th><th>Destino</th><th>Monto</th><th>Descripción</th><th>Fav</th><th>Fecha</th></tr>
              </thead>
              <tbody>
                {loading ? <LoadingRows cols={7}/> : data.map((t,i)=>(
                  <tr key={t._id||i}>
                    <td><Badge value={t.transactionType||t.TransactionType}/></td>
                    <td style={{fontFamily:'monospace',fontSize:'.82rem',color:'var(--gold-pure)'}}>{t.sourceAccountNumber||t.sourceAccountId||'—'}</td>
                    <td style={{fontFamily:'monospace',fontSize:'.82rem',color:'var(--gold-pure)'}}>{t.destinationAccountNumber||t.destinationAccountId||'—'}</td>
                    <td style={{fontWeight:500,color:'var(--white)'}}>Q {fmt(t.amount||t.Amount)}</td>
                    <td style={{color:'var(--muted)',fontSize:'.82rem',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.description||'—'}</td>
                    <td style={{textAlign:'center'}}>{t.favorito ? <span style={{color:'#eab308'}}>★</span> : <span style={{color:'var(--muted)',fontSize:'.75rem'}}>—</span>}</td>
                    <td style={{color:'var(--muted)',fontSize:'.82rem'}}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString('es-GT') : '—'}</td>
                  </tr>
                ))}
                {!loading && data.length===0 && <EmptyState text="Sin transferencias realizadas"/>}
              </tbody>
            </table>
          </>
        )}

        {/* Favoritos */}
        {tab === 'favorites' && (
          <>
            <div className="table-header">
              <span className="table-title">Cuentas favoritas ({favorites.length})</span>
            </div>
            {favorites.length === 0 ? (
              <div style={{padding:'3rem',textAlign:'center',color:'var(--muted)'}}>
                <span style={{fontSize:'2rem',display:'block',marginBottom:'1rem',opacity:.3}}>★</span>
                <p>No tienes cuentas favoritas aún.</p>
                <p style={{fontSize:'.82rem',marginTop:'.5rem'}}>Al crear una transferencia marca la cuenta como favorita para encontrarla aquí.</p>
              </div>
            ) : (
              <div style={{padding:'1.25rem',display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'1rem'}}>
                {favorites.map((f,i)=>(
                  <div key={i} style={{
                    background:'rgba(200,169,81,0.05)',
                    border:'1px solid rgba(200,169,81,0.15)',
                    borderRadius:12, padding:'1.25rem',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                  }}>
                    <div>
                      <p style={{fontSize:'.75rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'.25rem'}}>
                        {f.alias || 'Sin alias'}
                      </p>
                      <p style={{fontFamily:'monospace',color:'var(--gold-pure)',fontSize:'.88rem'}}>{f.accountNumber}</p>
                      {f.name && <p style={{fontSize:'.78rem',color:'var(--muted)',marginTop:'.15rem'}}>{f.name}</p>}
                    </div>
                    <button
                      onClick={()=>useFavorite(f)}
                      style={{
                        padding:'.5rem .85rem',background:'linear-gradient(135deg,#b8942e,#c8a951)',
                        color:'#060810',border:'none',borderRadius:8,
                        fontFamily:"'Outfit',sans-serif",fontSize:'.78rem',fontWeight:600,
                        cursor:'pointer',whiteSpace:'nowrap',
                      }}
                    >
                      Transferir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal nueva transferencia */}
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Nueva Transferencia</span>
              <button className="modal-close" onClick={()=>setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Selector cuenta origen */}
              <div className="modal-field">
                <label className="modal-label">Cuenta origen *</label>
                <select className="modal-select" value={form.sourceAccountId}
                  onChange={e=>setForm(p=>({...p,sourceAccountId:e.target.value}))}>
                  <option value="">Selecciona tu cuenta</option>
                  {myAccounts.map(a=>(
                    <option key={a.accountNumber} value={a.accountNumber}>
                      {a.accountNumber} — Q {fmt(a.balance)} ({a.accountType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-field">
                <label className="modal-label">Cuenta destino *</label>
                <input className="modal-input" placeholder="ACC-000-0000"
                  value={form.destinationAccountId}
                  onChange={e=>setForm(p=>({...p,destinationAccountId:e.target.value.toUpperCase()}))}/>
              </div>

              <div className="modal-fields-row">
                <div className="modal-field">
                  <label className="modal-label">Tipo</label>
                  <select className="modal-select" value={form.transactionType}
                    onChange={e=>setForm(p=>({...p,transactionType:e.target.value}))}>
                    <option value="transferencia">Transferencia</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>
                <div className="modal-field">
                  <label className="modal-label">Moneda</label>
                  <select className="modal-select" value={form.currencyId}
                    onChange={e=>setForm(p=>({...p,currencyId:e.target.value}))}>
                    <option value="GTQ">GTQ — Quetzal</option>
                    <option value="USD">USD — Dólar</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                </div>
              </div>

              <div className="modal-field">
                <label className="modal-label">Monto * (máximo Q 2,000.00)</label>
                <input className="modal-input" type="number" placeholder="0.00"
                  value={form.amount}
                  onChange={e=>setForm(p=>({...p,amount:e.target.value}))}/>
                {form.sourceAccountId && (
                  <p style={{fontSize:'.75rem',color:'var(--muted)',marginTop:'.35rem'}}>
                    Balance disponible: Q {fmt(myAccounts.find(a=>a.accountNumber===form.sourceAccountId)?.balance||0)}
                  </p>
                )}
              </div>

              <div className="modal-field">
                <label className="modal-label">Descripción</label>
                <input className="modal-input" placeholder="Descripción opcional"
                  value={form.description}
                  onChange={e=>setForm(p=>({...p,description:e.target.value}))}/>
              </div>

              {/* Favorito */}
              <div style={{display:'flex',alignItems:'center',gap:'.75rem',padding:'.85rem',background:'rgba(234,179,8,0.05)',border:'1px solid rgba(234,179,8,0.15)',borderRadius:8}}>
                <input type="checkbox" id="fav-check"
                  checked={form.favorito}
                  onChange={e=>setForm(p=>({...p,favorito:e.target.checked}))}
                  style={{width:16,height:16,cursor:'pointer'}}/>
                <label htmlFor="fav-check" style={{fontSize:'.82rem',color:'rgba(234,179,8,0.8)',cursor:'pointer'}}>
                  ★ Guardar como cuenta favorita
                </label>
              </div>

              {form.favorito && (
                <div className="modal-field" style={{marginTop:'.5rem'}}>
                  <label className="modal-label">Alias para esta cuenta (opcional)</label>
                  <input className="modal-input" placeholder="Ej: Cuenta de Juan"
                    value={form.alias}
                    onChange={e=>setForm(p=>({...p,alias:e.target.value}))}/>
                </div>
              )}

              {/* Límites */}
              <div style={{background:'rgba(107,127,163,0.06)',border:'1px solid rgba(107,127,163,0.15)',borderRadius:8,padding:'.85rem 1rem',fontSize:'.78rem',color:'var(--muted)',lineHeight:1.6}}>
                ℹ️ Límites: máximo <strong>Q 2,000</strong> por operación · máximo <strong>Q 10,000</strong> diarios
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleCreate} disabled={saving}>
                {saving ? <span className="spin"/> : 'Confirmar transferencia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
/* ── Préstamos usuario ── */
const UserLoans = () => {
  const { user }          = useAuthStore();
  const [data, setData]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [myAccounts, setMyAccounts] = useState([]);
  const [form, setForm]   = useState({
    accountNumber:'', requestedAmount:'', loanPurpose:'',
  });

  const fmt     = (n) => n != null ? Number(n).toLocaleString('es-GT',{minimumFractionDigits:2}) : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-GT') : '—';

  const loadData = () => {
  setLoading(true);
  const token = JSON.parse(localStorage.getItem('bancario-auth'))?.state?.token;
  fetch(`http://localhost:3006/api/v1/loan/my?_t=${Date.now()}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(d => setData(Array.isArray(d?.data) ? d.data : []))
    .catch(() => setData([]))
    .finally(() => setLoading(false));

  if (user?.id) {
    getAccountsByUser(user.id)
      .then(res => {
        const d = res.data?.data || res.data || [];
        setMyAccounts(Array.isArray(d) ? d.filter(a=>a.status==='activa') : []);
      })
      .catch(() => setMyAccounts([]));
  }
};

  useEffect(() => { loadData(); }, [user?.id]);

  const handleSolicitar = async () => {
  if (!form.accountNumber)   { showError('Selecciona una cuenta'); return; }
  if (!form.requestedAmount || Number(form.requestedAmount) <= 0) { showError('El monto es obligatorio'); return; }
  if (!form.loanPurpose)     { showError('El motivo del préstamo es obligatorio'); return; }
  setSaving(true);
  try {
    await createLoan({
      userId:          user?.id,
      accountNumber:   form.accountNumber,
      requestedAmount: Number(form.requestedAmount),
      loanPurpose:     form.loanPurpose,
      status:          'solicitado',
      requestDate:     new Date().toISOString(),
      termMonths:      12,    // valor por defecto — el admin lo ajusta
      interestRate:    0,     // el admin define la tasa real
      monthlyPayment:  0,
      outstandingBalance: Number(form.requestedAmount),
    });
    showSuccess('Solicitud de préstamo enviada exitosamente');
    setModal(false);
    setForm({ accountNumber:'', requestedAmount:'', loanPurpose:'' });
    loadData();
  } catch(e) {
    console.log('ERRORS:', JSON.stringify(e?.response?.data?.errors));
    showError(e?.response?.data?.message || 'Error al solicitar el préstamo');
  } finally { setSaving(false); }
};
  const statusColors = {
    solicitado:  '#eab308',
    aprobado:    '#4caf7d',
    rechazado:   '#e05c5c',
    desembolsado:'#6366f1',
    pagado:      '#c8a951',
    vencido:     '#ef4444',
  };

  const activos = data.filter(l => !['pagado','rechazado'].includes(l.status));

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Mis Préstamos</h1><p className="page-subtitle">Estado de tus créditos y financiamientos</p></div>
        <button className="btn-add" onClick={()=>setModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Solicitar préstamo
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{marginBottom:'1.5rem'}}>
        {[
          { label:'Total préstamos', value: loading?'...':data.length },
          { label:'Activos',         value: loading?'...':activos.length },
          { label:'Solicitados',     value: loading?'...':data.filter(l=>l.status==='solicitado').length },
          { label:'Monto total',     value: loading?'...':'Q '+fmt(data.reduce((s,l)=>s+Number(l.requestedAmount||0),0)) },
        ].map((s,i)=>(
          <div key={i} className="stat-card">
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tarjetas de préstamos activos */}
      {!loading && activos.length > 0 && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:'1.25rem',marginBottom:'1.5rem'}}>
          {activos.map((l,i) => {
            const color = statusColors[l.status] || '#c8a951';
            const progreso = l.approvedAmount && l.outstandingBalance
              ? Math.max(0, Math.min(100, ((l.approvedAmount - l.outstandingBalance) / l.approvedAmount) * 100))
              : 0;
            return (
              <div key={i} style={{
                background:'linear-gradient(135deg,rgba(15,30,53,0.95),rgba(22,40,71,0.85))',
                border:`1px solid rgba(200,169,81,0.15)`,
                borderRadius:16, padding:'1.5rem',
                position:'relative', overflow:'hidden',
              }}>
                <div style={{position:'absolute',top:-20,right:-20,width:100,height:100,
                  background:'radial-gradient(circle,rgba(200,169,81,0.06) 0%,transparent 70%)',borderRadius:'50%'}}/>

                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem'}}>
                  <div>
                    <p style={{fontSize:'.68rem',textTransform:'uppercase',letterSpacing:'.1em',color:'var(--muted)',marginBottom:'.2rem'}}>Préstamo</p>
                    <p style={{fontFamily:'monospace',color:'var(--gold-pure)',fontSize:'.82rem'}}>{l.accountNumber||'—'}</p>
                  </div>
                  <span style={{padding:'.2rem .65rem',borderRadius:20,fontSize:'.7rem',fontWeight:600,background:`${color}18`,border:`1px solid ${color}40`,color}}>
                    {l.status}
                  </span>
                </div>

                <div style={{marginBottom:'1rem'}}>
                  <p style={{fontSize:'.62rem',textTransform:'uppercase',color:'var(--muted)',letterSpacing:'.08em',marginBottom:'.25rem'}}>Monto aprobado</p>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.6rem',fontWeight:600,color:'var(--white)'}}>
                    Q {fmt(l.approvedAmount||l.requestedAmount)}
                  </p>
                </div>

                {/* Barra de progreso */}
                {l.approvedAmount > 0 && (
                  <div style={{marginBottom:'1rem'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'.7rem',color:'var(--muted)',marginBottom:'.3rem'}}>
                      <span>Pagado</span>
                      <span>{Math.round(progreso)}%</span>
                    </div>
                    <div style={{height:4,borderRadius:2,background:'rgba(255,255,255,0.08)'}}>
                      <div style={{height:'100%',borderRadius:2,background:'linear-gradient(90deg,#4caf7d,#c8a951)',width:`${progreso}%`,transition:'width .3s'}}/>
                    </div>
                  </div>
                )}

                <div style={{display:'flex',justifyContent:'space-between',paddingTop:'.75rem',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                  <div>
                    <p style={{fontSize:'.6rem',textTransform:'uppercase',color:'var(--muted)',letterSpacing:'.06em'}}>Cuota mensual</p>
                    <p style={{fontSize:'.85rem',color:'var(--white)',fontWeight:500,marginTop:'.1rem'}}>Q {fmt(l.monthlyPayment||0)}</p>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <p style={{fontSize:'.6rem',textTransform:'uppercase',color:'var(--muted)',letterSpacing:'.06em'}}>Plazo</p>
                    <p style={{fontSize:'.85rem',color:'var(--white)',marginTop:'.1rem'}}>{l.termMonths||'—'} meses</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabla historial */}
      <div className="table-card">
        <div className="table-header"><span className="table-title">Historial de préstamos ({data.length})</span></div>
        <table className="data-table">
          <thead>
            <tr><th>Cuenta</th><th>Solicitado</th><th>Aprobado</th><th>Tasa</th><th>Plazo</th><th>Cuota</th><th>Estado</th><th>Fecha</th></tr>
          </thead>
          <tbody>
            {loading ? <LoadingRows cols={8}/> : data.map((l,i) => {
              const color = statusColors[l.status] || '#c8a951';
              return (
                <tr key={l._id||i}>
                  <td style={{fontFamily:'monospace',color:'var(--gold-pure)',fontSize:'.82rem'}}>{l.accountNumber||'—'}</td>
                  <td>Q {fmt(l.requestedAmount)}</td>
                  <td style={{color:'#4caf7d',fontWeight:500}}>Q {fmt(l.approvedAmount||0)}</td>
                  <td style={{color:'var(--muted)'}}>{l.interestRate||'—'}%</td>
                  <td style={{color:'var(--muted)'}}>{l.termMonths||'—'} m</td>
                  <td>Q {fmt(l.monthlyPayment||0)}</td>
                  <td>
                    <span style={{padding:'.2rem .6rem',borderRadius:20,fontSize:'.7rem',fontWeight:600,background:`${color}18`,border:`1px solid ${color}40`,color}}>
                      {l.status}
                    </span>
                  </td>
                  <td style={{color:'var(--muted)',fontSize:'.82rem'}}>{fmtDate(l.requestDate||l.createdAt)}</td>
                </tr>
              );
            })}
            {!loading && data.length===0 && <EmptyState text="Sin préstamos registrados"/>}
          </tbody>
        </table>
      </div>

      {/* Modal solicitar */}
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Solicitar Préstamo</span>
              <button className="modal-close" onClick={()=>setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Cuenta para desembolso *</label>
                <select className="modal-select" value={form.accountNumber}
                  onChange={e=>setForm(p=>({...p,accountNumber:e.target.value}))}>
                  <option value="">Selecciona una cuenta</option>
                  {myAccounts.map(a=>(
                    <option key={a.accountNumber} value={a.accountNumber}>
                      {a.accountNumber} — Q {fmt(a.balance)} ({a.accountType})
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-field">
                <label className="modal-label">Monto solicitado (Q) *</label>
                <input className="modal-input" type="number" placeholder="10000"
                  value={form.requestedAmount}
                  onChange={e=>setForm(p=>({...p,requestedAmount:e.target.value}))}/>
              </div>
              <div className="modal-field">
                <label className="modal-label">Motivo del préstamo *</label>
                <input className="modal-input" placeholder="¿Para qué necesitas el préstamo?"
                  value={form.loanPurpose}
                  onChange={e=>setForm(p=>({...p,loanPurpose:e.target.value}))}/>
              </div>
              <div style={{background:'rgba(200,169,81,0.05)',border:'1px solid rgba(200,169,81,0.12)',borderRadius:8,padding:'.85rem 1rem',fontSize:'.78rem',color:'rgba(200,169,81,0.8)',lineHeight:1.5}}>
                ℹ️ Tu solicitud será revisada por un administrador. El monto aprobado, tasa de interés y plazo serán determinados por el banco.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleSolicitar} disabled={saving}>
                {saving?<span className="spin"/>:'Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
/* ── Depósitos usuario ── */
const UserDeposits = () => {
  const { user } = useAuthStore();
  const [deposits, setDeposits]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [saving, setSaving]         = useState(false);
  const [myAccounts, setMyAccounts] = useState([]);
  const [form, setForm]             = useState({
    accountNumber:'', amount:'', currencyCode:'GTQ', description:'',
  });

  const fmt     = (n) => Number(n||0).toLocaleString('es-GT',{minimumFractionDigits:2});
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-GT') : '—';

  const loadData = () => {
    setLoading(true);
    // Carga cuentas del usuario para el selector
    if (user?.id) {
      getAccountsByUser(user.id)
        .then(res => {
          const d = res.data?.data || res.data || [];
          setMyAccounts(Array.isArray(d) ? d : []);
        })
        .catch(() => setMyAccounts([]));
    }
    // Carga depósitos
    getDeposits('limit=100&status=exitosa')
      .then(res => {
        const d = res.data?.data || res.data || [];
        const all = Array.isArray(d) ? d : [];
        // Filtra solo los depósitos de las cuentas del usuario
        setDeposits(all);
      })
      .catch(() => setDeposits([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const handleCreate = async () => {
    if (!form.accountNumber) { showError('Selecciona una cuenta'); return; }
    if (!form.amount || Number(form.amount) <= 0) { showError('El monto debe ser mayor a 0'); return; }
    setSaving(true);
    try {
      await createDeposit({
        accountNumber:    form.accountNumber,
        amount:           Number(form.amount),
        currencyCode:     form.currencyCode,
        description:      form.description,
        executedByUserId: user?.id,
      });
      showSuccess('Depósito realizado exitosamente');
      setModal(false);
      setForm({ accountNumber:'', amount:'', currencyCode:'GTQ', description:'' });
      loadData();
    } catch(e) {
      showError(e?.response?.data?.message || 'Error al realizar el depósito');
    } finally { setSaving(false); }
  };

  const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Depósitos</h1>
          <p className="page-subtitle">Historial de depósitos en tus cuentas</p>
        </div>
        <button className="btn-add" onClick={()=>setModal(true)}>
          <PlusIcon/> Nuevo depósito
        </button>
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Mis depósitos ({deposits.length})</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>N° Cuenta</th>
              <th>Monto</th>
              <th>Balance anterior</th>
              <th>Balance nuevo</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <LoadingRows cols={7}/> : deposits.length === 0 ? (
              <EmptyState text="Sin depósitos realizados"/>
            ) : deposits.map((d,i)=>(
              <tr key={d._id||i}>
                <td style={{fontFamily:'monospace',color:'var(--gold-pure)',fontSize:'.85rem'}}>{d.accountNumber||'—'}</td>
                <td style={{fontWeight:500,color:'var(--white)'}}>Q {fmt(d.amount)}</td>
                <td style={{color:'var(--muted)',fontSize:'.82rem'}}>Q {fmt(d.previousBalance)}</td>
                <td style={{color:'#4caf7d',fontWeight:500}}>Q {fmt(d.newBalance)}</td>
                <td style={{color:'var(--muted)',fontSize:'.82rem'}}>{d.description||'—'}</td>
                <td><Badge value={d.status||'exitosa'}/></td>
                <td style={{color:'var(--muted)',fontSize:'.82rem'}}>{fmtDate(d.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nuevo depósito */}
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Nuevo Depósito</span>
              <button className="modal-close" onClick={()=>setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Cuenta a depositar *</label>
                <select className="modal-select" value={form.accountNumber}
                  onChange={e=>setForm(p=>({...p,accountNumber:e.target.value}))}>
                  <option value="">Selecciona una cuenta</option>
                  {myAccounts
                    .filter(a => a.status === 'activa')
                    .map(a=>(
                      <option key={a.accountNumber} value={a.accountNumber}>
                        {a.accountNumber} — Q {fmt(a.balance)} ({a.accountType})
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="modal-fields-row">
                <div className="modal-field">
                  <label className="modal-label">Monto *</label>
                  <input className="modal-input" type="number" placeholder="0.00"
                    value={form.amount}
                    onChange={e=>setForm(p=>({...p,amount:e.target.value}))}/>
                </div>
                <div className="modal-field">
                  <label className="modal-label">Moneda</label>
                  <select className="modal-select" value={form.currencyCode}
                    onChange={e=>setForm(p=>({...p,currencyCode:e.target.value}))}>
                    <option value="GTQ">GTQ — Quetzal</option>
                    <option value="USD">USD — Dólar</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                </div>
              </div>

              <div className="modal-field">
                <label className="modal-label">Descripción</label>
                <input className="modal-input" placeholder="Motivo del depósito"
                  value={form.description}
                  onChange={e=>setForm(p=>({...p,description:e.target.value}))}/>
              </div>

              <div style={{background:'rgba(200,169,81,0.05)',border:'1px solid rgba(200,169,81,0.12)',borderRadius:8,padding:'.85rem 1rem',fontSize:'.78rem',color:'rgba(200,169,81,0.8)',lineHeight:1.5}}>
                ℹ️ El depósito acredita fondos externos a tu cuenta. Para mover dinero entre tus cuentas usa <strong>Transferencias</strong>.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleCreate} disabled={saving}>
                {saving ? <span className="spin"/> : 'Depositar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// RETIROSS 
const UserWithdrawals = () => {
  const { user } = useAuthStore();
  const [modal, setModal]           = useState(false);
  const [statementModal, setStatementModal] = useState(false);
  const [myAccounts, setMyAccounts] = useState([]);
  const [statement, setStatement]   = useState(null);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState({ accountNumber:'', amount:'' });

  const fmt     = (n) => Number(n||0).toLocaleString('es-GT',{minimumFractionDigits:2});
  const fmtDate = (d) => d ? new Date(d).toLocaleString('es-GT') : '—';

  useEffect(() => {
    if (!user?.id) return;
    getAccountsByUser(user.id)
      .then(res => {
        const d = res.data?.data || res.data || [];
        setMyAccounts(Array.isArray(d) ? d.filter(a => a.status === 'activa') : []);
      })
      .catch(() => setMyAccounts([]));
  }, [user?.id]);

  const handleCreate = async () => {
  if (!form.accountNumber) { showError('Selecciona una cuenta'); return; }
  if (!form.amount || Number(form.amount) <= 0) { showError('El monto debe ser mayor a 0'); return; }

  const acc = myAccounts.find(a => a.accountNumber === form.accountNumber);
  if (acc && Number(form.amount) > acc.balance) {
    showError(`Saldo insuficiente. Tu saldo es Q ${fmt(acc.balance)}`);
    return;
  }
  if (acc && Number(form.amount) > (acc.dailyWithdrawalLimit || 0)) {
    showError(`El monto supera tu límite diario de Q ${fmt(acc.dailyWithdrawalLimit)}`);
    return;
  }

  setSaving(true);
  try {
    await createWithdrawal({
      accountNumber: form.accountNumber,
      amount:        Number(form.amount),
    });
    showSuccess('Retiro realizado exitosamente');
    setModal(false);
    setForm({ accountNumber:'', amount:'' });
    // Refresca cuentas para ver nuevo balance
    if (user?.id) {
      getAccountsByUser(user.id)
        .then(res => {
          const d = res.data?.data || res.data || [];
          setMyAccounts(Array.isArray(d) ? d.filter(a => a.status === 'activa') : []);
        });
    }
  } catch(e) {
    const msg = e?.response?.data?.error || e?.response?.data?.message || 'Error al realizar el retiro';
    // Limpia el prefijo "Error: " que agrega el backend
    showError(msg.replace('Error: ', ''));
  } finally { setSaving(false); }
};

  const handleViewStatement = async (accountNumber) => {
    if (!accountNumber) { showError('Selecciona una cuenta'); return; }
    setLoadingStatement(true);
    setStatementModal(true);
    try {
      const res = await getStatement(accountNumber);
      setStatement(res.data);
    } catch(e) {
      showError(e?.response?.data?.message || 'Error al obtener el historial');
      setStatementModal(false);
    } finally { setLoadingStatement(false); }
  };

  const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Retiros</h1>
          <p className="page-subtitle">Retira fondos de tus cuentas activas</p>
        </div>
        <div style={{display:'flex',gap:'.75rem'}}>
          <button className="btn-secondary" onClick={()=>setStatementModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Estado de cuenta
          </button>
          <button className="btn-add" onClick={()=>setModal(true)}>
            <PlusIcon/> Nuevo retiro
          </button>
        </div>
      </div>

      {/* Tarjetas de cuentas con balance */}
      {myAccounts.length > 0 && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'1rem',marginBottom:'1.5rem'}}>
          {myAccounts.map((a,i) => (
            <div key={i} style={{
              background:'linear-gradient(135deg,rgba(15,30,53,0.95),rgba(22,40,71,0.85))',
              border:'1px solid rgba(200,169,81,0.15)',
              borderRadius:14, padding:'1.25rem',
              position:'relative', overflow:'hidden',
            }}>
              <div style={{position:'absolute',top:-15,right:-15,width:80,height:80,background:'radial-gradient(circle,rgba(200,169,81,0.06) 0%,transparent 70%)',borderRadius:'50%'}}/>
              <p style={{fontSize:'.68rem',textTransform:'uppercase',letterSpacing:'.1em',color:'var(--muted)',marginBottom:'.25rem'}}>{a.accountType}</p>
              <p style={{fontFamily:'monospace',color:'var(--gold-pure)',fontSize:'.82rem',marginBottom:'.5rem'}}>{a.accountNumber}</p>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.6rem',fontWeight:600,color:'var(--white)',marginBottom:'.75rem'}}>
                Q {fmt(a.balance)}
              </p>
              <div style={{display:'flex',gap:'.5rem'}}>
                <button onClick={()=>{ setForm(p=>({...p,accountNumber:a.accountNumber})); setModal(true); }}
                  style={{flex:1,padding:'.5rem',background:'linear-gradient(135deg,#b8942e,#c8a951)',color:'#060810',border:'none',borderRadius:7,fontSize:'.75rem',fontWeight:600,cursor:'pointer',fontFamily:"'Outfit',sans-serif"}}>
                  Retirar
                </button>
                <button onClick={()=>handleViewStatement(a.accountNumber)}
                  style={{flex:1,padding:'.5rem',background:'rgba(255,255,255,0.04)',color:'var(--muted)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:7,fontSize:'.75rem',cursor:'pointer',fontFamily:"'Outfit',sans-serif"}}>
                  Historial
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {myAccounts.length === 0 && (
        <div style={{textAlign:'center',padding:'3rem',color:'var(--muted)'}}>
          <svg viewBox="0 0 24 24" fill="none" width="40" height="40" style={{opacity:.15,display:'block',margin:'0 auto 1rem'}}>
            <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>No tienes cuentas activas para realizar retiros.</p>
        </div>
      )}

      {/* Modal nuevo retiro */}
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" style={{maxWidth:440}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Nuevo Retiro</span>
              <button className="modal-close" onClick={()=>setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Cuenta a retirar *</label>
                <select className="modal-select" value={form.accountNumber}
                  onChange={e=>setForm(p=>({...p,accountNumber:e.target.value}))}>
                  <option value="">Selecciona una cuenta</option>
                  {myAccounts.map(a=>(
                    <option key={a.accountNumber} value={a.accountNumber}>
                      {a.accountNumber} — Q {fmt(a.balance)} ({a.accountType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-field">
                <label className="modal-label">Monto a retirar *</label>
                <input className="modal-input" type="number" placeholder="0.00"
                  value={form.amount}
                  onChange={e=>setForm(p=>({...p,amount:e.target.value}))}/>
              </div>

              {/* Balance disponible */}
              {form.accountNumber && (() => {
  const acc = myAccounts.find(a => a.accountNumber === form.accountNumber);
  if (!acc) return null;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'.5rem'}}>
      <div style={{background:'rgba(200,169,81,0.05)',border:'1px solid rgba(200,169,81,0.12)',borderRadius:8,padding:'.85rem 1rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:'.78rem',color:'var(--muted)'}}>Balance disponible</span>
        <span style={{fontSize:'.9rem',color:'var(--gold-pure)',fontWeight:600}}>
          Q {fmt(acc.balance)}
        </span>
      </div>
      <div style={{background:'rgba(107,127,163,0.06)',border:'1px solid rgba(107,127,163,0.15)',borderRadius:8,padding:'.75rem 1rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:'.78rem',color:'var(--muted)'}}>Límite retiro diario</span>
        <span style={{fontSize:'.85rem',color:'var(--white)',fontWeight:500}}>
          Q {fmt(acc.dailyWithdrawalLimit||0)}
        </span>
      </div>
    </div>
  );
})()}

              <div style={{background:'rgba(224,92,92,0.06)',border:'1px solid rgba(224,92,92,0.15)',borderRadius:8,padding:'.85rem 1rem',display:'flex',gap:'.6rem',alignItems:'flex-start'}}>
                <svg viewBox="0 0 24 24" fill="none" width="15" height="15" style={{flexShrink:0,marginTop:1}}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M12 9v4M12 17h.01" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p style={{fontSize:'.78rem',color:'rgba(224,92,92,0.8)',lineHeight:1.5,margin:0}}>
                  El retiro está sujeto al límite diario configurado en tu cuenta. El monto se deducirá inmediatamente.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleCreate} disabled={saving}
                style={{background:'linear-gradient(135deg,#c0392b,#e05c5c)'}}>
                {saving ? <span className="spin"/> : 'Confirmar retiro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal estado de cuenta */}
      {statementModal && (
        <div className="modal-overlay" onClick={()=>{ setStatementModal(false); setStatement(null); }}>
          <div className="modal" style={{maxWidth:600}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Estado de Cuenta — Historial de Retiros</span>
              <button className="modal-close" onClick={()=>{ setStatementModal(false); setStatement(null); }}>✕</button>
            </div>
            <div className="modal-body">
              {/* Selector de cuenta */}
              {!statement && (
                <div className="modal-field">
                  <label className="modal-label">Selecciona una cuenta</label>
                  <div style={{display:'flex',gap:'.75rem'}}>
                    <select className="modal-select" id="stmt-acc">
                      <option value="">Selecciona...</option>
                      {myAccounts.map(a=>(
                        <option key={a.accountNumber} value={a.accountNumber}>
                          {a.accountNumber} ({a.accountType})
                        </option>
                      ))}
                    </select>
                    <button className="btn-add" style={{whiteSpace:'nowrap'}}
                      onClick={()=>handleViewStatement(document.getElementById('stmt-acc').value)}>
                      Ver historial
                    </button>
                  </div>
                </div>
              )}

              {loadingStatement && (
                <div style={{textAlign:'center',padding:'2rem'}}>
                  <span style={{display:'inline-block',width:32,height:32,border:'2px solid rgba(200,169,81,0.2)',borderTopColor:'var(--gold-pure)',borderRadius:'50%',animation:'spin .65s linear infinite'}}/>
                </div>
              )}

              {statement && !loadingStatement && (
                <div>
                  {/* Resumen */}
                  <div style={{background:'rgba(200,169,81,0.06)',border:'1px solid rgba(200,169,81,0.15)',borderRadius:10,padding:'1.25rem',marginBottom:'1rem'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'.5rem'}}>
                      <span style={{fontSize:'.75rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em'}}>Cuenta</span>
                      <span style={{fontFamily:'monospace',color:'var(--gold-pure)'}}>{statement.accountNumber}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <span style={{fontSize:'.75rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em'}}>Balance actual</span>
                      <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.3rem',fontWeight:600,color:'var(--white)'}}>
                        Q {fmt(statement.currentBalance)}
                      </span>
                    </div>
                  </div>

                  {/* Historial */}
                  <p style={{fontSize:'.75rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.1em',fontWeight:600,marginBottom:'.75rem'}}>
                    Historial de retiros ({statement.history?.length||0})
                  </p>

                  {statement.history?.length === 0 && (
                    <p style={{textAlign:'center',color:'var(--muted)',padding:'1.5rem',fontSize:'.9rem'}}>
                      Sin retiros registrados en esta cuenta
                    </p>
                  )}

                  <div style={{maxHeight:300,overflowY:'auto',display:'flex',flexDirection:'column',gap:'.5rem'}}>
                    {statement.history?.map((h,i)=>(
                      <div key={i} style={{
                        background:'rgba(255,255,255,0.02)',
                        border:'1px solid rgba(255,255,255,0.05)',
                        borderRadius:8, padding:'.85rem 1rem',
                        display:'flex', justifyContent:'space-between', alignItems:'center',
                      }}>
                        <div>
                          <p style={{fontSize:'.85rem',color:'var(--white)',fontWeight:500,marginBottom:'.2rem'}}>
                            Retiro de Q {fmt(h.amount)}
                          </p>
                          <p style={{fontSize:'.72rem',color:'var(--muted)'}}>{fmtDate(h.createdAt)}</p>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <p style={{fontSize:'.75rem',color:'var(--muted)',marginBottom:'.15rem'}}>
                            {h.currencyCode||'GTQ'}
                          </p>
                          <span style={{
                            padding:'.15rem .6rem',borderRadius:20,fontSize:'.68rem',
                            background:'rgba(224,92,92,0.1)',border:'1px solid rgba(224,92,92,0.2)',
                            color:'#e05c5c',fontWeight:500
                          }}>
                            -{fmt(h.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="btn-secondary" style={{marginTop:'.75rem',width:'100%',justifyContent:'center'}}
                    onClick={()=>setStatement(null)}>
                    Ver otra cuenta
                  </button>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={()=>{ setStatementModal(false); setStatement(null); }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Estado de cuenta usuario ── */





/* ══ MAIN ══ */
const USER_SECTIONS = {
  overview:UserOverview, 
  accounts:UserAccounts, 
  cards:        UserCards,  
  transactions: UserTransactions, 
  loans:        UserLoans,      
  deposits:UserDeposits,
   withdrawals:UserWithdrawals, 
   statements:UserStatements, 
   profile: ProfilePage,
};

const UserDashboard = () => {
  const [page,setPage]=useState('overview');
  const Section=USER_SECTIONS[page]||UserOverview;
  return(
    <DashboardLayout activePage={page} onNavigate={setPage} isAdmin={false}>
      <Section/>
    </DashboardLayout>
  );
};

export default UserDashboard;