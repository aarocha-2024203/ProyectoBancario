import { useState } from 'react';
import { useData } from '../../../../shared/hooks/useData';
import { showSuccess, showError } from '../../../../shared/utils/toast';
import { getCoins, createCoin, deleteCoin } from '../../../../shared/api/banking';
import Badge from '../../shared/Badge';
import LoadingRows from '../../shared/LoadingRows';
import EmptyState from '../../shared/EmptyState';
import ConfirmModal from '../../shared/ConfirmModal';
import { fmt } from '../../shared/formatters';

const CoinsSection = () => {
  const { data, loading, reload } = useData(getCoins);
  const [modal, setModal]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm]       = useState({
    code: '', name: '', symbol: '', exchangeRate: '', baseCurrency: false,
  });

  const handleCreate = async () => {
    if (!form.code)         { showError('El código es obligatorio'); return; }
    if (!form.name)         { showError('El nombre es obligatorio'); return; }
    if (!form.exchangeRate) { showError('El tipo de cambio es obligatorio'); return; }
    setSaving(true);
    try {
      await createCoin({ ...form, exchangeRate: Number(form.exchangeRate) });
      showSuccess('Moneda creada');
      setModal(false);
      setForm({ code: '', name: '', symbol: '', exchangeRate: '', baseCurrency: false });
      reload();
    } catch (e) { showError(e?.response?.data?.message || 'Error al crear'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await deleteCoin(confirm.id);
      showSuccess('Moneda eliminada');
      reload();
    } catch { showError('Error al eliminar'); }
    setConfirm(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Monedas</h1>
          <p className="page-subtitle">Divisas y tipos de cambio del sistema</p>
        </div>
        <button className="btn-add" onClick={() => setModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Nueva moneda
        </button>
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Divisas configuradas ({data.length})</span>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Código</th><th>Nombre</th><th>Símbolo</th><th>Tipo cambio</th><th>Base</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {loading ? <LoadingRows cols={7}/> : data.map((c, i) => {
              const id = c._id || c.id;
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--gold-pure)', letterSpacing: '.05em' }}>{c.code || c.Code}</td>
                  <td style={{ color: 'var(--white)' }}>{c.name || c.Name}</td>
                  <td style={{ fontFamily: 'monospace' }}>{c.symbol || c.Symbol}</td>
                  <td>Q {fmt(c.exchangeRate || c.ExchangeRate)}</td>
                  <td><Badge value={(c.baseCurrency || c.BaseCurrency) ? 'Sí' : 'No'}/></td>
                  <td><Badge value={c.status || c.Status || 'activa'}/></td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon danger" title="Eliminar" onClick={() => setConfirm({ id, label: c.code || c.Code })}>
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                          <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && data.length === 0 && <EmptyState text="Sin monedas configuradas"/>}
          </tbody>
        </table>
      </div>

      {/* Modal crear */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Nueva Moneda</span>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-fields-row">
                <div className="modal-field">
                  <label className="modal-label">Código *</label>
                  <input className="modal-input" placeholder="GTQ" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}/>
                </div>
                <div className="modal-field">
                  <label className="modal-label">Símbolo</label>
                  <input className="modal-input" placeholder="Q" value={form.symbol} onChange={e => setForm(p => ({ ...p, symbol: e.target.value }))}/>
                </div>
              </div>
              <div className="modal-field">
                <label className="modal-label">Nombre *</label>
                <input className="modal-input" placeholder="Quetzal" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}/>
              </div>
              <div className="modal-fields-row">
                <div className="modal-field">
                  <label className="modal-label">Tipo de cambio *</label>
                  <input className="modal-input" type="number" placeholder="1.00" value={form.exchangeRate} onChange={e => setForm(p => ({ ...p, exchangeRate: e.target.value }))}/>
                </div>
                <div className="modal-field" style={{ justifyContent: 'flex-end', paddingTop: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', color: 'var(--muted)', fontSize: '.85rem' }}>
                    <input type="checkbox" checked={form.baseCurrency} onChange={e => setForm(p => ({ ...p, baseCurrency: e.target.checked }))} style={{ accentColor: 'var(--gold-pure)' }}/>
                    Moneda base
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleCreate} disabled={saving}>{saving ? <span className="spin"/> : 'Crear'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirm}
        title="Eliminar moneda"
        message={`¿Eliminar la moneda ${confirm?.label}? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default CoinsSection;
