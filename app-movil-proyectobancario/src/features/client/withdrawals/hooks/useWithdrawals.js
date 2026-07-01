// src/features/client/screens/withdrawals/useWithdrawals.js
import { useState, useCallback } from 'react';
import userClient from '../../../../shared/api/userClient.js';

const extract = (r) => {
    const d = r?.data;
    if (!d) return [];
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.withdrawals)) return d.withdrawals;
    for (const k of Object.keys(d)) {
        if (Array.isArray(d[k]) && d[k].length > 0) return d[k];
    }
    return [];
};

export default function useWithdrawals() {
    const [withdrawals, setWithdrawals] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const fetchWithdrawals = useCallback(async (accounts = []) => {
        if (!accounts.length) return;
        try {
            const results = await Promise.allSettled(
                accounts.map(a => userClient.get(`/withdrawal/statement/${a.accountNumber}`, {
                    headers: { 'Cache-Control': 'no-cache' },
                    params: { _t: Date.now() },
                }))
            );
            const all = results
                .filter(r => r.status === 'fulfilled')
                .flatMap(r => extract(r.value));
            setWithdrawals(all);
        } catch { }
    }, []);

    const createWithdrawal = useCallback(async (data) => {
        setSubmitting(true); setError(null);
        try {
            const r = await userClient.post('/withdrawal/', data);
            return { success: true, data: r?.data };
        } catch (e) {
            const msg = e?.response?.data?.message ?? e?.message ?? 'Error al retirar';
            setError(msg);
            return { success: false, error: msg };
        } finally {
            setSubmitting(false);
        }
    }, []);

    return {
        withdrawals, setWithdrawals, submitting, error,
        fetchWithdrawals, createWithdrawal
    };
}

