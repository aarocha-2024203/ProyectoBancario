// src/features/admin/hooks/useAdmin.js
// IMPORTANTE: El backend NO usa PATCH /accounts/:id/status para bloquear.
// El bloqueo se gestiona via POST /accountLocks/create (status:'bloqueado')
// y el desbloqueo via PUT /accountLocks/:id (status:'desbloqueado').
// El campo 'status' del documento 'accounts' siempre es 'activa'.
// Usamos '_displayStatus' para mostrar el estado real en la UI.

import { useState, useCallback } from 'react';
import axios from 'axios';
import userClient from '../../../shared/api/userClient.js';
import authClient from '../../../shared/api/authClient.js';
import { ENDPOINTS } from '../../../shared/constants/endpoints.js';
import { useAuthStore } from '../../../shared/store/authStore.js';
import {
  accountsAPI, cardsAPI, loansAPI, transactionsAPI,
  coinsAPI, depositsAPI, accountLocksAPI, statementsAPI,
} from '../../../shared/api/bankingClient.js';

const p = (d, keys = []) => {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  for (const k of [...keys, 'data', 'items', 'results']) {
    if (Array.isArray(d[k])) return d[k];
    if (Array.isArray(d?.data?.[k])) return d.data[k];
  }
  return [];
};

const AUTH_BASE_URL = ENDPOINTS.USERS.BASE.replace('/users', '');

