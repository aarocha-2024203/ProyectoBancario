// src/features/client/hooks/useClient.js
// Orquestador principal — usa los hooks de entidad internamente
// Mantiene la misma API para que ClientDashboard no cambie
import { useState, useCallback } from 'react';
import userClient from '../../../shared/api/userClient.js';
import { depositsAPI, loansAPI } from '../../../shared/api/bankingClient.js';
import { useAuthStore } from '../../../shared/store/authStore.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hook de cuentas
import useAccounts     from '../accounts/hooks/useAccounts.js';
// Hook de tarjetas
import useCards        from '../cards/hooks/useCards.js';
// Hook de préstamos
import useLoans        from '../loans/hooks/useLoans.js';
// Hook de transacciones
import useTransactions from '../transactions/hooks/useTransactions.js';
// Hook de depósitos
import useDeposits     from '../deposits/hooks/useDeposits.js';
// Hook de retiros
import useWithdrawals  from '../withdrawals/hooks/useWithdrawals.js';

// ─── Parser universal ─────────────────────────────────────────────────────────
const extract = (response) => {
  if (!response) return [];
  const d = response?.data;
  if (!d) return [];
  if (Array.isArray(d?.data))           return d.data;
  if (Array.isArray(d))                 return d;
  if (Array.isArray(d?.accounts))       return d.accounts;
  if (Array.isArray(d?.cards))          return d.cards;
  if (Array.isArray(d?.loans))          return d.loans;
  if (Array.isArray(d?.transactions))   return d.transactions;
  if (Array.isArray(d?.deposits))       return d.deposits;
  if (Array.isArray(d?.data?.data))     return d.data.data;
  for (const k of Object.keys(d)) {
    if (Array.isArray(d[k]) && d[k].length > 0) return d[k];
  }
  return [];
};

export default function useClient() {
  // ── Hooks de entidad ─────────────────────────────────────────────────────────
  const { accounts, setAccounts, fetchAccounts }         = useAccounts();
  const { cards,    setCards,    fetchCards }             = useCards();
  const { loans,    setLoans,    fetchLoans, updateLoan } = useLoans();
  const { transactions, setTransactions, fetchTransactions,
          createTransaction, deleteTransaction }          = useTransactions();
  const { deposits, setDeposits, fetchDeposits,
          createDeposit }                                 = useDeposits();
  const { withdrawals, setWithdrawals, fetchWithdrawals,
          createWithdrawal }                              = useWithdrawals();

  // ── Estado compartido ─────────────────────────────────────────────────────────
  const [statements, setStatements] = useState([]);
  const [coins,      setCoins]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);
  const [success,    setSuccess]    = useState(null);

  const clearMsg = () => { setError(null); setSuccess(null); };

  // ── fetchAll: carga todo en paralelo usando los hooks de entidad ──────────────
  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);

    const token  = useAuthStore.getState().token;
    const user   = useAuthStore.getState().user;
    const userId = user?.id ?? user?._id ?? user?.userId ?? '';

    if (!token) { setLoading(false); return; }

    const safe = async (...fns) => {
      for (const fn of fns) {
        try { const r = await fn(); if (r) return r; } catch(e) {
          if (e?.response?.status && e.response.status < 400) return null;
        }
      }
      return null;
    };

    try {
      const [accsR, cardsR, loansR, txR, stR, coinsR, depR] =
        await Promise.allSettled([
          safe(
            () => userClient.get('/accounts/'),
            () => userClient.get(`/accounts/user/${userId}`)
          ),
          safe(
            () => userClient.get('/cards/'),
            () => userClient.get('/cards/my')
          ),
          safe(
            () => userClient.get('/loan?limit=100'),
            () => userClient.get(`/loan?userId=${userId}&limit=100`),
            () => userClient.get('/loan'),
          ),
          safe(
            () => userClient.get('/transaction/?limit=200'),
            () => userClient.get('/transaction/')
          ),
          safe(() => userClient.get('/accountStatements')),
          userClient.get('/coins/'),
          safe(() => depositsAPI.list()),
        ]);

      // ── Cuentas con detección de bloqueos ────────────────────────────────────
      const rawAccs = accsR.status === 'fulfilled' ? extract(accsR.value) : [];
      const lockedNums = new Set();
      try {
        const stored = await AsyncStorage.getItem('pb_locked_accounts');
        if (stored) {
          Object.entries(JSON.parse(stored)).forEach(([num, locked]) => {
            if (locked) lockedNums.add(num);
          });
        }
      } catch {}
      const accs = rawAccs.map(a => ({
        ...a,
        _displayStatus: lockedNums.has(a.accountNumber) ? 'bloqueada' : (a.status ?? 'activa'),
      }));
      setAccounts(accs);

      // ── Tarjetas ─────────────────────────────────────────────────────────────
      setCards(cardsR.status === 'fulfilled' ? extract(cardsR.value) : []);

      // ── Préstamos con AsyncStorage fallback ───────────────────────────────────
      let loansData = loansR.status === 'fulfilled' ? extract(loansR.value) : [];
      if (loansData.length === 0) {
        try {
          const stored = await AsyncStorage.getItem('pb_loans');
          if (stored) {
            const all = JSON.parse(stored);
            const accNums = rawAccs.map(a => a.accountNumber);
            loansData = all.filter(l => accNums.includes(l.accountNumber) || l.userId === userId);
          }
        } catch {}
      } else {
        try {
          const stored = await AsyncStorage.getItem('pb_loans');
          const all = stored ? JSON.parse(stored) : [];
          loansData.forEach(l => {
            const idx = all.findIndex(s => (s._id??s.id) === (l._id??l.id));
            if (idx >= 0) all[idx] = {...all[idx], ...l};
            else all.push(l);
          });
          await AsyncStorage.setItem('pb_loans', JSON.stringify(all));
        } catch {}
      }
      setLoans(loansData);

      // ── Resto ─────────────────────────────────────────────────────────────────
      setTransactions(txR.status === 'fulfilled' ? extract(txR.value) : []);
      setStatements(stR.status === 'fulfilled'   ? extract(stR.value) : []);
      setCoins(coinsR.status === 'fulfilled'     ? extract(coinsR.value) : []);
      setDeposits(depR.status === 'fulfilled'    ? extract(depR.value)  : []);

    } catch (e) {
      console.error('[useClient] fetchAll error:', e);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // ── Datos ────────────────────────────────────────────────────────────────
    accounts, cards, loans, transactions, statements,
    deposits, withdrawals, coins,
    // ── Estado ───────────────────────────────────────────────────────────────
    loading, submitting, error, success,
    // ── Acciones globales ─────────────────────────────────────────────────────
    clearMsg, fetchAll, fetchWithdrawals,
    // ── Acciones de entidad ───────────────────────────────────────────────────
    createTransaction, deleteTransaction,
    createDeposit,
    updateLoan,
    createWithdrawal,
  };
}
