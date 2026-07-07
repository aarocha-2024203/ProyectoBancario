import { useState, useEffect } from 'react';
import { useData, clearDataCache } from '../../../../shared/hooks/useData';
import { showSuccess, showError } from '../../../../shared/utils/toast';
import {
  getAccountLocks,
  createAccountLock,
  updateAccountLock,
  deleteAccountLock,
  toggleAccountStatus,
} from '../../../../shared/api/banking';
import useAuthStore from '../../../../features/auth/store/authStore';
import Badge from '../../shared/Badge';
import LoadingRows from '../../shared/LoadingRows';
import EmptyState from '../../shared/EmptyState';
import ConfirmModal from '../../shared/ConfirmModal';
import LockField from '../components/LockField';
import { fmtDate } from '../../shared/formatters';

const lockReasons = ['seguridad', 'fraude', 'solicitud_cliente', 'deuda', 'inactividad'];

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
    accountId: '', userId: '', lockReason: 'seguridad',
    description: '', lockDate: '', unlockDate: '',
    lockedBy: '', unlockedBy: '', status: 'bloqueado',
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { if (data.length > 0) setLocalData(data); }, [data]);

  const filtered = localData.filter((l) =>
    `${l.accountId || ''} ${l.userId || ''} ${l.lockReason || ''} ${l.status || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const openCreate = () => { setForm(emptyForm); setEditItem(null); setModal(true); };

  const openEdit = (l) => {
    setForm({
      accountId:   l.accountId   || '',
      userId:      l.userId      || '',
      lockReason:  l.lockReason  || 'seguridad',
      description: l.description || '',
      lockDate:    l.lockDate    ? l.lockDate.slice(0, 16)   : '',
      unlockDate:  l.unlockDate  ? l.unlockDate.slice(0, 16) : '',
      lockedBy:    l.lockedBy    || '',
      status:      l.status      || 'bloqueado',
      unlockedBy:  l.unlockedBy  || '',
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
        unlockDate:  form.unlockDate ? new Date(form.unlockDate).toISOString() : null,
        lockedBy:    form.lockedBy || form.userId,
        unlockedBy:  form.status === 'desbloqueado'
          ? (form.unlockedBy || form.lockedBy || user?.id || form.userId)
          : undefined,
        status: form.status,
      };
      Object.keys(payload).forEach((k) => { if (payload[k] === undefined) delete payload[k]; });

      if (editItem) {
        const id = editItem._id || editItem.id;
        await updateAccountLock(id, payload);
        if (form.status === 'desbloqueado') {
          try { await toggleAccountStatus(payload.accountId, 'activa'); } catch {}
        }
        setLocalData((prev) => prev.map((l) => ((l._id || l.id) === id ? { ...l, ...payload } : l)));
        showSuccess('Bloqueo actualizado');
      } else {
        const res = await createAccountLock(payload);
        const newLock = res.data?.data || res.data;
        try { await toggleAccountStatus(payload.accountId, 'bloqueada'); } catch {}
        setLocalData((prev) => [newLock, ...prev]);
        showSuccess('Cuenta bloqueada exitosamente');
      }
      setModal(false);
      clearDataCache();
    } catch (e) {
      showError(e?.response?.data?.message || e?.response?.data?.error || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const id    = confirm._id || confirm.id;
    const accId = confirm.accountId;
    try {
      await deleteAccountLock(id);
      try { await toggleAccountStatus(accId, 'activa'); } catch {}
      setLocalData((prev) => prev.filter((l) => (l._id || l.id) !== id));
      showSuccess('Bloqueo eliminado — cuenta desbloqueada');
    } catch (e) { showError(e?.response?.data?.message || 'Error al eliminar'); }
    setConfirm(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cuentas Bloqueadas</h1>
          <p className="page-subtitle">Gestión de bloqueos — al crear un bloqueo la cuenta queda bloqueada automáticamente</p>
        </div>
        <button className="btn-add" onClick={openCreate}>
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Bloquear cuenta
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        {[
          { label: 'Total bloqueos', value: localData.length },
          { label: 'Por seguridad',  value: localData.filter((l) => (l.lockReason || '').toLowerCase() === 'seguridad').length },
          { label: 'Por fraude',     value: localData.filter((l) => (l.lockReason || '').toLowerCase() === 'fraude').length },
          { label: 'Otros motivos',  value: localData.filter((l) => !['seguridad', 'fraude'].includes((l.lockReason || '').toLowerCase())).length },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-value" style={{ fontSize: '1.4rem' }}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Bloqueos activos ({filtered.length})</span>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
            <div className="search-input-wrap">
              <span className="search-icon">
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <input className="search-input" placeholder="Buscar por cuenta, usuario..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <button className="btn-secondary" onClick={() => { clearDataCache(); reload(); }}>
              <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Actualizar
            </button>
          </div>
        </div>

        <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cuenta</th><th>Usuario</th><th>Motivo</th><th>Descripción</th>
              <th>Bloqueado por</th><th>Fecha bloqueo</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && localData.length === 0 ? (
              <LoadingRows cols={8} />
            ) : (
              filtered.map((l, i) => (
                <tr key={l._id || l.id || i}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--gold-pure)', fontSize: '.85rem' }}>{l.accountId || '—'}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '.8rem', fontFamily: 'monospace' }}>{l.userId || '—'}</td>
                  <td><Badge value={l.lockReason} /></td>
                  <td style={{ color: 'var(--muted)', fontSize: '.8rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.description || '—'}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '.8rem', fontFamily: 'monospace' }}>{l.lockedBy || '—'}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '.8rem' }}>{fmtDate(l.lockDate || l.createdAt)}</td>
                  <td><Badge value={l.status || 'bloqueado'} /></td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" title="Editar bloqueo" onClick={() => openEdit(l)}>
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                      <button className="btn-icon danger" title="Eliminar bloqueo / Desbloquear cuenta" onClick={() => setConfirm(l)}>
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                          <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            {!loading && filtered.length === 0 && <EmptyState text="Sin bloqueos registrados" />}
          </tbody>
        </table>
      </div>
      </div>

      {/* Modal Crear / Editar */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editItem ? 'Editar bloqueo' : 'Bloquear cuenta'}</span>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-fields-row">
                <LockField label="N° de cuenta *">
                  <input className="modal-input" placeholder="ACC-000-0000" value={form.accountId} onChange={(e) => setForm((p) => ({ ...p, accountId: e.target.value }))} />
                </LockField>
                <LockField label="ID de usuario *">
                  <input className="modal-input" placeholder="usr_XXXX" value={form.userId} onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))} />
                </LockField>
              </div>
              <div className="modal-fields-row">
                <LockField label="Motivo del bloqueo">
                  <select className="modal-select" value={form.lockReason} onChange={(e) => setForm((p) => ({ ...p, lockReason: e.target.value }))}>
                    {lockReasons.map((r) => (<option key={r} value={r}>{r.replace(/_/g, ' ')}</option>))}
                  </select>
                </LockField>
                <LockField label="Estado">
                  <select className="modal-select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                    <option value="bloqueado">Bloqueado</option>
                    <option value="desbloqueado">Desbloqueado</option>
                  </select>
                </LockField>
              </div>
              <LockField label="Descripción">
                <input className="modal-input" placeholder="Describe el motivo del bloqueo..." value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </LockField>
              <div className="modal-fields-row">
                <LockField label="Fecha de bloqueo">
                  <input className="modal-input" type="datetime-local" value={form.lockDate} onChange={(e) => setForm((p) => ({ ...p, lockDate: e.target.value }))} />
                </LockField>
                <LockField label="Fecha de desbloqueo">
                  <input className="modal-input" type="datetime-local" value={form.unlockDate} onChange={(e) => setForm((p) => ({ ...p, unlockDate: e.target.value }))} />
                </LockField>
              </div>
              {form.status === 'desbloqueado' && (
                <LockField label="Desbloqueado por (ID admin)">
                  <input className="modal-input" placeholder="usr_XXXX" value={form.unlockedBy} onChange={(e) => setForm((p) => ({ ...p, unlockedBy: e.target.value }))} />
                </LockField>
              )}
              <div style={{ background: 'rgba(224,92,92,0.06)', border: '1px solid rgba(224,92,92,0.15)', borderRadius: 8, padding: '.85rem 1rem', display: 'flex', gap: '.6rem', alignItems: 'flex-start' }}>
                <svg viewBox="0 0 24 24" fill="none" width="15" height="15" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M12 9v4M12 17h.01" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p style={{ fontSize: '.78rem', color: 'rgba(224,92,92,0.8)', lineHeight: 1.5, margin: 0 }}>
                  {editItem
                    ? 'Al cambiar el estado a "Desbloqueado" la cuenta quedará activa nuevamente.'
                    : 'Al crear este bloqueo la cuenta será bloqueada automáticamente y el usuario no podrá realizar operaciones.'}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
              <button
                className="btn-save"
                onClick={handleSave}
                disabled={saving}
                style={!editItem ? { background: 'linear-gradient(135deg,#c0392b,#e05c5c)' } : {}}
              >
                {saving ? <span className="spin" /> : editItem ? 'Actualizar bloqueo' : 'Bloquear cuenta'}
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
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default LocksSection;