const createAuthApiClient = () => {
  const client = axios.create({
    baseURL: AUTH_BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });
  client.interceptors.request.use(config => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return client;
};

const authApiClient = createAuthApiClient();

const fetchUsers = async () => {
  const seen = new Set();
  const all  = [];
  const addUsers = (arr) => {
    arr.forEach(u => {
      const uid = String(u.id ?? u._id ?? u.Id ?? u.userId ?? '');
      if (uid && !seen.has(uid)) { seen.add(uid); all.push({ ...u, _uid: uid }); }
    });
  };
  for (const role of ['ADMIN_ROLE', 'USER_ROLE']) {
    try {
      const r = await authApiClient.get(`/users/by-role/${role}`);
      addUsers(p(r.data, ['users', 'data', 'userList']));
      await new Promise(res => setTimeout(res, 150));
    } catch (e) {
      const status = e?.response?.status;
      if (status !== 403 && status !== 404) {
        console.warn('[useAdmin] fetchUsers role', role, status);
      }
    }
  }
  return all;
};

export default function useAdmin() {
  const [data, setData] = useState({
    users: [], accounts: [], cards: [], loans: [],
    transactions: [], coins: [], locks: [], services: [],
    deposits: [], statements: [],
  });
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);
  const [success,    setSuccess]    = useState(null);

  const clearMsg = () => { setError(null); setSuccess(null); };

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [
        users,
        accountsResults,
        cardsRes,
        loansRes,
        txRes,
        coinsRes,
        locksRes,
        servicesRes,
        statementsRes,
        depositsRes,
      ] = await Promise.all([
        fetchUsers(),
        Promise.all([
          userClient.get('/accounts/?status=activa&limit=200'),
          userClient.get('/accounts/?status=inactiva&limit=200'),
          userClient.get('/accounts/?status=bloqueada&limit=200'),
        ]).catch(() => []),
        userClient.get('/cards/').catch(()=>({data:{}})),
        userClient.get('/loan?limit=200').catch(()=>({data:{}})),
        userClient.get('/transaction/').catch(()=>({data:{}})),
        userClient.get('/coins/').catch(()=>({data:{}})),
        userClient.get('/accountLocks/').catch(()=>({data:{}})),
        userClient.get('/service/').catch(()=>({data:{}})),
        userClient.get('/accountStatements').catch(()=>({data:{}})),
        depositsAPI.list().catch(()=>({data:{}})),
      ]);

      const parsedAccounts = Array.isArray(accountsResults)
        ? accountsResults.flatMap(r => p(r?.data, ['accounts','data']))
        : [];

      // El backend no actualiza el campo 'status' de accounts al bloquear.
      // El estado real viene de accountLocks: si hay un registro bloqueado → bloqueada.
      const parsedLocks = p(locksRes.data, ['accountLocks','locks']);
      const lockedSet   = new Set(
        parsedLocks
          .filter(l => l.status === 'bloqueado')
          .map(l => l.accountId ?? l.account)
          .filter(Boolean)
      );

      // Enriquecer cuentas con _displayStatus real
      const enrichedAccounts = parsedAccounts.map(a => ({
        ...a,
        _displayStatus: lockedSet.has(a.accountNumber) ? 'bloqueada' : (a.status ?? 'activa'),
      }));

      setData({
        users,
        accounts:     enrichedAccounts,
        cards:        p(cardsRes.data,      ['cards']),
        loans:        p(loansRes.data,      ['loans']),
        transactions: p(txRes.data,         ['transactions']),
        coins:        p(coinsRes.data,      ['coins']),
        locks:        parsedLocks,
        services:     p(servicesRes.data,   ['services','service']),
        statements:   p(statementsRes.data, ['statements','accountStatements']),
        deposits:     p(depositsRes.data,   ['deposits','data']),
      });
    } catch (e) {
      console.error('[useAdmin] fetchAll error:', e);
      setError('Error al cargar datos del panel');
    } finally {
      setLoading(false);
    }
  }, []);

  const act = useCallback(async (fn, successMsg) => {
    setSubmitting(true); setError(null); setSuccess(null);
    try {
      const r = await fn();
      setSuccess(successMsg);
      await fetchAll();
      return { success: true, data: r?.data };
    } catch (e) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Error al procesar';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  }, [fetchAll]);

  return {
    data, loading, submitting, error, success, clearMsg, fetchAll,

    // ── Usuarios ──────────────────────────────────────────────────────────
    changeRole: (id, role) => act(
      () => authApiClient.put(`/users/change-role/${id}`, { roleName: role }),
      'Rol actualizado'
    ),

    // ── Cuentas ───────────────────────────────────────────────────────────
    createAccount: (d)     => act(() => accountsAPI.create(d),         'Cuenta creada'),
    updateAccount: (id, d) => act(() => accountsAPI.update(id, d),     'Cuenta actualizada'),
    deleteAccount: (id)    => act(() => accountsAPI.delete(id),        'Cuenta eliminada'),
    // PATCH /accounts/:accountNumber/status — el backend requiere accountNumber (ACC-000-0000)
    // NO el _id de MongoDB como pensábamos
    toggleAccount: async (accountNumber, s) => {
      setSubmitting(true); setError(null); setSuccess(null);
      try {
        await userClient.patch(`/accounts/${accountNumber}/status`, { status: s });
        setSuccess(`Cuenta ${s}`);
        await fetchAll();
        return { success: true };
      } catch (e) {
        const serverMsg = e?.response?.data?.message ?? e?.message ?? 'Error';
        setError(serverMsg);
        return { success: false, error: serverMsg };
      } finally { setSubmitting(false); }
    },

    // ── Tarjetas ──────────────────────────────────────────────────────────
    createCard: (d)     => act(() => cardsAPI.create(d),               'Tarjeta emitida'),
    updateCard: (id, d) => act(() => cardsAPI.update(id, d),           'Tarjeta actualizada'),
    deleteCard: (id)    => act(() => cardsAPI.delete(id),              'Tarjeta eliminada'),
    toggleCard: (id, s) => act(() => cardsAPI.setStatus(id, s),        `Tarjeta ${s}`),

    // ── Transacciones ─────────────────────────────────────────────────────
    deleteTx: (id) => act(() => transactionsAPI.delete(id), 'Transacción eliminada'),

    // ── Préstamos ─────────────────────────────────────────────────────────
    createLoan: (d)     => act(() => loansAPI.create(d),               'Préstamo creado'),
    updateLoan: (id, d) => act(() => loansAPI.update(id, d),           'Préstamo actualizado'),
    deleteLoan: (id)    => act(() => loansAPI.delete(id),              'Préstamo eliminado'),

    // ── Monedas ───────────────────────────────────────────────────────────
    createCoin: (d)     => act(() => coinsAPI.create(d),               'Moneda creada'),
    updateCoin: (id, d) => act(() => coinsAPI.update(id, d),           'Moneda actualizada'),
    deleteCoin: (id)    => act(() => coinsAPI.delete(id),              'Moneda eliminada'),
    toggleCoin: (id, s) => act(() => coinsAPI.toggleStatus(id, s),     `Moneda ${s}`),

    // ── Bloqueos ─────────────────────────────────────────────────────────
    // createLock: bloquea una cuenta (POST /accountLocks/create)
    createLock: (d)     => act(() => accountLocksAPI.create(d),        'Bloqueo registrado'),
    updateLock: (id, d) => act(() => accountLocksAPI.update(id, d),    'Bloqueo actualizado'),
    deleteLock: (id)    => act(() => accountLocksAPI.delete(id),       'Bloqueo eliminado'),
    // desbloquear: PUT con status:'desbloqueado'
    unlockAccount: (lockId, data) => act(
      () => accountLocksAPI.update(lockId, { ...data, status: 'desbloqueado' }),
      'Cuenta desbloqueada'
    ),

    // ── Depósitos ─────────────────────────────────────────────────────────
    createDeposit: (d)     => act(() => depositsAPI.create(d),         'Depósito creado'),
    updateDeposit: (id, d) => act(() => depositsAPI.update(id, d),     'Depósito actualizado'),
    revertDeposit: (id)    => act(() => depositsAPI.revert(id),        'Depósito revertido'),

    // ── Retiros ───────────────────────────────────────────────────────────
    createWithdrawal: (d) => act(
      () => userClient.post('/withdrawal/', d),
      'Retiro creado'
    ),

    // ── Estados de cuenta ─────────────────────────────────────────────────
    getStatementPdf: (accountNumber) => statementsAPI.pdf(accountNumber),
  };
}