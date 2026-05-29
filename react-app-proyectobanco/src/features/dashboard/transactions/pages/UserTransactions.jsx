import { useState } from 'react';
import { createTransaction, getAccountsByUser } from '../../../../shared/api/banking';
import { showSuccess, showError } from '../../../../shared/utils/toast';
import useAuthStore from '../../../auth/store/authStore';
import useUserTransactions from '../hooks/useUserTransactions';
import Badge from '../../shared/Badge';
import LoadingRows from '../../shared/LoadingRows';
import EmptyState from '../../shared/EmptyState';
import { fmt } from '../../shared/formatters';

const UserTransactions = () => {
  const { user }                          = useAuthStore();
  const { data, favorites, loading, reload } = useUserTransactions();
  const [modal, setModal]                 = useState(false);
  const [tab, setTab]                     = useState('all');
  const [saving, setSaving]               = useState(false);
  const [myAccounts, setMyAccounts]       = useState([]);

  const [form, setForm] = useState({
    sourceAccountId: '', destinationAccountId: '', transactionType: 'transferencia',
    amount: '', currencyId: 'GTQ', description: '', favorito: false, alias: '',
  });

  const openModal = () => {
    if (user?.id) {
      getAccountsByUser(user.id)
        .then(res => {
          const d = res.data?.data || res.data || [];
          setMyAccounts(Array.isArray(d) ? d.filter(a => a.status === 'activa') : []);
        })
        .catch(() => setMyAccounts([]));
    }
    setModal(true);
  };

  const handleCreate = async () => {
    if (!form.sourceAccountId)      { showError('La cuenta origen es obligatoria'); return; }
    if (!form.destinationAccountId) { showError('La cuenta destino es obligatoria'); return; }
    if (form.sourceAccountId === form.destinationAccountId) { showError('Las cuentas no pueden ser iguales'); return; }
    if (!form.amount || Number(form.amount) <= 0) { showError('El monto debe ser mayor a 0'); return; }
    if (Number(form.amount) > 2000) { showError('El máximo por transferencia es Q 2,000.00'); return; }
    setSaving(true);
    try {
      await createTransaction({
        sourceAccountId:      form.sourceAccountId,
        destinationAccountId: form.destinationAccountId,
        transactionType:      form.transactionType,
        amount:               Number(form.amount),
        currencyId:           form.currencyId,
        description:          form.description,
        favorito:             form.favorito,
        alias:                form.favorito ? form.alias : '',
        userId:               user?.id,
      });
      showSuccess('Transferencia realizada exitosamente');
      setModal(false);
      setForm({ sourceAccountId: '', destinationAccountId: '', transactionType: 'transferencia', amount: '', currencyId: 'GTQ', description: '', favorito: false, alias: '' });
      reload();
    } catch (e) {
      showError(e?.response?.data?.error || e?.response?.data?.message || 'Error al realizar la transferencia');
    } finally { setSaving(false); }
  };

  const useFavorite = (fav) => {
    setForm(p => ({ ...p, destinationAccountId: fav.accountNumber, alias: fav.alias || '' }));
    openModal();
  };

  const TabBtn = ({ k, label, count }) => (
    <button onClick={() => setTab(k)} style={{
      padding: '.75rem 1.1rem', fontSize: '.82rem',
      color: tab === k ? 'var(--gold-pure)' : 'var(--muted)',
      cursor: 'pointer', background: 'none', border: 'none',
      borderBottom: `2px solid ${tab === k ? 'var(--gold-pure)' : 'transparent'}`,
      fontFamily: "'Outfit',sans-serif", transition: 'all .2s',
      display: 'flex', alignItems: 'center', gap: '.4rem',
    }}>
      {label}
      {count > 0 && (
        <span style={{ padding: '.1rem .45rem', borderRadius: 20, fontSize: '.68rem', fontWeight: 700, background: 'rgba(200,169,81,0.15)', color: 'var(--gold-pure)', border: '1px solid rgba(200,169,81,0.2)' }}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Transferencias</h1><p className="page-subtitle">Historial de movimientos y transferencias</p></div>
        <button className="btn-add" onClick={openModal}>
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Nueva transferencia
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        {[
          { label: 'Total transferencias', value: loading ? '...' : data.length },
          { label: 'Monto total',          value: loading ? '...' : 'Q ' + fmt(data.reduce((s, t) => s + Number(t.amount || 0), 0)) },
          { label: 'Favoritos guardados',  value: favorites.length },
          { label: 'Cuentas activas',      value: myAccounts.length },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-value" style={{ fontSize: '1.2rem' }}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="table-card">
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(200,169,81,0.08)', padding: '0 1.5rem' }}>
          <TabBtn k="all"       label="Mis transferencias" count={data.length}/>
          <TabBtn k="favorites" label="Favoritos"           count={favorites.length}/>
        </div>

        {tab === 'all' && (
          <>
            <div className="table-header">
              <span className="table-title">Historial ({data.length})</span>
              <button className="btn-secondary" onClick={reload}>
                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Actualizar
              </button>
            </div>
            <table className="data-table">
              <thead><tr><th>Tipo</th><th>Origen</th><th>Destino</th><th>Monto</th><th>Descripción</th><th>Fav</th><th>Fecha</th></tr></thead>
              <tbody>
                {loading ? <LoadingRows cols={7}/> : data.map((t, i) => (
                  <tr key={t._id || i}>
                    <td><Badge value={t.transactionType || t.TransactionType}/></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--gold-pure)' }}>{t.sourceAccountNumber || t.sourceAccountId || '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--gold-pure)' }}>{t.destinationAccountNumber || t.destinationAccountId || '—'}</td>
                    <td style={{ fontWeight: 500, color: 'var(--white)' }}>Q {fmt(t.amount || t.Amount)}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '.82rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{t.favorito ? <span style={{ color: '#eab308' }}>★</span> : <span style={{ color: 'var(--muted)', fontSize: '.75rem' }}>—</span>}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString('es-GT') : '—'}</td>
                  </tr>
                ))}
                {!loading && data.length === 0 && <EmptyState text="Sin transferencias realizadas"/>}
              </tbody>
            </table>
          </>
        )}

        {tab === 'favorites' && (
          <>
            <div className="table-header"><span className="table-title">Cuentas favoritas ({favorites.length})</span></div>
            {favorites.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem', opacity: .3 }}>★</span>
                <p>No tienes cuentas favoritas aún.</p>
                <p style={{ fontSize: '.82rem', marginTop: '.5rem' }}>Al crear una transferencia marca la cuenta como favorita para encontrarla aquí.</p>
              </div>
            ) : (
              <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
                {favorites.map((f, i) => (
                  <div key={i} style={{ background: 'rgba(200,169,81,0.05)', border: '1px solid rgba(200,169,81,0.15)', borderRadius: 12, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.25rem' }}>{f.alias || 'Sin alias'}</p>
                      <p style={{ fontFamily: 'monospace', color: 'var(--gold-pure)', fontSize: '.88rem' }}>{f.accountNumber}</p>
                      {f.name && <p style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '.15rem' }}>{f.name}</p>}
                    </div>
                    <button onClick={() => useFavorite(f)} style={{ padding: '.5rem .85rem', background: 'linear-gradient(135deg,#b8942e,#c8a951)', color: '#060810', border: 'none', borderRadius: 8, fontFamily: "'Outfit',sans-serif", fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Transferir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal nueva transferencia */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Nueva Transferencia</span><button className="modal-close" onClick={() => setModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Cuenta origen *</label>
                <select className="modal-select" value={form.sourceAccountId} onChange={e => setForm(p => ({ ...p, sourceAccountId: e.target.value }))}>
                  <option value="">Selecciona tu cuenta</option>
                  {myAccounts.map(a => <option key={a.accountNumber} value={a.accountNumber}>{a.accountNumber} — Q {fmt(a.balance)} ({a.accountType})</option>)}
                </select>
              </div>
              <div className="modal-field">
                <label className="modal-label">Cuenta destino *</label>
                <input className="modal-input" placeholder="ACC-000-0000" value={form.destinationAccountId} onChange={e => setForm(p => ({ ...p, destinationAccountId: e.target.value.toUpperCase() }))}/>
              </div>
              <div className="modal-fields-row">
                <div className="modal-field">
                  <label className="modal-label">Tipo</label>
                  <select className="modal-select" value={form.transactionType} onChange={e => setForm(p => ({ ...p, transactionType: e.target.value }))}>
                    <option value="transferencia">Transferencia</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>
                <div className="modal-field">
                  <label className="modal-label">Moneda</label>
                  <select className="modal-select" value={form.currencyId} onChange={e => setForm(p => ({ ...p, currencyId: e.target.value }))}>
                    <option value="GTQ">GTQ — Quetzal</option>
                    <option value="USD">USD — Dólar</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                </div>
              </div>
              <div className="modal-field">
                <label className="modal-label">Monto * (máximo Q 2,000.00)</label>
                <input className="modal-input" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}/>
                {form.sourceAccountId && (
                  <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '.35rem' }}>
                    Balance disponible: Q {fmt(myAccounts.find(a => a.accountNumber === form.sourceAccountId)?.balance || 0)}
                  </p>
                )}
              </div>
              <div className="modal-field">
                <label className="modal-label">Descripción</label>
                <input className="modal-input" placeholder="Descripción opcional" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}/>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.85rem', background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.15)', borderRadius: 8 }}>
                <input type="checkbox" id="fav-check" checked={form.favorito} onChange={e => setForm(p => ({ ...p, favorito: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer' }}/>
                <label htmlFor="fav-check" style={{ fontSize: '.82rem', color: 'rgba(234,179,8,0.8)', cursor: 'pointer' }}>★ Guardar como cuenta favorita</label>
              </div>
              {form.favorito && (
                <div className="modal-field" style={{ marginTop: '.5rem' }}>
                  <label className="modal-label">Alias para esta cuenta (opcional)</label>
                  <input className="modal-input" placeholder="Ej: Cuenta de Juan" value={form.alias} onChange={e => setForm(p => ({ ...p, alias: e.target.value }))}/>
                </div>
              )}
              <div style={{ background: 'rgba(107,127,163,0.06)', border: '1px solid rgba(107,127,163,0.15)', borderRadius: 8, padding: '.85rem 1rem', fontSize: '.78rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                ℹ️ Límites: máximo <strong>Q 2,000</strong> por operación · máximo <strong>Q 10,000</strong> diarios
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleCreate} disabled={saving}>{saving ? <span className="spin"/> : 'Confirmar transferencia'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTransactions;
