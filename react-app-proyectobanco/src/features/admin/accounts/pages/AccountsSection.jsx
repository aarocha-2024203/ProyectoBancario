import { useState, useEffect } from 'react';
import { useData, clearDataCache } from '../../../../shared/hooks/useData';
import { showSuccess, showError } from '../../../../shared/utils/toast';
import {
  getAccounts,
  createAccount,
  deleteAccount,
  updateAccount,
  toggleAccountStatus,
} from '../../../../shared/api/banking';
import Badge from '../../shared/Badge';
import LoadingRows from '../../shared/LoadingRows';
import EmptyState from '../../shared/EmptyState';
import ConfirmModal from '../../shared/ConfirmModal';
import AccountField from '../components/AccountField';
import { fmt, fmtDate } from '../../shared/formatters';

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

  const filtered = localData.filter((a) =>
    `${a.accountNumber || ''} ${a.accountType || ''} ${a.status || ''} ${a.userId || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const openCreate = () => { setForm(emptyForm); setEditItem(null); setModal(true); };

  const openEdit = (a) => {
    setForm({
      accountType:          a.accountType          || 'ahorro',
      balance:              a.balance               || '',
      openingDate:          a.openingDate           ? a.openingDate.slice(0, 10) : '',
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
      if (!form.dpi || form.dpi.length !== 13)    { showError('El DPI debe tener 13 dígitos'); return; }
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
        setLocalData((prev) => prev.map((a) => (a.accountNumber === accNum ? { ...a, ...form } : a)));
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
        setLocalData((prev) => [newAccount, ...prev]);
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
      setLocalData((prev) => prev.filter((a) => a.accountNumber !== accNum));
      showSuccess('Cuenta eliminada');
    } catch (e) { showError(e?.response?.data?.message || 'Error al eliminar'); }
    setConfirm(null);
  };

  const handleToggleStatus = async (a) => {
    const accNum    = a.accountNumber;
    const newStatus = (a.status || '') === 'activa' ? 'inactiva' : 'activa';
    try {
      await toggleAccountStatus(accNum, newStatus);
      setLocalData((prev) => prev.map((x) => (x.accountNumber === accNum ? { ...x, status: newStatus } : x)));
      showSuccess(`Cuenta ${newStatus}`);
    } catch (e) { showError(e?.response?.data?.message || 'Error al cambiar estado'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cuentas</h1>
          <p className="page-subtitle">Gestión completa de cuentas bancarias</p>
        </div>
        <button className="btn-add" onClick={openCreate}>
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Nueva cuenta
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        {[
          { label: 'Total',       value: localData.length },
          { label: 'Activas',     value: localData.filter((a) => a.status === 'activa').length },
          { label: 'Inactivas',   value: localData.filter((a) => a.status === 'inactiva').length },
          { label: 'Balance total', value: 'Q ' + fmt(localData.reduce((s, a) => s + Number(a.balance || 0), 0)) },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-value" style={{ fontSize: '1.4rem' }}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Todas las cuentas ({filtered.length})</span>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
            <div className="search-input-wrap">
              <span className="search-icon">
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <input
                className="search-input"
                placeholder="Buscar cuenta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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

        <table className="data-table">
          <thead>
            <tr>
              <th>N° Cuenta</th><th>Tipo</th><th>Titular</th><th>Usuario ID</th>
              <th>Balance</th><th>Moneda</th><th>Estado</th><th>Apertura</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && localData.length === 0 ? (
              <LoadingRows cols={9} />
            ) : (
              filtered.map((a, i) => {
                const status = (a.status || '').toLowerCase();
                return (
                  <tr key={a.accountNumber || i}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--gold-pure)', fontSize: '.85rem' }}>{a.accountNumber || '—'}</td>
                    <td><Badge value={a.accountType} /></td>
                    <td style={{ color: 'var(--white)', fontSize: '.85rem' }}>{a.name || '—'}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '.78rem', fontFamily: 'monospace' }}>{a.userId || '—'}</td>
                    <td style={{ fontWeight: 500, color: 'var(--white)' }}>Q {fmt(a.balance)}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '.8rem' }}>{a.currencyCode || 'GTQ'}</td>
                    <td><Badge value={a.status || '—'} /></td>
                    <td style={{ color: 'var(--muted)', fontSize: '.8rem' }}>{fmtDate(a.openingDate || a.createdAt)}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon" title="Ver detalle" onClick={() => setDetailModal(a)}>
                          <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                        <button className="btn-icon" title="Editar" onClick={() => openEdit(a)}>
                          <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                        <button className="btn-icon" title={status === 'activa' ? 'Desactivar' : 'Activar'} onClick={() => handleToggleStatus(a)}>
                          {status === 'activa' ? (
                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                              <path d="M18.36 6.64A9 9 0 015.64 19.36M6.34 6.34A9 9 0 0019 17.65M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round" />
                              <path d="M22 4L12 14.01l-3-3" stroke="#4caf7d" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          )}
                        </button>
                        <button className="btn-icon danger" title="Eliminar" onClick={() => setConfirm(a)}>
                          <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                            <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            {!loading && filtered.length === 0 && <EmptyState text="Sin cuentas registradas" />}
          </tbody>
        </table>
      </div>

      {/* Modal Crear / Editar */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editItem ? 'Editar cuenta' : 'Nueva cuenta'}</span>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {!editItem && (
                <>
                  <div className="modal-fields-row">
                    <AccountField label="ID de usuario *">
                      <input className="modal-input" placeholder="usr_XXXX" value={form.userId} onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))} />
                    </AccountField>
                    <AccountField label="Moneda *">
                      <select className="modal-select" value={form.currencyCode} onChange={(e) => setForm((p) => ({ ...p, currencyCode: e.target.value }))}>
                        <option value="GTQ">GTQ — Quetzal</option>
                        <option value="USD">USD — Dólar</option>
                        <option value="EUR">EUR — Euro</option>
                      </select>
                    </AccountField>
                  </div>
                  <div className="modal-fields-row">
                    <AccountField label="Ocupación *">
                      <input className="modal-input" placeholder="Ingeniero, Comerciante..." value={form.jobName} onChange={(e) => setForm((p) => ({ ...p, jobName: e.target.value }))} />
                    </AccountField>
                    <AccountField label="Ingreso mensual (Q) *">
                      <input className="modal-input" type="number" placeholder="5000" value={form.monthlyIncome} onChange={(e) => setForm((p) => ({ ...p, monthlyIncome: e.target.value }))} />
                    </AccountField>
                  </div>
                  <AccountField label="Dirección *">
                    <input className="modal-input" placeholder="Zona 10, Ciudad de Guatemala" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
                  </AccountField>
                  <div className="modal-fields-row">
                    <AccountField label="DPI (13 dígitos) *">
                      <input className="modal-input" placeholder="1234567890123" maxLength={13} value={form.dpi} onChange={(e) => setForm((p) => ({ ...p, dpi: e.target.value.replace(/\D/g, '') }))} />
                    </AccountField>
                    <AccountField label="Teléfono (8 dígitos) *">
                      <input className="modal-input" placeholder="55123456" maxLength={8} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))} />
                    </AccountField>
                  </div>
                  <div className="modal-fields-row">
                    <AccountField label="Tipo de cuenta">
                      <select className="modal-select" value={form.accountType} onChange={(e) => setForm((p) => ({ ...p, accountType: e.target.value }))}>
                        <option value="ahorro">Ahorro</option>
                        <option value="corriente">Corriente</option>
                        <option value="nomina">Nómina</option>
                      </select>
                    </AccountField>
                    <AccountField label="Balance inicial">
                      <input className="modal-input" type="number" placeholder="0.00" value={form.balance} onChange={(e) => setForm((p) => ({ ...p, balance: e.target.value }))} />
                    </AccountField>
                  </div>
                  <div className="modal-fields-row">
                    <AccountField label="Límite retiro diario">
                      <input className="modal-input" type="number" placeholder="1000" value={form.dailyWithdrawalLimit} onChange={(e) => setForm((p) => ({ ...p, dailyWithdrawalLimit: e.target.value }))} />
                    </AccountField>
                    <AccountField label="Tasa interés anual (%)">
                      <input className="modal-input" type="number" placeholder="4.5" value={form.annualInterestRate} onChange={(e) => setForm((p) => ({ ...p, annualInterestRate: e.target.value }))} />
                    </AccountField>
                  </div>
                  <div className="modal-fields-row">
                    <AccountField label="Fecha apertura">
                      <input className="modal-input" type="date" value={form.openingDate} onChange={(e) => setForm((p) => ({ ...p, openingDate: e.target.value }))} />
                    </AccountField>
                    <AccountField label="Estado inicial">
                      <select className="modal-select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                        <option value="activa">Activa</option>
                        <option value="inactiva">Inactiva</option>
                      </select>
                    </AccountField>
                  </div>
                </>
              )}
              {editItem && (
                <>
                  <div style={{ background: 'rgba(200,169,81,0.05)', border: '1px solid rgba(200,169,81,0.12)', borderRadius: 8, padding: '.85rem 1rem', marginBottom: '.5rem', fontSize: '.82rem', color: 'var(--gold-bright)' }}>
                    Cuenta: <strong style={{ fontFamily: 'monospace' }}>{editItem.accountNumber}</strong>
                  </div>
                  <div className="modal-fields-row">
                    <AccountField label="Nombre titular">
                      <input className="modal-input" placeholder="Juan" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                    </AccountField>
                    <AccountField label="Ocupación">
                      <input className="modal-input" placeholder="Desarrollador" value={form.jobName} onChange={(e) => setForm((p) => ({ ...p, jobName: e.target.value }))} />
                    </AccountField>
                  </div>
                  <AccountField label="Dirección">
                    <input className="modal-input" placeholder="Zona 1, Ciudad de Guatemala" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
                  </AccountField>
                  <div className="modal-fields-row">
                    <AccountField label="Ingreso mensual (Q)">
                      <input className="modal-input" type="number" placeholder="5000" value={form.monthlyIncome} onChange={(e) => setForm((p) => ({ ...p, monthlyIncome: e.target.value }))} />
                    </AccountField>
                    <AccountField label="Teléfono (8 dígitos)">
                      <input className="modal-input" placeholder="55123456" maxLength={8} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))} />
                    </AccountField>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spin" /> : editItem ? 'Actualizar' : 'Crear cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Detalle de cuenta</span>
              <button className="modal-close" onClick={() => setDetailModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {[
                { label: 'N° Cuenta',     value: detailModal.accountNumber, mono: true },
                { label: 'Tipo',          value: detailModal.accountType },
                { label: 'Titular',       value: detailModal.name },
                { label: 'Balance',       value: 'Q ' + fmt(detailModal.balance) },
                { label: 'Moneda',        value: detailModal.currencyCode || 'GTQ' },
                { label: 'Estado',        value: detailModal.status },
                { label: 'Usuario ID',    value: detailModal.userId, mono: true },
                { label: 'DPI',           value: detailModal.dpi || '—' },
                { label: 'Teléfono',      value: detailModal.phone || '—' },
                { label: 'Retiro diario', value: 'Q ' + fmt(detailModal.dailyWithdrawalLimit || 0) },
                { label: 'Tasa interés',  value: (detailModal.annualInterestRate || 0) + '%' },
                { label: 'Dirección',     value: detailModal.address || '—' },
                { label: 'Apertura',      value: fmtDate(detailModal.openingDate || detailModal.createdAt) },
              ].map(({ label, value, mono }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: '.85rem', color: 'var(--white)', fontFamily: mono ? 'monospace' : 'inherit', maxWidth: 220, textAlign: 'right' }}>{value || '—'}</span>
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
        title="Eliminar cuenta"
        message={`¿Eliminar la cuenta ${confirm?.accountNumber}? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default AccountsSection;
