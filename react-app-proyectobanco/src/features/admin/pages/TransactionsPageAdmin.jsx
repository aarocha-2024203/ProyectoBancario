import { useState } from 'react';
import { useData } from '../../../shared/hooks/useData';
import { showSuccess, showError } from '../../../shared/utils/toast';
import { getTransactions, deleteTransaction } from '../../../shared/api/banking';

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
            <p className="empty-state-text">{text || 'Sin datos'}</p>
        </div>
    </td></tr>
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
                    <button className="btn-save" style={{ background: 'linear-gradient(135deg,#c0392b,#e05c5c)', color: '#fff' }} onClick={onConfirm}>Eliminar</button>
                </div>
            </div>
        </div>
    );
};

/* ── Modal detalle ── */
const TransactionDetail = ({ tx, onClose }) => {
    const row = (label, value) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '.78rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</span>
            <span style={{ fontSize: '.88rem', color: 'var(--white)', fontWeight: 500 }}>{value}</span>
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">Detalle de transacción</span>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    {/* Monto destacado */}
                    <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(200,169,81,0.05)', borderRadius: 12, marginBottom: '1.5rem', border: '1px solid rgba(200,169,81,0.1)' }}>
                        <p style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '.5rem' }}>{tx.transactionType || 'Transacción'}</p>
                        <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--gold-pure)', margin: 0 }}>Q {fmt(tx.amount || tx.Amount)}</p>
                        <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: '.3rem' }}>{fmtDate(tx.createdAt || tx.date)}</p>
                    </div>
                    {row('Estado', <Badge value={tx.status || 'exitosa'} />)}
                    {row('Tipo', <Badge value={tx.transactionType} />)}
                    {row('Cuenta origen', <span style={{ fontFamily: 'monospace', fontSize: '.82rem' }}>{tx.sourceAccountNumber || tx.sourceAccountId || '—'}</span>)}
                    {row('Cuenta destino', <span style={{ fontFamily: 'monospace', fontSize: '.82rem' }}>{tx.destinationAccountNumber || tx.destinationAccountId || '—'}</span>)}
                    {tx.userId && row('Usuario ID', <span style={{ fontFamily: 'monospace', fontSize: '.78rem', color: 'var(--muted)' }}>{tx.userId}</span>)}
                    {tx.description && row('Descripción', tx.description)}
                    {tx.alias && row('Alias', tx.alias)}
                    {tx.favorito !== undefined && row('Favorito', tx.favorito ? '⭐ Sí' : 'No')}
                    {row('ID', <span style={{ fontFamily: 'monospace', fontSize: '.72rem', color: 'var(--muted)' }}>{tx._id || '—'}</span>)}
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

