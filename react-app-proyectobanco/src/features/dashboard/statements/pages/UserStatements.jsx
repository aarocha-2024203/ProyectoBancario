import { useState } from 'react';
import { showSuccess, showError } from '../../../../shared/utils/toast';
import useUserStatements from '../hooks/useUserStatements';
import { fmt, fmtDate, fmtDateTime } from '../../shared/formatters';

const UserStatements = () => {
  const { myAccounts, statements, loadingStmt, reload } = useUserStatements();
  const [generating, setGenerating]   = useState(false);
  const [currentStmt, setCurrentStmt] = useState(null);
  const [form, setForm] = useState({ accountNumber: '', periodStart: '', periodEnd: '' });

  const token = () => JSON.parse(localStorage.getItem('bancario-auth'))?.state?.token;

  const inputStyle = {
    width: '100%', padding: '.6rem .85rem',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(200,169,81,0.2)',
    borderRadius: 8, color: 'var(--white)',
    fontSize: '.85rem', outline: 'none',
    fontFamily: "'Outfit',sans-serif", boxSizing: 'border-box',
  };

  const selectStyle = { ...inputStyle, appearance: 'none', cursor: 'pointer' };

  const handleGenerate = async () => {
    if (!form.accountNumber) { showError('Selecciona una cuenta'); return; }
    setGenerating(true);
    setCurrentStmt(null);
    try {
      const params = new URLSearchParams();
      if (form.periodStart) params.append('periodStart', form.periodStart);
      if (form.periodEnd)   params.append('periodEnd',   form.periodEnd);
      const res  = await fetch(
        `http://localhost:3006/api/v1/accountStatements/account/${form.accountNumber}/pdf?${params}`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      const data = await res.json();
      if (data.success) {
        setCurrentStmt(data.data);
        showSuccess('Estado de cuenta generado exitosamente');
        reload();
      } else { showError(data.message || 'Error al generar'); }
    } catch { showError('Error de conexión'); }
    finally { setGenerating(false); }
  };

  const handleDownload = (stmt) => {
    const txRows = (stmt.transactions || []).map(t => {
      const isEntry = t.destinationAccountNumber === stmt.accountNumber;
      const sign  = isEntry ? '+' : '-';
      const color = isEntry ? '#2e7d32' : '#c62828';
      return `<tr><td>${fmtDateTime(t.transactionDate)}</td><td style="text-transform:capitalize">${t.transactionType || '—'}</td><td>${t.description || '—'}</td><td>${t.sourceAccountNumber || '—'}</td><td>${t.destinationAccountNumber || '—'}</td><td style="color:${color};font-weight:600;text-align:right">${sign} Q ${fmt(t.amount)}</td></tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Estado de Cuenta — ${stmt.accountNumber}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:2.5rem;color:#222;background:#fff}.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;padding-bottom:1rem;border-bottom:2px solid #1a3a6b}.bank{font-size:1.4rem;font-weight:700;color:#1a3a6b}.info{font-size:.85rem;color:#555;text-align:right}h2{font-size:1.1rem;color:#1a3a6b;margin:1.5rem 0 .75rem}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem}.card{background:#f5f7fa;border-radius:8px;padding:1rem;border-left:4px solid #1a3a6b}.card.green{border-color:#2e7d32}.card.red{border-color:#c62828}.card-label{font-size:.72rem;text-transform:uppercase;color:#666;letter-spacing:.06em;margin-bottom:.3rem}.card-value{font-size:1.1rem;font-weight:700;color:#222}.card.green .card-value{color:#2e7d32}.card.red .card-value{color:#c62828}table{width:100%;border-collapse:collapse;font-size:.82rem}th{background:#1a3a6b;color:#fff;padding:.6rem .75rem;text-align:left}td{padding:.55rem .75rem;border-bottom:1px solid #eee}tr:nth-child(even) td{background:#f9f9f9}.footer{margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:.75rem;color:#999;text-align:center}</style></head><body>
<div class="header"><div class="bank">🏦 Banco Nacional</div><div class="info"><div>Cuenta: <strong>${stmt.accountNumber}</strong></div><div>Período: ${fmtDate(stmt.periodStart)} — ${fmtDate(stmt.periodEnd)}</div><div>Generado: ${new Date().toLocaleString('es-GT')}</div></div></div>
<h2>Resumen del período</h2><div class="summary"><div class="card"><div class="card-label">Balance apertura</div><div class="card-value">Q ${fmt(stmt.openingBalance)}</div></div><div class="card"><div class="card-label">Balance cierre</div><div class="card-value">Q ${fmt(stmt.closingBalance)}</div></div><div class="card green"><div class="card-label">Total depósitos</div><div class="card-value">+ Q ${fmt(stmt.totalDeposits)}</div></div><div class="card red"><div class="card-label">Total retiros</div><div class="card-value">- Q ${fmt(stmt.totalWithdrawals)}</div></div><div class="card red"><div class="card-label">Transferencias enviadas</div><div class="card-value">- Q ${fmt(stmt.totalTransfersSent)}</div></div><div class="card green"><div class="card-label">Transferencias recibidas</div><div class="card-value">+ Q ${fmt(stmt.totalTransfersReceived)}</div></div></div>
<h2>Movimientos del período (${(stmt.transactions || []).length})</h2>
${(stmt.transactions || []).length > 0 ? `<table><thead><tr><th>Fecha y hora</th><th>Tipo</th><th>Descripción</th><th>Origen</th><th>Destino</th><th>Monto</th></tr></thead><tbody>${txRows}</tbody></table>` : '<p style="color:#999;padding:1rem 0">Sin movimientos en el período seleccionado.</p>'}
<div class="footer">Documento generado electrónicamente — Banco Nacional · ${new Date().getFullYear()}</div></body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `estado-cuenta-${stmt.accountNumber}-${new Date().toISOString().slice(0, 10)}.html`;
    a.click(); URL.revokeObjectURL(url);
    showSuccess('Estado de cuenta descargado');
  };

  const TxRow = ({ t, accountNumber }) => {
    const isEntry  = t.destinationAccountNumber === accountNumber;
    const isRetiro = t.transactionType === 'retiro';
    const color    = (isEntry || t.transactionType === 'deposito') && !isRetiro ? '#4caf7d' : '#e05c5c';
    const sign     = (isEntry || t.transactionType === 'deposito') && !isRetiro ? '+' : '-';
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 90px', gap: '.75rem', alignItems: 'center', padding: '.75rem', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.2rem' }}>
            <span style={{ padding: '.15rem .5rem', borderRadius: 20, fontSize: '.68rem', fontWeight: 600, background: isRetiro || (!isEntry && t.transactionType !== 'deposito') ? 'rgba(224,92,92,0.1)' : 'rgba(76,175,125,0.1)', color: isRetiro || (!isEntry && t.transactionType !== 'deposito') ? '#e05c5c' : '#4caf7d', textTransform: 'capitalize' }}>{t.transactionType}</span>
            {t.favorito && <span style={{ color: '#eab308', fontSize: '.75rem' }}>★ {t.alias}</span>}
          </div>
          <p style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: '.15rem' }}>{t.description || '—'}</p>
          <p style={{ fontSize: '.72rem', color: 'rgba(255,255,255,0.25)' }}>{fmtDateTime(t.transactionDate)}</p>
          {t.sourceAccountNumber && t.destinationAccountNumber && (
            <p style={{ fontSize: '.7rem', color: 'rgba(255,255,255,0.2)', marginTop: '.1rem', fontFamily: 'monospace' }}>{t.sourceAccountNumber} → {t.destinationAccountNumber}</p>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '.72rem', color: 'var(--muted)', marginBottom: '.15rem' }}>{t.currencyCode || 'GTQ'}</p>
          <p style={{ fontSize: '.95rem', fontWeight: 700, color, fontFamily: "'Cormorant Garamond',serif" }}>{sign} Q {fmt(t.amount)}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {t.newBalance != null && <>
            <p style={{ fontSize: '.68rem', color: 'rgba(255,255,255,0.25)', marginBottom: '.1rem' }}>Saldo</p>
            <p style={{ fontSize: '.82rem', color: 'var(--white)', fontWeight: 500 }}>Q {fmt(t.newBalance)}</p>
          </>}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Estado de Cuenta</h1><p className="page-subtitle">Genera y descarga tus estados de cuenta</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* Panel izquierdo */}
        <div style={{ background: 'linear-gradient(135deg,rgba(15,30,53,0.95),rgba(22,40,71,0.85))', border: '1px solid rgba(200,169,81,0.15)', borderRadius: 20, padding: '1.75rem', position: 'sticky', top: '1rem' }}>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.2rem', fontWeight: 600, color: 'var(--white)', marginBottom: '1.25rem' }}>Generar estado</p>

          <div style={{ marginBottom: '.85rem' }}>
            <label style={{ display: 'block', fontSize: '.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem', fontWeight: 500 }}>Cuenta bancaria *</label>
            <select style={selectStyle} value={form.accountNumber} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value }))}>
              <option value="" style={{ background: '#0f1e35', color: '#fff' }}>Selecciona una cuenta</option>
              {myAccounts.map(a => <option key={a.accountNumber} value={a.accountNumber} style={{ background: '#0f1e35', color: '#fff' }}>{a.accountNumber} — Q {fmt(a.balance)}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '.85rem' }}>
            <label style={{ display: 'block', fontSize: '.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem', fontWeight: 500 }}>Fecha inicio (opcional)</label>
            <input style={inputStyle} type="date" value={form.periodStart} onChange={e => setForm(p => ({ ...p, periodStart: e.target.value }))}/>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem', fontWeight: 500 }}>Fecha fin (opcional)</label>
            <input style={inputStyle} type="date" value={form.periodEnd} onChange={e => setForm(p => ({ ...p, periodEnd: e.target.value }))}/>
          </div>

          <div style={{ background: 'rgba(200,169,81,0.05)', border: '1px solid rgba(200,169,81,0.1)', borderRadius: 8, padding: '.75rem', fontSize: '.73rem', color: 'rgba(200,169,81,0.7)', lineHeight: 1.5, marginBottom: '1rem' }}>
            ℹ️ Sin fechas genera el estado del mes actual.
          </div>

          <button onClick={handleGenerate} disabled={generating || !form.accountNumber} style={{ width: '100%', padding: '.85rem', background: generating || !form.accountNumber ? 'rgba(200,169,81,0.08)' : 'linear-gradient(135deg,#b8942e,#c8a951)', color: generating || !form.accountNumber ? 'rgba(200,169,81,0.35)' : '#060810', border: `1px solid ${!form.accountNumber ? 'rgba(200,169,81,0.1)' : 'transparent'}`, borderRadius: 10, fontFamily: "'Outfit',sans-serif", fontSize: '.88rem', fontWeight: 700, cursor: generating || !form.accountNumber ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.6rem', transition: 'all .2s' }}>
            {generating
              ? <><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(6,8,16,.3)', borderTopColor: '#060810', borderRadius: '50%', animation: 'spin .65s linear infinite' }}/> Generando...</>
              : <><svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>Generar estado de cuenta</>
            }
          </button>

          {statements.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', fontWeight: 600, marginBottom: '.75rem' }}>Historial ({statements.length})</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', maxHeight: 220, overflowY: 'auto' }}>
                {statements.map((s, i) => (
                  <div key={s._id || i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '.75rem', color: 'var(--white)', fontWeight: 500, marginBottom: '.15rem' }}>{fmtDate(s.periodStart)} — {fmtDate(s.periodEnd)}</p>
                      <p style={{ fontSize: '.7rem', color: 'var(--muted)' }}>Cierre: Q {fmt(s.closingBalance)}</p>
                    </div>
                    <button onClick={() => handleDownload({ ...s, accountNumber: form.accountNumber, transactions: [] })} style={{ background: 'rgba(200,169,81,0.08)', border: '1px solid rgba(200,169,81,0.15)', borderRadius: 6, padding: '.4rem', cursor: 'pointer', color: 'var(--gold-pure)' }}>
                      <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panel derecho */}
        <div>
          {!currentStmt ? (
            <div style={{ background: 'linear-gradient(135deg,rgba(15,30,53,0.6),rgba(22,40,71,0.4))', border: '1px dashed rgba(200,169,81,0.15)', borderRadius: 20, padding: '4rem 2rem', textAlign: 'center', color: 'var(--muted)' }}>
              <svg viewBox="0 0 24 24" fill="none" width="48" height="48" style={{ opacity: .1, display: 'block', margin: '0 auto 1rem' }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <p style={{ fontSize: '1rem', marginBottom: '.5rem' }}>Selecciona una cuenta y genera tu estado</p>
              <p style={{ fontSize: '.82rem' }}>Verás todos tus movimientos del período aquí.</p>
            </div>
          ) : (
            <div style={{ background: 'linear-gradient(135deg,rgba(15,30,53,0.95),rgba(22,40,71,0.85))', border: '1px solid rgba(200,169,81,0.15)', borderRadius: 20, padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.3rem', fontWeight: 600, color: 'var(--white)', marginBottom: '.25rem' }}>Estado de Cuenta</p>
                  <p style={{ fontFamily: 'monospace', color: 'var(--gold-pure)', fontSize: '.88rem' }}>{currentStmt.accountNumber}</p>
                  <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '.25rem' }}>{fmtDate(currentStmt.periodStart)} — {fmtDate(currentStmt.periodEnd)}</p>
                </div>
                <button onClick={() => handleDownload(currentStmt)} style={{ padding: '.6rem 1rem', background: 'linear-gradient(135deg,rgba(200,169,81,0.15),rgba(200,169,81,0.08))', border: '1px solid rgba(200,169,81,0.3)', color: 'var(--gold-pure)', borderRadius: 8, fontFamily: "'Outfit',sans-serif", fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Descargar HTML
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Bal. apertura', value: 'Q ' + fmt(currentStmt.openingBalance) },
                  { label: 'Bal. cierre',   value: 'Q ' + fmt(currentStmt.closingBalance), gold: true },
                  { label: 'Depósitos',     value: '+ Q ' + fmt(currentStmt.totalDeposits), green: true },
                  { label: 'Retiros',       value: '- Q ' + fmt(currentStmt.totalWithdrawals), red: true },
                  { label: 'Transf. enviadas',   value: '- Q ' + fmt(currentStmt.totalTransfersSent), red: true },
                  { label: 'Transf. recibidas',  value: '+ Q ' + fmt(currentStmt.totalTransfersReceived), green: true },
                ].map(({ label, value, green, red, gold }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${green ? 'rgba(76,175,125,0.2)' : red ? 'rgba(224,92,92,0.2)' : gold ? 'rgba(200,169,81,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, padding: '.85rem' }}>
                    <p style={{ fontSize: '.65rem', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '.08em', marginBottom: '.3rem' }}>{label}</p>
                    <p style={{ fontSize: '.9rem', fontWeight: 700, color: green ? '#4caf7d' : red ? '#e05c5c' : gold ? 'var(--gold-pure)' : 'var(--white)' }}>{value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p style={{ fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', fontWeight: 600, marginBottom: '.85rem' }}>
                  Movimientos del período ({(currentStmt.transactions || []).length})
                </p>
                {(currentStmt.transactions || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>Sin movimientos en el período seleccionado.</div>
                ) : (
                  <div style={{ maxHeight: 420, overflowY: 'auto', paddingRight: '.25rem' }}>
                    {currentStmt.transactions.map((t, i) => <TxRow key={t._id || i} t={t} accountNumber={currentStmt.accountNumber}/>)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserStatements;
