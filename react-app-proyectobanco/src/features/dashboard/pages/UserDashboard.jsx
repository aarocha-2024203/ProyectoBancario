import { useState } from 'react';
import DashboardLayout from '../../../shared/components/layout/DashboardLayout';
import { useData } from '../../../shared/hooks/useData';
import { showSuccess, showError } from '../../../shared/utils/toast';
import {
  getAccounts, getCards, getTransactions, getLoans,
  getAccountStatements, createTransaction, createWithdrawal, createDeposit,
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
  const {user}=useAuthStore();
  const {data:accounts,loading:la}=useData(getAccounts);
  const {data:cards,loading:lc}=useData(getCards);
  const {data:loans,loading:ll}=useData(getLoans);
  const {data:transactions,loading:lt}=useData(getTransactions);
  const totalBalance=accounts.reduce((s,a)=>s+Number(a.balance||a.Balance||0),0);
  return(
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
        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'3rem',fontWeight:600,color:'var(--white)',lineHeight:1}}>Q {la?'...' :fmt(totalBalance)}</p>
        <p style={{fontSize:'.82rem',color:'var(--muted)',marginTop:'.5rem'}}>{la?'...' :accounts.length} cuenta{accounts.length!==1?'s':''} activa{accounts.length!==1?'s':''}</p>
      </div>

      <div className="stats-grid">
        {[
          {label:'Mis cuentas',value:la?'...':accounts.length,icon:'🏦'},
          {label:'Mis tarjetas',value:lc?'...':cards.length,icon:'💳'},
          {label:'Mis préstamos',value:ll?'...':loans.length,icon:'📋'},
          {label:'Transacciones',value:lt?'...':transactions.length,icon:'↕️'},
        ].map((s,i)=>(
          <div key={i} className="stat-card">
            <div className="stat-card-icon"><span style={{fontSize:'1.1rem'}}>{s.icon}</span></div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Últimas transacciones */}
      <div className="table-card" style={{marginTop:'1.5rem'}}>
        <div className="table-header"><span className="table-title">Últimos movimientos</span></div>
        <table className="data-table">
          <thead><tr><th>Tipo</th><th>Origen</th><th>Destino</th><th>Monto</th><th>Fecha</th></tr></thead>
          <tbody>
            {lt?<LoadingRows cols={5}/>:transactions.slice(0,5).map((t,i)=>(
              <tr key={i}>
                <td><Badge value={t.transactionType||t.TransactionType}/></td>
                <td style={{fontFamily:'monospace',fontSize:'.82rem',color:'var(--gold-pure)'}}>{t.sourceAccountId||t.SourceAccountId||'—'}</td>
                <td style={{fontFamily:'monospace',fontSize:'.82rem',color:'var(--gold-pure)'}}>{t.destinationAccountId||t.DestinationAccountId||'—'}</td>
                <td style={{fontWeight:500}}>Q {fmt(t.amount||t.Amount)}</td>
                <td style={{color:'var(--muted)',fontSize:'.82rem'}}>{fmtDate(t.createdAt||t.date)}</td>
              </tr>
            ))}
            {!lt&&transactions.length===0&&<EmptyState text="Sin movimientos recientes"/>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── Cuentas usuario ── */
const UserAccounts = () => {
  const {data,loading}=useData(getAccounts);
  return(
    <div>
      <div className="page-header"><div><h1 className="page-title">Mis Cuentas</h1><p className="page-subtitle">Tus cuentas bancarias activas</p></div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem',marginBottom:'1.5rem'}}>
        {loading?[1,2].map(i=><div key={i} className="stat-card"><div className="skeleton" style={{height:80}}/></div>):
        data.map((a,i)=>(
          <div key={i} style={{background:'linear-gradient(135deg,rgba(15,30,53,0.9),rgba(22,40,71,0.8))',border:'1px solid rgba(200,169,81,0.15)',borderRadius:16,padding:'1.5rem',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,right:0,width:100,height:100,background:'radial-gradient(circle,rgba(200,169,81,0.05) 0%,transparent 70%)',borderRadius:'50%'}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem'}}>
              <Badge value={a.accountType||a.AccountType||'—'}/>
              <Badge value={a.status||a.Status||'—'}/>
            </div>
            <p style={{fontFamily:'monospace',color:'var(--gold-pure)',fontSize:'.85rem',marginBottom:'.5rem'}}>{a.accountNumber||a.AccountNumber||'—'}</p>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.8rem',fontWeight:600,color:'var(--white)'}}>Q {fmt(a.balance||a.Balance)}</p>
            <p style={{fontSize:'.72rem',color:'var(--muted)',marginTop:'.4rem'}}>Apertura: {fmtDate(a.openingDate||a.createdAt)}</p>
          </div>
        ))}
        {!loading&&data.length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:'3rem',color:'var(--muted)'}}>No tienes cuentas activas</div>}
      </div>
    </div>
  );
};

/* ── Tarjetas usuario ── */
const UserCards = () => {
  const {data,loading}=useData(getCards);
  return(
    <div>
      <div className="page-header"><div><h1 className="page-title">Mis Tarjetas</h1><p className="page-subtitle">Tus tarjetas de crédito y débito</p></div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'1.25rem'}}>
        {loading?[1,2].map(i=><div key={i} className="stat-card"><div className="skeleton" style={{height:100}}/></div>):
        data.map((c,i)=>{
          const isBlocked=(c.status||c.Status||'').toLowerCase()==='bloqueada';
          return(
            <div key={i} style={{background:isBlocked?'rgba(224,92,92,0.04)':'linear-gradient(135deg,rgba(200,169,81,0.08),rgba(15,30,53,0.95))',border:`1px solid ${isBlocked?'rgba(224,92,92,0.2)':'rgba(200,169,81,0.15)'}`,borderRadius:16,padding:'1.5rem',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:-20,right:-20,width:120,height:120,background:`radial-gradient(circle,${isBlocked?'rgba(224,92,92,0.06)':'rgba(200,169,81,0.06)'} 0%,transparent 70%)`,borderRadius:'50%'}}/>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1rem'}}>
                <span style={{fontSize:'.75rem',textTransform:'uppercase',letterSpacing:'.1em',color:'var(--muted)'}}>{c.cardType||c.CardType||'Tarjeta'}</span>
                <Badge value={c.status||c.Status||'activa'}/>
              </div>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.6rem',fontWeight:600,color:isBlocked?'var(--danger)':'var(--white)',marginBottom:'.5rem'}}>Q {fmt(c.availableBalance||c.AvailableBalance)}</p>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:'1rem',paddingTop:'.75rem',borderTop:`1px solid ${isBlocked?'rgba(224,92,92,0.1)':'rgba(200,169,81,0.1)'}`}}>
                <div><p style={{fontSize:'.65rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em'}}>Vence</p><p style={{fontSize:'.82rem',color:'var(--white)'}}>{fmtDate(c.expirationDate||c.ExpirationDate)}</p></div>
                <div style={{textAlign:'right'}}><p style={{fontSize:'.65rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em'}}>CVV</p><p style={{fontSize:'.82rem',color:'var(--white)'}}>***</p></div>
              </div>
            </div>
          );
        })}
        {!loading&&data.length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:'3rem',color:'var(--muted)'}}>No tienes tarjetas registradas</div>}
      </div>
    </div>
  );
};

