import { useState, useEffect } from 'react';
import { showSuccess, showError } from '../../../../shared/utils/toast';
import { getDeposits, createDeposit } from '../../../../shared/api/banking';
import Badge from '../../shared/Badge';
import LoadingRows from '../../shared/LoadingRows';
import EmptyState from '../../shared/EmptyState';
import { fmt, fmtDate } from '../../shared/formatters';

const EMPTY_FORM = {
  accountNumber: '', amount: '', currencyCode: 'GTQ',
  description: '', executedByUserId: '',
};

const DepositsSection = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [search, setSearch]     = useState('');
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);

  const loadDeposits = () => {
    setLoading(true);
    getDeposits('limit=100&status=exitosa')
      .then(res => {
        const d = res.data?.data || res.data || [];
        setDeposits(Array.isArray(d) ? d : []);
      })
      .catch(() => setDeposits([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDeposits(); }, []);

  const filtered = deposits.filter(d =>
    `${d.accountNumber || ''} ${d.executedByUserId || ''} ${d.description || ''} ${d.status || ''}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.accountNumber)                  { showError('El número de cuenta es obligatorio'); return; }
    if (!form.amount || Number(form.amount) <= 0) { showError('El monto debe ser mayor a 0'); return; }
    if (!form.currencyCode)                   { showError('La moneda es obligatoria'); return; }
    setSaving(true);
    try {
      await createDeposit({
        accountNumber:    form.accountNumber.trim().toUpperCase(),
        amount:           Number(form.amount),
        currencyCode:     form.currencyCode,
        description:      form.description,
        executedByUserId: form.executedByUserId || undefined,
      });
      showSuccess('Depósito realizado exitosamente');
      setModal(false);
      setForm(EMPTY_FORM);
      loadDeposits();
    } catch (e) {
      showError(e?.response?.data?.message || e?.response?.data?.error || 'Error al realizar el depósito');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Depósitos</h1>
          <p className="page-subtitle">Registro de todos los depósitos realizados en el sistema</p>
        </div>
        <button className="btn-add" onClick={() => setModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Nuevo depósito
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        {[
          { label: 'Total depósitos',  value: deposits.length },
          { label: 'Total depositado', value: 'Q ' + fmt(deposits.reduce((s, d) => s + Number(d.amount || 0), 0)) },
          { label: 'Exitosos',         value: deposits.filter(d => d.status === 'exitosa').length },
          { label: 'Reversados',       value: deposits.filter(d => d.status === 'reversada').length },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-value" style={{ fontSize: '1.3rem' }}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Todos los depósitos ({filtered.length})</span>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
            <div className="search-input-wrap">
              <span className="search-icon">
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
              <input className="search-input" placeholder="Buscar por cuenta, usuario..." value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <button className="btn-secondary" onClick={loadDeposits}>
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
              <th>N° Cuenta</th><th>Monto</th><th>Moneda</th><th>Balance anterior</th>
              <th>Balance nuevo</th><th>Descripción</th><th>Ejecutado por</th><th>Estado</th><th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <LoadingRows cols={9}/> : filtered.map((d, i) => (
              <tr key={d._id || i}>
                <td style={{ fontFamily: 'monospace', color: 'var(--gold-pure)', fontSize: '.85rem' }}>{d.accountNumber || '—'}</td>
                <td style={{ fontWeight: 500, color: 'var(--white)' }}>Q {fmt(d.amount)}</td>
                <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{d.currencyCode || 'GTQ'}</td>
                <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>Q {fmt(d.previousBalance)}</td>
                <td style={{ color: '#4caf7d', fontWeight: 500 }}>Q {fmt(d.newBalance)}</td>
                <td style={{ color: 'var(--muted)', fontSize: '.82rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.description || '—'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '.78rem', color: 'var(--muted)' }}>{d.executedByUserId || '—'}</td>
                <td><Badge value={d.status || 'exitosa'}/></td>
                <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{fmtDate(d.createdAt)}</td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && <EmptyState text="Sin depósitos registrados"/>}
          </tbody>
        </table>
      </div>
      </div>

      {/* Modal nuevo depósito */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Nuevo Depósito</span>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-fields-row">
                <div className="modal-field">
                  <label className="modal-label">N° de cuenta *</label>
                  <input className="modal-input" placeholder="ACC-000-0000" value={form.accountNumber} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value.toUpperCase() }))}/>
                </div>
                <div className="modal-field">
                  <label className="modal-label">Moneda *</label>
                  <select className="modal-select" value={form.currencyCode} onChange={e => setForm(p => ({ ...p, currencyCode: e.target.value }))}>
                    <option value="GTQ">GTQ — Quetzal</option>
                    <option value="USD">USD — Dólar</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                </div>
              </div>
              <div className="modal-field">
                <label className="modal-label">Monto *</label>
                <input className="modal-input" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}/>
              </div>
              <div className="modal-field">
                <label className="modal-label">Descripción</label>
                <input className="modal-input" placeholder="Motivo del depósito" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}/>
              </div>
              <div className="modal-field">
                <label className="modal-label">ID de quien ejecuta (opcional)</label>
                <input className="modal-input" placeholder="usr_XXXX" value={form.executedByUserId} onChange={e => setForm(p => ({ ...p, executedByUserId: e.target.value }))}/>
              </div>
              <div style={{ background: 'rgba(200,169,81,0.05)', border: '1px solid rgba(200,169,81,0.12)', borderRadius: 8, padding: '.85rem 1rem', fontSize: '.78rem', color: 'rgba(200,169,81,0.8)', lineHeight: 1.5 }}>
                ℹ️ El depósito acredita fondos directamente a la cuenta indicada. Para transferir entre cuentas usa la sección de <strong>Transacciones</strong>.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleCreate} disabled={saving}>{saving ? <span className="spin"/> : 'Realizar depósito'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositsSection;
