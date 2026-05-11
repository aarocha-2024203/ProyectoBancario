import { useState } from 'react';
import { useData } from '../../../shared/hooks/useData';
import { showSuccess, showError } from '../../../shared/utils/toast';
import { getLoans, getLoan, updateLoan, deleteLoan } from '../../../shared/api/banking';

const fmt = (n) => n != null ? Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2 }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const Badge = ({ value }) => {
    const v = (value || '').toLowerCase();
    const cls = v === 'aprobado' || v === 'desembolsado' ? 'badge-success'
        : v === 'rechazado' || v === 'vencido' ? 'badge-danger'
        : v === 'pagado' ? 'badge-muted'
        : 'badge-warning';
    return <span className={`badge ${cls}`}>{value || '—'}</span>;
};

const LoadingRows = ({ cols }) => (
    <>{[1, 2, 3, 4].map(i => <tr key={i}>{Array(cols).fill(0).map((_, j) => <td key={j}><div className="skeleton" style={{ width: j === 0 ? '60%' : '80%' }} /></td>)}</tr>)}</>
);

const EmptyState = ({ text }) => (
    <tr><td colSpan={99}><div className="empty-state"><div className="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" width="32" height="32"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" /><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></div><p className="empty-state-text">{text}</p></div></td></tr>
);

const ConfirmModal = ({ open, title, message, onConfirm, onCancel }) => {
    if (!open) return null;
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header"><span className="modal-title">{title}</span><button className="modal-close" onClick={onCancel}>✕</button></div>
                <div className="modal-body"><p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>{message}</p></div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onCancel}>Cancelar</button>
                    <button className="btn-save" style={{ background: 'linear-gradient(135deg,#c0392b,#e05c5c)', color: '#fff' }} onClick={onConfirm}>Confirmar</button>
                </div>
            </div>
        </div>
    );
};

