import { useState } from 'react';
import { useData, clearDataCache } from '../../../../shared/hooks/useData';
import { showSuccess, showError } from '../../../../shared/utils/toast';
import { getTransactions } from '../../../../shared/api/banking';
import Badge from '../../shared/Badge';
import LoadingRows from '../../shared/LoadingRows';
import EmptyState from '../../shared/EmptyState';
import ConfirmModal from '../../shared/ConfirmModal';
import { fmt, fmtDate } from '../../shared/formatters';

const TransactionsSection = () => {
  const { data, loading, reload } = useData(getTransactions);
  const [search, setSearch]   = useState('');
  const [confirm, setConfirm] = useState(null);

  const filtered = data.filter(t =>
    `${t.sourceAccountNumber || t.sourceAccountId || ''} ${t.destinationAccountNumber || t.destinationAccountId || ''} ${t.transactionType || ''} ${t.status || ''} ${t.executedByUserId || ''}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const totalMonto = data.reduce((s, t) => s + Number(t.amount || 0), 0);

  const handleDelete = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('bancario-auth'))?.state?.token;
      await fetch(`http://localhost:3006/api/v1/transaction/${confirm._id || confirm.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      showSuccess('Transacción eliminada');
      reload();
    } catch (e) { showError(e?.response?.data?.message || 'Error al eliminar'); }
    setConfirm(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transacciones</h1>
          <p className="page-subtitle">Historial completo de transferencias del sistema</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        {[
          { label: 'Total transacciones', value: loading ? '...' : data.length },
          { label: 'Monto total',         value: loading ? '...' : 'Q ' + fmt(totalMonto) },
          { label: 'Exitosas',            value: loading ? '...' : data.filter(t => t.status === 'exitosa').length },
          { label: 'Favoritos',           value: loading ? '...' : data.filter(t => t.favorito).length },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-value" style={{ fontSize: '1.2rem' }}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Todas las transacciones ({filtered.length})</span>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
            <div className="search-input-wrap">
              <span className="search-icon">
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
              <input className="search-input" placeholder="Buscar por cuenta, tipo, usuario..." value={search} onChange={e => setSearch(e.target.value)}/>
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
              <th>Tipo</th><th>Cuenta origen</th><th>Cuenta destino</th>
              <th>Monto</th><th>Moneda</th><th>Usuario</th>
              <th>Favorito</th><th>Estado</th><th>Fecha</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <LoadingRows cols={10}/> : filtered.map((t, i) => (
              <tr key={t._id || i}>
                <td><Badge value={t.transactionType}/></td>
                <td style={{ fontFamily: 'monospace', color: 'var(--gold-pure)', fontSize: '.82rem' }}>{t.sourceAccountNumber || t.sourceAccountId || '—'}</td>
                <td style={{ fontFamily: 'monospace', color: 'var(--gold-pure)', fontSize: '.82rem' }}>{t.destinationAccountNumber || t.destinationAccountId || '—'}</td>
                <td style={{ fontWeight: 500, color: 'var(--white)' }}>Q {fmt(t.amount)}</td>
                <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{t.currencyCode || t.currencyId || 'GTQ'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '.75rem', color: 'var(--muted)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.executedByUserId || t.userId || '—'}</td>
                <td style={{ textAlign: 'center' }}>
                  {t.favorito
                    ? <span title={t.alias || ''} style={{ color: '#eab308', fontSize: '1rem' }}>★</span>
                    : <span style={{ color: 'var(--muted)', fontSize: '.75rem' }}>—</span>
                  }
                </td>
                <td><Badge value={t.status || 'exitosa'}/></td>
                <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString('es-GT') : '—'}</td>
                <td>
                  <div className="action-btns">
                    <button className="btn-icon danger" title="Eliminar" onClick={() => setConfirm(t)}>
                      <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                        <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && <EmptyState text="Sin transacciones registradas"/>}
          </tbody>
        </table>
      </div>
      </div>

      <ConfirmModal
        open={!!confirm}
        title="Eliminar transacción"
        message={`¿Eliminar la transacción de Q ${fmt(confirm?.amount)} de ${confirm?.sourceAccountNumber || confirm?.sourceAccountId}?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default TransactionsSection;
