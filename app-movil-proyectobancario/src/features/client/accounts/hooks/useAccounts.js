// src/features/client/screens/accounts/useAccounts.js
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userClient from '../../../../shared/api/userClient.js';
import { useAuthStore } from '../../../../shared/store/authStore.js';

const extract = (r) => {
  const d = r?.data;
  if (!d) return [];
  if (Array.isArray(d?.data))     return d.data;
  if (Array.isArray(d))           return d;
  if (Array.isArray(d?.accounts)) return d.accounts;
  for (const k of Object.keys(d)) {
    if (Array.isArray(d[k]) && d[k].length > 0) return d[k];
  }
  return [];
};

export default function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const userId = useAuthStore.getState().user?.id
      ?? useAuthStore.getState().user?._id ?? '';
    try {
      const r = await userClient.get('/accounts/').catch(
        () => userClient.get(`/accounts/user/${userId}`)
      );
      const rawAccs = extract(r);

      // Detectar bloqueos desde AsyncStorage
      const lockedNums = new Set();
      try {
        const stored = await AsyncStorage.getItem('pb_locked_accounts');
        if (stored) {
          Object.entries(JSON.parse(stored)).forEach(([num, locked]) => {
            if (locked) lockedNums.add(num);
          });
        }
      } catch {}

      setAccounts(rawAccs.map(a => ({
        ...a,
        _displayStatus: lockedNums.has(a.accountNumber) ? 'bloqueada' : (a.status ?? 'activa'),
      })));
    } catch (e) {
      setError('Error al cargar cuentas');
    } finally {
      setLoading(false);
    }
  }, []);

  return { accounts, setAccounts, loading, error, fetchAccounts };
}
