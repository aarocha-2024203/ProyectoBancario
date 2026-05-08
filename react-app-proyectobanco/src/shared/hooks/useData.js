import { useState, useEffect, useCallback } from 'react';

export const useData = (fetchFn, deps = []) => {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      const d = res.data;
      // Normaliza distintas estructuras de respuesta
      const items = d?.data ?? d?.items ?? d?.coins ?? d?.accounts ??
                    d?.cards ?? d?.transactions ?? d?.loans ??
                    d?.accountLocks ?? d?.services ?? d?.statements ??
                    (Array.isArray(d) ? d : []);
      setData(items);
    } catch (e) {
      setError(e?.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load, setData };
};