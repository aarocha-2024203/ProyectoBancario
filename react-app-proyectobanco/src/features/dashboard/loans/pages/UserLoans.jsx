import { useState } from 'react';
import { createLoan } from '../../../../shared/api/banking';
import { showSuccess, showError } from '../../../../shared/utils/toast';
import useAuthStore from '../../../auth/store/authStore';
import useUserLoans from '../hooks/useUserLoans';
import LoadingRows from '../../shared/LoadingRows';
import EmptyState from '../../shared/EmptyState';
import { fmt, fmtDate } from '../../shared/formatters';

const STATUS_COLORS = {
  solicitado: '#eab308', aprobado: '#4caf7d', rechazado: '#e05c5c',
  desembolsado: '#6366f1', pagado: '#c8a951', vencido: '#ef4444',
};

const UserLoans = () => {
  const { user }                              = useAuthStore();
  const { data, myAccounts, loading, reload } = useUserLoans();
  const [modal, setModal]                     = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [form, setForm]                       = useState({ accountNumber: '', requestedAmount: '', loanPurpose: '' });

  const handleSolicitar = async () => {
    if (!form.accountNumber)   { showError('Selecciona una cuenta'); return; }
    if (!form.requestedAmount || Number(form.requestedAmount) <= 0) { showError('El monto es obligatorio'); return; }
    if (!form.loanPurpose)     { showError('El motivo del préstamo es obligatorio'); return; }
    setSaving(true);
    try {
      await createLoan({
        userId:             user?.id,
        accountNumber:      form.accountNumber,
        requestedAmount:    Number(form.requestedAmount),
        loanPurpose:        form.loanPurpose,
        status:             'solicitado',
        requestDate:        new Date().toISOString(),
        termMonths:         12,
        interestRate:       0,
        monthlyPayment:     0,
        outstandingBalance: Number(form.requestedAmount),
      });
      showSuccess('Solicitud de préstamo enviada exitosamente');
      setModal(false);
      setForm({ accountNumber: '', requestedAmount: '', loanPurpose: '' });
      reload();
    } catch (e) {
      showError(e?.response?.data?.message || 'Error al solicitar el préstamo');
    } finally { setSaving(false); }
  };

  const activos = data.filter(l => !['pagado', 'rechazado'].includes(l.status));

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Mis Préstamos</h1><p className="page-subtitle">Estado de tus créditos y financiamientos</p></div>
        <button className="btn-add" onClick={() => setModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Solicitar préstamo
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total préstamos', value: loading ? '...' : data.length },
          { label: 'Activos',         value: loading ? '...' : activos.length },
          { label: 'Solicitados',     value: loading ? '...' : data.filter(l => l.status === 'solicitado').length },
          { label: 'Monto total',     value: loading ? '...' : 'Q ' + fmt(data.reduce((s, l) => s + Number(l.requestedAmount || 0), 0)) },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tarjetas activos */}
      {!loading && activos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {activos.map((l, i) => {
            const color   = STATUS_COLORS[l.status] || '#c8a951';
            const progreso = l.approvedAmount && l.outstandingBalance
              ? Math.max(0, Math.min(100, ((l.approvedAmount - l.outstandingBalance) / l.approvedAmount) * 100)) : 0;
            return (
              <div key={i} style={{ background: 'linear-gradient(135deg,rgba(15,30,53,0.95),rgba(22,40,71,0.85))', border: '1px solid rgba(200,169,81,0.15)', borderRadius: 16, padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'radial-gradient(circle,rgba(200,169,81,0.06) 0%,transparent 70%)', borderRadius: '50%' }}/>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '.2rem' }}>Préstamo</p>
                    <p style={{ fontFamily: 'monospace', color: 'var(--gold-pure)', fontSize: '.82rem' }}>{l.accountNumber || '—'}</p>
                  </div>
                  <span style={{ padding: '.2rem .65rem', borderRadius: 20, fontSize: '.7rem', fontWeight: 600, background: `${color}18`, border: `1px solid ${color}40`, color }}>{l.status}</span>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '.62rem', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '.08em', marginBottom: '.25rem' }}>Monto aprobado</p>
                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.6rem', fontWeight: 600, color: 'var(--white)' }}>Q {fmt(l.approvedAmount || l.requestedAmount)}</p>
                </div>
                {l.approvedAmount > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: 'var(--muted)', marginBottom: '.3rem' }}>
                      <span>Pagado</span><span>{Math.round(progreso)}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                      <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#4caf7d,#c8a951)', width: `${progreso}%`, transition: 'width .3s' }}/>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <p style={{ fontSize: '.6rem', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '.06em' }}>Cuota mensual</p>
                    <p style={{ fontSize: '.85rem', color: 'var(--white)', fontWeight: 500, marginTop: '.1rem' }}>Q {fmt(l.monthlyPayment || 0)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '.6rem', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '.06em' }}>Plazo</p>
                    <p style={{ fontSize: '.85rem', color: 'var(--white)', marginTop: '.1rem' }}>{l.termMonths || '—'} meses</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabla historial */}
      <div className="table-card">
        <div className="table-header"><span className="table-title">Historial de préstamos ({data.length})</span></div>
        <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Cuenta</th><th>Solicitado</th><th>Aprobado</th><th>Tasa</th><th>Plazo</th><th>Cuota</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>
            {loading ? <LoadingRows cols={8}/> : data.map((l, i) => {
              const color = STATUS_COLORS[l.status] || '#c8a951';
              return (
                <tr key={l._id || i}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--gold-pure)', fontSize: '.82rem' }}>{l.accountNumber || '—'}</td>
                  <td>Q {fmt(l.requestedAmount)}</td>
                  <td style={{ color: '#4caf7d', fontWeight: 500 }}>Q {fmt(l.approvedAmount || 0)}</td>
                  <td style={{ color: 'var(--muted)' }}>{l.interestRate || '—'}%</td>
                  <td style={{ color: 'var(--muted)' }}>{l.termMonths || '—'} m</td>
                  <td>Q {fmt(l.monthlyPayment || 0)}</td>
                  <td><span style={{ padding: '.2rem .6rem', borderRadius: 20, fontSize: '.7rem', fontWeight: 600, background: `${color}18`, border: `1px solid ${color}40`, color }}>{l.status}</span></td>
                  <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{fmtDate(l.requestDate || l.createdAt)}</td>
                </tr>
              );
            })}
            {!loading && data.length === 0 && <EmptyState text="Sin préstamos registrados"/>}
          </tbody>
        </table>
      </div>
      </div>

      {/* Modal solicitar */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Solicitar Préstamo</span><button className="modal-close" onClick={() => setModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Cuenta para desembolso *</label>
                <select className="modal-select" value={form.accountNumber} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value }))}>
                  <option value="">Selecciona una cuenta</option>
                  {myAccounts.map(a => <option key={a.accountNumber} value={a.accountNumber}>{a.accountNumber} — Q {fmt(a.balance)} ({a.accountType})</option>)}
                </select>
              </div>
              <div className="modal-field">
                <label className="modal-label">Monto solicitado (Q) *</label>
                <input className="modal-input" type="number" placeholder="10000" value={form.requestedAmount} onChange={e => setForm(p => ({ ...p, requestedAmount: e.target.value }))}/>
              </div>
              <div className="modal-field">
                <label className="modal-label">Motivo del préstamo *</label>
                <input className="modal-input" placeholder="¿Para qué necesitas el préstamo?" value={form.loanPurpose} onChange={e => setForm(p => ({ ...p, loanPurpose: e.target.value }))}/>
              </div>
              <div style={{ background: 'rgba(200,169,81,0.05)', border: '1px solid rgba(200,169,81,0.12)', borderRadius: 8, padding: '.85rem 1rem', fontSize: '.78rem', color: 'rgba(200,169,81,0.8)', lineHeight: 1.5 }}>
                ℹ️ Tu solicitud será revisada por un administrador. El monto aprobado, tasa de interés y plazo serán determinados por el banco.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleSolicitar} disabled={saving}>{saving ? <span className="spin"/> : 'Enviar solicitud'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLoans;
