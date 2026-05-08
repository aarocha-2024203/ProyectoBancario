import { useState, useEffect } from 'react';
import DashboardLayout from '../../../shared/components/layout/DashboardLayout';
import { useData } from '../../../shared/hooks/useData';
import { showSuccess, showError } from '../../../shared/utils/toast';
import {
  getAccounts, getCards, getTransactions, getLoans,
  getCoins, getAccountLocks, getServices, createCoin,
  deleteCoin, toggleCardStatus, deleteLoan, deleteAccountLock,
  createAccount, deleteAccount, createLoan,
} from '../../../shared/api/banking';
import { getUsers, changeRole } from '../../../shared/api/users';
import ProfilePage from '../../profile/ProfilePage';

/* ── helpers ── */
const fmt = (n) => n != null ? Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2 }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-GT') : '—';

const Badge = ({ value }) => {
  const v = (value || '').toLowerCase();
  const cls = v === 'activa' || v === 'active' || v === 'activo' || v === 'aprobado' ? 'badge-success'
    : v === 'bloqueada' || v === 'bloqueado' || v === 'rechazado' ? 'badge-danger'
    : v === 'pendiente' ? 'badge-warning'
    : v === 'admin_role' ? 'badge-gold'
    : 'badge-muted';
  return <span className={`badge ${cls}`}>{value || '—'}</span>;
};

const LoadingRows = ({ cols }) => (
  <>
    {[1,2,3,4].map(i => (
      <tr key={i} className="loading-rows">
        {Array(cols).fill(0).map((_, j) => (
          <td key={j}><div className="skeleton" style={{width: j===0?'60%':'80%'}} /></td>
        ))}
      </tr>
    ))}
  </>
);

const EmptyState = ({ text }) => (
  <tr><td colSpan={99}>
    <div className="empty-state">
      <div className="empty-state-icon">
        <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="empty-state-text">{text || 'Sin datos disponibles'}</p>
    </div>
  </td></tr>
);

/* ── Confirm modal ── */
const ConfirmModal = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body"><p style={{color:'var(--muted)',fontSize:'.9rem'}}>{message}</p></div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onCancel}>Cancelar</button>
          <button className="btn-save" style={{background:'linear-gradient(135deg,#c0392b,#e05c5c)',color:'#fff'}} onClick={onConfirm}>Eliminar</button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════
   SECCIÓN: Overview
