import axios from 'axios';

const banking = axios.create({
  baseURL: import.meta.env.VITE_BANKING_URL || 'http://localhost:3006/api/v1',
  timeout: 10000,
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
    if (error.response?.status === 401) {
      localStorage.removeItem('bancario-auth');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default banking;

// ── Coins ──────────────────────────────────────────
export const getCoins       = ()         => banking.get('/coins/');
export const createCoin     = (data)     => banking.post('/coins/create', data);
export const updateCoin     = (id, data) => banking.put(`/coins/${id}`, data);
export const deleteCoin     = (id)       => banking.delete(`/coins/${id}`);
export const toggleCoinStatus = (id, status) => banking.patch(`/coins/${id}/status`, { status });

// ── Accounts ───────────────────────────────────────
export const getAccounts    = ()         => banking.get('/accounts/');
export const getAccount     = (id)       => banking.get(`/accounts/${id}`);
export const createAccount  = (data)     => banking.post('/accounts/create', data);
export const updateAccount  = (id, data) => banking.put(`/accounts/${id}`, data);
export const deleteAccount  = (id)       => banking.delete(`/accounts/${id}`);

// ── Cards ──────────────────────────────────────────
export const getCards       = ()         => banking.get('/cards/');
export const getCard        = (id)       => banking.get(`/cards/${id}`);
export const createCard     = (data)     => banking.post('/cards/create', data);
export const updateCard     = (id, data) => banking.put(`/cards/${id}`, data);
export const deleteCard     = (id)       => banking.delete(`/cards/${id}`);
export const toggleCardStatus = (id, status) => banking.patch(`/cards/${id}/status`, { status });

// ── Transactions ───────────────────────────────────
export const getTransactions = ()         => banking.get('/transaction/');
export const getTransaction  = (id)       => banking.get(`/transaction/${id}`);
export const createTransaction = (data)   => banking.post('/transaction/create', data);
export const deleteTransaction = (id)     => banking.delete(`/transaction/${id}`);

// ── Loans ──────────────────────────────────────────
export const getLoans       = ()         => banking.get('/loan');
export const getLoan        = (id)       => banking.get(`/loan/${id}`);
export const createLoan     = (data)     => banking.post('/loan/create', data);
export const updateLoan     = (id, data) => banking.put(`/loan/${id}`, data);
export const deleteLoan     = (id)       => banking.delete(`/loan/${id}`);

// ── Account Locks ──────────────────────────────────
export const getAccountLocks  = ()         => banking.get('/accountLocks/');
export const createAccountLock = (data)    => banking.post('/accountLocks/create', data);
export const deleteAccountLock = (id)      => banking.delete(`/accountLocks/${id}`);

// ── Withdrawals ────────────────────────────────────
export const createWithdrawal  = (data)    => banking.post('/withdrawal/', data);
export const getStatement      = (account) => banking.get(`/withdrawal/statement/${account}`);

// ── Deposits ───────────────────────────────────────
export const createDeposit  = (data)     => banking.post('/deposits/create', data);

// ── Services ───────────────────────────────────────
export const getServices    = ()         => banking.get('/service/');

// ── Account Statements ─────────────────────────────
export const getAccountStatements = ()       => banking.get('/accountStatements');
export const getAccountStatementPdf = (acc)  => banking.get(`/accountStatements/account/${acc}/pdf`, { responseType: 'blob' });