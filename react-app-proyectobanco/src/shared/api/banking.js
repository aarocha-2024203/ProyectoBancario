import axios from 'axios';
 
const banking = axios.create({
  baseURL: import.meta.env.VITE_BANKING_URL || 'http://localhost:3006/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});
 
banking.interceptors.request.use((config) => {
  const stored = localStorage.getItem('bancario-auth');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
    } catch {}
  }
  return config;
});
 
banking.interceptors.response.use(
  (r) => r,
  (error) => {
    console.error('AXIOS ERROR:', error.code, error.message, error?.response?.status, error?.response?.data);
    if (error.response?.status === 401) {
      localStorage.removeItem('bancario-auth');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);
 
export default banking;
 
const delay = (ms) => new Promise(r => setTimeout(r, ms));
 
// ── Coins ──────────────────────────────────────────
export const getCoins         = ()           => banking.get('/coins/');
export const createCoin       = (data)       => banking.post('/coins/create', data);
export const updateCoin       = (id, data)   => banking.put(`/coins/${id}`, data);
export const deleteCoin       = (id)         => banking.delete(`/coins/${id}`);
export const toggleCoinStatus = (id, status) => banking.patch(`/coins/${id}/status`, { status });
 
// ── Accounts ───────────────────────────────────────
// Trae todas las cuentas sin importar estado
export const getAccounts = () =>
  Promise.all([
    banking.get('/accounts/?status=activa&limit=100'),
    banking.get('/accounts/?status=inactiva&limit=100'),
    banking.get('/accounts/?status=bloqueada&limit=100'),
  ]).then(([a, b, c]) => ({
    data: {
      data: [
        ...(a.data?.data || []),
        ...(b.data?.data || []),
        ...(c.data?.data || []),
      ]
    }
  })).catch(() => ({ data: { data: [] } }));
 
export const getAccount          = (id)          => banking.get(`/accounts/${id}`);
export const createAccount       = (data)        => banking.post('/accounts/create', data);
export const updateAccount       = (id, data)    => banking.put(`/accounts/${id}`, data);
export const deleteAccount       = (id)          => banking.delete(`/accounts/${id}`);
export const toggleAccountStatus = (id, status)  => banking.patch(`/accounts/${id}/status`, { status });
export const getAccountsByUser = (userId) => banking.get(`/accounts/user/${userId}`);
 
// Versiones con delay para el Overview (respetar rate limit)
export const getAccountsDelayed = () => delay(500).then(() =>
  Promise.all([
    banking.get('/accounts/?status=activa&limit=100'),
    banking.get('/accounts/?status=inactiva&limit=100'),
  ]).then(([a, b]) => ({
    data: { data: [...(a.data?.data || []), ...(b.data?.data || [])] }
  })).catch(() => ({ data: { data: [] } }))
);
 
// ── Account Locks ──────────────────────────────────
export const getAccountLocks   = ()          => banking.get('/accountLocks/');
export const getAccountLock    = (id)        => banking.get(`/accountLocks/${id}`);
export const createAccountLock = (data)      => banking.post('/accountLocks/create', data);
export const updateAccountLock = (id, data)  => banking.put(`/accountLocks/${id}`, data);
export const deleteAccountLock = (id)        => banking.delete(`/accountLocks/${id}`);
 
// ── Cards ──────────────────────────────────────────
export const getCards         = ()           => banking.get('/cards/');
export const getCard          = (id)         => banking.get(`/cards/${id}`);
export const createCard       = (data)       => banking.post('/cards/create', data);
export const updateCard       = (id, data)   => banking.put(`/cards/${id}`, data);
export const deleteCard       = (id)         => banking.delete(`/cards/${id}`);
export const toggleCardStatus = (id, status) => banking.patch(`/cards/${id}/status`, { status });
export const getCardsDelayed  = ()           => delay(1000).then(() => banking.get('/cards/'));
export const getMyCards = () => banking.get('/cards/my');
// ── Transactions ───────────────────────────────────
export const getTransactions   = ()       => banking.get('/transaction/');
export const getTransaction    = (id)     => banking.get(`/transaction/${id}`);
export const createTransaction = (data)   => banking.post('/transaction/create', data);
export const deleteTransaction = (id)     => banking.delete(`/transaction/${id}`);
export const getFavorites = () => banking.get('/transaction/favorites');
export const updateTransaction = (id, data) => banking.put(`/transaction/${id}`, data);
// ── Loans ──────────────────────────────────────────
export const getLoans = () => banking.get('/loan?limit=100');
export const getLoan        = (id)       => banking.get(`/loan/${id}`);
export const createLoan     = (data)     => banking.post('/loan/create', data);
export const updateLoan     = (id, data) => banking.put(`/loan/${id}`, data);
export const deleteLoan     = (id)       => banking.delete(`/loan/${id}`);

export const getLoansDelayed = () => delay(1500).then(() => banking.get('/loan?limit=100'));
 
// ── Withdrawals ────────────────────────────────────
export const createWithdrawal = (data)    => banking.post('/withdrawal/', data);
export const getStatement = (account) =>
  banking.get(`/withdrawal/statement/${account}`, {
    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
    params:  { _t: Date.now() }, // fuerza petición nueva
  });
 
// ── Deposits ───────────────────────────────────────────
export const createDeposit     = (data)         => banking.post('/deposits/create', data);
export const getDeposits       = (params = '')  => banking.get(`/deposits/${params ? '?' + params : ''}`);
export const getDepositById    = (id)           => banking.get(`/deposits/${id}`);
export const updateDeposit     = (id, data)     => banking.put(`/deposits/${id}`, data);
export const revertDeposit     = (id)           => banking.patch(`/deposits/${id}/revert`);
// ── Services ───────────────────────────────────────
export const getServices = () => banking.get('/service/');
 
// ── Account Statements ─────────────────────────────
export const getAccountStatements   = ()      => banking.get('/accountStatements');
export const getAccountStatementPdf = (acc)   => banking.get(`/accountStatements/account/${acc}/pdf`, { responseType: 'blob' });