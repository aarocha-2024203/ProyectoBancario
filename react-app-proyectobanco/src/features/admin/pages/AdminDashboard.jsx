import { useState, useEffect } from 'react';
import DashboardLayout from '../../../shared/components/layout/DashboardLayout';
import { useData, clearDataCache } from '../../../shared/hooks/useData';
import { showSuccess, showError } from '../../../shared/utils/toast';
import {
  getAccounts, getCards, getTransactions, getLoans,
  getCoins, getAccountLocks, getServices, getAccountStatements,
  createCoin, deleteCoin, toggleCardStatus, deleteLoan,
  deleteAccountLock, createAccount, deleteAccount, createLoan,
  createDeposit, createWithdrawal,
  getAccountsDelayed, getCardsDelayed, getLoansDelayed,
  updateAccount, toggleAccountStatus,
  getAccountLock, updateAccountLock, createAccountLock,
} from '../../../shared/api/banking';
import { getUsers, changeRole } from '../../../shared/api/users';
import ProfilePage from '../../profile/ProfilePage';
import useAuthStore from '../../../features/auth/store/authStore';


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
  const { data: users,    loading: lu } = useData(getUsers);
  const { data: accounts, loading: la } = useData(getAccountsDelayed);
  const { data: cards,    loading: lc } = useData(getCardsDelayed);
  const { data: loans,    loading: ll } = useData(getLoansDelayed);

  const stats = [
    { label:'Usuarios registrados', value: lu ? '...' : users.length,
      icon:<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="#c8a951" strokeWidth="1.5"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { label:'Cuentas activas', value: la ? '...' : accounts.filter(a=>(a.status||a.Status||'').toLowerCase()==='activa').length,
      icon:<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { label:'Tarjetas emitidas', value: lc ? '...' : cards.length,
      icon:<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="2" y="5" width="20" height="14" rx="2" stroke="#c8a951" strokeWidth="1.5"/><path d="M2 10h20" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { label:'Préstamos activos', value: ll ? '...' : loans.length,
      icon:<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { label:'Total en cuentas', value: la ? '...' : 'Q ' + fmt(accounts.reduce((s,a)=>s+Number(a.balance||a.Balance||0),0)),
      icon:<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><circle cx="12" cy="12" r="10" stroke="#c8a951" strokeWidth="1.5"/><path d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H9m0 0h5.5a1.5 1.5 0 010 3H9" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/></svg> },
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
      <div className="table-card" style={{marginTop:'1.5rem'}}>
        <div className="table-header"><span className="table-title">Últimas cuentas creadas</span></div>
        <table className="data-table">
          <thead><tr><th>N° Cuenta</th><th>Tipo</th><th>Balance</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>
            {la ? <LoadingRows cols={5}/> : accounts.slice(0,6).map((a,i)=>(
              <tr key={i}>
                <td style={{fontFamily:'monospace',color:'var(--gold-pure)'}}>{a.accountNumber||a.AccountNumber||'—'}</td>
                <td><Badge value={a.accountType||a.AccountType}/></td>
                <td>Q {fmt(a.balance||a.Balance)}</td>
                <td><Badge value={a.status||a.Status}/></td>
                <td style={{color:'var(--muted)',fontSize:'.82rem'}}>{fmtDate(a.openingDate||a.createdAt)}</td>
              </tr>
            ))}
            {!la && accounts.length===0 && <EmptyState text="Sin cuentas registradas"/>}
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
  const [localUsers, setLocalUsers] = useState([]);
  const [search, setSearch]         = useState('');
  const [changing, setChanging]     = useState(null);
  const [editModal, setEditModal]   = useState(null);

  // Sincroniza localUsers cuando llegan datos del backend
  useEffect(() => {
    if (users.length > 0) setLocalUsers(users);
  }, [users]);

  const getRole = (u) =>
    u?.role || u?.UserRoles?.[0]?.Role?.Name || u?._fetchedRole || 'USER_ROLE';

  const filtered = localUsers.filter(u =>
    `${u.name||''} ${u.surname||''} ${u.username||''} ${u.email||''}`
      .toLowerCase().includes(search.toLowerCase())
  );

// Email del admin principal que NO puede ser degradado
const PROTECTED_ADMIN_EMAIL = 'proyectobancario3@gmail.com';

const handleRoleChange = async (id, currentRole) => {
  const targetUser = localUsers.find(u => u.id === id || u.Id === id);

  // Protección: el admin principal no puede ser degradado
  if (targetUser?.email === PROTECTED_ADMIN_EMAIL) {
    showError('Este administrador principal no puede ser modificado.');
    return;
  }

  // Protección: solo el admin principal puede cambiar roles
  // (el usuario actual debe ser el admin principal)
  const currentUser = useAuthStore.getState().user;
  const currentUserInList = localUsers.find(u =>
    u.id === currentUser?.id ||
    u.username === currentUser?.username
  );
  if (currentUserInList?.email !== PROTECTED_ADMIN_EMAIL) {
    showError('Solo el administrador principal puede cambiar roles.');
    return;
  }

  const newRole = currentRole === 'ADMIN_ROLE' ? 'USER_ROLE' : 'ADMIN_ROLE';
  setChanging(id);

  // Actualiza localmente de inmediato
  setLocalUsers(prev => prev.map(u =>
    (u.id === id || u.Id === id)
      ? { ...u, role: newRole, _fetchedRole: newRole }
      : u
  ));
  if (editModal && (editModal.id === id || editModal.Id === id)) {
    setEditModal(prev => ({ ...prev, role: newRole, _fetchedRole: newRole }));
  }

  try {
    await changeRole(id, newRole);
    showSuccess(`Rol cambiado a ${newRole}`);
    clearDataCache();

    // Si degradamos a alguien de ADMIN a USER,
    // forzamos cierre de sesión en ese dispositivo
    // (el backend invalida el token en la próxima petición)
    if (currentRole === 'ADMIN_ROLE' && newRole === 'USER_ROLE') {
      showSuccess('El usuario será redirigido al dashboard de cliente en su próxima acción.');
    }
  } catch (e) {
    // Revierte si falla
    setLocalUsers(prev => prev.map(u =>
      (u.id === id || u.Id === id)
        ? { ...u, role: currentRole, _fetchedRole: currentRole }
        : u
    ));
    if (editModal && (editModal.id === id || editModal.Id === id)) {
      setEditModal(prev => ({ ...prev, role: currentRole, _fetchedRole: currentRole }));
    }
    showError(e?.response?.data?.message || 'Error al cambiar el rol');
  } finally {
    setChanging(null);
  }
};
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios registrados</h1>
          <p className="page-subtitle">Gestión y control de acceso de usuarios</p>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Total: {filtered.length} usuarios</span>
          <div className="search-input-wrap">
            <span className="search-icon">
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </span>
            <input className="search-input" placeholder="Buscar usuario..."
              value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && localUsers.length === 0
              ? <LoadingRows cols={6}/>
              : filtered.map((u, i) => {
              const id        = u.id || u.Id;
              const role      = getRole(u);
              const avatar    = u.profilePicture;
              const hasAvatar = avatar && !avatar.includes('default');
              const initials  = `${(u.name||'U')[0]}${(u.surname||'')[0]||''}`.toUpperCase();
              const isActive  = u.status === true || u.status === 1;

              return (
                <tr key={id || i}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
                      <div style={{
                        width:34, height:34, borderRadius:'50%',
                        background:'linear-gradient(135deg,#8a7035,#c8a951)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:"'Cormorant Garamond',serif",
                        fontSize:'.85rem', fontWeight:700, color:'#060810',
                        flexShrink:0, overflow:'hidden',
                      }}>
                        {hasAvatar
                          ? <img src={avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}
                              onError={e => e.target.style.display='none'}/>
                          : initials
                        }
                      </div>
                      <div>
                        <p style={{ color:'var(--white)', fontWeight:500, fontSize:'.88rem', lineHeight:1.2 }}>
                          {u.name||'—'} {u.surname||''}
                        </p>
                        <p style={{ color:'var(--muted)', fontSize:'.75rem' }}>@{u.username||'—'}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ color:'var(--muted)', fontSize:'.82rem' }}>{u.email||'—'}</td>
                  <td style={{ color:'var(--muted)', fontSize:'.82rem' }}>{u.phone||'—'}</td>
                  <td><Badge value={role}/></td>
                  <td><Badge value={isActive ? 'Activo' : 'Inactivo'}/></td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" title="Ver detalle" onClick={() => setEditModal(u)}>
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                      <button
                        className="btn-icon"
                        style={{ width:'auto', padding:'0 8px', fontSize:'.7rem', color:'var(--gold-pure)' }}
                        disabled={changing === id}
                        onClick={() => handleRoleChange(id, role)}
                        title={role === 'ADMIN_ROLE' ? 'Quitar admin' : 'Hacer admin'}
                      >
                        {changing === id
                          ? <span className="spin"/>
                          : role === 'ADMIN_ROLE' ? '→ User' : '→ Admin'
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && localUsers.length === 0 &&
              <EmptyState text="Sin usuarios registrados"/>
            }
          </tbody>
        </table>
      </div>

      {/* Modal detalle */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Detalle del usuario</span>
              <button className="modal-close" onClick={() => setEditModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
                <div style={{
                  width:72, height:72, borderRadius:'50%', margin:'0 auto .75rem',
                  background:'linear-gradient(135deg,#8a7035,#c8a951)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:"'Cormorant Garamond',serif", fontSize:'1.5rem',
                  fontWeight:700, color:'#060810', overflow:'hidden',
                }}>
                  {editModal.profilePicture && !editModal.profilePicture.includes('default')
                    ? <img src={editModal.profilePicture} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    : `${(editModal.name||'U')[0]}${(editModal.surname||'')[0]||''}`.toUpperCase()
                  }
                </div>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.1rem', color:'var(--white)', fontWeight:600 }}>
                  {editModal.name} {editModal.surname}
                </p>
                <p style={{ fontSize:'.75rem', color:'var(--muted)' }}>@{editModal.username}</p>
              </div>

              {[
                { label:'ID',         value: editModal.id,    mono: true },
                { label:'Correo',     value: editModal.email },
                { label:'Teléfono',   value: editModal.phone || '—' },
                { label:'Rol',        value: getRole(editModal) },
                { label:'Estado',     value: editModal.status ? 'Activo' : 'Inactivo' },
                { label:'Verificado', value: editModal.isEmailVerified ? 'Sí' : 'No' },
                { label:'Registro',   value: editModal.createdAt ? new Date(editModal.createdAt).toLocaleDateString('es-GT') : '—' },
              ].map(({ label, value, mono }) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'.65rem 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize:'.72rem', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:500 }}>{label}</span>
                  <span style={{ fontSize:'.85rem', color:'var(--white)', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
                </div>
              ))}

              <div style={{ marginTop:'1rem', paddingTop:'1rem', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize:'.72rem', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.75rem', fontWeight:500 }}>Cambiar rol</p>
                <div style={{ display:'flex', gap:'.75rem' }}>
                  {['USER_ROLE','ADMIN_ROLE'].map(r => {
                    const current = getRole(editModal);
                    const isActive = current === r;
                    return (
                      <button key={r}
                        disabled={isActive || changing === editModal.id}
                        onClick={() => { handleRoleChange(editModal.id, current); }}
                        style={{
                          flex:1, padding:'.65rem',
                          background: isActive ? 'rgba(200,169,81,0.15)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isActive ? 'rgba(200,169,81,0.35)' : 'rgba(255,255,255,0.07)'}`,
                          color: isActive ? 'var(--gold-pure)' : 'var(--muted)',
                          borderRadius:8, fontFamily:"'Outfit',sans-serif", fontSize:'.8rem',
                          cursor: isActive ? 'default' : 'pointer',
                          transition:'all .2s',
                        }}
                      >
                        {r === 'ADMIN_ROLE' ? 'Administrador' : 'Cliente'}
                        {isActive && ' ✓'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setEditModal(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
/* ══════════════════════════════════
   SECCIÓN: Cuentas
══════════════════════════════════ */
// ── FUERA del componente ──────────────────────────────────────
const AccountField = ({ label, children }) => (
  <div className="modal-field">
    <label className="modal-label">{label}</label>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────
const AccountsSection = () => {
  const { data, loading, reload } = useData(getAccounts);
  const [localData, setLocalData] = useState([]);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [confirm, setConfirm]     = useState(null);
  const [saving, setSaving]       = useState(false);
  const [detailModal, setDetailModal] = useState(null);

  const emptyForm = {
    accountType: 'ahorro', balance: '', openingDate: '',
    status: 'activa', dailyWithdrawalLimit: '', annualInterestRate: '',
    currencyCode: 'GTQ', userId: '', dpi: '', address: '',
    jobName: '', monthlyIncome: '', phone: '',
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { if (data.length > 0) setLocalData(data); }, [data]);

  const fmt     = (n) => n != null ? Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2 }) : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-GT') : '—';

  const filtered = localData.filter(a =>
    `${a.accountNumber||''} ${a.accountType||''} ${a.status||''} ${a.userId||''}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm(emptyForm); setEditItem(null); setModal(true); };

  const openEdit = (a) => {
    setForm({
      accountType:          a.accountType          || 'ahorro',
      balance:              a.balance               || '',
      openingDate:          a.openingDate           ? a.openingDate.slice(0,10) : '',
      status:               a.status                || 'activa',
      dailyWithdrawalLimit: a.dailyWithdrawalLimit  || '',
      annualInterestRate:   a.annualInterestRate     || '',
      currencyCode:         a.currencyCode           || 'GTQ',
      userId:               a.userId                 || '',
      dpi:                  a.dpi                    || '',
      address:              a.address                || '',
      name:                 a.name                   || '',
      jobName:              a.jobName                || '',
      monthlyIncome:        a.monthlyIncome           || '',
      phone:                a.phone                  || '',
    });
    setEditItem(a);
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.userId)        { showError('El ID de usuario es obligatorio'); return; }
    if (!form.monthlyIncome) { showError('El ingreso mensual es obligatorio'); return; }
    if (!form.address)       { showError('La dirección es obligatoria'); return; }
    if (!form.jobName)       { showError('La ocupación es obligatoria'); return; }
    if (!form.currencyCode)  { showError('La moneda es obligatoria'); return; }
    if (!editItem) {
      if (!form.dpi || form.dpi.length !== 13)   { showError('El DPI debe tener 13 dígitos'); return; }
      if (!form.phone || form.phone.length !== 8) { showError('El teléfono debe tener 8 dígitos'); return; }
    }

    setSaving(true);
    try {
      if (editItem) {
        const accNum = editItem.accountNumber;
        await updateAccount(accNum, {
          name:          form.name,
          address:       form.address,
          jobName:       form.jobName,
          monthlyIncome: Number(form.monthlyIncome),
        });
        setLocalData(prev => prev.map(a =>
          a.accountNumber === accNum ? { ...a, ...form } : a
        ));
        showSuccess('Cuenta actualizada');
      } else {
        const res = await createAccount({
          userId:               form.userId,
          currencyCode:         form.currencyCode,
          monthlyIncome:        Number(form.monthlyIncome),
          address:              form.address,
          jobName:              form.jobName,
          phone:                form.phone,
          dpi:                  form.dpi,
          accountType:          form.accountType,
          balance:              Number(form.balance) || 0,
          openingDate:          form.openingDate ? new Date(form.openingDate).toISOString() : new Date().toISOString(),
          status:               form.status,
          dailyWithdrawalLimit: Number(form.dailyWithdrawalLimit) || 1000,
          annualInterestRate:   Number(form.annualInterestRate)   || 0,
        });
        const newAccount = res.data?.data || res.data;
        setLocalData(prev => [newAccount, ...prev]);
        showSuccess('Cuenta creada exitosamente');
      }
      setModal(false);
      clearDataCache();
    } catch (e) {
      showError(e?.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const accNum = confirm.accountNumber;
    try {
      await deleteAccount(accNum);
      setLocalData(prev => prev.filter(a => a.accountNumber !== accNum));
      showSuccess('Cuenta eliminada');
    } catch (e) { showError(e?.response?.data?.message || 'Error al eliminar'); }
    setConfirm(null);
  };

  const handleToggleStatus = async (a) => {
    const accNum    = a.accountNumber;
    const newStatus = (a.status||'') === 'activa' ? 'inactiva' : 'activa';
    try {
      await toggleAccountStatus(accNum, newStatus);
      setLocalData(prev => prev.map(x =>
        x.accountNumber === accNum ? { ...x, status: newStatus } : x
      ));
      showSuccess(`Cuenta ${newStatus}`);
    } catch (e) { showError(e?.response?.data?.message || 'Error al cambiar estado'); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Cuentas</h1><p className="page-subtitle">Gestión completa de cuentas bancarias</p></div>
        <button className="btn-add" onClick={openCreate}>
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Nueva cuenta
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom:'1.25rem' }}>
        {[
          { label:'Total',    value: localData.length },
          { label:'Activas',  value: localData.filter(a=>a.status==='activa').length },
          { label:'Inactivas',value: localData.filter(a=>a.status==='inactiva').length },
          { label:'Balance total', value: 'Q ' + fmt(localData.reduce((s,a)=>s+Number(a.balance||0),0)) },
        ].map((s,i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-value" style={{fontSize:'1.4rem'}}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Todas las cuentas ({filtered.length})</span>
          <div style={{display:'flex',gap:'.75rem',alignItems:'center'}}>
            <div className="search-input-wrap">
              <span className="search-icon">
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
              <input className="search-input" placeholder="Buscar cuenta..."
                value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <button className="btn-secondary" onClick={()=>{ clearDataCache(); reload(); }}>
              <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Actualizar
            </button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>N° Cuenta</th><th>Tipo</th><th>Titular</th><th>Usuario ID</th>
              <th>Balance</th><th>Moneda</th><th>Estado</th><th>Apertura</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && localData.length===0 ? <LoadingRows cols={9}/> : filtered.map((a,i) => {
              const status = (a.status||'').toLowerCase();
              return (
                <tr key={a.accountNumber||i}>
                  <td style={{fontFamily:'monospace',color:'var(--gold-pure)',fontSize:'.85rem'}}>{a.accountNumber||'—'}</td>
                  <td><Badge value={a.accountType}/></td>
                  <td style={{color:'var(--white)',fontSize:'.85rem'}}>{a.name||'—'}</td>
                  <td style={{color:'var(--muted)',fontSize:'.78rem',fontFamily:'monospace'}}>{a.userId||'—'}</td>
                  <td style={{fontWeight:500,color:'var(--white)'}}>Q {fmt(a.balance)}</td>
                  <td style={{color:'var(--muted)',fontSize:'.8rem'}}>{a.currencyCode||'GTQ'}</td>
                  <td><Badge value={a.status||'—'}/></td>
                  <td style={{color:'var(--muted)',fontSize:'.8rem'}}>{fmtDate(a.openingDate||a.createdAt)}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" title="Ver detalle" onClick={()=>setDetailModal(a)}>
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                      <button className="btn-icon" title="Editar" onClick={()=>openEdit(a)}>
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                      <button className="btn-icon" title={status==='activa'?'Desactivar':'Activar'} onClick={()=>handleToggleStatus(a)}>
                        {status==='activa'
                          ? <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M18.36 6.64A9 9 0 015.64 19.36M6.34 6.34A9 9 0 0019 17.65M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          : <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round"/><path d="M22 4L12 14.01l-3-3" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        }
                      </button>
                      <button className="btn-icon danger" title="Eliminar" onClick={()=>setConfirm(a)}>
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                          <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length===0 && <EmptyState text="Sin cuentas registradas"/>}
          </tbody>
        </table>
      </div>

      {/* Modal Crear / Editar */}
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editItem ? 'Editar cuenta' : 'Nueva cuenta'}</span>
              <button className="modal-close" onClick={()=>setModal(false)}>✕</button>
            </div>
            <div className="modal-body">

              {/* ── CREAR ── */}
              {!editItem && (
                <>
                  <div className="modal-fields-row">
                    <AccountField label="ID de usuario *">
                      <input className="modal-input" placeholder="usr_XXXX"
                        value={form.userId}
                        onChange={e=>setForm(p=>({...p,userId:e.target.value}))}/>
                    </AccountField>
                    <AccountField label="Moneda *">
                      <select className="modal-select" value={form.currencyCode}
                        onChange={e=>setForm(p=>({...p,currencyCode:e.target.value}))}>
                        <option value="GTQ">GTQ — Quetzal</option>
                        <option value="USD">USD — Dólar</option>
                        <option value="EUR">EUR — Euro</option>
                      </select>
                    </AccountField>
                  </div>

                  <div className="modal-fields-row">
                    <AccountField label="Ocupación *">
                      <input className="modal-input" placeholder="Ingeniero, Comerciante..."
                        value={form.jobName}
                        onChange={e=>setForm(p=>({...p,jobName:e.target.value}))}/>
                    </AccountField>
                    <AccountField label="Ingreso mensual (Q) *">
                      <input className="modal-input" type="number" placeholder="5000"
                        value={form.monthlyIncome}
                        onChange={e=>setForm(p=>({...p,monthlyIncome:e.target.value}))}/>
                    </AccountField>
                  </div>

                  <AccountField label="Dirección *">
                    <input className="modal-input" placeholder="Zona 10, Ciudad de Guatemala"
                      value={form.address}
                      onChange={e=>setForm(p=>({...p,address:e.target.value}))}/>
                  </AccountField>

                  <div className="modal-fields-row">
                    <AccountField label="DPI (13 dígitos) *">
                      <input className="modal-input" placeholder="1234567890123" maxLength={13}
                        value={form.dpi}
                        onChange={e=>setForm(p=>({...p,dpi:e.target.value.replace(/\D/g,'')}))}/>
                    </AccountField>
                    <AccountField label="Teléfono (8 dígitos) *">
                      <input className="modal-input" placeholder="55123456" maxLength={8}
                        value={form.phone}
                        onChange={e=>setForm(p=>({...p,phone:e.target.value.replace(/\D/g,'')}))}/>
                    </AccountField>
                  </div>

                  <div className="modal-fields-row">
                    <AccountField label="Tipo de cuenta">
                      <select className="modal-select" value={form.accountType}
                        onChange={e=>setForm(p=>({...p,accountType:e.target.value}))}>
                        <option value="ahorro">Ahorro</option>
                        <option value="corriente">Corriente</option>
                        <option value="nomina">Nómina</option>
                      </select>
                    </AccountField>
                    <AccountField label="Balance inicial">
                      <input className="modal-input" type="number" placeholder="0.00"
                        value={form.balance}
                        onChange={e=>setForm(p=>({...p,balance:e.target.value}))}/>
                    </AccountField>
                  </div>

                  <div className="modal-fields-row">
                    <AccountField label="Límite retiro diario">
                      <input className="modal-input" type="number" placeholder="1000"
                        value={form.dailyWithdrawalLimit}
                        onChange={e=>setForm(p=>({...p,dailyWithdrawalLimit:e.target.value}))}/>
                    </AccountField>
                    <AccountField label="Tasa interés anual (%)">
                      <input className="modal-input" type="number" placeholder="4.5"
                        value={form.annualInterestRate}
                        onChange={e=>setForm(p=>({...p,annualInterestRate:e.target.value}))}/>
                    </AccountField>
                  </div>

                  <div className="modal-fields-row">
                    <AccountField label="Fecha apertura">
                      <input className="modal-input" type="date"
                        value={form.openingDate}
                        onChange={e=>setForm(p=>({...p,openingDate:e.target.value}))}/>
                    </AccountField>
                    <AccountField label="Estado inicial">
                      <select className="modal-select" value={form.status}
                        onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
                        <option value="activa">Activa</option>
                        <option value="inactiva">Inactiva</option>
                      </select>
                    </AccountField>
                  </div>
                </>
              )}

              {/* ── EDITAR ── */}
              {editItem && (
                <>
                  <div style={{background:'rgba(200,169,81,0.05)',border:'1px solid rgba(200,169,81,0.12)',borderRadius:8,padding:'.85rem 1rem',marginBottom:'.5rem',fontSize:'.82rem',color:'var(--gold-bright)'}}>
                    Cuenta: <strong style={{fontFamily:'monospace'}}>{editItem.accountNumber}</strong>
                  </div>
                  <div className="modal-fields-row">
                    <AccountField label="Nombre titular">
                      <input className="modal-input" placeholder="Juan"
                        value={form.name}
                        onChange={e=>setForm(p=>({...p,name:e.target.value}))}/>
                    </AccountField>
                    <AccountField label="Ocupación">
                      <input className="modal-input" placeholder="Desarrollador"
                        value={form.jobName}
                        onChange={e=>setForm(p=>({...p,jobName:e.target.value}))}/>
                    </AccountField>
                  </div>
                  <AccountField label="Dirección">
                    <input className="modal-input" placeholder="Zona 1, Ciudad de Guatemala"
                      value={form.address}
                      onChange={e=>setForm(p=>({...p,address:e.target.value}))}/>
                  </AccountField>
                  <div className="modal-fields-row">
                    <AccountField label="Ingreso mensual (Q)">
                      <input className="modal-input" type="number" placeholder="5000"
                        value={form.monthlyIncome}
                        onChange={e=>setForm(p=>({...p,monthlyIncome:e.target.value}))}/>
                    </AccountField>
                    <AccountField label="Teléfono (8 dígitos)">
                      <input className="modal-input" placeholder="55123456" maxLength={8}
                        value={form.phone}
                        onChange={e=>setForm(p=>({...p,phone:e.target.value.replace(/\D/g,'')}))}/>
                    </AccountField>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spin"/> : editItem ? 'Actualizar' : 'Crear cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {detailModal && (
        <div className="modal-overlay" onClick={()=>setDetailModal(null)}>
          <div className="modal" style={{maxWidth:500}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Detalle de cuenta</span>
              <button className="modal-close" onClick={()=>setDetailModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {[
                { label:'N° Cuenta',     value: detailModal.accountNumber,       mono:true },
                { label:'Tipo',          value: detailModal.accountType },
                { label:'Titular',       value: detailModal.name },
                { label:'Balance',       value: 'Q ' + fmt(detailModal.balance) },
                { label:'Moneda',        value: detailModal.currencyCode||'GTQ' },
                { label:'Estado',        value: detailModal.status },
                { label:'Usuario ID',    value: detailModal.userId,              mono:true },
                { label:'DPI',           value: detailModal.dpi||'—' },
                { label:'Teléfono',      value: detailModal.phone||'—' },
                { label:'Retiro diario', value: 'Q ' + fmt(detailModal.dailyWithdrawalLimit||0) },
                { label:'Tasa interés',  value: (detailModal.annualInterestRate||0) + '%' },
                { label:'Dirección',     value: detailModal.address||'—' },
                { label:'Apertura',      value: fmtDate(detailModal.openingDate||detailModal.createdAt) },
              ].map(({ label, value, mono }) => (
                <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'.65rem 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                  <span style={{fontSize:'.72rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em',fontWeight:500}}>{label}</span>
                  <span style={{fontSize:'.85rem',color:'var(--white)',fontFamily:mono?'monospace':'inherit',maxWidth:220,textAlign:'right'}}>{value||'—'}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={()=>setDetailModal(null)}>Cerrar</button>
              <button className="btn-save" onClick={()=>{ setDetailModal(null); openEdit(detailModal); }}>Editar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirm}
        title="Eliminar cuenta"
        message={`¿Eliminar la cuenta ${confirm?.accountNumber}? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={()=>setConfirm(null)}
      />
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
// ── FUERA del componente ──────────────────────────────
const LockField = ({ label, children }) => (
  <div className="modal-field">
    <label className="modal-label">{label}</label>
    {children}
  </div>
);
 
// ─────────────────────────────────────────────────────
const LocksSection = () => {
  const { user } = useAuthStore();
  const { data, loading, reload } = useData(getAccountLocks);
  const [localData, setLocalData] = useState([]);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [confirm, setConfirm]     = useState(null);
  const [saving, setSaving]       = useState(false);
 
 const emptyForm = {
  accountId:'', userId:'', lockReason:'seguridad',
  description:'', lockDate:'', unlockDate:'',
  lockedBy:'', unlockedBy:'', status:'bloqueado',
};
  const [form, setForm] = useState(emptyForm);
 
  useEffect(() => { if (data.length > 0) setLocalData(data); }, [data]);
 
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-GT') : '—';
 
  const filtered = localData.filter(l =>
    `${l.accountId||''} ${l.userId||''} ${l.lockReason||''} ${l.status||''}`
      .toLowerCase().includes(search.toLowerCase())
  );
 
  const openCreate = () => { setForm(emptyForm); setEditItem(null); setModal(true); };
 
  const openEdit = (l) => {
    setForm({
      accountId:   l.accountId   || '',
      userId:      l.userId      || '',
      lockReason:  l.lockReason  || 'seguridad',
      description: l.description || '',
      lockDate:    l.lockDate    ? l.lockDate.slice(0,16)   : '',
      unlockDate:  l.unlockDate  ? l.unlockDate.slice(0,16) : '',
      lockedBy:    l.lockedBy    || '',
      status:      l.status      || 'bloqueado',
      unlockedBy: l.unlockedBy || '',
    });
    setEditItem(l);
    setModal(true);
  };
 
  const handleSave = async () => {
  if (!form.accountId || !form.userId) {
    showError('N° de cuenta e ID de usuario son obligatorios');
    return;
  }
  setSaving(true);
  try {
    const payload = {
  accountId:   form.accountId.trim(),
  userId:      form.userId.trim(),
  lockReason:  form.lockReason,
  description: form.description,
  lockDate:    form.lockDate || new Date().toISOString(),
  unlockDate: form.unlockDate ? new Date(form.unlockDate).toISOString() : null,
  lockedBy:    form.lockedBy || form.userId,
  unlockedBy:  form.status === 'desbloqueado'
    ? (form.lockedBy || user?.id || form.userId)
    : undefined,
  status:      form.status,
};

Object.keys(payload).forEach(k => {
  if (payload[k] === undefined) delete payload[k];
});
    if (editItem) {
      const id = editItem._id || editItem.id;
      await updateAccountLock(id, payload);
      // Si cambia a desbloqueado → desbloquea la cuenta también
      if (form.status === 'desbloqueado') {
        try {
          await toggleAccountStatus(payload.accountId, 'activa');
        } catch (err) {
          console.warn('Error desbloqueando cuenta:', err?.response?.data?.message);
        }
      }
      setLocalData(prev =>
        prev.map(l =>
          (l._id || l.id) === id ? { ...l, ...payload } : l
        )
      );
      showSuccess('Bloqueo actualizado');
    } else {
      // 1. Crear el registro de bloqueo
      const res = await createAccountLock(payload);
      const newLock = res.data?.data || res.data;
      // 2. Cambiar estado de la cuenta a bloqueada
      try {
        await toggleAccountStatus(payload.accountId, 'bloqueada');
      } catch (err) {
        console.warn(
          'No se pudo cambiar estado de cuenta:',
          err?.response?.data?.message
        );
      }
      setLocalData(prev => [newLock, ...prev]);
      showSuccess('Cuenta bloqueada exitosamente');
    }
    setModal(false);
    clearDataCache();
  } catch (e) {
    console.error('ERROR COMPLETO:', e);
    console.error('RESPONSE:', e?.response?.data);
     console.error('ERRORS DETAIL:', JSON.stringify(e?.response?.data?.errors));
  showError(e?.response?.data?.message || e?.response?.data?.error || 'Error al guardar');
    showError(
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      'Error al guardar'
    );

  } finally {
    setSaving(false);
  }
};
 
  const handleDelete = async () => {
  const id    = confirm._id || confirm.id;
  const accId = confirm.accountId;
  try {
    await deleteAccountLock(id);
    try { await toggleAccountStatus(accId, 'activa'); } catch {}
    setLocalData(prev => prev.filter(l => (l._id||l.id) !== id));
    showSuccess('Bloqueo eliminado — cuenta desbloqueada');
  } catch(e) { showError(e?.response?.data?.message || 'Error al eliminar'); }
  setConfirm(null);
};
 
  const lockReasons = ['seguridad','fraude','solicitud_cliente','deuda','inactividad'];
 
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cuentas Bloqueadas</h1>
          <p className="page-subtitle">Gestión de bloqueos — al crear un bloqueo la cuenta queda bloqueada automáticamente</p>
        </div>
        <button className="btn-add" onClick={openCreate}>
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Bloquear cuenta
        </button>
      </div>
 
      {/* Stats */}
      <div className="stats-grid" style={{marginBottom:'1.25rem'}}>
        {[
          { label:'Total bloqueos', value: localData.length },
          { label:'Por seguridad',  value: localData.filter(l=>(l.lockReason||'').toLowerCase()==='seguridad').length },
          { label:'Por fraude',     value: localData.filter(l=>(l.lockReason||'').toLowerCase()==='fraude').length },
          { label:'Otros motivos',  value: localData.filter(l=>!['seguridad','fraude'].includes((l.lockReason||'').toLowerCase())).length },
        ].map((s,i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-value" style={{fontSize:'1.4rem'}}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>
 
      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Bloqueos activos ({filtered.length})</span>
          <div style={{display:'flex',gap:'.75rem',alignItems:'center'}}>
            <div className="search-input-wrap">
              <span className="search-icon">
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
              <input className="search-input" placeholder="Buscar por cuenta, usuario..."
                value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <button className="btn-secondary" onClick={()=>{clearDataCache();reload();}}>
              <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Actualizar
            </button>
          </div>
        </div>
 
        <table className="data-table">
          <thead>
            <tr>
              <th>Cuenta</th>
              <th>Usuario</th>
              <th>Motivo</th>
              <th>Descripción</th>
              <th>Bloqueado por</th>
              <th>Fecha bloqueo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && localData.length===0 ? <LoadingRows cols={8}/> : filtered.map((l,i) => (
              <tr key={l._id||l.id||i}>
                <td style={{fontFamily:'monospace',color:'var(--gold-pure)',fontSize:'.85rem'}}>{l.accountId||'—'}</td>
                <td style={{color:'var(--muted)',fontSize:'.8rem',fontFamily:'monospace'}}>{l.userId||'—'}</td>
                <td><Badge value={l.lockReason}/></td>
                <td style={{color:'var(--muted)',fontSize:'.8rem',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.description||'—'}</td>
                <td style={{color:'var(--muted)',fontSize:'.8rem',fontFamily:'monospace'}}>{l.lockedBy||'—'}</td>
                <td style={{color:'var(--muted)',fontSize:'.8rem'}}>{fmtDate(l.lockDate||l.createdAt)}</td>
                <td><Badge value={l.status||'bloqueado'}/></td>
                <td>
                  <div className="action-btns">
                    <button className="btn-icon" title="Editar bloqueo" onClick={()=>openEdit(l)}>
                      <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <button className="btn-icon danger" title="Eliminar bloqueo / Desbloquear cuenta" onClick={()=>setConfirm(l)}>
                      <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                        <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length===0 && <EmptyState text="Sin bloqueos registrados"/>}
          </tbody>
        </table>
      </div>
 
      {/* ── Modal Crear / Editar ── */}
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" style={{maxWidth:540}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editItem ? 'Editar bloqueo' : 'Bloquear cuenta'}</span>
              <button className="modal-close" onClick={()=>setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
 
              <div className="modal-fields-row">
                <LockField label="N° de cuenta *">
                  <input className="modal-input" placeholder="ACC-000-0000"
                    value={form.accountId}
                    onChange={e=>setForm(p=>({...p,accountId:e.target.value}))}/>
                </LockField>
                <LockField label="ID de usuario *">
                  <input className="modal-input" placeholder="usr_XXXX"
                    value={form.userId}
                    onChange={e=>setForm(p=>({...p,userId:e.target.value}))}/>
                </LockField>
              </div>
 
              <div className="modal-fields-row">
                <LockField label="Motivo del bloqueo">
                  <select className="modal-select" value={form.lockReason}
                    onChange={e=>setForm(p=>({...p,lockReason:e.target.value}))}>
                    {lockReasons.map(r => (
                      <option key={r} value={r}>{r.replace(/_/g,' ')}</option>
                    ))}
                  </select>
                </LockField>
                <LockField label="Estado">
                  <select className="modal-select" value={form.status}
                    onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
                    <option value="bloqueado">Bloqueado</option>
                    <option value="desbloqueado">Desbloqueado</option>
                  </select>
                </LockField>
              </div>
 
              <LockField label="Descripción">
                <input className="modal-input" placeholder="Describe el motivo del bloqueo..."
                  value={form.description}
                  onChange={e=>setForm(p=>({...p,description:e.target.value}))}/>
              </LockField>
 
              <div className="modal-fields-row">
                <LockField label="Fecha de bloqueo">
                  <input className="modal-input" type="datetime-local"
                    value={form.lockDate}
                    onChange={e=>setForm(p=>({...p,lockDate:e.target.value}))}/>
                </LockField>
                <LockField label="Fecha de desbloqueo">
                  <input className="modal-input" type="datetime-local"
                    value={form.unlockDate}
                    onChange={e=>setForm(p=>({...p,unlockDate:e.target.value}))}/>
                </LockField>
              </div>
 
              {form.status === 'desbloqueado' && (
  <LockField label="Desbloqueado por (ID admin)">
    <input className="modal-input" placeholder="usr_XXXX"
      value={form.unlockedBy}
      onChange={e=>setForm(p=>({...p,unlockedBy:e.target.value}))}/>
  </LockField>
)}
 
              {/* Aviso */}
              <div style={{
                background:'rgba(224,92,92,0.06)',
                border:'1px solid rgba(224,92,92,0.15)',
                borderRadius:8, padding:'.85rem 1rem',
                display:'flex', gap:'.6rem', alignItems:'flex-start'
              }}>
                <svg viewBox="0 0 24 24" fill="none" width="15" height="15" style={{flexShrink:0,marginTop:1}}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M12 9v4M12 17h.01" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p style={{fontSize:'.78rem',color:'rgba(224,92,92,0.8)',lineHeight:1.5,margin:0}}>
                  {editItem
                    ? 'Al cambiar el estado a "Desbloqueado" la cuenta quedará activa nuevamente.'
                    : 'Al crear este bloqueo la cuenta será bloqueada automáticamente y el usuario no podrá realizar operaciones.'
                  }
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}
                style={!editItem ? {
                  background:'linear-gradient(135deg,#c0392b,#e05c5c)',
                } : {}}>
                {saving ? <span className="spin"/> : editItem ? 'Actualizar bloqueo' : 'Bloquear cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}
 
      <ConfirmModal
        open={!!confirm}
        title="Eliminar bloqueo"
        message={`¿Eliminar el bloqueo de la cuenta ${confirm?.accountId}? La cuenta quedará activa nuevamente.`}
        onConfirm={handleDelete}
        onCancel={()=>setConfirm(null)}
      />
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