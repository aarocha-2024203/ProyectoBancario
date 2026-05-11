import { useState } from 'react';
import { useData } from '../../../shared/hooks/useData';
import { showSuccess, showError } from '../../../shared/utils/toast';
import {
    getTransactions,
    createTransaction,
    deleteTransaction,
    getAccounts,
} from '../../../shared/api/banking';
import useAuthStore from '../../auth/store/authStore';

const fmt = (n) => n != null ? Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2 }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const Badge = ({ value }) => {
    const v = (value || '').toLowerCase();
    const cls = ['exitosa', 'completada', 'success'].includes(v) ? 'badge-success'
        : ['fallida', 'rechazada', 'failed'].includes(v) ? 'badge-danger'
        : ['transferencia'].includes(v) ? 'badge-gold'
        : 'badge-muted';
    return <span className={`badge ${cls}`}>{value || '—'}</span>;
};

const LoadingRows = ({ cols }) => (
    <>{[1, 2, 3, 4].map(i => <tr key={i}>{Array(cols).fill(0).map((_, j) => <td key={j}><div className="skeleton" style={{ width: j === 0 ? '60%' : '80%' }} /></td>)}</tr>)}</>
);

const EmptyState = ({ text }) => (
    <tr><td colSpan={99}>
        <div className="empty-state">
            <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
                    <path d="M7 16l-4-4m0 0l4-4m-4 4h18M17 8l4 4m0 0l-4 4m4-4H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <p className="empty-state-text">{text}</p>
        </div>
    </td></tr>
);

