import { useState } from 'react';
import DashboardLayout from '../../../shared/components/layout/DashboardLayout';

// ── Todas las secciones en sus propios archivos ───────────────────────────────
import UserOverview      from '../overview/pages/UserOverview';
import UserAccounts      from '../accounts/pages/UserAccounts';
import UserCards         from '../cards/pages/UserCards';
import UserTransactions  from '../transactions/pages/UserTransactions';
import UserLoans         from '../loans/pages/UserLoans';
import UserDeposits      from '../deposits/pages/UserDeposits';
import UserWithdrawals   from '../withdrawals/pages/UserWithdrawals';
import UserStatements    from '../statements/pages/UserStatements';
import ProfilePage       from '../../profile/ProfilePage';

// ── Mapa de secciones ────────────────────────────────────────────────────────
const USER_SECTIONS = {
  overview:     UserOverview,
  accounts:     UserAccounts,
  cards:        UserCards,
  transactions: UserTransactions,
  loans:        UserLoans,
  deposits:     UserDeposits,
  withdrawals:  UserWithdrawals,
  statements:   UserStatements,
  profile:      ProfilePage,
};

// ── Componente principal ─────────────────────────────────────────────────────
const UserDashboard = () => {
  const [page, setPage] = useState('overview');
  const Section = USER_SECTIONS[page] || UserOverview;

  return (
    <DashboardLayout activePage={page} onNavigate={setPage} isAdmin={false}>
      <Section />
    </DashboardLayout>
  );
};

export default UserDashboard;
