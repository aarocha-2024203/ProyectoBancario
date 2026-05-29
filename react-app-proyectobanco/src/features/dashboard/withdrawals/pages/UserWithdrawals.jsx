import { useState } from 'react';
import { createWithdrawal, getAccountsByUser, getStatement } from '../../../../shared/api/banking';
import { showSuccess, showError } from '../../../../shared/utils/toast';
import useAuthStore from '../../../auth/store/authStore';
import useUserWithdrawals from '../hooks/useUserWithdrawals';
import { fmt, fmtDate, fmtDateTime } from '../../shared/formatters';

const UserWithdrawals = () => {
  const { user }                = useAuthStore();
  const { myAccounts, reload }  = useUserWithdrawals();
  const [modal, setModal]       = useState(false);
  const [statementModal, setStatementModal] = useState(false);
  const [statement, setStatement]           = useState(null);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ accountNumber: '', amount: '' });

  const handleCreate = async () => {
    if (!form.accountNumber) { showError('Selecciona una cuenta'); return; }
    if (!form.amount || Number(form.amount) <= 0) { showError('El monto debe ser mayor a 0'); return; }
    const acc = myAccounts.find(a => a.accountNumber === form.accountNumber);
    if (acc && Number(form.amount) > acc.balance) { showError(`Saldo insuficiente. Tu saldo es Q ${fmt(acc.balance)}`); return; }
    if (acc && Number(form.amount) > (acc.dailyWithdrawalLimit || 0)) { showError(`El monto supera tu límite diario de Q ${fmt(acc.dailyWithdrawalLimit)}`); return; }
    setSaving(true);
    try {
      await createWithdrawal({ accountNumber: form.accountNumber, amount: Number(form.amount) });
      showSuccess('Retiro realizado exitosamente');
      setModal(false);
      setForm({ accountNumber: '', amount: '' });
      if (user?.id) {
        getAccountsByUser(user.id).then(res => {
          const d = res.data?.data || res.data || [];
          reload();
        });
      }
    } catch (e) {
      showError((e?.response?.data?.error || e?.response?.data?.message || 'Error al realizar el retiro').replace('Error: ', ''));
    } finally { setSaving(false); }
  };

  const handleViewStatement = async (accountNumber) => {
    if (!accountNumber) { showError('Selecciona una cuenta'); return; }
    setLoadingStatement(true);
    setStatementModal(true);
    try {
      const res = await getStatement(accountNumber);
      setStatement(res.data);
    } catch (e) {
      showError(e?.response?.data?.message || 'Error al obtener el historial');
      setStatementModal(false);
    } finally { setLoadingStatement(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Retiros</h1><p className="page-subtitle">Retira fondos de tus cuentas activas</p></div>
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <button className="btn-secondary" onClick={() => setStatementModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Estado de cuenta
          </button>
          <button className="btn-add" onClick={() => setModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Nuevo retiro
          </button>
        </div>
      </div>

      {/* Tarjetas de cuentas */}
      {myAccounts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {myAccounts.map((a, i) => (
            <div key={i} style={{ background: 'linear-gradient(135deg,rgba(15,30,53,0.95),rgba(22,40,71,0.85))', border: '1px solid rgba(200,169,81,0.15)', borderRadius: 14, padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -15, right: -15, width: 80, height: 80, background: 'radial-gradient(circle,rgba(200,169,81,0.06) 0%,transparent 70%)', borderRadius: '50%' }}/>
              <p style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '.25rem' }}>{a.accountType}</p>
              <p style={{ fontFamily: 'monospace', color: 'var(--gold-pure)', fontSize: '.82rem', marginBottom: '.5rem' }}>{a.accountNumber}</p>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.6rem', fontWeight: 600, color: 'var(--white)', marginBottom: '.75rem' }}>Q {fmt(a.balance)}</p>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button onClick={() => { setForm(p => ({ ...p, accountNumber: a.accountNumber })); setModal(true); }}
                  style={{ flex: 1, padding: '.5rem', background: 'linear-gradient(135deg,#b8942e,#c8a951)', color: '#060810', border: 'none', borderRadius: 7, fontSize: '.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                  Retirar
                </button>
                <button onClick={() => handleViewStatement(a.accountNumber)}
                  style={{ flex: 1, padding: '.5rem', background: 'rgba(255,255,255,0.04)', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, fontSize: '.75rem', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                  Historial
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {myAccounts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          <svg viewBox="0 0 24 24" fill="none" width="40" height="40" style={{ opacity: .15, display: 'block', margin: '0 auto 1rem' }}><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <p>No tienes cuentas activas para realizar retiros.</p>
        </div>
      )}

      {/* Modal retiro */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Nuevo Retiro</span><button className="modal-close" onClick={() => setModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Cuenta a retirar *</label>
                <select className="modal-select" value={form.accountNumber} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value }))}>
                  <option value="">Selecciona una cuenta</option>
                  {myAccounts.map(a => <option key={a.accountNumber} value={a.accountNumber}>{a.accountNumber} — Q {fmt(a.balance)} ({a.accountType})</option>)}
                </select>
              </div>
              <div className="modal-field">
                <label className="modal-label">Monto a retirar *</label>
                <input className="modal-input" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}/>
              </div>
              {form.accountNumber && (() => {
                const acc = myAccounts.find(a => a.accountNumber === form.accountNumber);
                if (!acc) return null;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                    <div style={{ background: 'rgba(200,169,81,0.05)', border: '1px solid rgba(200,169,81,0.12)', borderRadius: 8, padding: '.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>Balance disponible</span>
                      <span style={{ fontSize: '.9rem', color: 'var(--gold-pure)', fontWeight: 600 }}>Q {fmt(acc.balance)}</span>
                    </div>
                    <div style={{ background: 'rgba(107,127,163,0.06)', border: '1px solid rgba(107,127,163,0.15)', borderRadius: 8, padding: '.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>Límite retiro diario</span>
                      <span style={{ fontSize: '.85rem', color: 'var(--white)', fontWeight: 500 }}>Q {fmt(acc.dailyWithdrawalLimit || 0)}</span>
                    </div>
                  </div>
                );
              })()}
              <div style={{ background: 'rgba(224,92,92,0.06)', border: '1px solid rgba(224,92,92,0.15)', borderRadius: 8, padding: '.85rem 1rem', display: 'flex', gap: '.6rem', alignItems: 'flex-start' }}>
                <svg viewBox="0 0 24 24" fill="none" width="15" height="15" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round"/><path d="M12 9v4M12 17h.01" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <p style={{ fontSize: '.78rem', color: 'rgba(224,92,92,0.8)', lineHeight: 1.5, margin: 0 }}>El retiro está sujeto al límite diario de tu cuenta. El monto se deducirá inmediatamente.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleCreate} disabled={saving} style={{ background: 'linear-gradient(135deg,#c0392b,#e05c5c)' }}>
                {saving ? <span className="spin"/> : 'Confirmar retiro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal estado de cuenta */}
      {statementModal && (
        <div className="modal-overlay" onClick={() => { setStatementModal(false); setStatement(null); }}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Estado de Cuenta — Historial de Retiros</span>
              <button className="modal-close" onClick={() => { setStatementModal(false); setStatement(null); }}>✕</button>
            </div>
            <div className="modal-body">
              {!statement && (
                <div className="modal-field">
                  <label className="modal-label">Selecciona una cuenta</label>
                  <div style={{ display: 'flex', gap: '.75rem' }}>
                    <select className="modal-select" id="stmt-acc">
                      <option value="">Selecciona...</option>
                      {myAccounts.map(a => <option key={a.accountNumber} value={a.accountNumber}>{a.accountNumber} ({a.accountType})</option>)}
                    </select>
                    <button className="btn-add" style={{ whiteSpace: 'nowrap' }} onClick={() => handleViewStatement(document.getElementById('stmt-acc').value)}>
                      Ver historial
                    </button>
                  </div>
                </div>
              )}
              {loadingStatement && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <span style={{ display: 'inline-block', width: 32, height: 32, border: '2px solid rgba(200,169,81,0.2)', borderTopColor: 'var(--gold-pure)', borderRadius: '50%', animation: 'spin .65s linear infinite' }}/>
                </div>
              )}
              {statement && !loadingStatement && (
                <div>
                  <div style={{ background: 'rgba(200,169,81,0.06)', border: '1px solid rgba(200,169,81,0.15)', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                      <span style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Cuenta</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--gold-pure)' }}>{statement.accountNumber}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Balance actual</span>
                      <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.3rem', fontWeight: 600, color: 'var(--white)' }}>Q {fmt(statement.currentBalance)}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, marginBottom: '.75rem' }}>
                    Historial de retiros ({statement.history?.length || 0})
                  </p>
                  {statement.history?.length === 0 && <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '1.5rem', fontSize: '.9rem' }}>Sin retiros registrados en esta cuenta</p>}
                  <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                    {statement.history?.map((h, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '.85rem', color: 'var(--white)', fontWeight: 500, marginBottom: '.2rem' }}>Retiro de Q {fmt(h.amount)}</p>
                          <p style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{fmtDateTime(h.createdAt)}</p>
                        </div>
                        <span style={{ padding: '.15rem .6rem', borderRadius: 20, fontSize: '.68rem', background: 'rgba(224,92,92,0.1)', border: '1px solid rgba(224,92,92,0.2)', color: '#e05c5c', fontWeight: 500 }}>
                          -{fmt(h.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button className="btn-secondary" style={{ marginTop: '.75rem', width: '100%', justifyContent: 'center' }} onClick={() => setStatement(null)}>Ver otra cuenta</button>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => { setStatementModal(false); setStatement(null); }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserWithdrawals;
