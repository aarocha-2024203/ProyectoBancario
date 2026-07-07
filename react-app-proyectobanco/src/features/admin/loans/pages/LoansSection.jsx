import { useState, useEffect } from 'react';
import { useData, clearDataCache } from '../../../../shared/hooks/useData';
import { showSuccess, showError } from '../../../../shared/utils/toast';
import { getLoans, createLoan } from '../../../../shared/api/banking';
import LoadingRows from '../../shared/LoadingRows';
import EmptyState from '../../shared/EmptyState';
import ConfirmModal from '../../shared/ConfirmModal';
import LoanField from '../components/LoanField';
import { fmt, fmtDate } from '../../shared/formatters';

const BANKING_URL = import.meta.env.VITE_BANKING_URL || 'http://localhost:3006/api/v1';

const STATUS_COLORS = {
  solicitado:   { bg: 'rgba(234,179,8,0.1)',  border: 'rgba(234,179,8,0.25)',  color: '#eab308' },
  aprobado:     { bg: 'rgba(76,175,125,0.1)', border: 'rgba(76,175,125,0.25)', color: '#4caf7d' },
  rechazado:    { bg: 'rgba(224,92,92,0.1)',  border: 'rgba(224,92,92,0.25)',  color: '#e05c5c' },
  desembolsado: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)', color: '#6366f1' },
  pagado:       { bg: 'rgba(200,169,81,0.1)', border: 'rgba(200,169,81,0.25)', color: '#c8a951' },
  vencido:      { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)',  color: '#ef4444' },
};

const EMPTY_FORM = {
  userId: '', accountNumber: '', requestedAmount: '', approvedAmount: '',
  interestRate: '', termMonths: '', monthlyPayment: '', outstandingBalance: '',
  requestDate: '', approvalDate: '', disbursementDate: '',
  status: 'solicitado', loanPurpose: '', approvedByUserId: '',
};

