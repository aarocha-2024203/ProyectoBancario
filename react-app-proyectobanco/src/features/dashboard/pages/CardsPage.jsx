import { useState } from 'react';
import { useData } from '../../../shared/hooks/useData';
import { showSuccess, showError } from '../../../shared/utils/toast';
import {
    getCards,
    createCard,
    updateCard,
    deleteCard,
    toggleCardStatus,
} from '../../../shared/api/banking';
import useAuthStore from '../../auth/store/authStore';

const fmt = (n) =>
    n != null ? Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2 }) : '—';
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('es-GT') : '—');

const Badge = ({ value }) => {
    const v = (value || '').toLowerCase();
    const cls = ['activa', 'active'].includes(v)
        ? 'badge-success'
        : ['bloqueada', 'cancelada', 'vencida'].includes(v)
            ? 'badge-danger'
            : 'badge-muted';
    return <span className={`badge ${cls}`}>{value || '—'}</span>;
};

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const CardVisual = ({ card }) => {
    const isBlocked = (card.status || '').toLowerCase() === 'bloqueada';
    const isCredit = (card.cardType || '').toLowerCase() === 'credito';
    const num = card.cardNumber || '0000000000000000';
    const formatted = num.replace(/(.{4})/g, '$1 ').trim();

    return (
        <div
            style={{
                background: isBlocked
                    ? 'linear-gradient(135deg,#1a0a0a,#2d1010)'
                    : isCredit
                        ? 'linear-gradient(135deg,#0a1628,#1a2d4a,#0f2040)'
                        : 'linear-gradient(135deg,#0f1e35,#162847,#0a1628)',
                border: `1px solid ${isBlocked ? 'rgba(224,92,92,0.3)' : 'rgba(200,169,81,0.25)'}`,
                borderRadius: 16, padding: '1.5rem', position: 'relative',
                overflow: 'hidden', minHeight: 180, cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = isBlocked ? '0 12px 40px rgba(224,92,92,0.15)' : '0 12px 40px rgba(200,169,81,0.12)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, background: `radial-gradient(circle,${isBlocked ? 'rgba(224,92,92,0.08)' : 'rgba(200,169,81,0.08)'} 0%,transparent 70%)`, borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, background: `radial-gradient(circle,${isBlocked ? 'rgba(224,92,92,0.05)' : 'rgba(200,169,81,0.05)'} 0%,transparent 70%)`, borderRadius: '50%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <span style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.12em', color: isBlocked ? 'rgba(224,92,92,0.7)' : 'var(--gold-dim)', fontWeight: 600 }}>{card.cardType || 'tarjeta'}</span>
                <Badge value={card.status || 'activa'} />
            </div>
            <div style={{ width: 36, height: 28, background: isBlocked ? 'linear-gradient(135deg,rgba(224,92,92,0.3),rgba(224,92,92,0.15))' : 'linear-gradient(135deg,rgba(200,169,81,0.4),rgba(200,169,81,0.2))', borderRadius: 6, marginBottom: '1rem', border: `1px solid ${isBlocked ? 'rgba(224,92,92,0.2)' : 'rgba(200,169,81,0.3)'}` }} />
            <p style={{ fontFamily: 'monospace', fontSize: '.95rem', letterSpacing: '.15em', color: isBlocked ? 'rgba(224,92,92,0.8)' : 'var(--white)', marginBottom: '.8rem' }}>
                {formatted.length > 10 ? `${formatted.slice(0, 9)}** **** ${formatted.slice(-4)}` : formatted}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <p style={{ fontSize: '.6rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.2rem' }}>Titular</p>
                    <p style={{ fontSize: '.82rem', color: 'var(--white)', fontWeight: 500 }}>{card.name || card.holderName || '—'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '.6rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.2rem' }}>Vence</p>
                    <p style={{ fontSize: '.82rem', color: isBlocked ? 'rgba(224,92,92,0.8)' : 'var(--gold-pure)' }}>{fmtDate(card.expirationDate || card.expDate)}</p>
                </div>
            </div>
        </div>
    );
};

const Modal = ({ title, onClose, children }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div style={{ background: 'var(--bg-card, #0f1e35)', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--white)', margin: 0 }}>{title}</h2>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
            </div>
            {children}
        </div>
    </div>
);

const inputStyle = { width: '100%', padding: '.6rem .9rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,169,81,0.15)', borderRadius: 8, color: 'var(--white)', fontSize: '.88rem', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem', fontWeight: 500 };

const CreateCardForm = ({ onSuccess, onClose, userId }) => {
    const [form, setForm] = useState({ cardType: 'debito', franchise: 'VISA', creditLimit: '', availableBalance: '', expirationDate: '', cvv: '', pin: '' });
    const [loading, setLoading] = useState(false);
    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const handleSubmit = async () => {
        if (!form.cardType) return showError('Selecciona el tipo de tarjeta');
        setLoading(true);
        try {
            const payload = { userId, cardType: form.cardType, franchise: form.franchise, status: 'activa' };
            if (form.creditLimit) payload.creditLimit = Number(form.creditLimit);
            if (form.availableBalance) payload.availableBalance = Number(form.availableBalance);
            if (form.expirationDate) payload.expirationDate = form.expirationDate;
            if (form.cvv) payload.cvv = form.cvv;
            if (form.pin) payload.pin = form.pin;
            await createCard(payload);
            showSuccess('Tarjeta creada exitosamente');
            onSuccess();
            onClose();
        } catch (e) {
            showError(e?.response?.data?.message || 'Error al crear la tarjeta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={labelStyle}>Tipo de tarjeta</label>
                    <select style={inputStyle} value={form.cardType} onChange={(e) => set('cardType', e.target.value)}>
                        <option value="debito">Débito</option>
                        <option value="credito">Crédito</option>
                    </select>
                </div>
                <div>
                    <label style={labelStyle}>Franquicia</label>
                    <select style={inputStyle} value={form.franchise} onChange={(e) => set('franchise', e.target.value)}>
                        <option value="VISA">VISA</option>
                        <option value="MASTERCARD">Mastercard</option>
                        <option value="AMEX">American Express</option>
                    </select>
                </div>
            </div>
            {form.cardType === 'credito' && (
                <div>
                    <label style={labelStyle}>Límite de crédito (Q)</label>
                    <input type="number" style={inputStyle} placeholder="Ej. 10000" value={form.creditLimit} onChange={(e) => set('creditLimit', e.target.value)} />
                </div>
            )}
            <div>
                <label style={labelStyle}>Balance disponible (Q)</label>
                <input type="number" style={inputStyle} placeholder="Ej. 5000" value={form.availableBalance} onChange={(e) => set('availableBalance', e.target.value)} />
            </div>
            <div>
                <label style={labelStyle}>Fecha de vencimiento</label>
                <input type="date" style={inputStyle} value={form.expirationDate} onChange={(e) => set('expirationDate', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={labelStyle}>CVV</label>
                    <input type="text" style={inputStyle} placeholder="123" maxLength={4} value={form.cvv} onChange={(e) => set('cvv', e.target.value)} />
                </div>
                <div>
                    <label style={labelStyle}>PIN</label>
                    <input type="password" style={inputStyle} placeholder="1234" maxLength={4} value={form.pin} onChange={(e) => set('pin', e.target.value)} />
                </div>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
                <button onClick={onClose} style={{ flex: 1, padding: '.65rem', background: 'none', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 8, color: 'var(--muted)', cursor: 'pointer', fontSize: '.88rem' }}>Cancelar</button>
                <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, padding: '.65rem', background: loading ? 'rgba(200,169,81,0.3)' : 'rgba(200,169,81,0.15)', border: '1px solid rgba(200,169,81,0.4)', borderRadius: 8, color: loading ? 'var(--muted)' : 'var(--gold-pure)', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '.88rem', fontWeight: 600 }}>
                    {loading ? 'Creando...' : 'Crear tarjeta'}
                </button>
            </div>
        </div>
    );
};

const EditCardForm = ({ card, onSuccess, onClose }) => {
    const [form, setForm] = useState({ franchise: card.franchise || '', creditLimit: card.creditLimit || '', availableBalance: card.availableBalance || '', expirationDate: card.expirationDate ? card.expirationDate.slice(0, 10) : '' });
    const [loading, setLoading] = useState(false);
    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {};
            if (form.franchise) payload.franchise = form.franchise;
            if (form.creditLimit !== '') payload.creditLimit = Number(form.creditLimit);
            if (form.availableBalance !== '') payload.availableBalance = Number(form.availableBalance);
            if (form.expirationDate) payload.expirationDate = form.expirationDate;
            await updateCard(card._id, payload);
            showSuccess('Tarjeta actualizada exitosamente');
            onSuccess();
            onClose();
        } catch (e) {
            showError(e?.response?.data?.message || 'Error al actualizar la tarjeta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
                <label style={labelStyle}>Franquicia</label>
                <select style={inputStyle} value={form.franchise} onChange={(e) => set('franchise', e.target.value)}>
                    <option value="VISA">VISA</option>
                    <option value="MASTERCARD">Mastercard</option>
                    <option value="AMEX">American Express</option>
                </select>
            </div>
            {(card.cardType || '').toLowerCase() === 'credito' && (
                <div>
                    <label style={labelStyle}>Límite de crédito (Q)</label>
                    <input type="number" style={inputStyle} value={form.creditLimit} onChange={(e) => set('creditLimit', e.target.value)} />
                </div>
            )}
            <div>
                <label style={labelStyle}>Balance disponible (Q)</label>
                <input type="number" style={inputStyle} value={form.availableBalance} onChange={(e) => set('availableBalance', e.target.value)} />
            </div>
            <div>
                <label style={labelStyle}>Fecha de vencimiento</label>
                <input type="date" style={inputStyle} value={form.expirationDate} onChange={(e) => set('expirationDate', e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
                <button onClick={onClose} style={{ flex: 1, padding: '.65rem', background: 'none', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 8, color: 'var(--muted)', cursor: 'pointer', fontSize: '.88rem' }}>Cancelar</button>
                <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, padding: '.65rem', background: 'rgba(200,169,81,0.15)', border: '1px solid rgba(200,169,81,0.4)', borderRadius: 8, color: loading ? 'var(--muted)' : 'var(--gold-pure)', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '.88rem', fontWeight: 600 }}>
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
            </div>
        </div>
    );
};

const CardDetail = ({ card, onEdit, onReload, onClose }) => {
    const [loadingStatus, setLoadingStatus] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const isBlocked = (card.status || '').toLowerCase() === 'bloqueada';

    const handleToggle = async () => {
        setLoadingStatus(true);
        try {
            const newStatus = isBlocked ? 'activa' : 'bloqueada';
            await toggleCardStatus(card._id, newStatus);
            showSuccess(`Tarjeta ${newStatus} correctamente`);
            onReload();
            onClose();
        } catch (e) {
            showError(e?.response?.data?.message || 'Error al cambiar estado');
        } finally {
            setLoadingStatus(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('¿Eliminar esta tarjeta? Esta acción no se puede deshacer.')) return;
        setLoadingDelete(true);
        try {
            await deleteCard(card._id);
            showSuccess('Tarjeta eliminada exitosamente');
            onReload();
            onClose();
        } catch (e) {
            showError(e?.response?.data?.message || 'Error al eliminar la tarjeta');
        } finally {
            setLoadingDelete(false);
        }
    };

    const row = (label, value) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '.78rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</span>
            <span style={{ fontSize: '.88rem', color: 'var(--white)', fontWeight: 500 }}>{value}</span>
        </div>
    );

    return (
        <div>
            <CardVisual card={card} />
            <div style={{ marginTop: '1.5rem' }}>
                {row('Número', card.cardNumber || '—')}
                {row('Tipo', card.cardType || '—')}
                {row('Franquicia', card.franchise || '—')}
                {row('Balance disponible', `Q ${fmt(card.availableBalance)}`)}
                {(card.cardType || '').toLowerCase() === 'credito' && row('Límite de crédito', `Q ${fmt(card.creditLimit)}`)}
                {row('Vencimiento', fmtDate(card.expirationDate))}
                {row('Estado', <Badge value={card.status || 'activa'} />)}
                {row('Creada', fmtDate(card.createdAt))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginTop: '1.5rem' }}>
                <button onClick={() => onEdit(card)} style={{ padding: '.65rem', background: 'rgba(200,169,81,0.1)', border: '1px solid rgba(200,169,81,0.3)', borderRadius: 8, color: 'var(--gold-pure)', cursor: 'pointer', fontSize: '.85rem', fontWeight: 500 }}>✏️ Editar</button>
                <button onClick={handleToggle} disabled={loadingStatus} style={{ padding: '.65rem', background: isBlocked ? 'rgba(74,222,128,0.1)' : 'rgba(234,179,8,0.1)', border: `1px solid ${isBlocked ? 'rgba(74,222,128,0.3)' : 'rgba(234,179,8,0.3)'}`, borderRadius: 8, color: isBlocked ? '#4ade80' : '#eab308', cursor: loadingStatus ? 'not-allowed' : 'pointer', fontSize: '.85rem', fontWeight: 500 }}>
                    {loadingStatus ? '...' : isBlocked ? '🔓 Desbloquear' : '🔒 Bloquear'}
                </button>
                <button onClick={handleDelete} disabled={loadingDelete} style={{ gridColumn: '1 / -1', padding: '.65rem', background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.25)', borderRadius: 8, color: '#e05c5c', cursor: loadingDelete ? 'not-allowed' : 'pointer', fontSize: '.85rem', fontWeight: 500 }}>
                    {loadingDelete ? 'Eliminando...' : '🗑️ Eliminar tarjeta'}
                </button>
            </div>
        </div>
    );
};

/* ══ COMPONENTE PRINCIPAL ══ */
const UserCards = () => {
    const { user } = useAuthStore();
    const userId = user?.id || user?.userId || user?.sub || user?.Id;

    // reload es el nombre correcto que devuelve useData (no refresh)
    const { data, loading, reload } = useData(getCards);

    const [modal, setModal] = useState(null);
    const [selected, setSelected] = useState(null);

    const openDetail = (card) => { setSelected(card); setModal('detail'); };
    const openEdit = (card) => { setSelected(card); setModal('edit'); };
    const closeModal = () => { setModal(null); setSelected(null); };

    const activeCards = data.filter((c) => (c.status || '').toLowerCase() === 'activa');
    const blockedCards = data.filter((c) => (c.status || '').toLowerCase() === 'bloqueada');

    return (
        <div>
            {/* Header — UN SOLO botón */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Mis Tarjetas</h1>
                    <p className="page-subtitle">Gestiona tus tarjetas de crédito y débito</p>
                </div>
                <button className="btn-primary" onClick={() => setModal('create')} style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                    <PlusIcon /> Nueva tarjeta
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total tarjetas', value: loading ? '...' : data.length, icon: '💳' },
                    { label: 'Activas', value: loading ? '...' : activeCards.length, icon: '✅' },
                    { label: 'Bloqueadas', value: loading ? '...' : blockedCards.length, icon: '🔒' },
                    { label: 'Balance total', value: loading ? '...' : `Q ${fmt(data.reduce((s, c) => s + Number(c.availableBalance || 0), 0))}`, icon: '💰' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-card-icon"><span style={{ fontSize: '1.1rem' }}>{s.icon}</span></div>
                        <div className="stat-card-value" style={{ fontSize: i === 3 ? '1rem' : undefined }}>{s.value}</div>
                        <div className="stat-card-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
                    {[1, 2, 3].map((i) => (<div key={i} className="stat-card"><div className="skeleton" style={{ height: 180, borderRadius: 12 }} /></div>))}
                </div>
            ) : data.length === 0 ? (
                // Empty state SIN botón duplicado
                <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed rgba(200,169,81,0.15)', borderRadius: 16, color: 'var(--muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
                    <p style={{ fontSize: '1rem', marginBottom: '.5rem', color: 'var(--white)' }}>No tienes tarjetas registradas</p>
                    <p style={{ fontSize: '.85rem' }}>Usa el botón "Nueva tarjeta" para solicitar una</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
                    {data.map((card) => (
                        <div key={card._id} onClick={() => openDetail(card)}>
                            <CardVisual card={card} />
                            <div style={{ padding: '.75rem .25rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '.78rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                                    {card.franchise || '—'} ···· {(card.cardNumber || '').slice(-4) || '????'}
                                </span>
                                <span style={{ fontSize: '.78rem', color: 'var(--gold-dim)' }}>Q {fmt(card.availableBalance)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabla */}
            {!loading && data.length > 0 && (
                <div className="table-card" style={{ marginTop: '2rem' }}>
                    <div className="table-header">
                        <span className="table-title">Listado de tarjetas</span>
                        <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{data.length} tarjeta{data.length !== 1 ? 's' : ''}</span>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr><th>Número</th><th>Tipo</th><th>Franquicia</th><th>Balance</th><th>Vencimiento</th><th>Estado</th><th>Acciones</th></tr>
                        </thead>
                        <tbody>
                            {data.map((card) => (
                                <tr key={card._id}>
                                    <td style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--gold-pure)' }}>···· {(card.cardNumber || '').slice(-4) || '????'}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{card.cardType || '—'}</td>
                                    <td>{card.franchise || '—'}</td>
                                    <td style={{ fontWeight: 500 }}>Q {fmt(card.availableBalance)}</td>
                                    <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{fmtDate(card.expirationDate)}</td>
                                    <td><Badge value={card.status || 'activa'} /></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '.4rem' }}>
                                            <button onClick={(e) => { e.stopPropagation(); openDetail(card); }} style={{ padding: '.3rem .6rem', fontSize: '.75rem', background: 'rgba(200,169,81,0.1)', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 6, color: 'var(--gold-dim)', cursor: 'pointer' }}>Ver</button>
                                            <button onClick={(e) => { e.stopPropagation(); openEdit(card); }} style={{ padding: '.3rem .6rem', fontSize: '.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'var(--muted)', cursor: 'pointer' }}>Editar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modals */}
            {modal === 'create' && (
                <Modal title="Nueva tarjeta" onClose={closeModal}>
                    <CreateCardForm userId={userId} onSuccess={reload} onClose={closeModal} />
                </Modal>
            )}
            {modal === 'detail' && selected && (
                <Modal title="Detalle de tarjeta" onClose={closeModal}>
                    <CardDetail card={selected} onEdit={openEdit} onReload={reload} onClose={closeModal} />
                </Modal>
            )}
            {modal === 'edit' && selected && (
                <Modal title="Editar tarjeta" onClose={closeModal}>
                    <EditCardForm card={selected} onSuccess={reload} onClose={closeModal} />
                </Modal>
            )}
        </div>
    );
};

export default UserCards;