const inputStyle = { width: '100%', padding: '.55rem .85rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,169,81,0.15)', borderRadius: 8, color: 'var(--white)', fontSize: '.88rem', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.35rem', fontWeight: 500 };

/* ── Dropdown personalizado ── */
const CustomSelect = ({ value, onChange, options }) => {
    const [open, setOpen] = useState(false);
    const selected = options.find(o => o.value === value);
    return (
        <div style={{ position: 'relative' }}>
            <div onClick={() => setOpen(o => !o)} style={{ ...inputStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none', border: `1px solid ${open ? 'rgba(200,169,81,0.4)' : 'rgba(200,169,81,0.15)'}` }}>
                <span style={{ color: selected ? 'var(--white)' : 'var(--muted)' }}>{selected ? selected.label : 'Seleccionar...'}</span>
                <span style={{ fontSize: '.65rem', color: 'var(--muted)', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▼</span>
            </div>
            {open && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100, background: '#0d1b2e', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                    {options.map(o => (
                        <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                            style={{ padding: '.65rem .85rem', cursor: 'pointer', fontSize: '.88rem', color: value === o.value ? 'var(--gold-pure)' : 'var(--white)', background: value === o.value ? 'rgba(200,169,81,0.12)' : 'transparent' }}
                            onMouseEnter={e => { if (value !== o.value) e.currentTarget.style.background = 'rgba(200,169,81,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = value === o.value ? 'rgba(200,169,81,0.12)' : 'transparent'; }}
                        >{o.label}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

const STATUS_OPTIONS = [
    { value: 'solicitado', label: 'Solicitado' },
    { value: 'aprobado', label: 'Aprobado' },
    { value: 'rechazado', label: 'Rechazado' },
    { value: 'desembolsado', label: 'Desembolsado' },
    { value: 'pagado', label: 'Pagado' },
    { value: 'vencido', label: 'Vencido' },
];

/* ── Modal detalle + edición ── */
const LoanDetailModal = ({ loan, onSuccess, onClose }) => {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        status: loan.status || 'solicitado',
        approvedAmount: loan.approvedAmount || '',
        interestRate: loan.interestRate || '',
        termMonths: loan.termMonths || '',
        monthlyPayment: loan.monthlyPayment || '',
        outstandingBalance: loan.outstandingBalance || '',
        approvalDate: loan.approvalDate ? loan.approvalDate.slice(0, 10) : '',
        disbursementDate: loan.disbursementDate ? loan.disbursementDate.slice(0, 10) : '',
    });
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { status: form.status };
            if (form.approvedAmount !== '') payload.approvedAmount = Number(form.approvedAmount);
            if (form.interestRate !== '') payload.interestRate = Number(form.interestRate);
            if (form.termMonths !== '') payload.termMonths = Number(form.termMonths);
            if (form.monthlyPayment !== '') payload.monthlyPayment = Number(form.monthlyPayment);
            if (form.outstandingBalance !== '') payload.outstandingBalance = Number(form.outstandingBalance);
            if (form.approvalDate) payload.approvalDate = form.approvalDate;
            if (form.disbursementDate) payload.disbursementDate = form.disbursementDate;
            await updateLoan(loan._id, payload);
            showSuccess('Préstamo actualizado exitosamente');
            onSuccess();
            onClose();
        } catch (e) {
            showError(e?.response?.data?.message || 'Error al actualizar');
        } finally {
            setSaving(false);
        }
    };

    const row = (label, value) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '.78rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</span>
            <span style={{ fontSize: '.88rem', color: 'var(--white)', fontWeight: 500 }}>{value}</span>
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">{editing ? 'Editar préstamo' : 'Detalle del préstamo'}</span>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    {!editing ? (
                        <>
                            {/* Vista detalle */}
                            <div style={{ textAlign: 'center', padding: '1.25rem', background: 'rgba(200,169,81,0.05)', borderRadius: 12, marginBottom: '1.25rem', border: '1px solid rgba(200,169,81,0.1)' }}>
                                <p style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '.4rem' }}>{loan.loanPurpose || 'Préstamo'}</p>
                                <p style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--gold-pure)', margin: 0 }}>Q {fmt(loan.requestedAmount)}</p>
                                <div style={{ marginTop: '.5rem' }}><Badge value={loan.status} /></div>
                            </div>
                            {row('Usuario ID', <span style={{ fontFamily: 'monospace', fontSize: '.78rem' }}>{loan.userId}</span>)}
                            {row('Cuenta', <span style={{ fontFamily: 'monospace' }}>{loan.accountNumber}</span>)}
                            {row('Monto aprobado', loan.approvedAmount ? `Q ${fmt(loan.approvedAmount)}` : 'Pendiente')}
                            {row('Cuota mensual', loan.monthlyPayment ? `Q ${fmt(loan.monthlyPayment)}` : '—')}
                            {row('Tasa de interés', `${loan.interestRate || 0}%`)}
                            {row('Plazo', `${loan.termMonths} meses`)}
                            {row('Saldo pendiente', `Q ${fmt(loan.outstandingBalance)}`)}
                            {row('Fecha solicitud', fmtDate(loan.requestDate || loan.createdAt))}
                            {loan.approvalDate && row('Fecha aprobación', fmtDate(loan.approvalDate))}
                            {loan.disbursementDate && row('Fecha desembolso', fmtDate(loan.disbursementDate))}
                            {row('ID', <span style={{ fontFamily: 'monospace', fontSize: '.72rem', color: 'var(--muted)' }}>{loan._id}</span>)}
                        </>
                    ) : (
                        /* Vista edición */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                            <div>
                                <label style={labelStyle}>Estado</label>
                                <CustomSelect value={form.status} onChange={v => set('status', v)} options={STATUS_OPTIONS} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
                                <div>
                                    <label style={labelStyle}>Monto aprobado (Q)</label>
                                    <input type="number" style={inputStyle} value={form.approvedAmount} onChange={e => set('approvedAmount', e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Tasa de interés (%)</label>
                                    <input type="number" style={inputStyle} value={form.interestRate} onChange={e => set('interestRate', e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Plazo (meses)</label>
                                    <input type="number" style={inputStyle} value={form.termMonths} onChange={e => set('termMonths', e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Cuota mensual (Q)</label>
                                    <input type="number" style={inputStyle} value={form.monthlyPayment} onChange={e => set('monthlyPayment', e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Saldo pendiente (Q)</label>
                                    <input type="number" style={inputStyle} value={form.outstandingBalance} onChange={e => set('outstandingBalance', e.target.value)} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
                                <div>
                                    <label style={labelStyle}>Fecha aprobación</label>
                                    <input type="date" style={inputStyle} value={form.approvalDate} onChange={e => set('approvalDate', e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Fecha desembolso</label>
                                    <input type="date" style={inputStyle} value={form.disbursementDate} onChange={e => set('disbursementDate', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    {!editing ? (
                        <>
                            <button className="btn-cancel" onClick={onClose}>Cerrar</button>
                            <button className="btn-save" onClick={() => setEditing(true)}>✏️ Editar</button>
                        </>
                    ) : (
                        <>
                            <button className="btn-cancel" onClick={() => setEditing(false)}>Cancelar</button>
                            <button className="btn-save" onClick={handleSave} disabled={saving}>{saving ? <span className="spin" /> : 'Guardar cambios'}</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ══ COMPONENTE PRINCIPAL ADMIN ══ */
const LoansPageAdmin = () => {
    const [statusFilter, setStatusFilter] = useState('solicitado');
    const { data, loading, reload } = useData(() => getLoans(statusFilter));
    const [search, setSearch] = useState('');
    const [detail, setDetail] = useState(null);
    const [confirm, setConfirm] = useState(null);

    // Recarga cuando cambia el filtro de status
    const handleStatusChange = (s) => {
        setStatusFilter(s);
    };

    const filtered = data.filter(l =>
        `${l.userId || ''} ${l.accountNumber || ''} ${l.status || ''} ${l.loanPurpose || ''}`.toLowerCase().includes(search.toLowerCase())
    );

    const totalMonto = data.reduce((s, l) => s + Number(l.requestedAmount || 0), 0);

    const handleDelete = async () => {
        if (!confirm) return;
        try {
            await deleteLoan(confirm.id);
            showSuccess('Préstamo eliminado');
            reload();
        } catch { showError('Error al eliminar'); }
        finally { setConfirm(null); }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Préstamos</h1>
                    <p className="page-subtitle">Gestión de todos los créditos del sistema</p>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                {[
                    { label: 'En esta vista', value: loading ? '...' : data.length, icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" /></svg> },
                    { label: 'Solicitados', value: loading ? '...' : data.filter(l => l.status === 'solicitado').length, icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><circle cx="12" cy="12" r="10" stroke="#eab308" strokeWidth="1.5" /><path d="M12 8v4M12 16h.01" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" /></svg> },
                    { label: 'Aprobados', value: loading ? '...' : data.filter(l => l.status === 'aprobado' || l.status === 'desembolsado').length, icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M9 12l2 2 4-4" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="10" stroke="#4caf7d" strokeWidth="1.5" /></svg> },
                    { label: 'Monto total', value: loading ? '...' : `Q ${fmt(totalMonto)}`, icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><circle cx="12" cy="12" r="10" stroke="#c8a951" strokeWidth="1.5" /><path d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H9m0 0h5.5a1.5 1.5 0 010 3H9" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" /></svg> },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-card-icon">{s.icon}</div>
                        <div className="stat-card-value" style={{ fontSize: i === 3 ? '1rem' : undefined }}>{s.value}</div>
                        <div className="stat-card-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="table-card">
                <div className="table-header">
                    <span className="table-title">Préstamos</span>
                    <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Filtro por estado */}
                        <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                            {STATUS_OPTIONS.map(s => (
                                <button key={s.value} onClick={() => handleStatusChange(s.value)}
                                    style={{ padding: '.28rem .65rem', fontSize: '.72rem', borderRadius: 20, border: `1px solid ${statusFilter === s.value ? 'rgba(200,169,81,0.5)' : 'rgba(255,255,255,0.08)'}`, background: statusFilter === s.value ? 'rgba(200,169,81,0.12)' : 'transparent', color: statusFilter === s.value ? 'var(--gold-pure)' : 'var(--muted)', cursor: 'pointer' }}>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                        <div className="search-input-wrap">
                            <span className="search-icon"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" /><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></span>
                            <input className="search-input" placeholder="Buscar usuario, cuenta..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr><th>Usuario</th><th>Cuenta</th><th>Solicitado</th><th>Aprobado</th><th>Cuota</th><th>Plazo</th><th>Propósito</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr>
                    </thead>
                    <tbody>
                        {loading ? <LoadingRows cols={10} /> : filtered.map((l, i) => (
                            <tr key={i}>
                                <td style={{ fontSize: '.78rem', color: 'var(--muted)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.userId || '—'}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--gold-pure)' }}>{l.accountNumber || '—'}</td>
                                <td style={{ fontWeight: 500 }}>Q {fmt(l.requestedAmount)}</td>
                                <td style={{ color: l.approvedAmount ? '#4ade80' : 'var(--muted)' }}>{l.approvedAmount ? `Q ${fmt(l.approvedAmount)}` : '—'}</td>
                                <td style={{ color: 'var(--white)' }}>{l.monthlyPayment ? `Q ${fmt(l.monthlyPayment)}` : '—'}</td>
                                <td style={{ color: 'var(--muted)' }}>{l.termMonths ? `${l.termMonths}m` : '—'}</td>
                                <td style={{ color: 'var(--muted)', fontSize: '.82rem', textTransform: 'capitalize' }}>{l.loanPurpose || '—'}</td>
                                <td><Badge value={l.status} /></td>
                                <td style={{ color: 'var(--muted)', fontSize: '.78rem' }}>{fmtDate(l.requestDate || l.createdAt)}</td>
                                <td>
                                    <div className="action-btns">
                                        <button onClick={() => setDetail(l)} style={{ padding: '.3rem .6rem', fontSize: '.75rem', background: 'rgba(200,169,81,0.1)', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 6, color: 'var(--gold-dim)', cursor: 'pointer' }}>Ver</button>
                                        <button className="btn-icon danger" title="Eliminar" onClick={() => setConfirm({ id: l._id, label: `Q ${fmt(l.requestedAmount)}` })}>
                                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!loading && filtered.length === 0 && <EmptyState text={`Sin préstamos con estado "${statusFilter}"`} />}
                    </tbody>
                </table>
            </div>

            {detail && <LoanDetailModal loan={detail} onSuccess={reload} onClose={() => setDetail(null)} />}
            <ConfirmModal open={!!confirm} title="Eliminar préstamo" message={`¿Eliminar el préstamo de ${confirm?.label}? Esta acción no se puede deshacer.`} onConfirm={handleDelete} onCancel={() => setConfirm(null)} />
        </div>
    );
};

export default LoansPageAdmin;