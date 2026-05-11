import { useState } from 'react';
import { useData } from '../../../shared/hooks/useData';
import { showSuccess, showError } from '../../../shared/utils/toast';
import {
    getCards,
    toggleCardStatus,
    deleteCard,
    updateCard,
} from '../../../shared/api/banking';

const fmt = (n) => n != null ? Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2 }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-GT') : '—';

const Badge = ({ value }) => {
    const v = (value || '').toLowerCase();
    const cls = ['activa', 'active'].includes(v)
        ? 'badge-success'
        : ['bloqueada', 'cancelada', 'vencida'].includes(v)
            ? 'badge-danger'
            : 'badge-muted';
    return <span className={`badge ${cls}`}>{value || '—'}</span>;
};

const LoadingRows = ({ cols }) => (
    <>
        {[1, 2, 3, 4].map(i => (
            <tr key={i}>
                {Array(cols).fill(0).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ width: j === 0 ? '60%' : '80%' }} /></td>
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
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </div>
            <p className="empty-state-text">{text || 'Sin datos'}</p>
        </div>
    </td></tr>
);

const ConfirmModal = ({ open, title, message, onConfirm, onCancel, danger = true }) => {
    if (!open) return null;
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">{title}</span>
                    <button className="modal-close" onClick={onCancel}>✕</button>
                </div>
                <div className="modal-body">
                    <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>{message}</p>
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onCancel}>Cancelar</button>
                    <button
                        className="btn-save"
                        style={danger ? { background: 'linear-gradient(135deg,#c0392b,#e05c5c)', color: '#fff' } : {}}
                        onClick={onConfirm}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ── Modal editar tarjeta (admin) ── */
const EditCardModal = ({ card, onSuccess, onClose }) => {
    const [form, setForm] = useState({
        franchise: card.franchise || '',
        creditLimit: card.creditLimit || '',
        availableBalance: card.availableBalance || '',
        expirationDate: card.expirationDate ? card.expirationDate.slice(0, 10) : '',
    });
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const payload = {};
            if (form.franchise) payload.franchise = form.franchise;
            if (form.creditLimit !== '') payload.creditLimit = Number(form.creditLimit);
            if (form.availableBalance !== '') payload.availableBalance = Number(form.availableBalance);
            if (form.expirationDate) payload.expirationDate = form.expirationDate;
            await updateCard(card._id, payload);
            showSuccess('Tarjeta actualizada');
            onSuccess();
            onClose();
        } catch (e) {
            showError(e?.response?.data?.message || 'Error al actualizar');
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = { width: '100%', padding: '.55rem .85rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,169,81,0.15)', borderRadius: 8, color: 'var(--white)', fontSize: '.88rem', outline: 'none', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.35rem', fontWeight: 500 };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">Editar Tarjeta</span>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Franquicia</label>
                        <select style={inputStyle} value={form.franchise} onChange={e => set('franchise', e.target.value)}>
                            <option value="VISA">VISA</option>
                            <option value="MASTERCARD">Mastercard</option>
                            <option value="AMEX">American Express</option>
                        </select>
                    </div>
                    {(card.cardType || '').toLowerCase() === 'credito' && (
                        <div>
                            <label style={labelStyle}>Límite de crédito (Q)</label>
                            <input type="number" style={inputStyle} value={form.creditLimit} onChange={e => set('creditLimit', e.target.value)} />
                        </div>
                    )}
                    <div>
                        <label style={labelStyle}>Balance disponible (Q)</label>
                        <input type="number" style={inputStyle} value={form.availableBalance} onChange={e => set('availableBalance', e.target.value)} />
                    </div>
                    <div>
                        <label style={labelStyle}>Fecha de vencimiento</label>
                        <input type="date" style={inputStyle} value={form.expirationDate} onChange={e => set('expirationDate', e.target.value)} />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancelar</button>
                    <button className="btn-save" onClick={handleSubmit} disabled={saving}>
                        {saving ? <span className="spin" /> : 'Guardar cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ══ COMPONENTE PRINCIPAL ══ */
const CardsPageAdmin = () => {
    const { data, loading, reload } = useData(getCards);
    const [search, setSearch] = useState('');
    const [toggling, setToggling] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [confirmToggle, setConfirmToggle] = useState(null);
    const [editCard, setEditCard] = useState(null);

    const filtered = data.filter(c =>
        `${c.cardType || ''} ${c.status || ''} ${c.userId || ''} ${c.franchise || ''} ${c.cardNumber || ''}`.toLowerCase().includes(search.toLowerCase())
    );

    const totalActivas = data.filter(c => (c.status || '').toLowerCase() === 'activa').length;
    const totalBloqueadas = data.filter(c => (c.status || '').toLowerCase() === 'bloqueada').length;
    const totalBalance = data.reduce((s, c) => s + Number(c.availableBalance || 0), 0);

    const handleToggleConfirm = async () => {
        if (!confirmToggle) return;
        const { id, status } = confirmToggle;
        setToggling(id);
        setConfirmToggle(null);
        try {
            const newStatus = status === 'activa' ? 'bloqueada' : 'activa';
            await toggleCardStatus(id, newStatus);
            showSuccess(`Tarjeta ${newStatus} correctamente`);
            reload();
        } catch {
            showError('Error al cambiar estado');
        } finally {
            setToggling(null);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!confirmDelete) return;
        try {
            await deleteCard(confirmDelete.id);
            showSuccess('Tarjeta eliminada exitosamente');
            reload();
        } catch {
            showError('Error al eliminar la tarjeta');
        } finally {
            setConfirmDelete(null);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Tarjetas</h1>
                    <p className="page-subtitle">Gestión de todas las tarjetas del sistema</p>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total tarjetas', value: loading ? '...' : data.length, icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="2" y="5" width="20" height="14" rx="2" stroke="#c8a951" strokeWidth="1.5" /><path d="M2 10h20" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" /></svg> },
                    { label: 'Activas', value: loading ? '...' : totalActivas, icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M9 12l2 2 4-4" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="10" stroke="#4caf7d" strokeWidth="1.5" /></svg> },
                    { label: 'Bloqueadas', value: loading ? '...' : totalBloqueadas, icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#e05c5c" strokeWidth="1.5" /><path d="M7 11V7a5 5 0 0110 0v4" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round" /></svg> },
                    { label: 'Balance total', value: loading ? '...' : `Q ${fmt(totalBalance)}`, icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><circle cx="12" cy="12" r="10" stroke="#c8a951" strokeWidth="1.5" /><path d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H9m0 0h5.5a1.5 1.5 0 010 3H9" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round" /></svg> },
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
                    <span className="table-title">Todas las tarjetas</span>
                    <div className="table-actions">
                        <div className="search-input-wrap">
                            <span className="search-icon">
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </span>
                            <input
                                className="search-input"
                                placeholder="Buscar por tipo, estado, usuario..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>N° Tarjeta</th>
                            <th>Usuario ID</th>
                            <th>Tipo</th>
                            <th>Franquicia</th>
                            <th>Balance</th>
                            <th>Vencimiento</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <LoadingRows cols={8} /> : filtered.map((c, i) => {
                            const id = c._id || c.id;
                            const status = (c.status || 'activa').toLowerCase();
                            const isBlocked = status === 'bloqueada';
                            return (
                                <tr key={i}>
                                    <td style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--gold-pure)' }}>
                                        ···· {(c.cardNumber || '').slice(-4) || '????'}
                                    </td>
                                    <td style={{ fontSize: '.78rem', color: 'var(--muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {c.userId || c.UserId || '—'}
                                    </td>
                                    <td style={{ textTransform: 'capitalize' }}>{c.cardType || c.CardType || '—'}</td>
                                    <td>{c.franchise || '—'}</td>
                                    <td style={{ fontWeight: 500 }}>Q {fmt(c.availableBalance || c.AvailableBalance)}</td>
                                    <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{fmtDate(c.expirationDate || c.ExpirationDate)}</td>
                                    <td><Badge value={c.status || 'activa'} /></td>
                                    <td>
                                        <div className="action-btns">
                                            {/* Editar */}
                                            <button
                                                className="btn-icon"
                                                title="Editar"
                                                onClick={() => setEditCard(c)}
                                                style={{ color: 'var(--gold-dim)' }}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>

                                            {/* Bloquear / Activar */}
                                            <button
                                                className="btn-icon"
                                                title={isBlocked ? 'Desbloquear' : 'Bloquear'}
                                                disabled={toggling === id}
                                                onClick={() => setConfirmToggle({ id, status, label: `···· ${(c.cardNumber || '').slice(-4)}` })}
                                                style={{ color: isBlocked ? '#4ade80' : '#eab308' }}
                                            >
                                                {toggling === id ? <span className="spin" /> : isBlocked ? (
                                                    <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                                        <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                                        <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                        <path d="M12 15v2" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
                                                    </svg>
                                                ) : (
                                                    <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                                        <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                                        <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                    </svg>
                                                )}
                                            </button>

                                            {/* Eliminar */}
                                            <button
                                                className="btn-icon danger"
                                                title="Eliminar"
                                                onClick={() => setConfirmDelete({ id, label: `···· ${(c.cardNumber || '').slice(-4)}` })}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                                    <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {!loading && filtered.length === 0 && <EmptyState text="Sin tarjetas registradas" />}
                    </tbody>
                </table>
            </div>

            {/* Modal editar */}
            {editCard && (
                <EditCardModal
                    card={editCard}
                    onSuccess={reload}
                    onClose={() => setEditCard(null)}
                />
            )}

            {/* Confirm toggle */}
            <ConfirmModal
                open={!!confirmToggle}
                title={confirmToggle?.status === 'activa' ? 'Bloquear tarjeta' : 'Desbloquear tarjeta'}
                message={`¿Estás seguro de que deseas ${confirmToggle?.status === 'activa' ? 'bloquear' : 'desbloquear'} la tarjeta ${confirmToggle?.label}?`}
                danger={confirmToggle?.status === 'activa'}
                onConfirm={handleToggleConfirm}
                onCancel={() => setConfirmToggle(null)}
            />

            {/* Confirm delete */}
            <ConfirmModal
                open={!!confirmDelete}
                title="Eliminar tarjeta"
                message={`¿Eliminar la tarjeta ${confirmDelete?.label}? Esta acción no se puede deshacer.`}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setConfirmDelete(null)}
            />
        </div>
    );
};

export default CardsPageAdmin;