/* ══ COMPONENTE PRINCIPAL ADMIN ══ */
const TransactionsPageAdmin = () => {
    const { data, loading, reload } = useData(getTransactions);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('todos');
    const [detail, setDetail] = useState(null);
    const [confirm, setConfirm] = useState(null);

    const filtered = data.filter(t => {
        const matchSearch = `${t.transactionType || ''} ${t.sourceAccountNumber || t.sourceAccountId || ''} ${t.destinationAccountNumber || t.destinationAccountId || ''} ${t.userId || ''} ${t.description || ''}`.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'todos' || (t.transactionType || '').toLowerCase() === filter;
        return matchSearch && matchFilter;
    });

    const totalMonto = data.reduce((s, t) => s + Number(t.amount || 0), 0);
    const transferencias = data.filter(t => (t.transactionType || '').toLowerCase() === 'transferencia').length;
    const pagos = data.filter(t => (t.transactionType || '').toLowerCase() === 'pago').length;

    const handleDelete = async () => {
        if (!confirm) return;
        try {
            await deleteTransaction(confirm.id);
            showSuccess('Transacción eliminada');
            reload();
        } catch {
            showError('Error al eliminar');
        } finally {
            setConfirm(null);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Transacciones</h1>
                    <p className="page-subtitle">Historial completo de movimientos del sistema</p>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total transacciones', value: loading ? '...' : data.length, icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M7 16l-4-4m0 0l4-4m-4 4h18M17 8l4 4m0 0l-4 4m4-4H3" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
                    { label: 'Transferencias', value: loading ? '...' : transferencias, icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M5 12h14M12 5l7 7-7 7" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
                    { label: 'Pagos', value: loading ? '...' : pagos, icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="2" y="5" width="20" height="14" rx="2" stroke="#c8a951" strokeWidth="1.5" /><path d="M2 10h20" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" /></svg> },
                    { label: 'Monto total', value: loading ? '...' : `Q ${fmt(totalMonto)}`, icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><circle cx="12" cy="12" r="10" stroke="#c8a951" strokeWidth="1.5" /><path d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H9m0 0h5.5a1.5 1.5 0 010 3H9" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" /></svg> },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-card-icon">{s.icon}</div>
                        <div className="stat-card-value" style={{ fontSize: i === 3 ? '1rem' : undefined }}>{s.value}</div>
                        <div className="stat-card-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabla */}
            <div className="table-card">
                <div className="table-header">
                    <span className="table-title">Todos los movimientos</span>
                    <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                        {/* Filtros */}
                        <div style={{ display: 'flex', gap: '.4rem' }}>
                            {['todos', 'transferencia', 'pago'].map(f => (
                                <button key={f} onClick={() => setFilter(f)} style={{ padding: '.3rem .75rem', fontSize: '.75rem', borderRadius: 20, border: `1px solid ${filter === f ? 'rgba(200,169,81,0.5)' : 'rgba(255,255,255,0.08)'}`, background: filter === f ? 'rgba(200,169,81,0.12)' : 'transparent', color: filter === f ? 'var(--gold-pure)' : 'var(--muted)', cursor: 'pointer', textTransform: 'capitalize' }}>
                                    {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                        <div className="search-input-wrap">
                            <span className="search-icon"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" /><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></span>
                            <input className="search-input" placeholder="Buscar por cuenta, usuario, tipo..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr><th>Tipo</th><th>Usuario</th><th>Origen</th><th>Destino</th><th>Monto</th><th>Descripción</th><th>Fecha</th><th>Acciones</th></tr>
                    </thead>
                    <tbody>
                        {loading ? <LoadingRows cols={8} /> : filtered.map((t, i) => {
                            const id = t._id || t.id;
                            return (
                                <tr key={i}>
                                    <td><Badge value={t.transactionType || t.TransactionType} /></td>
                                    <td style={{ fontSize: '.78rem', color: 'var(--muted)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.userId || '—'}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--gold-pure)' }}>{t.sourceAccountNumber || t.sourceAccountId || '—'}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--gold-pure)' }}>{t.destinationAccountNumber || t.destinationAccountId || '—'}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--white)' }}>Q {fmt(t.amount || t.Amount)}</td>
                                    <td style={{ color: 'var(--muted)', fontSize: '.82rem', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description || '—'}</td>
                                    <td style={{ color: 'var(--muted)', fontSize: '.78rem' }}>{fmtDate(t.createdAt || t.date)}</td>
                                    <td>
                                        <div className="action-btns">
                                            <button onClick={() => setDetail(t)} style={{ padding: '.3rem .6rem', fontSize: '.75rem', background: 'rgba(200,169,81,0.1)', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 6, color: 'var(--gold-dim)', cursor: 'pointer' }}>Ver</button>
                                            <button className="btn-icon danger" title="Eliminar" onClick={() => setConfirm({ id, label: `Q ${fmt(t.amount)}` })}>
                                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {!loading && filtered.length === 0 && <EmptyState text="Sin transacciones registradas" />}
                    </tbody>
                </table>
            </div>

            {detail && <TransactionDetail tx={detail} onClose={() => setDetail(null)} />}
            <ConfirmModal open={!!confirm} title="Eliminar transacción" message={`¿Eliminar la transacción de ${confirm?.label}? Esta acción no se puede deshacer.`} onConfirm={handleDelete} onCancel={() => setConfirm(null)} />
        </div>
    );
};

export default TransactionsPageAdmin;
