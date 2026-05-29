import { useState } from 'react';
import DashboardLayout from '../../../shared/components/layout/DashboardLayout';

// ── Todas las secciones en sus propios archivos ───────────────────────────────
import OverviewSection     from '../overview/pages/OverviewSection';
import UsersSection        from '../users/pages/UsersSection';
import AccountsSection     from '../accounts/pages/AccountsSection';
import CardsSection        from '../cards/pages/CardsSection';
import TransactionsSection from '../transactions/pages/TransactionsSection';
import LoansSection        from '../loans/pages/LoansSection';
import CoinsSection        from '../coins/pages/CoinsSection';
import LocksSection        from '../locks/pages/LocksSection';
import ServicesSection     from '../services/pages/ServicesSection';
import DepositsSection     from '../deposits/pages/DepositsSection';
import WithdrawalsSection  from '../withdrawals/pages/WithdrawalsSection';
import StatementsSection   from '../statements/pages/StatementsSection';
import ProfilePage         from '../../profile/ProfilePage';

// ── Mapa de secciones ────────────────────────────────────────────────────────
const SECTIONS = {
  overview:     OverviewSection,
  users:        UsersSection,
  accounts:     AccountsSection,
  cards:        CardsSection,
  transactions: TransactionsSection,
  loans:        LoansSection,
  coins:        CoinsSection,
  locks:        LocksSection,
  services:     ServicesSection,
  deposits:     DepositsSection,
  withdrawals:  WithdrawalsSection,
  statements:   StatementsSection,
  profile:      ProfilePage,
};

// ── Componente principal ─────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [page, setPage] = useState('overview');
  const Section = SECTIONS[page] || OverviewSection;

  return (
    <DashboardLayout activePage={page} onNavigate={setPage} isAdmin>
      <Section />
    </DashboardLayout>
  );
};

export default AdminDashboard;