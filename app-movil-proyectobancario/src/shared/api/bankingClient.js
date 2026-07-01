// src/shared/api/bankingClient.js
// userClient.baseURL = EXPO_PUBLIC_BANKING_URL = http://localhost:3006/api/v1
// Todas las rutas son RELATIVAS a esa base
import userClient from './userClient.js';

// ─── Cuentas ──────────────────────────────────────────────────────────────────
// 3 llamadas paralelas por status (igual que el React Web)
export const accountsAPI = {
  list: () =>
    Promise.all([
      userClient.get('/accounts/?status=activa&limit=100'),
      userClient.get('/accounts/?status=inactiva&limit=100'),
      userClient.get('/accounts/?status=bloqueada&limit=100'),
    ]).then(([a, b, c]) => ({
      data: {
        accounts: [
          ...(a.data?.data || a.data?.accounts || []),
          ...(b.data?.data || b.data?.accounts || []),
          ...(c.data?.data || c.data?.accounts || []),
        ],
      },
    })).catch(() => ({ data: { accounts: [] } })),

  getOne:    (id)        => userClient.get(`/accounts/${id}`),
  create:    (data)      => userClient.post('/accounts/create', data),
  update:    (id, d)     => userClient.put(`/accounts/${id}`, d),
  delete:    (id)        => userClient.delete(`/accounts/${id}`),
  setStatus: async (id, s) => {
    // Intentar con el id tal como viene (puede ser _id o accountNumber)
    try {
      return await userClient.patch(`/accounts/${id}/status`, { status: s });
    } catch (e) {
      // Si falla, puede que el backend necesite el accountNumber en lugar del _id
      // El Postman muestra que acepta ambos formatos
      throw e;
    }
  },
  byUser:    (userId)    => userClient.get(`/accounts/user/${userId}`),
};

// ─── Tarjetas ─────────────────────────────────────────────────────────────────
export const cardsAPI = {
  list:      ()          => userClient.get('/cards/'),
  myCards:   ()          => userClient.get('/cards/my'),
  getOne:    (id)        => userClient.get(`/cards/${id}`),
  create:    (data)      => userClient.post('/cards/create', data),
  update:    (id, d)     => userClient.put(`/cards/${id}`, d),
  delete:    (id)        => userClient.delete(`/cards/${id}`),
  setStatus: (id, s)     => userClient.patch(`/cards/${id}/status`, { status: s }),
};

// ─── Transacciones ────────────────────────────────────────────────────────────
export const transactionsAPI = {
  list:      ()          => userClient.get('/transaction/'),
  getOne:    (id)        => userClient.get(`/transaction/${id}`),
  create:    (data)      => userClient.post('/transaction/create', data),
  update:    (id, d)     => userClient.put(`/transaction/${id}`, d),
  delete:    (id)        => userClient.delete(`/transaction/${id}`),
  favorites: ()          => userClient.get('/transaction/favorites'),
};

// ─── Préstamos ────────────────────────────────────────────────────────────────
// ?limit=100 igual que el React Web
export const loansAPI = {
  list:   ()       => userClient.get('/loan?limit=100'),
  getOne: (id)     => userClient.get(`/loan/${id}`),
  create: (data)   => userClient.post('/loan/create', data),
  update: (id, d)  => userClient.put(`/loan/${id}`, d),
  delete: (id)     => userClient.delete(`/loan/${id}`),
};

// ─── Retiros ──────────────────────────────────────────────────────────────────
export const withdrawalsAPI = {
  create:    (data)   => userClient.post('/withdrawal/', data),
  statement: (number) => userClient.get(`/withdrawal/statement/${number}`, {
    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
    params:  { _t: Date.now() },
  }),
};

// ─── Depósitos ────────────────────────────────────────────────────────────────
export const depositsAPI = {
  create: (data) => userClient.post('/deposits/create', data),
  list:   ()     => userClient.get('/deposits/'),
  getOne: (id)   => userClient.get(`/deposits/${id}`),
  update: (id,d) => userClient.put(`/deposits/${id}`, d),
  revert: (id)   => userClient.patch(`/deposits/${id}/revert`),
};

// ─── Monedas ──────────────────────────────────────────────────────────────────
export const coinsAPI = {
  list:         ()          => userClient.get('/coins/'),
  getOne:       (id)        => userClient.get(`/coins/${id}`),
  create:       (data)      => userClient.post('/coins/create', data),
  update:       (id, d)     => userClient.put(`/coins/${id}`, d),
  delete:       (id)        => userClient.delete(`/coins/${id}`),
  toggleStatus: (id, s)     => userClient.patch(`/coins/${id}/status`, { status: s }),
};

// ─── Estados de cuenta ────────────────────────────────────────────────────────
export const statementsAPI = {
  list: ()       => userClient.get('/accountStatements'),
  pdf:  (number) => userClient.get(
    `/accountStatements/account/${number}/pdf`,
    { responseType: 'blob' }
  ),
};

// ─── Servicios ────────────────────────────────────────────────────────────────
export const servicesAPI = {
  list: () => userClient.get('/service/'),
};

// ─── Cuentas bloqueadas ───────────────────────────────────────────────────────
export const accountLocksAPI = {
  list:   ()       => userClient.get('/accountLocks/'),
  getOne: (id)     => userClient.get(`/accountLocks/${id}`),
  create: (data)   => userClient.post('/accountLocks/create', data),
  update: (id, d)  => userClient.put(`/accountLocks/${id}`, d),
  delete: (id)     => userClient.delete(`/accountLocks/${id}`),
};