/* ── Dropdown personalizado ── */
const CustomSelect = ({ value, onChange, options, placeholder = 'Seleccionar...' }) => {
    const [open, setOpen] = useState(false);
    const selected = options.find(o => o.value === value);
    return (
        <div style={{ position: 'relative' }}>
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', padding: '.6rem .9rem', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${open ? 'rgba(200,169,81,0.4)' : 'rgba(200,169,81,0.15)'}`,
                    borderRadius: 8, color: selected ? 'var(--white)' : 'var(--muted)',
                    fontSize: '.88rem', cursor: 'pointer', userSelect: 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
            >
                <span>{selected ? selected.label : placeholder}</span>
                <span style={{ fontSize: '.65rem', color: 'var(--muted)', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▼</span>
            </div>
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
                    background: '#0d1b2e', border: '1px solid rgba(200,169,81,0.2)',
                    borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}>
                    {options.map(o => (
                        <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                            style={{ padding: '.65rem .9rem', cursor: 'pointer', fontSize: '.88rem', color: value === o.value ? 'var(--gold-pure)' : 'var(--white)', background: value === o.value ? 'rgba(200,169,81,0.12)' : 'transparent' }}
                            onMouseEnter={e => { if (value !== o.value) e.currentTarget.style.background = 'rgba(200,169,81,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = value === o.value ? 'rgba(200,169,81,0.12)' : 'transparent'; }}
                        >{o.label}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

const inputStyle = { width: '100%', padding: '.6rem .9rem', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,169,81,0.15)', borderRadius: 8, color: 'var(--white)', fontSize: '.88rem', outline: 'none' };
const labelStyle = { display: 'block', fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem', fontWeight: 500 };

const TRANSACTION_TYPES = [
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'pago', label: 'Pago' },
];

/* ── Modal nueva transferencia ── */
const NewTransactionModal = ({ onSuccess, onClose, userAccounts }) => {
    const [form, setForm] = useState({
        sourceAccountNumber: '',
        destinationAccountNumber: '',
        transactionType: 'transferencia',
        amount: '',
        currencyCode: 'GTQ',
        description: '',
        favorito: false,
        alias: '',
    });
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async () => {
        if (!form.sourceAccountNumber) return showError('Selecciona la cuenta origen');
        if (!form.destinationAccountNumber) return showError('Ingresa la cuenta destino');
        if (!form.amount || Number(form.amount) <= 0) return showError('Ingresa un monto válido');

        setSaving(true);
        try {
            await createTransaction({
                sourceAccountNumber: form.sourceAccountNumber,
                destinationAccountNumber: form.destinationAccountNumber,
                transactionType: form.transactionType,
                amount: Number(form.amount),
                currencyCode: form.currencyCode,
                description: form.description || undefined,
                favorito: form.favorito,
                alias: form.alias || undefined,
            });
            showSuccess('Transferencia realizada exitosamente');
            onSuccess();
            onClose();
        } catch (e) {
            showError(e?.response?.data?.message || 'Error al realizar la transferencia');
        } finally {
            setSaving(false);
        }
    };

    const myAccountOptions = userAccounts
        .filter(a => (a.status || '').toLowerCase() === 'activa')
        .map(a => ({ value: a.accountNumber, label: `${a.accountNumber} — Q ${fmt(a.balance)}` }));

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#0d1b2e', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--white)', margin: 0 }}>Nueva Transferencia</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Cuenta origen */}
                    <div>
                        <label style={labelStyle}>Cuenta origen</label>
                        {myAccountOptions.length > 0 ? (
                            <CustomSelect
                                value={form.sourceAccountNumber}
                                onChange={v => set('sourceAccountNumber', v)}
                                options={myAccountOptions}
                                placeholder="Selecciona tu cuenta..."
                            />
                        ) : (
                            <input style={inputStyle} placeholder="ACC-000-0000" value={form.sourceAccountNumber} onChange={e => set('sourceAccountNumber', e.target.value)} />
                        )}
                    </div>

                    {/* Cuenta destino */}
                    <div>
                        <label style={labelStyle}>Cuenta destino</label>
                        <input style={inputStyle} placeholder="ACC-000-0000 (cuenta del destinatario)" value={form.destinationAccountNumber} onChange={e => set('destinationAccountNumber', e.target.value)} />
                    </div>

                    {/* Tipo y monto */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Tipo</label>
                            <CustomSelect value={form.transactionType} onChange={v => set('transactionType', v)} options={TRANSACTION_TYPES} />
                        </div>
                        <div>
                            <label style={labelStyle}>Monto (Q)</label>
                            <input type="number" style={inputStyle} placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label style={labelStyle}>Descripción (opcional)</label>
                        <input style={inputStyle} placeholder="Ej. Pago de alquiler" value={form.description} onChange={e => set('description', e.target.value)} />
                    </div>

                    {/* Favorito */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', color: 'var(--muted)', fontSize: '.85rem' }}>
                            <input type="checkbox" checked={form.favorito} onChange={e => set('favorito', e.target.checked)} style={{ accentColor: 'var(--gold-pure)', width: 16, height: 16 }} />
                            Guardar como favorito
                        </label>
                    </div>

                    {form.favorito && (
                        <div>
                            <label style={labelStyle}>Alias (opcional)</label>
                            <input style={inputStyle} placeholder="Ej. Mamá, Arrendador..." value={form.alias} onChange={e => set('alias', e.target.value)} />
                        </div>
                    )}

                    {/* Resumen */}
                    {form.sourceAccountNumber && form.destinationAccountNumber && form.amount && (
                        <div style={{ background: 'rgba(200,169,81,0.06)', border: '1px solid rgba(200,169,81,0.15)', borderRadius: 10, padding: '1rem' }}>
                            <p style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.5rem' }}>Resumen</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem' }}>
                                <span style={{ fontSize: '.85rem', color: 'var(--muted)' }}>Origen</span>
                                <span style={{ fontSize: '.85rem', color: 'var(--white)', fontFamily: 'monospace' }}>{form.sourceAccountNumber}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem' }}>
                                <span style={{ fontSize: '.85rem', color: 'var(--muted)' }}>Destino</span>
                                <span style={{ fontSize: '.85rem', color: 'var(--white)', fontFamily: 'monospace' }}>{form.destinationAccountNumber}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '.5rem', borderTop: '1px solid rgba(200,169,81,0.1)' }}>
                                <span style={{ fontSize: '.9rem', color: 'var(--white)', fontWeight: 600 }}>Total a transferir</span>
                                <span style={{ fontSize: '.9rem', color: 'var(--gold-pure)', fontWeight: 700 }}>Q {fmt(Number(form.amount))}</span>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
                        <button onClick={onClose} style={{ flex: 1, padding: '.65rem', background: 'none', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 8, color: 'var(--muted)', cursor: 'pointer', fontSize: '.88rem' }}>Cancelar</button>
                        <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: '.65rem', background: saving ? 'rgba(200,169,81,0.3)' : 'rgba(200,169,81,0.15)', border: '1px solid rgba(200,169,81,0.4)', borderRadius: 8, color: saving ? 'var(--muted)' : 'var(--gold-pure)', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '.88rem', fontWeight: 600 }}>
                            {saving ? 'Procesando...' : '↗ Transferir'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Modal detalle transacción ── */
const TransactionDetail = ({ tx, onClose }) => {
    const isOut = tx.transactionType?.toLowerCase() === 'transferencia' || tx.transactionType?.toLowerCase() === 'pago';
    const row = (label, value) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '.78rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</span>
            <span style={{ fontSize: '.88rem', color: 'var(--white)', fontWeight: 500 }}>{value}</span>
        </div>
    );

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#0d1b2e', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 440 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--white)', margin: 0 }}>Detalle de transacción</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                </div>

                {/* Monto destacado */}
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(200,169,81,0.05)', borderRadius: 12, marginBottom: '1.5rem', border: '1px solid rgba(200,169,81,0.1)' }}>
                    <p style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '.5rem' }}>{tx.transactionType || 'Transacción'}</p>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--gold-pure)', margin: 0 }}>Q {fmt(tx.amount || tx.Amount)}</p>
                    <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: '.3rem' }}>{fmtDate(tx.createdAt || tx.date)}</p>
                </div>

                {row('Estado', <Badge value={tx.status || 'exitosa'} />)}
                {row('Cuenta origen', <span style={{ fontFamily: 'monospace', fontSize: '.82rem' }}>{tx.sourceAccountNumber || tx.sourceAccountId || '—'}</span>)}
                {row('Cuenta destino', <span style={{ fontFamily: 'monospace', fontSize: '.82rem' }}>{tx.destinationAccountNumber || tx.destinationAccountId || '—'}</span>)}
                {tx.description && row('Descripción', tx.description)}
                {tx.alias && row('Alias', tx.alias)}
                {tx.favorito !== undefined && row('Favorito', tx.favorito ? '⭐ Sí' : 'No')}
                {row('ID', <span style={{ fontFamily: 'monospace', fontSize: '.75rem', color: 'var(--muted)' }}>{tx._id || '—'}</span>)}

                <button onClick={onClose} style={{ width: '100%', marginTop: '1.5rem', padding: '.65rem', background: 'none', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 8, color: 'var(--muted)', cursor: 'pointer', fontSize: '.88rem' }}>Cerrar</button>
            </div>
        </div>
    );
};

/* ══ COMPONENTE PRINCIPAL ══ */
const UserTransactions = () => {
    const { user } = useAuthStore();
    const { data, loading, reload } = useData(getTransactions);
    const { data: accounts } = useData(getAccounts);

    const [modal, setModal] = useState(false);
    const [detail, setDetail] = useState(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('todos');

    const filtered = data.filter(t => {
        const matchSearch = `${t.transactionType || ''} ${t.sourceAccountNumber || t.sourceAccountId || ''} ${t.destinationAccountNumber || t.destinationAccountId || ''} ${t.description || ''}`.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'todos' || (t.transactionType || '').toLowerCase() === filter;
        return matchSearch && matchFilter;
    });

    const totalEnviado = data.reduce((s, t) => s + Number(t.amount || 0), 0);
    const transferencias = data.filter(t => (t.transactionType || '').toLowerCase() === 'transferencia').length;
    const pagos = data.filter(t => (t.transactionType || '').toLowerCase() === 'pago').length;

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Transferencias</h1>
                    <p className="page-subtitle">Envía dinero y consulta tu historial de movimientos</p>
                </div>
                <button className="btn-primary" onClick={() => setModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    Nueva transferencia
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total movimientos', value: loading ? '...' : data.length, icon: '↕️' },
                    { label: 'Transferencias', value: loading ? '...' : transferencias, icon: '↗️' },
                    { label: 'Pagos', value: loading ? '...' : pagos, icon: '💸' },
                    { label: 'Monto total movido', value: loading ? '...' : `Q ${fmt(totalEnviado)}`, icon: '💰' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-card-icon"><span style={{ fontSize: '1.1rem' }}>{s.icon}</span></div>
                        <div className="stat-card-value" style={{ fontSize: i === 3 ? '1rem' : undefined }}>{s.value}</div>
                        <div className="stat-card-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabla */}
            <div className="table-card">
                <div className="table-header">
                    <span className="table-title">Mis movimientos</span>
                    <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                        {/* Filtro tipo */}
                        <div style={{ display: 'flex', gap: '.4rem' }}>
                            {['todos', 'transferencia', 'pago'].map(f => (
                                <button key={f} onClick={() => setFilter(f)} style={{ padding: '.3rem .75rem', fontSize: '.75rem', borderRadius: 20, border: `1px solid ${filter === f ? 'rgba(200,169,81,0.5)' : 'rgba(255,255,255,0.08)'}`, background: filter === f ? 'rgba(200,169,81,0.12)' : 'transparent', color: filter === f ? 'var(--gold-pure)' : 'var(--muted)', cursor: 'pointer', textTransform: 'capitalize' }}>
                                    {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                        {/* Búsqueda */}
                        <div className="search-input-wrap">
                            <span className="search-icon"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" /><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></span>
                            <input className="search-input" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>
                </div>
                <table className="data-table">
                    <thead>
                        <tr><th>Tipo</th><th>Origen</th><th>Destino</th><th>Monto</th><th>Descripción</th><th>Fecha</th><th>Ver</th></tr>
                    </thead>
                    <tbody>
                        {loading ? <LoadingRows cols={7} /> : filtered.map((t, i) => (
                            <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setDetail(t)}>
                                <td><Badge value={t.transactionType || t.TransactionType} /></td>
                                <td style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--gold-pure)' }}>
                                    {t.sourceAccountNumber || t.sourceAccountId || '—'}
                                </td>
                                <td style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--gold-pure)' }}>
                                    {t.destinationAccountNumber || t.destinationAccountId || '—'}
                                </td>
                                <td style={{ fontWeight: 600, color: 'var(--white)' }}>Q {fmt(t.amount || t.Amount)}</td>
                                <td style={{ color: 'var(--muted)', fontSize: '.82rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {t.description || '—'}
                                </td>
                                <td style={{ color: 'var(--muted)', fontSize: '.78rem' }}>{fmtDate(t.createdAt || t.date)}</td>
                                <td>
                                    <button onClick={e => { e.stopPropagation(); setDetail(t); }} style={{ padding: '.3rem .6rem', fontSize: '.75rem', background: 'rgba(200,169,81,0.1)', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 6, color: 'var(--gold-dim)', cursor: 'pointer' }}>
                                        Ver
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!loading && filtered.length === 0 && <EmptyState text={search ? 'Sin resultados para tu búsqueda' : 'Aún no tienes movimientos'} />}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {modal && <NewTransactionModal onSuccess={reload} onClose={() => setModal(false)} userAccounts={accounts} />}
            {detail && <TransactionDetail tx={detail} onClose={() => setDetail(null)} />}
        </div>
    );
};

export default UserTransactions;
