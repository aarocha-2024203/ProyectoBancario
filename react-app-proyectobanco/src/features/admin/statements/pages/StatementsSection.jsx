import { useState } from 'react';
import { useData, clearDataCache } from '../../../../shared/hooks/useData';
import { showSuccess, showError } from '../../../../shared/utils/toast';
import { getAccountStatements } from '../../../../shared/api/banking';
import LoadingRows from '../../shared/LoadingRows';
import EmptyState from '../../shared/EmptyState';
import ConfirmModal from '../../shared/ConfirmModal';
import { fmt, fmtDate } from '../../shared/formatters';

const StatementsSection = () => {
  const { data, loading, reload } = useData(getAccountStatements);
  const [search, setSearch]       = useState('');
  const [confirm, setConfirm]     = useState(null);

  const filtered = data.filter((s) =>
    `${s.accountId || ''} ${s._id || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    const token = JSON.parse(localStorage.getItem('bancario-auth'))?.state?.token;
    try {
      await fetch(`http://localhost:3006/api/v1/accountStatements/${confirm._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      showSuccess('Estado de cuenta eliminado');
      clearDataCache();
      reload();
    } catch {
      showError('Error al eliminar');
    }
    setConfirm(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Estados de Cuenta</h1>
          <p className="page-subtitle">Historial de estados de cuenta generados</p>
        </div>
        <button className="btn-secondary" onClick={() => { clearDataCache(); reload(); }}>
          <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
            <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        {[
          {
            label: 'Total generados',
            value: loading ? '...' : data.length,
          },
          {
            label: 'Este mes',
            value: loading
              ? '...'
              : data.filter((s) => {
                  const d = new Date(s.createdAt);
                  const now = new Date();
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length,
          },
          {
            label: 'Total depósitos',
            value: loading ? '...' : 'Q ' + fmt(data.reduce((s, x) => s + Number(x.totalDeposits || 0), 0)),
          },
          {
            label: 'Total retiros',
            value: loading ? '...' : 'Q ' + fmt(data.reduce((s, x) => s + Number(x.totalWithdrawals || 0), 0)),
          },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-value" style={{ fontSize: '1.2rem' }}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Estados generados ({filtered.length})</span>
          <div className="search-input-wrap">
            <span className="search-icon">
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <input className="search-input" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Cuenta</th><th>Período inicio</th><th>Período fin</th>
              <th>Bal. apertura</th><th>Bal. cierre</th><th>Depósitos</th>
              <th>Retiros</th><th>Generado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows cols={10} />
            ) : (
              filtered.map((s, i) => (
                <tr key={s._id || i}>
                  <td style={{ fontFamily: 'monospace', fontSize: '.72rem', color: 'var(--muted)' }}>{String(s._id).slice(-8)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '.78rem', color: 'var(--gold-pure)' }}>{String(s.accountId || '—').slice(-8)}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{fmtDate(s.periodStart)}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{fmtDate(s.periodEnd)}</td>
                  <td>Q {fmt(s.openingBalance)}</td>
                  <td style={{ fontWeight: 500, color: 'var(--white)' }}>Q {fmt(s.closingBalance)}</td>
                  <td style={{ color: '#4caf7d' }}>Q {fmt(s.totalDeposits)}</td>
                  <td style={{ color: '#e05c5c' }}>Q {fmt(s.totalWithdrawals)}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{fmtDate(s.createdAt)}</td>
                  <td>
                    <button className="btn-icon danger" title="Eliminar" onClick={() => setConfirm(s)}>
                      <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                        <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
            {!loading && filtered.length === 0 && <EmptyState text="Sin estados de cuenta generados" />}
          </tbody>
        </table>
      </div>
      </div>

      <ConfirmModal
        open={!!confirm}
        title="Eliminar estado de cuenta"
        message="¿Eliminar este estado de cuenta? Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default StatementsSection;
