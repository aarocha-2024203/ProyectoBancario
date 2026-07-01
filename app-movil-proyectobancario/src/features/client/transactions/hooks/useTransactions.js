// src/features/client/screens/transactions/useTransactions.js
import { useState, useCallback } from 'react';
import userClient from '../../../../shared/api/userClient.js';

const extract = (r) => {
  const d = r?.data;
  if (!d) return [];
  if (Array.isArray(d?.data))         return d.data;
  if (Array.isArray(d))               return d;
  if (Array.isArray(d?.transactions)) return d.transactions;
  for (const k of Object.keys(d)) {
    if (Array.isArray(d[k]) && d[k].length > 0) return d[k];
  }
  return [];
};

export default function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState(null);

  const fetchTransactions = useCallback(async () => {
    try {
      const r = await userClient.get('/transaction/?limit=200').catch(
        () => userClient.get('/transaction/')
      );
      setTransactions(extract(r));
    } catch {}
  }, []);

  const createTransaction = useCallback(async (data) => {
    setSubmitting(true); setError(null);
    try {
      const r = await userClient.post('/transaction/create', data);
      await fetchTransactions();
      return { success: true, data: r?.data };
    } catch (e) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Error al transferir';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  }, [fetchTransactions]);

  const deleteTransaction = useCallback(async (id) => {
    setSubmitting(true);
    try {
      await userClient.delete(`/transaction/${id}`);
      await fetchTransactions();
      return { success: true };
    } catch (e) {
      return { success: false };
    } finally {
      setSubmitting(false);
    }
  }, [fetchTransactions]);

  return { transactions, setTransactions, submitting, error,
           fetchTransactions, createTransaction, deleteTransaction };
}