/* ── Transferencias usuario ── */
const UserTransactions = () => {
  const {data,loading,reload}=useData(getTransactions);
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({sourceAccountId:'',destinationAccountId:'',transactionType:'transferencia',amount:'',description:''});
  const [saving,setSaving]=useState(false);
  const handleCreate=async()=>{
    setSaving(true);
    try{ await createTransaction({...form,amount:Number(form.amount)}); showSuccess('Transferencia realizada'); setModal(false); reload(); }
    catch(e){ showError(e?.response?.data?.message||'Error'); }
    finally{ setSaving(false); }
  };
  return(
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Transferencias</h1><p className="page-subtitle">Historial de movimientos y transferencias</p></div>
        <button className="btn-add" onClick={()=>setModal(true)}><PlusIcon/>Nueva transferencia</button>
      </div>
      <div className="table-card">
        <div className="table-header"><span className="table-title">Mis movimientos ({data.length})</span></div>
        <table className="data-table">
          <thead><tr><th>Tipo</th><th>Origen</th><th>Destino</th><th>Monto</th><th>Fecha</th></tr></thead>
          <tbody>
            {loading?<LoadingRows cols={5}/>:data.map((t,i)=>(
              <tr key={i}>
                <td><Badge value={t.transactionType||t.TransactionType}/></td>
                <td style={{fontFamily:'monospace',fontSize:'.82rem',color:'var(--gold-pure)'}}>{t.sourceAccountId||t.SourceAccountId||'—'}</td>
                <td style={{fontFamily:'monospace',fontSize:'.82rem',color:'var(--gold-pure)'}}>{t.destinationAccountId||t.DestinationAccountId||'—'}</td>
                <td style={{fontWeight:500}}>Q {fmt(t.amount||t.Amount)}</td>
                <td style={{color:'var(--muted)',fontSize:'.82rem'}}>{fmtDate(t.createdAt||t.date)}</td>
              </tr>
            ))}
            {!loading&&data.length===0&&<EmptyState text="Sin transacciones"/>}
          </tbody>
        </table>
      </div>
      {modal&&(<div className="modal-overlay" onClick={()=>setModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><span className="modal-title">Nueva Transferencia</span><button className="modal-close" onClick={()=>setModal(false)}>✕</button></div>
        <div className="modal-body">
          <div className="modal-fields-row">
            <div className="modal-field"><label className="modal-label">Cuenta origen</label><input className="modal-input" placeholder="ACC-000-0000" value={form.sourceAccountId} onChange={e=>setForm(p=>({...p,sourceAccountId:e.target.value}))}/></div>
            <div className="modal-field"><label className="modal-label">Cuenta destino</label><input className="modal-input" placeholder="ACC-000-0000" value={form.destinationAccountId} onChange={e=>setForm(p=>({...p,destinationAccountId:e.target.value}))}/></div>
          </div>
          <div className="modal-fields-row">
            <div className="modal-field"><label className="modal-label">Tipo</label><select className="modal-select" value={form.transactionType} onChange={e=>setForm(p=>({...p,transactionType:e.target.value}))}><option value="transferencia">Transferencia</option><option value="pago">Pago</option></select></div>
            <div className="modal-field"><label className="modal-label">Monto</label><input className="modal-input" type="number" placeholder="0.00" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))}/></div>
          </div>
          <div className="modal-field"><label className="modal-label">Descripción</label><input className="modal-input" placeholder="Descripción opcional" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
        </div>
        <div className="modal-footer"><button className="btn-cancel" onClick={()=>setModal(false)}>Cancelar</button><button className="btn-save" onClick={handleCreate} disabled={saving}>{saving?<span className="spin"/>:'Transferir'}</button></div>
      </div></div>)}
    </div>
  );
};