══════════════════════════════════ */
const OverviewSection = () => {
  const { data: accounts, loading: la } = useData(getAccounts);
  const { data: cards,    loading: lc } = useData(getCards);
  const { data: loans,    loading: ll } = useData(getLoans);
  const { data: users,    loading: lu } = useData(getUsers);

  const stats = [
    { label:'Usuarios registrados', value: lu ? '...' : users.length, icon:<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="#c8a951" strokeWidth="1.5"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { label:'Cuentas activas', value: la ? '...' : accounts.filter(a=>a.status==='activa'||a.Status==='activa').length, icon:<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { label:'Tarjetas emitidas', value: lc ? '...' : cards.length, icon:<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="2" y="5" width="20" height="14" rx="2" stroke="#c8a951" strokeWidth="1.5"/><path d="M2 10h20" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { label:'Préstamos activos', value: ll ? '...' : loans.length, icon:<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { label:'Total en cuentas', value: la ? '...' : 'Q ' + fmt(accounts.reduce((s,a)=>s+Number(a.balance||a.Balance||0),0)), icon:<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><circle cx="12" cy="12" r="10" stroke="#c8a951" strokeWidth="1.5"/><path d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H9m0 0h5.5a1.5 1.5 0 010 3H9" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Panel General</h1><p className="page-subtitle">Resumen del sistema bancario en tiempo real</p></div>
      </div>
      <div className="stats-grid">
        {stats.map((s,i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Últimas cuentas */}
      <div className="table-card" style={{marginTop:'1.5rem'}}>
        <div className="table-header"><span className="table-title">Últimas cuentas creadas</span></div>
        <table className="data-table">
          <thead><tr><th>N° Cuenta</th><th>Tipo</th><th>Balance</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>
            {la ? <LoadingRows cols={5} /> : accounts.slice(0,6).map((a,i)=>(
              <tr key={i}>
                <td style={{fontFamily:'monospace',color:'var(--gold-pure)'}}>{a.accountNumber||a.AccountNumber||a._id||'—'}</td>
                <td><Badge value={a.accountType||a.AccountType||'—'}/></td>
                <td>Q {fmt(a.balance||a.Balance)}</td>
                <td><Badge value={a.status||a.Status}/></td>
                <td>{fmtDate(a.openingDate||a.createdAt||a.created_at)}</td>
              </tr>
            ))}
            {!la && accounts.length===0 && <EmptyState text="Sin cuentas registradas" />}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ══════════════════════════════════
   SECCIÓN: Usuarios
══════════════════════════════════ */
const UsersSection = () => {
  const { data: users, loading, reload } = useData(getUsers);
  const [search, setSearch] = useState('');
  const [changing, setChanging] = useState(null);

  const filtered = users.filter(u =>
    `${u.Name||u.name||''} ${u.Username||u.username||''} ${u.Email||u.email||''}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === 'ADMIN_ROLE' ? 'USER_ROLE' : 'ADMIN_ROLE';
    setChanging(userId);
    try {
      await changeRole(userId, newRole);
      showSuccess(`Rol cambiado a ${newRole}`);
      reload();
    } catch { showError('Error al cambiar el rol'); }
    finally { setChanging(null); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Usuarios</h1><p className="page-subtitle">Gestión de usuarios del sistema</p></div>
      </div>
      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Todos los usuarios</span>
          <div className="table-actions">
            <div className="search-input-wrap">
              <span className="search-icon"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
              <input className="search-input" placeholder="Buscar usuario..." value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
          </div>
        </div>
        <table className="data-table">
          <thead><tr><th>Nombre</th><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>
            {loading ? <LoadingRows cols={6}/> : filtered.map((u,i)=>{
              const id = u.Id||u.id||u._id;
              const role = u.UserRoles?.[0]?.Role?.Name || u.role || 'USER_ROLE';
              return (
                <tr key={i}>
                  <td><span style={{color:'var(--white)',fontWeight:500}}>{u.Name||u.name||'—'} {u.Surname||u.surname||''}</span></td>
                  <td style={{color:'var(--gold-pure)'}}>@{u.Username||u.username||'—'}</td>
                  <td style={{color:'var(--muted)',fontSize:'.82rem'}}>{u.Email||u.email||'—'}</td>
                  <td><Badge value={role}/></td>
                  <td><Badge value={u.Status||u.status ? 'Activo':'Inactivo'}/></td>
                  <td>
                    <button className="btn-icon" title="Cambiar rol" disabled={changing===id}
                      onClick={()=>handleRoleChange(id,role)}
                      style={{width:'auto',padding:'0 10px',fontSize:'0.72rem',color:'var(--gold-pure)'}}>
                      {changing===id ? <span className="spin"/> : role==='ADMIN_ROLE'?'→ User':'→ Admin'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length===0 && <EmptyState text="Sin usuarios encontrados"/>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ══════════════════════════════════
   SECCIÓN: Cuentas
══════════════════════════════════ */
const AccountsSection = () => {
  const { data, loading, reload } = useData(getAccounts);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ accountType:'ahorro', balance:'', openingDate:'', status:'activa' });
  const [saving, setSaving] = useState(false);

  const filtered = data.filter(a =>
    `${a.accountNumber||a.AccountNumber||''} ${a.accountType||a.AccountType||''} ${a.status||a.Status||''}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createAccount({ ...form, balance: Number(form.balance), openingDate: form.openingDate || new Date().toISOString() });
      showSuccess('Cuenta creada'); setModal(false); reload();
    } catch(e){ showError(e?.response?.data?.message||'Error al crear'); }
    finally{ setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteAccount(id); showSuccess('Cuenta eliminada'); reload(); }
    catch { showError('Error al eliminar'); }
    setConfirm(null);
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Cuentas</h1><p className="page-subtitle">Administración de cuentas bancarias</p></div>
        <button className="btn-add" onClick={()=>setModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Nueva cuenta
        </button>
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Todas las cuentas</span>
          <div className="search-input-wrap">
            <span className="search-icon"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
            <input className="search-input" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>
        <table className="data-table">
          <thead><tr><th>N° Cuenta</th><th>Tipo</th><th>Balance</th><th>Estado</th><th>Apertura</th><th>Acciones</th></tr></thead>
          <tbody>
            {loading ? <LoadingRows cols={6}/> : filtered.map((a,i)=>{
              const id = a._id||a.id||a.accountNumber||a.AccountNumber;
              return (
                <tr key={i}>
                  <td style={{fontFamily:'monospace',color:'var(--gold-pure)'}}>{a.accountNumber||a.AccountNumber||'—'}</td>
                  <td><Badge value={a.accountType||a.AccountType}/></td>
                  <td style={{fontWeight:500,color:'var(--white)'}}>Q {fmt(a.balance||a.Balance)}</td>
                  <td><Badge value={a.status||a.Status}/></td>
                  <td style={{color:'var(--muted)',fontSize:'.82rem'}}>{fmtDate(a.openingDate||a.createdAt)}</td>
                  <td><div className="action-btns">
                    <button className="btn-icon danger" title="Eliminar" onClick={()=>setConfirm({id,label:a.accountNumber||a.AccountNumber})}>
                      <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div></td>
                </tr>
              );
            })}
            {!loading && filtered.length===0 && <EmptyState text="Sin cuentas"/>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Nueva Cuenta</span>
              <button className="modal-close" onClick={()=>setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-fields-row">
                <div className="modal-field">
                  <label className="modal-label">Tipo</label>
                  <select className="modal-select" value={form.accountType} onChange={e=>setForm(p=>({...p,accountType:e.target.value}))}>
                    <option value="ahorro">Ahorro</option>
                    <option value="corriente">Corriente</option>
                    <option value="monetaria">Monetaria</option>
                  </select>
                </div>
                <div className="modal-field">
                  <label className="modal-label">Balance inicial</label>
                  <input className="modal-input" type="number" placeholder="0.00" value={form.balance} onChange={e=>setForm(p=>({...p,balance:e.target.value}))}/>
                </div>
              </div>
              <div className="modal-fields-row">
                <div className="modal-field">
                  <label className="modal-label">Fecha apertura</label>
                  <input className="modal-input" type="date" value={form.openingDate} onChange={e=>setForm(p=>({...p,openingDate:e.target.value}))}/>
                </div>
                <div className="modal-field">
                  <label className="modal-label">Estado</label>
                  <select className="modal-select" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
                    <option value="activa">Activa</option>
                    <option value="inactiva">Inactiva</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleCreate} disabled={saving}>{saving?<span className="spin"/>:'Crear cuenta'}</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal open={!!confirm} title="Eliminar cuenta" message={`¿Eliminar la cuenta ${confirm?.label}? Esta acción no se puede deshacer.`} onConfirm={()=>handleDelete(confirm.id)} onCancel={()=>setConfirm(null)}/>
    </div>
  );
};

/* ══════════════════════════════════
   SECCIÓN: Tarjetas
══════════════════════════════════ */
const CardsSection = () => {
  const { data, loading, reload } = useData(getCards);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState(null);

  const filtered = data.filter(c =>
    `${c.cardType||c.CardType||''} ${c.status||c.Status||''} ${c.userId||c.UserId||''}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = async (id, status) => {
    setToggling(id);
    try {
      const newStatus = status === 'activa' ? 'bloqueada' : 'activa';
      await toggleCardStatus(id, newStatus);
      showSuccess(`Tarjeta ${newStatus}`); reload();
    } catch { showError('Error al cambiar estado'); }
    finally { setToggling(null); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Tarjetas</h1><p className="page-subtitle">Gestión de tarjetas de crédito y débito</p></div>
      </div>
      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Todas las tarjetas</span>
          <div className="search-input-wrap">
            <span className="search-icon"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
            <input className="search-input" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Usuario</th><th>Tipo</th><th>Balance</th><th>Vencimiento</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>
            {loading ? <LoadingRows cols={7}/> : filtered.map((c,i)=>{
              const id = c._id||c.id;
              const status = c.status||c.Status||'activa';
              return (
                <tr key={i}>
                  <td style={{fontFamily:'monospace',fontSize:'.78rem',color:'var(--muted)'}}>{String(id).slice(-8)}</td>
                  <td style={{color:'var(--gold-pure)',fontSize:'.82rem'}}>{c.userId||c.UserId||'—'}</td>
                  <td><Badge value={c.cardType||c.CardType}/></td>
                  <td style={{fontWeight:500}}>Q {fmt(c.availableBalance||c.AvailableBalance)}</td>
                  <td style={{color:'var(--muted)',fontSize:'.82rem'}}>{fmtDate(c.expirationDate||c.ExpirationDate)}</td>
                  <td><Badge value={status}/></td>
                  <td>
                    <button className="btn-icon" title={status==='activa'?'Bloquear':'Activar'} disabled={toggling===id} onClick={()=>handleToggle(id, status)}>
                      {toggling===id ? <span className="spin"/> : status==='activa'
                        ? <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        : <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M12 15v2" stroke="#4caf7d" strokeWidth="2" strokeLinecap="round"/></svg>
                      }
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length===0 && <EmptyState text="Sin tarjetas registradas"/>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ══════════════════════════════════
   SECCIÓN: Transacciones
══════════════════════════════════ */
const TransactionsSection = () => {
  const { data, loading } = useData(getTransactions);
  const [search, setSearch] = useState('');
  const filtered = data.filter(t =>
    `${t.transactionType||t.TransactionType||''} ${t.sourceAccountId||t.SourceAccountId||''} ${t.destinationAccountId||t.DestinationAccountId||''}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Transacciones</h1><p className="page-subtitle">Historial completo de movimientos</p></div></div>
      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Todos los movimientos</span>
          <div className="search-input-wrap">
            <span className="search-icon"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
            <input className="search-input" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Tipo</th><th>Origen</th><th>Destino</th><th>Monto</th><th>Fecha</th></tr></thead>
          <tbody>
            {loading ? <LoadingRows cols={6}/> : filtered.map((t,i)=>(
              <tr key={i}>
                <td style={{fontFamily:'monospace',fontSize:'.75rem',color:'var(--muted)'}}>{String(t._id||t.id||'').slice(-8)}</td>
                <td><Badge value={t.transactionType||t.TransactionType}/></td>
                <td style={{fontFamily:'monospace',fontSize:'.82rem',color:'var(--gold-pure)'}}>{t.sourceAccountId||t.SourceAccountId||'—'}</td>
                <td style={{fontFamily:'monospace',fontSize:'.82rem',color:'var(--gold-pure)'}}>{t.destinationAccountId||t.DestinationAccountId||'—'}</td>
                <td style={{fontWeight:500}}>Q {fmt(t.amount||t.Amount)}</td>
                <td style={{color:'var(--muted)',fontSize:'.82rem'}}>{fmtDate(t.createdAt||t.created_at||t.date)}</td>
              </tr>
            ))}
            {!loading && filtered.length===0 && <EmptyState text="Sin transacciones"/>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ══════════════════════════════════
   SECCIÓN: Préstamos
══════════════════════════════════ */
const LoansSection = () => {
  const { data, loading, reload } = useData(getLoans);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ userId:'', accountNumber:'', requestedAmount:'', approvedAmount:'', interestRate:'', termMonths:'', status:'pendiente' });
  const [saving, setSaving] = useState(false);

  const filtered = data.filter(l =>
    `${l.userId||l.UserId||''} ${l.accountNumber||l.AccountNumber||''} ${l.status||l.Status||''}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createLoan({ ...form, requestedAmount:Number(form.requestedAmount), approvedAmount:Number(form.approvedAmount), interestRate:Number(form.interestRate), termMonths:Number(form.termMonths) });
      showSuccess('Préstamo creado'); setModal(false); reload();
    } catch(e){ showError(e?.response?.data?.message||'Error'); }
    finally{ setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Préstamos</h1><p className="page-subtitle">Gestión de créditos y financiamientos</p></div>
        <button className="btn-add" onClick={()=>setModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Nuevo préstamo
        </button>
      </div>
      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Todos los préstamos</span>
          <div className="search-input-wrap">
            <span className="search-icon"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
            <input className="search-input" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>
        <table className="data-table">
          <thead><tr><th>Usuario</th><th>Cuenta</th><th>Monto solicitado</th><th>Aprobado</th><th>Plazo</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {loading ? <LoadingRows cols={7}/> : filtered.map((l,i)=>{
              const id = l._id||l.id;
              return (
                <tr key={i}>
                  <td style={{color:'var(--gold-pure)',fontSize:'.82rem'}}>{l.userId||l.UserId||'—'}</td>
                  <td style={{fontFamily:'monospace',fontSize:'.82rem'}}>{l.accountNumber||l.AccountNumber||'—'}</td>
                  <td>Q {fmt(l.requestedAmount||l.RequestedAmount)}</td>
                  <td style={{color:'var(--success)',fontWeight:500}}>Q {fmt(l.approvedAmount||l.ApprovedAmount)}</td>
                  <td style={{color:'var(--muted)'}}>{l.termMonths||l.TermMonths||'—'} meses</td>
                  <td><Badge value={l.status||l.Status}/></td>
                  <td><div className="action-btns">
                    <button className="btn-icon danger" onClick={()=>setConfirm({id})}>
                      <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div></td>
                </tr>
              );
            })}
            {!loading && filtered.length===0 && <EmptyState text="Sin préstamos"/>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Nuevo Préstamo</span><button className="modal-close" onClick={()=>setModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="modal-fields-row">
                <div className="modal-field"><label className="modal-label">ID Usuario</label><input className="modal-input" placeholder="usr_XXXX" value={form.userId} onChange={e=>setForm(p=>({...p,userId:e.target.value}))}/></div>
                <div className="modal-field"><label className="modal-label">N° Cuenta</label><input className="modal-input" placeholder="ACC-000-0000" value={form.accountNumber} onChange={e=>setForm(p=>({...p,accountNumber:e.target.value}))}/></div>
              </div>
              <div className="modal-fields-row">
                <div className="modal-field"><label className="modal-label">Monto solicitado</label><input className="modal-input" type="number" placeholder="0.00" value={form.requestedAmount} onChange={e=>setForm(p=>({...p,requestedAmount:e.target.value}))}/></div>
                <div className="modal-field"><label className="modal-label">Monto aprobado</label><input className="modal-input" type="number" placeholder="0.00" value={form.approvedAmount} onChange={e=>setForm(p=>({...p,approvedAmount:e.target.value}))}/></div>
              </div>
              <div className="modal-fields-row">
                <div className="modal-field"><label className="modal-label">Tasa de interés (%)</label><input className="modal-input" type="number" placeholder="5.5" value={form.interestRate} onChange={e=>setForm(p=>({...p,interestRate:e.target.value}))}/></div>
                <div className="modal-field"><label className="modal-label">Plazo (meses)</label><input className="modal-input" type="number" placeholder="12" value={form.termMonths} onChange={e=>setForm(p=>({...p,termMonths:e.target.value}))}/></div>
              </div>
              <div className="modal-field"><label className="modal-label">Estado</label>
                <select className="modal-select" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
                  <option value="pendiente">Pendiente</option><option value="aprobado">Aprobado</option><option value="rechazado">Rechazado</option>
                </select>
              </div>
            </div>
            <div className="modal-footer"><button className="btn-cancel" onClick={()=>setModal(false)}>Cancelar</button><button className="btn-save" onClick={handleCreate} disabled={saving}>{saving?<span className="spin"/>:'Crear préstamo'}</button></div>
          </div>
        </div>
      )}
      <ConfirmModal open={!!confirm} title="Eliminar préstamo" message="¿Eliminar este préstamo? Esta acción no se puede deshacer." onConfirm={async()=>{try{await deleteLoan(confirm.id);showSuccess('Eliminado');reload();}catch{showError('Error');}setConfirm(null);}} onCancel={()=>setConfirm(null)}/>
    </div>
  );
};

/* ══════════════════════════════════
   SECCIÓN: Monedas
══════════════════════════════════ */
const CoinsSection = () => {
  const { data, loading, reload } = useData(getCoins);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ code:'', name:'', symbol:'', exchangeRate:'', baseCurrency:false });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createCoin({ ...form, exchangeRate:Number(form.exchangeRate) });
      showSuccess('Moneda creada'); setModal(false); reload();
    } catch(e){ showError(e?.response?.data?.message||'Error'); }
    finally{ setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Monedas</h1><p className="page-subtitle">Divisas y tipos de cambio</p></div>
        <button className="btn-add" onClick={()=>setModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Nueva moneda
        </button>
      </div>
      <div className="table-card">
        <div className="table-header"><span className="table-title">Divisas configuradas</span></div>
        <table className="data-table">
          <thead><tr><th>Código</th><th>Nombre</th><th>Símbolo</th><th>Tipo cambio</th><th>Base</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {loading ? <LoadingRows cols={7}/> : data.map((c,i)=>{
              const id = c._id||c.id;
              return (
                <tr key={i}>
                  <td style={{fontWeight:600,color:'var(--gold-pure)',letterSpacing:'.05em'}}>{c.code||c.Code}</td>
                  <td style={{color:'var(--white)'}}>{c.name||c.Name}</td>
                  <td style={{fontFamily:'monospace'}}>{c.symbol||c.Symbol}</td>
                  <td>Q {fmt(c.exchangeRate||c.ExchangeRate)}</td>
                  <td><Badge value={(c.baseCurrency||c.BaseCurrency)?'Sí':'No'}/></td>
                  <td><Badge value={c.status||c.Status||'activa'}/></td>
                  <td><div className="action-btns">
                    <button className="btn-icon danger" onClick={()=>setConfirm({id,label:c.code||c.Code})}>
                      <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div></td>
                </tr>
              );
            })}
            {!loading && data.length===0 && <EmptyState text="Sin monedas configuradas"/>}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Nueva Moneda</span><button className="modal-close" onClick={()=>setModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="modal-fields-row">
                <div className="modal-field"><label className="modal-label">Código</label><input className="modal-input" placeholder="GTQ" value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value.toUpperCase()}))}/></div>
                <div className="modal-field"><label className="modal-label">Símbolo</label><input className="modal-input" placeholder="Q" value={form.symbol} onChange={e=>setForm(p=>({...p,symbol:e.target.value}))}/></div>
              </div>
              <div className="modal-field"><label className="modal-label">Nombre</label><input className="modal-input" placeholder="Quetzal" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
              <div className="modal-fields-row">
                <div className="modal-field"><label className="modal-label">Tipo de cambio</label><input className="modal-input" type="number" placeholder="1.00" value={form.exchangeRate} onChange={e=>setForm(p=>({...p,exchangeRate:e.target.value}))}/></div>
                <div className="modal-field" style={{justifyContent:'flex-end',paddingTop:'1.5rem'}}>
                  <label style={{display:'flex',alignItems:'center',gap:'.5rem',cursor:'pointer',color:'var(--muted)',fontSize:'.85rem'}}>
                    <input type="checkbox" checked={form.baseCurrency} onChange={e=>setForm(p=>({...p,baseCurrency:e.target.checked}))} style={{accentColor:'var(--gold-pure)'}}/>
                    Moneda base
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn-cancel" onClick={()=>setModal(false)}>Cancelar</button><button className="btn-save" onClick={handleCreate} disabled={saving}>{saving?<span className="spin"/>:'Crear'}</button></div>
          </div>
        </div>
      )}
      <ConfirmModal open={!!confirm} title="Eliminar moneda" message={`¿Eliminar la moneda ${confirm?.label}?`} onConfirm={async()=>{try{await deleteCoin(confirm.id);showSuccess('Eliminada');reload();}catch{showError('Error');}setConfirm(null);}} onCancel={()=>setConfirm(null)}/>
    </div>
  );
};

/* ══════════════════════════════════
   SECCIÓN: Cuentas Bloqueadas
══════════════════════════════════ */
const LocksSection = () => {
  const { data, loading, reload } = useData(getAccountLocks);
  const [confirm, setConfirm] = useState(null);
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Cuentas Bloqueadas</h1><p className="page-subtitle">Registro de bloqueos de cuentas</p></div></div>
      <div className="table-card">
        <div className="table-header"><span className="table-title">Bloqueos activos</span></div>
        <table className="data-table">
          <thead><tr><th>Cuenta</th><th>Usuario</th><th>Razón</th><th>Descripción</th><th>Fecha</th><th>Acciones</th></tr></thead>
          <tbody>
            {loading ? <LoadingRows cols={6}/> : data.map((l,i)=>{
              const id = l._id||l.id;
              return (
                <tr key={i}>
                  <td style={{fontFamily:'monospace',color:'var(--gold-pure)'}}>{l.accountId||l.AccountId||'—'}</td>
                  <td style={{fontSize:'.82rem',color:'var(--muted)'}}>{l.userId||l.UserId||'—'}</td>
                  <td><Badge value={l.lockReason||l.LockReason}/></td>
                  <td style={{color:'var(--muted)',fontSize:'.82rem',maxWidth:200}}>{l.description||l.Description||'—'}</td>
                  <td style={{color:'var(--muted)',fontSize:'.82rem'}}>{fmtDate(l.createdAt||l.created_at)}</td>
                  <td><div className="action-btns">
                    <button className="btn-icon danger" onClick={()=>setConfirm({id})}>
                      <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div></td>
                </tr>
              );
            })}
            {!loading && data.length===0 && <EmptyState text="Sin cuentas bloqueadas"/>}
          </tbody>
        </table>
      </div>
      <ConfirmModal open={!!confirm} title="Desbloquear cuenta" message="¿Eliminar este bloqueo?" onConfirm={async()=>{try{await deleteAccountLock(confirm.id);showSuccess('Bloqueo eliminado');reload();}catch{showError('Error');}setConfirm(null);}} onCancel={()=>setConfirm(null)}/>
    </div>
  );
};

/* ══════════════════════════════════
   SECCIÓN: Servicios
══════════════════════════════════ */
const ServicesSection = () => {
  const { data, loading } = useData(getServices);
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Servicios</h1><p className="page-subtitle">Servicios disponibles en el sistema</p></div></div>
      <div className="table-card">
        <div className="table-header"><span className="table-title">Catálogo de servicios</span></div>
        <table className="data-table">
          <thead><tr><th>Nombre</th><th>Descripción</th><th>Estado</th></tr></thead>
          <tbody>
            {loading ? <LoadingRows cols={3}/> : data.map((s,i)=>(
              <tr key={i}>
                <td style={{color:'var(--white)',fontWeight:500}}>{s.name||s.Name||s.serviceName||'—'}</td>
                <td style={{color:'var(--muted)',fontSize:'.85rem'}}>{s.description||s.Description||'—'}</td>
                <td><Badge value={s.status||s.Status||'activo'}/></td>
              </tr>
            ))}
            {!loading && data.length===0 && <EmptyState text="Sin servicios configurados"/>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ══════════════════════════════════
   SECCIÓN: Depósitos
══════════════════════════════════ */
const DepositsSection = () => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ accountNumber:'', amount:'', currencyCode:'GTQ', description:'' });
  const [saving, setSaving] = useState(false);
  const { data: coins } = useData(getCoins);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createDeposit({ ...form, amount: Number(form.amount) });
      showSuccess('Depósito realizado'); setModal(false);
      setForm({ accountNumber:'', amount:'', currencyCode:'GTQ', description:'' });
    } catch(e){ showError(e?.response?.data?.message||'Error al realizar depósito'); }
    finally{ setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Depósitos</h1><p className="page-subtitle">Registrar depósitos en cuentas</p></div>
        <button className="btn-add" onClick={()=>setModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Nuevo depósito
        </button>
      </div>
      <div className="table-card">
        <div className="table-header"><span className="table-title">Depósitos</span></div>
        <div style={{padding:'3rem',textAlign:'center',color:'var(--muted)'}}>
          <svg viewBox="0 0 24 24" fill="none" width="40" height="40" style={{opacity:.2,marginBottom:'1rem'}}>
            <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>Usa el botón "Nuevo depósito" para registrar un depósito en una cuenta.</p>
        </div>
      </div>
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Nuevo Depósito</span><button className="modal-close" onClick={()=>setModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="modal-field"><label className="modal-label">N° de Cuenta</label><input className="modal-input" placeholder="ACC-000-0000" value={form.accountNumber} onChange={e=>setForm(p=>({...p,accountNumber:e.target.value}))}/></div>
              <div className="modal-fields-row">
                <div className="modal-field"><label className="modal-label">Monto</label><input className="modal-input" type="number" placeholder="0.00" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))}/></div>
                <div className="modal-field"><label className="modal-label">Moneda</label>
                  <select className="modal-select" value={form.currencyCode} onChange={e=>setForm(p=>({...p,currencyCode:e.target.value}))}>
                    {coins.length ? coins.map(c=><option key={c._id||c.id} value={c.code||c.Code}>{c.code||c.Code} — {c.name||c.Name}</option>) : <option value="GTQ">GTQ — Quetzal</option>}
                  </select>
                </div>
              </div>
              <div className="modal-field"><label className="modal-label">Descripción</label><input className="modal-input" placeholder="Motivo del depósito" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
            </div>
            <div className="modal-footer"><button className="btn-cancel" onClick={()=>setModal(false)}>Cancelar</button><button className="btn-save" onClick={handleCreate} disabled={saving}>{saving?<span className="spin"/>:'Depositar'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════
   SECCIÓN: Retiros
══════════════════════════════════ */
const WithdrawalsSection = () => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ accountNumber:'', amount:'' });
  const [saving, setSaving] = useState(false);
  const { createWithdrawal } = require ? null : null;
  import('../../../shared/api/banking').then(m => window._bk = m);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const { createWithdrawal: cw } = await import('../../../shared/api/banking');
      await cw({ accountNumber: form.accountNumber, amount: Number(form.amount) });
      showSuccess('Retiro realizado'); setModal(false);
      setForm({ accountNumber:'', amount:'' });
    } catch(e){ showError(e?.response?.data?.message||'Error al realizar retiro'); }
    finally{ setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Retiros</h1><p className="page-subtitle">Registrar retiros de cuentas</p></div>
        <button className="btn-add" onClick={()=>setModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Nuevo retiro
        </button>
      </div>
      <div className="table-card">
        <div style={{padding:'3rem',textAlign:'center',color:'var(--muted)'}}>
          <svg viewBox="0 0 24 24" fill="none" width="40" height="40" style={{opacity:.2,marginBottom:'1rem'}}>
            <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>Usa el botón "Nuevo retiro" para registrar un retiro.</p>
        </div>
      </div>
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Nuevo Retiro</span><button className="modal-close" onClick={()=>setModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="modal-field"><label className="modal-label">N° de Cuenta</label><input className="modal-input" placeholder="ACC-000-0000" value={form.accountNumber} onChange={e=>setForm(p=>({...p,accountNumber:e.target.value}))}/></div>
              <div className="modal-field"><label className="modal-label">Monto</label><input className="modal-input" type="number" placeholder="0.00" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))}/></div>
            </div>
            <div className="modal-footer"><button className="btn-cancel" onClick={()=>setModal(false)}>Cancelar</button><button className="btn-save" onClick={handleCreate} disabled={saving}>{saving?<span className="spin"/>:'Retirar'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════
   SECCIÓN: Estados de cuenta
══════════════════════════════════ */
const StatementsSection = () => {
  const { data, loading } = useData(getAccountStatements);
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Estados de Cuenta</h1><p className="page-subtitle">Historial de estados de cuenta</p></div></div>
      <div className="table-card">
        <div className="table-header"><span className="table-title">Estados de cuenta</span></div>
        <table className="data-table">
          <thead><tr><th>Cuenta</th><th>Periodo</th><th>Balance inicial</th><th>Balance final</th><th>Fecha</th></tr></thead>
          <tbody>
            {loading ? <LoadingRows cols={5}/> : data.map((s,i)=>(
              <tr key={i}>
                <td style={{fontFamily:'monospace',color:'var(--gold-pure)'}}>{s.accountNumber||s.AccountNumber||s.accountId||'—'}</td>
                <td style={{color:'var(--muted)',fontSize:'.82rem'}}>{s.period||s.Period||'—'}</td>
                <td>Q {fmt(s.openingBalance||s.initialBalance||0)}</td>
                <td style={{fontWeight:500,color:'var(--white)'}}>Q {fmt(s.closingBalance||s.finalBalance||0)}</td>
                <td style={{color:'var(--muted)',fontSize:'.82rem'}}>{fmtDate(s.createdAt||s.date)}</td>
              </tr>
            ))}
            {!loading && data.length===0 && <EmptyState text="Sin estados de cuenta"/>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ══════════════════════════════════
   MAIN ADMIN DASHBOARD
══════════════════════════════════ */
const SECTIONS = {
  overview: OverviewSection,
  users: UsersSection,
  accounts: AccountsSection,
  cards: CardsSection,
  transactions: TransactionsSection,
  loans: LoansSection,
  coins: CoinsSection,
  locks: LocksSection,
  services: ServicesSection,
  deposits: DepositsSection,
  withdrawals: WithdrawalsSection,
  statements: StatementsSection,
  profile: ProfilePage,
};

import { getAccountStatements } from '../../../shared/api/banking';
import { createDeposit } from '../../../shared/api/banking';

const AdminDashboard = () => {
  const [page, setPage] = useState('overview');
  const Section = SECTIONS[page] || OverviewSection;

  return (
    <DashboardLayout activePage={page} onNavigate={setPage} isAdmin>
      <Section />
    </DashboardLayout>
  );
};

export default AdminDashboard;