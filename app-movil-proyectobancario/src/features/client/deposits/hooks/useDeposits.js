// src/features/client/screens/deposits/useDeposits.js
import { useState, useCallback } from 'react';
import { depositsAPI } from '../../../../shared/api/bankingClient.js';

const extract = (r) => {
  const d = r?.data;
  if (!d) return [];
  if (Array.isArray(d?.data))     return d.data;
  if (Array.isArray(d))           return d;
  if (Array.isArray(d?.deposits)) return d.deposits;
  for (const k of Object.keys(d)) {
    if (Array.isArray(d[k]) && d[k].length > 0) return d[k];
  }
  return [];
};

export default function useDeposits() {
  const [deposits,   setDeposits]   = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);

  const fetchDeposits = useCallback(async () => {
    try {
      const r = await depositsAPI.list();
      setDeposits(extract(r));
    } catch {}
  }, []);

  const createDeposit = useCallback(async (data) => {
    setSubmitting(true); setError(null);
    try {
      const r = await depositsAPI.create(data);
      await fetchDeposits();
      return { success: true, data: r?.data };
    } catch (e) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Error al depositar';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  }, [fetchDeposits]);

  return { deposits, setDeposits, submitting, error, fetchDeposits, createDeposit };
}
