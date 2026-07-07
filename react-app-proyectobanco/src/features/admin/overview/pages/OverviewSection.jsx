import { useData } from '../../../../shared/hooks/useData';
import { getUsers } from '../../../../shared/api/users';
import {
  getAccountsDelayed,
  getCardsDelayed,
  getLoansDelayed,
} from '../../../../shared/api/banking';
import Badge from '../../shared/Badge';
import LoadingRows from '../../shared/LoadingRows';
import EmptyState from '../../shared/EmptyState';
import { fmt, fmtDate } from '../../shared/formatters';

const OverviewSection = () => {
  const { data: users,    loading: lu } = useData(getUsers);
  const { data: accounts, loading: la } = useData(getAccountsDelayed);
  const { data: cards,    loading: lc } = useData(getCardsDelayed);
  const { data: loans,    loading: ll } = useData(getLoansDelayed);

  const stats = [
    {
      label: 'Usuarios registrados',
      value: lu ? '...' : users.length,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="9" cy="7" r="4" stroke="#c8a951" strokeWidth="1.5"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'Cuentas activas',
      value: la ? '...' : accounts.filter(a => (a.status || '').toLowerCase() === 'activa').length,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'Tarjetas emitidas',
      value: lc ? '...' : cards.length,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
          <rect x="2" y="5" width="20" height="14" rx="2" stroke="#c8a951" strokeWidth="1.5"/>
          <path d="M2 10h20" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'Préstamos activos',
      value: ll ? '...' : loans.length,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'Total en cuentas',
      value: la ? '...' : 'Q ' + fmt(accounts.reduce((s, a) => s + Number(a.balance || 0), 0)),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
          <circle cx="12" cy="12" r="10" stroke="#c8a951" strokeWidth="1.5"/>
          <path d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H9m0 0h5.5a1.5 1.5 0 010 3H9" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel General</h1>
          <p className="page-subtitle">Resumen del sistema bancario en tiempo real</p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="table-card" style={{ marginTop: '1.5rem' }}>
        <div className="table-header">
          <span className="table-title">Últimas cuentas creadas</span>
        </div>

        <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>N° Cuenta</th>
              <th>Tipo</th>
              <th>Balance</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {la ? (
              <LoadingRows cols={5} />
            ) : (
              accounts.slice(0, 6).map((a, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--gold-pure)' }}>
                    {a.accountNumber || a.AccountNumber || '—'}
                  </td>
                  <td><Badge value={a.accountType || a.AccountType} /></td>
                  <td>Q {fmt(a.balance || a.Balance)}</td>
                  <td><Badge value={a.status || a.Status} /></td>
                  <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>
                    {fmtDate(a.openingDate || a.createdAt)}
                  </td>
                </tr>
              ))
            )}
            {!la && accounts.length === 0 && <EmptyState text="Sin cuentas registradas" />}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
};

export default OverviewSection;