/* ── Préstamos usuario ── */
const UserLoans = () => {
  const {data,loading}=useData(getLoans);
  return(
    <div>
      <div className="page-header"><div><h1 className="page-title">Mis Préstamos</h1><p className="page-subtitle">Estado de tus créditos y financiamientos</p></div></div>
      <div className="table-card">
        <div className="table-header"><span className="table-title">Préstamos ({data.length})</span></div>
        <table className="data-table">
          <thead><tr><th>Cuenta</th><th>Solicitado</th><th>Aprobado</th><th>Tasa</th><th>Plazo</th><th>Estado</th></tr></thead>
          <tbody>
            {loading?<LoadingRows cols={6}/>:data.map((l,i)=>(
              <tr key={i}>
                <td style={{fontFamily:'monospace',color:'var(--gold-pure)',fontSize:'.82rem'}}>{l.accountNumber||l.AccountNumber||'—'}</td>
                <td>Q {fmt(l.requestedAmount||l.RequestedAmount)}</td>
                <td style={{color:'var(--success)',fontWeight:500}}>Q {fmt(l.approvedAmount||l.ApprovedAmount)}</td>
                <td style={{color:'var(--muted)'}}>{l.interestRate||l.InterestRate||'—'}%</td>
                <td style={{color:'var(--muted)'}}>{l.termMonths||l.TermMonths||'—'} m</td>
                <td><Badge value={l.status||l.Status}/></td>
              </tr>
            ))}
            {!loading&&data.length===0&&<EmptyState text="Sin préstamos activos"/>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── Depósitos usuario ── */
const UserDeposits = () => {
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({accountNumber:'',amount:'',currencyCode:'GTQ',description:''});
  const [saving,setSaving]=useState(false);
  const handleCreate=async()=>{
    setSaving(true);
    try{ await createDeposit({...form,amount:Number(form.amount)}); showSuccess('Depósito realizado'); setModal(false); setForm({accountNumber:'',amount:'',currencyCode:'GTQ',description:''}); }
    catch(e){ showError(e?.response?.data?.message||'Error'); }
    finally{ setSaving(false); }
  };
  return(
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Depósitos</h1><p className="page-subtitle">Depositar fondos en una cuenta</p></div>
        <button className="btn-add" onClick={()=>setModal(true)}><PlusIcon/>Nuevo depósito</button>
      </div>
      <div className="table-card"><div style={{padding:'3rem',textAlign:'center',color:'var(--muted)'}}>
        <svg viewBox="0 0 24 24" fill="none" width="40" height="40" style={{opacity:.15,display:'block',margin:'0 auto 1rem'}}><path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <p style={{fontSize:'.9rem'}}>Presiona "Nuevo depósito" para acreditar fondos.</p>
      </div></div>
      {modal&&(<div className="modal-overlay" onClick={()=>setModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><span className="modal-title">Nuevo Depósito</span><button className="modal-close" onClick={()=>setModal(false)}>✕</button></div>
        <div className="modal-body">
          <div className="modal-field"><label className="modal-label">N° de Cuenta</label><input className="modal-input" placeholder="ACC-000-0000" value={form.accountNumber} onChange={e=>setForm(p=>({...p,accountNumber:e.target.value}))}/></div>
          <div className="modal-fields-row">
            <div className="modal-field"><label className="modal-label">Monto</label><input className="modal-input" type="number" placeholder="0.00" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))}/></div>
            <div className="modal-field"><label className="modal-label">Moneda</label><select className="modal-select" value={form.currencyCode} onChange={e=>setForm(p=>({...p,currencyCode:e.target.value}))}><option value="GTQ">GTQ</option><option value="USD">USD</option><option value="EUR">EUR</option></select></div>
          </div>
          <div className="modal-field"><label className="modal-label">Descripción</label><input className="modal-input" placeholder="Motivo" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
        </div>
        <div className="modal-footer"><button className="btn-cancel" onClick={()=>setModal(false)}>Cancelar</button><button className="btn-save" onClick={handleCreate} disabled={saving}>{saving?<span className="spin"/>:'Depositar'}</button></div>
      </div></div>)}
    </div>
  );
};

/* ── Retiros usuario ── */
const UserWithdrawals = () => {
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({accountNumber:'',amount:''});
  const [saving,setSaving]=useState(false);
  const handleCreate=async()=>{
    setSaving(true);
    try{ await createWithdrawal({accountNumber:form.accountNumber,amount:Number(form.amount)}); showSuccess('Retiro realizado'); setModal(false); setForm({accountNumber:'',amount:''}); }
    catch(e){ showError(e?.response?.data?.message||'Error'); }
    finally{ setSaving(false); }
  };
  return(
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Retiros</h1><p className="page-subtitle">Retirar fondos de una cuenta</p></div>
        <button className="btn-add" onClick={()=>setModal(true)}><PlusIcon/>Nuevo retiro</button>
      </div>
      <div className="table-card"><div style={{padding:'3rem',textAlign:'center',color:'var(--muted)'}}>
        <svg viewBox="0 0 24 24" fill="none" width="40" height="40" style={{opacity:.15,display:'block',margin:'0 auto 1rem'}}><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <p style={{fontSize:'.9rem'}}>Presiona "Nuevo retiro" para retirar fondos.</p>
      </div></div>
      {modal&&(<div className="modal-overlay" onClick={()=>setModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><span className="modal-title">Nuevo Retiro</span><button className="modal-close" onClick={()=>setModal(false)}>✕</button></div>
        <div className="modal-body">
          <div className="modal-field"><label className="modal-label">N° de Cuenta</label><input className="modal-input" placeholder="ACC-000-0000" value={form.accountNumber} onChange={e=>setForm(p=>({...p,accountNumber:e.target.value}))}/></div>
          <div className="modal-field"><label className="modal-label">Monto</label><input className="modal-input" type="number" placeholder="0.00" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))}/></div>
        </div>
        <div className="modal-footer"><button className="btn-cancel" onClick={()=>setModal(false)}>Cancelar</button><button className="btn-save" onClick={handleCreate} disabled={saving}>{saving?<span className="spin"/>:'Retirar'}</button></div>
      </div></div>)}
    </div>
  );
};

