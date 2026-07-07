import { useState } from 'react';
import { useData, clearDataCache } from '../../../../shared/hooks/useData';
import { showSuccess, showError } from '../../../../shared/utils/toast';
import {
  getCards,
  toggleCardStatus,
  createCard,
  updateCard,
  deleteCard,
} from '../../../../shared/api/banking';
import Badge from '../../shared/Badge';
import LoadingRows from '../../shared/LoadingRows';
import EmptyState from '../../shared/EmptyState';
import ConfirmModal from '../../shared/ConfirmModal';
import CardField from '../components/CardField';
import { fmt, fmtDate } from '../../shared/formatters';

const CardsSection = () => {
  const { data, loading, reload } = useData(getCards);
  const [search, setSearch]           = useState('');
  const [toggling, setToggling]       = useState(null);
  const [confirm, setConfirm]         = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal]     = useState(null);
  const [saving, setSaving]           = useState(false);

  const emptyForm = {
    userId: '', cardType: 'debito', cvv: '', availableBalance: '',
    expirationDate: '', pin: '', franchise: 'VISA', creditLimit: '',
  };
  const [form, setForm] = useState(emptyForm);

  const filtered = data.filter(c =>
    `${c.cardType || ''} ${c.status || ''} ${c.userId || ''} ${c.franchise || ''} ${c.cardNumber || ''}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const totalActivas    = data.filter(c => (c.status || '').toLowerCase() === 'activa').length;
  const totalBloqueadas = data.filter(c => (c.status || '').toLowerCase() === 'bloqueada').length;
  const totalBalance    = data.reduce((s, c) => s + Number(c.availableBalance || 0), 0);

  const handleToggle = async (id, status) => {
    setToggling(id);
    try {
      const ns = status === 'activa' ? 'bloqueada' : 'activa';
      await toggleCardStatus(id, ns);
      showSuccess(`Tarjeta ${ns}`);
      reload();
    } catch { showError('Error al cambiar estado'); }
    finally { setToggling(null); }
  };

  const handleDelete = async () => {
    try { await deleteCard(confirm.id); showSuccess('Tarjeta eliminada'); reload(); }
    catch { showError('Error al eliminar'); }
    setConfirm(null);
  };

  const handleCreate = async () => {
    if (!form.userId)           { showError('El ID de usuario es obligatorio'); return; }
    if (!form.cvv)              { showError('El CVV es obligatorio'); return; }
    if (!form.pin)              { showError('El PIN es obligatorio'); return; }
    if (!form.availableBalance) { showError('El balance es obligatorio'); return; }
    if (!form.expirationDate)   { showError('La fecha de vencimiento es obligatoria'); return; }
    setSaving(true);
    try {
      await createCard({
        userId:           form.userId.trim(),
        cardType:         form.cardType,
        cvv:              form.cvv,
        pin:              form.pin,
        availableBalance: Number(form.availableBalance),
        expirationDate:   form.expirationDate,
        franchise:        form.franchise,
        creditLimit:      form.cardType === 'credito' ? Number(form.creditLimit) : undefined,
      });
      showSuccess('Tarjeta creada');
      setCreateModal(false);
      setForm(emptyForm);
      reload();
    } catch (e) { showError(e?.response?.data?.message || 'Error al crear'); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    setSaving(true);
    try {
      const payload = {};
      if (form.franchise)              payload.franchise        = form.franchise;
      if (form.availableBalance !== '') payload.availableBalance = Number(form.availableBalance);
      if (form.creditLimit !== '')     payload.creditLimit      = Number(form.creditLimit);
      if (form.expirationDate)         payload.expirationDate   = form.expirationDate;
      await updateCard(editModal._id, payload);
      showSuccess('Tarjeta actualizada');
      setEditModal(null);
      setForm(emptyForm);
      reload();
    } catch (e) { showError(e?.response?.data?.message || 'Error al actualizar'); }
    finally { setSaving(false); }
  };

  const openEdit = (c) => {
    setForm({
      userId:           c.userId || '',
      cardType:         c.cardType || 'debito',
      cvv:              '',
      pin:              '',
      availableBalance: c.availableBalance || '',
      expirationDate:   c.expirationDate ? c.expirationDate.slice(0, 10) : '',
      franchise:        c.franchise || 'VISA',
      creditLimit:      c.creditLimit || '',
    });
    setEditModal(c);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tarjetas</h1>
          <p className="page-subtitle">Gestión de tarjetas de crédito y débito</p>
        </div>
        <button className="btn-add" onClick={() => { setForm(emptyForm); setCreateModal(true); }}>
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Nueva tarjeta
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        {[
          { label: 'Total tarjetas', value: data.length,
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="2" y="5" width="20" height="14" rx="2" stroke="#c8a951" strokeWidth="1.5"/><path d="M2 10h20" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/></svg> },
          { label: 'Activas', value: totalActivas,
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M9 12l2 2 4-4" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10" stroke="#4caf7d" strokeWidth="1.5"/></svg> },
          { label: 'Bloqueadas', value: totalBloqueadas,
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#e05c5c" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round"/></svg> },
          { label: 'Balance total', value: 'Q ' + fmt(totalBalance),
            icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><circle cx="12" cy="12" r="10" stroke="#c8a951" strokeWidth="1.5"/><path d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H9m0 0h5.5a1.5 1.5 0 010 3H9" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/></svg> },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-value" style={{ fontSize: i === 3 ? '1rem' : undefined }}>{loading ? '...' : s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Todas las tarjetas ({filtered.length})</span>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-input-wrap">
              <span className="search-icon">
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
              <input className="search-input" placeholder="Buscar por tipo, estado, usuario..." value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <button className="btn-secondary" onClick={() => { clearDataCache(); reload(); }}>
              <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Actualizar
            </button>
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Tarjeta</th><th>Usuario ID</th><th>Tipo</th><th>Franquicia</th>
                <th>Balance</th><th>Vencimiento</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <LoadingRows cols={8}/> : filtered.map((c, i) => {
                const id = c._id || c.id;
                const status = (c.status || 'activa').toLowerCase();
                const isBlocked = status === 'bloqueada';
                return (
                  <tr key={i}>
                    <td style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--gold-pure)' }}>
                      {c.cardNumber ? `···· ${c.cardNumber.slice(-4)}` : '—'}
                    </td>
                    <td style={{ fontSize: '.78rem', color: 'var(--muted)', fontFamily: 'monospace', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.userId || '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{c.cardType || '—'}</td>
                    <td>{c.franchise || '—'}</td>
                    <td style={{ fontWeight: 500, color: 'var(--white)' }}>Q {fmt(c.availableBalance)}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{fmtDate(c.expirationDate)}</td>
                    <td><Badge value={c.status || 'activa'}/></td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon" title="Editar" onClick={() => openEdit(c)}>
                          <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                        <button className="btn-icon" title={isBlocked ? 'Activar' : 'Bloquear'} disabled={toggling === id} onClick={() => handleToggle(id, status)} style={{ color: isBlocked ? '#4caf7d' : '#eab308' }}>
                          {toggling === id ? <span className="spin"/> : isBlocked
                            ? <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            : <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          }
                        </button>
                        <button className="btn-icon danger" title="Eliminar" onClick={() => setConfirm({ id, label: `···· ${(c.cardNumber || '').slice(-4)}` })}>
                          <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                            <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && <EmptyState text="Sin tarjetas registradas"/>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear */}
      {createModal && (
        <div className="modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Nueva tarjeta</span>
              <button className="modal-close" onClick={() => setCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-fields-row">
                <CardField label="ID de usuario *"><input className="modal-input" placeholder="usr_XXXX" value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))}/></CardField>
                <CardField label="Tipo de tarjeta *">
                  <select className="modal-select" value={form.cardType} onChange={e => setForm(p => ({ ...p, cardType: e.target.value }))}>
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                  </select>
                </CardField>
              </div>
              <div className="modal-fields-row">
                <CardField label="Franquicia">
                  <select className="modal-select" value={form.franchise} onChange={e => setForm(p => ({ ...p, franchise: e.target.value }))}>
                    <option value="VISA">VISA</option>
                    <option value="MASTERCARD">Mastercard</option>
                    <option value="AMEX">American Express</option>
                  </select>
                </CardField>
                <CardField label="Balance disponible (Q) *"><input className="modal-input" type="number" placeholder="1000.00" value={form.availableBalance} onChange={e => setForm(p => ({ ...p, availableBalance: e.target.value }))}/></CardField>
              </div>
              {form.cardType === 'credito' && (
                <CardField label="Límite de crédito (Q)"><input className="modal-input" type="number" placeholder="5000.00" value={form.creditLimit} onChange={e => setForm(p => ({ ...p, creditLimit: e.target.value }))}/></CardField>
              )}
              <div className="modal-fields-row">
                <CardField label="CVV (3-4 dígitos) *"><input className="modal-input" placeholder="123" maxLength={4} value={form.cvv} onChange={e => setForm(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '') }))}/></CardField>
                <CardField label="PIN (4 dígitos) *"><input className="modal-input" type="password" placeholder="••••" maxLength={4} value={form.pin} onChange={e => setForm(p => ({ ...p, pin: e.target.value.replace(/\D/g, '') }))}/></CardField>
              </div>
              <CardField label="Fecha de vencimiento *"><input className="modal-input" type="date" value={form.expirationDate} onChange={e => setForm(p => ({ ...p, expirationDate: e.target.value }))}/></CardField>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setCreateModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleCreate} disabled={saving}>{saving ? <span className="spin"/> : 'Crear tarjeta'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Editar tarjeta</span>
              <button className="modal-close" onClick={() => setEditModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'rgba(200,169,81,0.05)', border: '1px solid rgba(200,169,81,0.12)', borderRadius: 8, padding: '.85rem 1rem', marginBottom: '.5rem', fontSize: '.82rem', color: 'var(--gold-bright)' }}>
                Tarjeta: <strong style={{ fontFamily: 'monospace' }}>{editModal.cardNumber ? `···· ${editModal.cardNumber.slice(-4)}` : '—'}</strong> · {editModal.cardType} · {editModal.userId}
              </div>
              <div className="modal-fields-row">
                <CardField label="Franquicia">
                  <select className="modal-select" value={form.franchise} onChange={e => setForm(p => ({ ...p, franchise: e.target.value }))}>
                    <option value="VISA">VISA</option>
                    <option value="MASTERCARD">Mastercard</option>
                    <option value="AMEX">American Express</option>
                  </select>
                </CardField>
                <CardField label="Balance disponible (Q)"><input className="modal-input" type="number" value={form.availableBalance} onChange={e => setForm(p => ({ ...p, availableBalance: e.target.value }))}/></CardField>
              </div>
              {editModal.cardType === 'credito' && (
                <CardField label="Límite de crédito (Q)"><input className="modal-input" type="number" value={form.creditLimit} onChange={e => setForm(p => ({ ...p, creditLimit: e.target.value }))}/></CardField>
              )}
              <CardField label="Fecha de vencimiento"><input className="modal-input" type="date" value={form.expirationDate} onChange={e => setForm(p => ({ ...p, expirationDate: e.target.value }))}/></CardField>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setEditModal(null)}>Cancelar</button>
              <button className="btn-save" onClick={handleEdit} disabled={saving}>{saving ? <span className="spin"/> : 'Actualizar'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirm}
        title="Eliminar tarjeta"
        message={`¿Eliminar la tarjeta ${confirm?.label}? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default CardsSection;