const LoansSection = () => {
  const { data, loading, reload } = useData(getLoans);
  const [localData, setLocalData]       = useState([]);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [modal, setModal]               = useState(false);
  const [editModal, setEditModal]       = useState(null);
  const [confirm, setConfirm]           = useState(null);
  const [detailModal, setDetailModal]   = useState(null);
  const [saving, setSaving]             = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);

  useEffect(() => { if (data.length > 0) setLocalData(data); }, [data]);

  const filtered = localData
    .filter(l => statusFilter === 'todos' || l.status === statusFilter)
    .filter(l =>
      `${l.userId || ''} ${l.accountNumber || ''} ${l.status || ''} ${l.loanPurpose || ''}`
        .toLowerCase().includes(search.toLowerCase())
    );

  const f = p => ({ ...form, ...p });

  const openEdit = (l) => {
    setForm({
      userId:             l.userId             || '',
      accountNumber:      l.accountNumber      || '',
      requestedAmount:    l.requestedAmount    || '',
      approvedAmount:     l.approvedAmount     || '',
      interestRate:       l.interestRate       || '',
      termMonths:         l.termMonths         || '',
      monthlyPayment:     l.monthlyPayment     || '',
      outstandingBalance: l.outstandingBalance || '',
      requestDate:        l.requestDate        ? l.requestDate.slice(0, 10)        : '',
      approvalDate:       l.approvalDate       ? l.approvalDate.slice(0, 10)       : '',
      disbursementDate:   l.disbursementDate   ? l.disbursementDate.slice(0, 10)   : '',
      status:             l.status             || 'solicitado',
      loanPurpose:        l.loanPurpose        || '',
      approvedByUserId:   l.approvedByUserId   || '',
    });
    setEditModal(l);
  };

  const handleCreate = async () => {
    if (!form.userId)          { showError('El ID de usuario es obligatorio'); return; }
    if (!form.accountNumber)   { showError('El número de cuenta es obligatorio'); return; }
    if (!form.requestedAmount) { showError('El monto solicitado es obligatorio'); return; }
    setSaving(true);
    try {
      const res = await createLoan({
        userId:             form.userId.trim(),
        accountNumber:      form.accountNumber.trim().toUpperCase(),
        requestedAmount:    Number(form.requestedAmount),
        approvedAmount:     form.approvedAmount     ? Number(form.approvedAmount)     : undefined,
        interestRate:       form.interestRate       ? Number(form.interestRate)       : undefined,
        termMonths:         form.termMonths         ? Number(form.termMonths)         : undefined,
        monthlyPayment:     form.monthlyPayment     ? Number(form.monthlyPayment)     : undefined,
        outstandingBalance: form.outstandingBalance ? Number(form.outstandingBalance) : undefined,
        requestDate:        form.requestDate        ? new Date(form.requestDate).toISOString()        : undefined,
        approvalDate:       form.approvalDate       ? new Date(form.approvalDate).toISOString()       : undefined,
        disbursementDate:   form.disbursementDate   ? new Date(form.disbursementDate).toISOString()   : undefined,
        status:             form.status,
        loanPurpose:        form.loanPurpose,
        approvedByUserId:   form.approvedByUserId || undefined,
      });
      const newLoan = res.data?.data || res.data;
      setLocalData(prev => [newLoan, ...prev]);
      showSuccess('Préstamo creado');
      setModal(false);
      setForm(EMPTY_FORM);
      clearDataCache();
    } catch (e) { showError(e?.response?.data?.message || e?.response?.data?.error || 'Error al crear'); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    setSaving(true);
    try {
      const id    = editModal._id;
      const token = JSON.parse(localStorage.getItem('bancario-auth'))?.state?.token;
      const res   = await fetch(`${BANKING_URL}/loan/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId:             form.userId,
          accountNumber:      form.accountNumber.toUpperCase(),
          requestedAmount:    Number(form.requestedAmount),
          approvedAmount:     form.approvedAmount     ? Number(form.approvedAmount)     : undefined,
          interestRate:       form.interestRate       ? Number(form.interestRate)       : undefined,
          termMonths:         form.termMonths         ? Number(form.termMonths)         : undefined,
          monthlyPayment:     form.monthlyPayment     ? Number(form.monthlyPayment)     : undefined,
          outstandingBalance: form.outstandingBalance ? Number(form.outstandingBalance) : undefined,
          requestDate:        form.requestDate        ? new Date(form.requestDate).toISOString()      : undefined,
          approvalDate:       form.approvalDate       ? new Date(form.approvalDate).toISOString()     : undefined,
          disbursementDate:   form.disbursementDate   ? new Date(form.disbursementDate).toISOString() : undefined,
          status:             form.status,
          loanPurpose:        form.loanPurpose,
          approvedByUserId:   form.approvedByUserId || undefined,
        }),
      });
      const d = await res.json();
      if (d.success) {
        showSuccess('Préstamo actualizado');
        setEditModal(null);
        clearDataCache();
        reload();
      } else { showError(d.message || 'Error al actualizar'); }
    } catch { showError('Error de conexión'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const id    = confirm._id;
    const token = JSON.parse(localStorage.getItem('bancario-auth'))?.state?.token;
    try {
      const res = await fetch(`${BANKING_URL}/loan/${id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) { setLocalData(prev => prev.filter(l => l._id !== id)); showSuccess('Préstamo eliminado'); }
      else { showError(d.message || 'Error al eliminar'); }
    } catch { showError('Error de conexión'); }
    setConfirm(null);
  };

  const ModalForm = () => (
    <>
      <div className="modal-fields-row">
        <LoanField label="ID de usuario *"><input className="modal-input" placeholder="usr_XXXX" value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))}/></LoanField>
        <LoanField label="N° de cuenta *"><input className="modal-input" placeholder="ACC-000-0000" value={form.accountNumber} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value.toUpperCase() }))}/></LoanField>
      </div>
      <div className="modal-fields-row">
        <LoanField label="Monto solicitado (Q) *"><input className="modal-input" type="number" placeholder="10000" value={form.requestedAmount} onChange={e => setForm(p => ({ ...p, requestedAmount: e.target.value }))}/></LoanField>
        <LoanField label="Monto aprobado (Q)"><input className="modal-input" type="number" placeholder="9000" value={form.approvedAmount} onChange={e => setForm(p => ({ ...p, approvedAmount: e.target.value }))}/></LoanField>
      </div>
      <div className="modal-fields-row">
        <LoanField label="Tasa de interés (%)"><input className="modal-input" type="number" placeholder="12" value={form.interestRate} onChange={e => setForm(p => ({ ...p, interestRate: e.target.value }))}/></LoanField>
        <LoanField label="Plazo (meses)"><input className="modal-input" type="number" placeholder="24" value={form.termMonths} onChange={e => setForm(p => ({ ...p, termMonths: e.target.value }))}/></LoanField>
      </div>
      <div className="modal-fields-row">
        <LoanField label="Cuota mensual (Q)"><input className="modal-input" type="number" placeholder="850" value={form.monthlyPayment} onChange={e => setForm(p => ({ ...p, monthlyPayment: e.target.value }))}/></LoanField>
        <LoanField label="Saldo pendiente (Q)"><input className="modal-input" type="number" placeholder="18000" value={form.outstandingBalance} onChange={e => setForm(p => ({ ...p, outstandingBalance: e.target.value }))}/></LoanField>
      </div>
      <div className="modal-fields-row">
        <LoanField label="Fecha solicitud"><input className="modal-input" type="date" value={form.requestDate} onChange={e => setForm(p => ({ ...p, requestDate: e.target.value }))}/></LoanField>
        <LoanField label="Fecha aprobación"><input className="modal-input" type="date" value={form.approvalDate} onChange={e => setForm(p => ({ ...p, approvalDate: e.target.value }))}/></LoanField>
      </div>
      <div className="modal-fields-row">
        <LoanField label="Fecha desembolso"><input className="modal-input" type="date" value={form.disbursementDate} onChange={e => setForm(p => ({ ...p, disbursementDate: e.target.value }))}/></LoanField>
        <LoanField label="Estado">
          <select className="modal-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
            <option value="solicitado">Solicitado</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
            <option value="desembolsado">Desembolsado</option>
            <option value="pagado">Pagado</option>
            <option value="vencido">Vencido</option>
          </select>
        </LoanField>
      </div>
      <LoanField label="Motivo del préstamo"><input className="modal-input" placeholder="Describe el propósito del préstamo..." value={form.loanPurpose} onChange={e => setForm(p => ({ ...p, loanPurpose: e.target.value }))}/></LoanField>
      <LoanField label="Aprobado por (ID admin)"><input className="modal-input" placeholder="usr_XXXX (opcional)" value={form.approvedByUserId} onChange={e => setForm(p => ({ ...p, approvedByUserId: e.target.value }))}/></LoanField>
    </>
  );

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Préstamos</h1><p className="page-subtitle">Gestión de créditos y financiamientos</p></div>
        <button className="btn-add" onClick={() => { setForm(EMPTY_FORM); setModal(true); }}>
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Nuevo préstamo
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        {[
          { label: 'Total',         value: localData.length },
          { label: 'Solicitados',   value: localData.filter(l => l.status === 'solicitado').length },
          { label: 'Aprobados',     value: localData.filter(l => l.status === 'aprobado').length },
          { label: 'Desembolsados', value: localData.filter(l => l.status === 'desembolsado').length },
          { label: 'Monto total',   value: 'Q ' + fmt(localData.reduce((s, l) => s + Number(l.requestedAmount || 0), 0)) },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-value" style={{ fontSize: '1.2rem' }}>{loading ? '...' : s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros por estado */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['todos', 'solicitado', 'aprobado', 'rechazado', 'desembolsado', 'pagado', 'vencido'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: '.4rem .85rem', borderRadius: 20, fontSize: '.75rem', fontWeight: 500,
            background: statusFilter === s ? 'rgba(200,169,81,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${statusFilter === s ? 'rgba(200,169,81,0.3)' : 'rgba(255,255,255,0.07)'}`,
            color: statusFilter === s ? 'var(--gold-pure)' : 'var(--muted)',
            cursor: 'pointer', textTransform: 'capitalize', fontFamily: "'Outfit',sans-serif",
          }}>{s}</button>
        ))}
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Préstamos ({filtered.length})</span>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
            <div className="search-input-wrap">
              <span className="search-icon"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
              <input className="search-input" placeholder="Buscar por usuario, cuenta..." value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <button className="btn-secondary" onClick={() => { clearDataCache(); reload(); }}>
              <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Actualizar
            </button>
          </div>
        </div>

        <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Usuario</th><th>Cuenta</th><th>Solicitado</th><th>Aprobado</th><th>Tasa</th><th>Plazo</th><th>Cuota</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {loading && localData.length === 0 ? <LoadingRows cols={10}/> : filtered.map((l, i) => {
              const sc = STATUS_COLORS[l.status] || STATUS_COLORS.solicitado;
              return (
                <tr key={l._id || i}>
                  <td style={{ fontFamily: 'monospace', fontSize: '.78rem', color: 'var(--muted)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.userId || '—'}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--gold-pure)', fontSize: '.82rem' }}>{l.accountNumber || '—'}</td>
                  <td style={{ fontWeight: 500 }}>Q {fmt(l.requestedAmount)}</td>
                  <td style={{ color: '#4caf7d', fontWeight: 500 }}>Q {fmt(l.approvedAmount || 0)}</td>
                  <td style={{ color: 'var(--muted)' }}>{l.interestRate || '—'}%</td>
                  <td style={{ color: 'var(--muted)' }}>{l.termMonths || '—'} m</td>
                  <td>Q {fmt(l.monthlyPayment || 0)}</td>
                  <td>
                    <span style={{ padding: '.2rem .65rem', borderRadius: 20, fontSize: '.72rem', fontWeight: 600, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>
                      {l.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{fmtDate(l.requestDate || l.createdAt)}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" title="Ver detalle" onClick={() => setDetailModal(l)}>
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </button>
                      <button className="btn-icon" title="Editar" onClick={() => openEdit(l)}>
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </button>
                      <button className="btn-icon danger" title="Eliminar" onClick={() => setConfirm(l)}>
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && <EmptyState text="Sin préstamos registrados"/>}
          </tbody>
        </table>
      </div>
      </div>

      {/* Modal crear */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Nuevo Préstamo</span><button className="modal-close" onClick={() => setModal(false)}>✕</button></div>
            <div className="modal-body"><ModalForm/></div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleCreate} disabled={saving}>{saving ? <span className="spin"/> : 'Crear préstamo'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Editar Préstamo</span><button className="modal-close" onClick={() => setEditModal(null)}>✕</button></div>
            <div className="modal-body">
              <div style={{ background: 'rgba(200,169,81,0.05)', border: '1px solid rgba(200,169,81,0.12)', borderRadius: 8, padding: '.75rem 1rem', marginBottom: '.5rem', fontSize: '.82rem', color: 'var(--gold-bright)' }}>
                ID: <strong style={{ fontFamily: 'monospace' }}>{editModal._id || editModal.id}</strong>
              </div>
              <ModalForm/>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setEditModal(null)}>Cancelar</button>
              <button className="btn-save" onClick={handleEdit} disabled={saving}>{saving ? <span className="spin"/> : 'Actualizar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Detalle del Préstamo</span><button className="modal-close" onClick={() => setDetailModal(null)}>✕</button></div>
            <div className="modal-body">
              {[
                { label: 'ID',              value: detailModal._id,                        mono: true },
                { label: 'Usuario',         value: detailModal.userId,                     mono: true },
                { label: 'Cuenta',          value: detailModal.accountNumber,              mono: true },
                { label: 'Solicitado',      value: 'Q ' + fmt(detailModal.requestedAmount) },
                { label: 'Aprobado',        value: 'Q ' + fmt(detailModal.approvedAmount || 0) },
                { label: 'Tasa interés',    value: (detailModal.interestRate || 0) + '%' },
                { label: 'Plazo',           value: (detailModal.termMonths || '—') + ' meses' },
                { label: 'Cuota mensual',   value: 'Q ' + fmt(detailModal.monthlyPayment || 0) },
                { label: 'Saldo pendiente', value: 'Q ' + fmt(detailModal.outstandingBalance || 0) },
                { label: 'Estado',          value: detailModal.status },
                { label: 'Motivo',          value: detailModal.loanPurpose || '—' },
                { label: 'Aprobado por',    value: detailModal.approvedByUserId || '—',   mono: true },
                { label: 'Fecha solicitud', value: fmtDate(detailModal.requestDate) },
                { label: 'Fecha aprobación',value: fmtDate(detailModal.approvalDate) },
                { label: 'Fecha desembolso',value: fmtDate(detailModal.disbursementDate) },
              ].map(({ label, value, mono }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: '.85rem', color: 'var(--white)', fontFamily: mono ? 'monospace' : 'inherit', maxWidth: 220, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value || '—'}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDetailModal(null)}>Cerrar</button>
              <button className="btn-save" onClick={() => { setDetailModal(null); openEdit(detailModal); }}>Editar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirm}
        title="Eliminar préstamo"
        message={`¿Eliminar el préstamo de Q ${fmt(confirm?.requestedAmount)} del usuario ${confirm?.userId}?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default LoansSection;