/* ── Estado de cuenta usuario ── */
const UserStatements = () => {
  const {data,loading}=useData(getAccountStatements);
  return(
    <div>
      <div className="page-header"><div><h1 className="page-title">Estado de Cuenta</h1><p className="page-subtitle">Historial de estados de tu cuenta</p></div></div>
      <div className="table-card">
        <div className="table-header"><span className="table-title">Estados ({data.length})</span></div>
        <table className="data-table">
          <thead><tr><th>Cuenta</th><th>Balance inicial</th><th>Balance final</th><th>Fecha</th></tr></thead>
          <tbody>
            {loading?<LoadingRows cols={4}/>:data.map((s,i)=>(
              <tr key={i}>
                <td style={{fontFamily:'monospace',color:'var(--gold-pure)'}}>{s.accountNumber||s.accountId||'—'}</td>
                <td>Q {fmt(s.openingBalance||s.initialBalance||0)}</td>
                <td style={{fontWeight:500,color:'var(--white)'}}>Q {fmt(s.closingBalance||s.finalBalance||0)}</td>
                <td style={{color:'var(--muted)',fontSize:'.82rem'}}>{fmtDate(s.createdAt||s.date)}</td>
              </tr>
            ))}
            {!loading&&data.length===0&&<EmptyState text="Sin estados de cuenta"/>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ══ MAIN ══ */
const USER_SECTIONS = {
  overview:UserOverview, accounts:UserAccounts, cards:UserCards,
  transactions:UserTransactions, loans:UserLoans,
  deposits:UserDeposits, withdrawals:UserWithdrawals, statements:UserStatements, profile: ProfilePage,
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