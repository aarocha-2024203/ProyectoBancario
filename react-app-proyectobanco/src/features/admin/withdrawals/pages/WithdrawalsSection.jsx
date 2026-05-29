import { useState } from 'react';
import { showSuccess, showError } from '../../../../shared/utils/toast';
import EmptyState from '../../shared/EmptyState';
import { fmt } from '../../shared/formatters';

const WithdrawalsSection = () => {
  const [stmtData, setStmtData]       = useState(null);
  const [loadingStmt, setLoadingStmt] = useState(false);
  const [stmtAccount, setStmtAccount] = useState('');
  const [search, setSearch]           = useState('');

  const handleStatement = async () => {
    const accNum = stmtAccount.trim().toUpperCase();
    if (!accNum) { showError('Ingresa un número de cuenta'); return; }
    setLoadingStmt(true);
    setStmtData(null);
    try {
      const token = JSON.parse(localStorage.getItem('bancario-auth'))?.state?.token;
      const res = await fetch(
        `http://localhost:3006/api/v1/withdrawal/statement/${accNum}?_t=${Date.now()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data?.success) { setStmtData(data); }
      else { showError(data?.message || 'Cuenta no encontrada'); }
    } catch { showError('Error al consultar el estado de cuenta'); }
    finally { setLoadingStmt(false); }
  };

  const filtered = (stmtData?.history || []).filter(w =>
    `${w.accountNumber || ''} ${w.userId || ''} ${w.currencyCode || ''}`
      .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Retiros</h1>
          <p className="page-subtitle">Consulta el historial de retiros por número de cuenta</p>
        </div>
      </div>

      {/* Buscador de cuenta */}
      <div className="table-card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ padding: '1.25rem', display: 'flex', gap: '.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="modal-field" style={{ flex: 1, minWidth: 200, margin: 0 }}>
            <label className="modal-label">N° de cuenta</label>
            <input
              className="modal-input"
              placeholder="ACC-000-0000"
              value={stmtAccount}
              onChange={e => setStmtAccount(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleStatement()}
            />
          </div>
          <button className="btn-add" onClick={handleStatement} disabled={loadingStmt} style={{ height: 40, whiteSpace: 'nowrap' }}>
            {loadingStmt
              ? <span className="spin"/>
              : <>
                  <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Consultar
                </>
            }
          </button>
          {stmtData && (
            <button className="btn-secondary" style={{ height: 40 }} onClick={() => { setStmtData(null); setStmtAccount(''); }}>
              Limpiar
            </button>
          )}
        </div>

        {!stmtData && !loadingStmt && (
          <div style={{ padding: '0 1.25rem 1.25rem' }}>
            <div style={{ background: 'rgba(200,169,81,0.05)', border: '1px solid rgba(200,169,81,0.12)', borderRadius: 8, padding: '.85rem 1rem', fontSize: '.78rem', color: 'rgba(200,169,81,0.8)', lineHeight: 1.5 }}>
              ℹ️ Los retiros solo pueden ser realizados por el cliente dueño de la cuenta desde su panel. El administrador puede consultar el historial de retiros de cualquier cuenta.
            </div>
          </div>
        )}
      </div>

      {/* Stats si hay datos */}
      {stmtData && (
        <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
          {[
            { label: 'Cuenta',        value: stmtData.accountNumber },
            { label: 'Balance actual', value: 'Q ' + fmt(stmtData.currentBalance) },
            { label: 'Total retiros',  value: stmtData.history?.length || 0 },
            { label: 'Total retirado', value: 'Q ' + fmt((stmtData.history || []).reduce((s, w) => s + Number(w.amount || 0), 0)) },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-card-value" style={{ fontSize: '1.1rem', wordBreak: 'break-all' }}>{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabla */}
      {stmtData && (
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">Retiros de {stmtData.accountNumber} ({filtered.length})</span>
            <div className="search-input-wrap">
              <span className="search-icon">
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
              <input className="search-input" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Cuenta</th><th>Monto retirado</th><th>Moneda</th>
                <th>Usuario ID</th><th>Descripción</th><th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <EmptyState text="Sin retiros registrados en esta cuenta"/>
                : filtered.map((w, i) => (
                  <tr key={w._id || i}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--gold-pure)', fontSize: '.85rem' }}>{w.accountNumber || '—'}</td>
                    <td style={{ fontWeight: 500, color: '#e05c5c' }}>- Q {fmt(w.amount)}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{w.currencyCode || 'GTQ'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '.78rem', color: 'var(--muted)' }}>{w.userId || '—'}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{w.description || '—'}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{w.createdAt ? new Date(w.createdAt).toLocaleString('es-GT') : '—'}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WithdrawalsSection;
