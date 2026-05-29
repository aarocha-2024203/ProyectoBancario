import useUserCards from '../hooks/useUserCards';
import Badge from '../../shared/Badge';
import { fmt, fmtDate } from '../../shared/formatters';

const UserCards = () => {
  const { cards, loading, reload } = useUserCards();

  const activas    = cards.filter(c => c.status === 'activa');
  const bloqueadas = cards.filter(c => c.status === 'bloqueada');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mis Tarjetas</h1>
          <p className="page-subtitle">Tus tarjetas de crédito y débito</p>
        </div>
        <button className="btn-secondary" onClick={reload}>
          <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
            <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total tarjetas', value: loading ? '...' : cards.length },
          { label: 'Activas',        value: loading ? '...' : activas.length },
          { label: 'Bloqueadas',     value: loading ? '...' : bloqueadas.length },
          { label: 'Balance total',  value: loading ? '...' : 'Q ' + fmt(activas.reduce((s, c) => s + Number(c.availableBalance || 0), 0)) },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tarjetas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
        {loading ? [1, 2].map(i => (
          <div key={i} className="stat-card"><div className="skeleton" style={{ height: 140 }}/></div>
        )) : cards.map((c, i) => {
          const isBlocked = c.status === 'bloqueada';
          const isCredit  = c.cardType === 'credito';
          return (
            <div key={i} style={{
              background: isBlocked
                ? 'linear-gradient(135deg,rgba(80,20,20,0.7),rgba(100,30,30,0.6))'
                : isCredit
                ? 'linear-gradient(135deg,rgba(20,60,40,0.9),rgba(10,80,50,0.8))'
                : 'linear-gradient(135deg,rgba(10,20,70,0.95),rgba(5,15,55,0.9))',
              border: `1px solid ${isBlocked ? 'rgba(224,92,92,0.25)' : 'rgba(200,169,81,0.2)'}`,
              borderRadius: 16, padding: '1.5rem',
              position: 'relative', overflow: 'hidden', minHeight: 180,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: `radial-gradient(circle,${isBlocked ? 'rgba(224,92,92,0.06)' : 'rgba(200,169,81,0.06)'} 0%,transparent 70%)`, borderRadius: '50%' }}/>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.12em', color: 'rgba(255,255,255,0.45)', marginBottom: '.2rem' }}>{isCredit ? 'Crédito' : 'Débito'} · {c.franchise || '—'}</p>
                  <p style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)', fontSize: '.85rem' }}>{c.cardNumber ? `···· ${c.cardNumber.slice(-4)}` : '—'}</p>
                </div>
                <Badge value={c.status || 'activa'}/>
              </div>

              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.8rem', fontWeight: 600, color: isBlocked ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.95)', margin: '.75rem 0' }}>
                Q {fmt(c.availableBalance)}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '.75rem', borderTop: `1px solid ${isBlocked ? 'rgba(224,92,92,0.15)' : 'rgba(255,255,255,0.08)'}` }}>
                <div>
                  <p style={{ fontSize: '.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', letterSpacing: '.08em' }}>Vence</p>
                  <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,0.7)', marginTop: '.1rem' }}>{fmtDate(c.expirationDate)}</p>
                </div>
                {isCredit && c.creditLimit && (
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', letterSpacing: '.08em' }}>Límite</p>
                    <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,0.7)', marginTop: '.1rem' }}>Q {fmt(c.creditLimit)}</p>
                  </div>
                )}
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', letterSpacing: '.08em' }}>CVV</p>
                  <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,0.6)', marginTop: '.1rem' }}>•••</p>
                </div>
              </div>

              {isBlocked && (
                <div style={{ marginTop: '.75rem', padding: '.5rem .75rem', background: 'rgba(224,92,92,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#e05c5c" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <p style={{ fontSize: '.72rem', color: '#e05c5c' }}>Tarjeta bloqueada — contacta al banco</p>
                </div>
              )}
            </div>
          );
        })}

        {!loading && cards.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <svg viewBox="0 0 24 24" fill="none" width="40" height="40" style={{ opacity: .12, display: 'block', margin: '0 auto 1rem' }}><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <p>No tienes tarjetas asignadas.</p>
            <p style={{ fontSize: '.82rem', marginTop: '.5rem' }}>Contacta al administrador para solicitar una tarjeta.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCards;
