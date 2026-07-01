// src/features/client/screens/loans/useLoans.js
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userClient from '../../../../shared/api/userClient.js';
import { loansAPI } from '../../../../shared/api/bankingClient.js';
import { useAuthStore } from '../../../../shared/store/authStore.js';

const extract = (r) => {
  const d = r?.data;
  if (!d) return [];
  if (Array.isArray(d?.data))  return d.data;
  if (Array.isArray(d))        return d;
  if (Array.isArray(d?.loans)) return d.loans;
  for (const k of Object.keys(d)) {
    if (Array.isArray(d[k]) && d[k].length > 0) return d[k];
  }
  return [];
};

export default function useLoans() {
  const [loans,      setLoans]      = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);

  const fetchLoans = useCallback(async (accounts = []) => {
    const userId = useAuthStore.getState().user?.id
      ?? useAuthStore.getState().user?._id ?? '';
    let data = [];
    // 1. Intentar backend
    try {
      const r = await userClient.get('/loan?limit=100').catch(
        () => userClient.get(`/loan?userId=${userId}&limit=100`).catch(
          () => userClient.get('/loan')
        )
      );
      data = extract(r);
    } catch {}
    // 2. Si backend vacío → AsyncStorage
    if (data.length === 0) {
      try {
        const stored = await AsyncStorage.getItem('pb_loans');
        if (stored) {
          const all = JSON.parse(stored);
          const accNums = accounts.map(a => a.accountNumber);
          data = all.filter(l => accNums.includes(l.accountNumber) || l.userId === userId);
        }
      } catch {}
    } else {
      // Sincronizar backend → AsyncStorage
      try {
        const stored = await AsyncStorage.getItem('pb_loans');
        const all = stored ? JSON.parse(stored) : [];
        data.forEach(l => {
          const idx = all.findIndex(s => (s._id??s.id)===(l._id??l.id));
          if (idx >= 0) all[idx] = {...all[idx],...l};
          else all.push(l);
        });
        await AsyncStorage.setItem('pb_loans', JSON.stringify(all));
      } catch {}
    }
    setLoans(data);
  }, []);

  const updateLoan = useCallback(async (id, data) => {
    setSubmitting(true); setError(null);
    try {
      const r = await loansAPI.update(id, data);
      // Sync AsyncStorage
      try {
        const stored = await AsyncStorage.getItem('pb_loans');
        if (stored) {
          const all = JSON.parse(stored);
          const idx = all.findIndex(l => (l._id??l.id) === id);
          if (idx >= 0) all[idx] = {...all[idx], ...data};
          await AsyncStorage.setItem('pb_loans', JSON.stringify(all));
        }
      } catch {}
      return { success: true, data: r?.data };
    } catch (e) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Error al actualizar';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { loans, setLoans, submitting, error, fetchLoans, updateLoan };
}
