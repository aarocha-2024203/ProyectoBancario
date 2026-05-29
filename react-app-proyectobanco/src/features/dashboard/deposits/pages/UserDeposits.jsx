import { useState } from 'react';
import { createDeposit } from '../../../../shared/api/banking';
import { showSuccess, showError } from '../../../../shared/utils/toast';
import useAuthStore from '../../../auth/store/authStore';
import useUserDeposits from '../hooks/useUserDeposits';
import Badge from '../../shared/Badge';
import LoadingRows from '../../shared/LoadingRows';
import EmptyState from '../../shared/EmptyState';
import { fmt, fmtDate } from '../../shared/formatters';

const UserDeposits = () => {
  const { user }                                  = useAuthStore();
  const { deposits, myAccounts, loading, reload } = useUserDeposits();
  const [modal, setModal]                         = useState(false);
  const [saving, setSaving]                       = useState(false);
  const [form, setForm]                           = useState({ accountNumber: '', amount: '', currencyCode: 'GTQ', description: '' });

  const handleCreate = async () => {
    if (!form.accountNumber)                       { showError('Selecciona una cuenta'); return; }
    if (!form.amount || Number(form.amount) <= 0)  { showError('El monto debe ser mayor a 0'); return; }
    setSaving(true);
    try {
      await createDeposit({
        accountNumber:    form.accountNumber,
        amount:           Number(form.amount),
        currencyCode:     form.currencyCode,
        description:      form.description,
        executedByUserId: user?.id,
      });
      showSuccess('Depósito realizado exitosamente');
      setModal(false);
      setForm({ accountNumber: '', amount: '', currencyCode: 'GTQ', description: '' });
      reload();
    } catch (e) { showError(e?.response?.data?.message || 'Error al realizar el depósito'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Depósitos</h1><p className="page-subtitle">Historial de depósitos en tus cuentas</p></div>
        <button className="btn-add" onClick={() => setModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Nuevo depósito
        </button>
      </div>

      <div className="table-card">
        <div className="table-header"><span className="table-title">Mis depósitos ({deposits.length})</span></div>
        <table className="data-table">
          <thead><tr><th>N° Cuenta</th><th>Monto</th><th>Balance anterior</th><th>Balance nuevo</th><th>Descripción</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>
            {loading ? <LoadingRows cols={7}/> : deposits.length === 0
              ? <EmptyState text="Sin depósitos realizados"/>
              : deposits.map((d, i) => (
                <tr key={d._id || i}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--gold-pure)', fontSize: '.85rem' }}>{d.accountNumber || '—'}</td>
                  <td style={{ fontWeight: 500, color: 'var(--white)' }}>Q {fmt(d.amount)}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>Q {fmt(d.previousBalance)}</td>
                  <td style={{ color: '#4caf7d', fontWeight: 500 }}>Q {fmt(d.newBalance)}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{d.description || '—'}</td>
                  <td><Badge value={d.status || 'exitosa'}/></td>
                  <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{fmtDate(d.createdAt)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Nuevo Depósito</span><button className="modal-close" onClick={() => setModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Cuenta a depositar *</label>
                <select className="modal-select" value={form.accountNumber} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value }))}>
                  <option value="">Selecciona una cuenta</option>
                  {myAccounts.filter(a => a.status === 'activa').map(a => (
                    <option key={a.accountNumber} value={a.accountNumber}>{a.accountNumber} — Q {fmt(a.balance)} ({a.accountType})</option>
                  ))}
                </select>
              </div>
              <div className="modal-fields-row">
                <div className="modal-field">
                  <label className="modal-label">Monto *</label>
                  <input className="modal-input" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}/>
                </div>
                <div className="modal-field">
                  <label className="modal-label">Moneda</label>
                  <select className="modal-select" value={form.currencyCode} onChange={e => setForm(p => ({ ...p, currencyCode: e.target.value }))}>
                    <option value="GTQ">GTQ — Quetzal</option>
                    <option value="USD">USD — Dólar</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                </div>
              </div>
              <div className="modal-field">
                <label className="modal-label">Descripción</label>
                <input className="modal-input" placeholder="Motivo del depósito" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}/>
              </div>
              <div style={{ background: 'rgba(200,169,81,0.05)', border: '1px solid rgba(200,169,81,0.12)', borderRadius: 8, padding: '.85rem 1rem', fontSize: '.78rem', color: 'rgba(200,169,81,0.8)', lineHeight: 1.5 }}>
                ℹ️ El depósito acredita fondos externos a tu cuenta. Para mover dinero entre tus cuentas usa <strong>Transferencias</strong>.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleCreate} disabled={saving}>{saving ? <span className="spin"/> : 'Depositar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDeposits;
