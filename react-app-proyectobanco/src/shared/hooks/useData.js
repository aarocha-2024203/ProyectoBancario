import { useState, useEffect, useCallback, useRef } from 'react';

// Caché simple en memoria para evitar peticiones duplicadas
const cache = new Map();
const CACHE_TTL = 30000; // 30 segundos

const getCacheKey = (fn) => fn.toString().slice(0, 100);

export const useData = (fetchFn, deps = []) => {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const mountedRef            = useRef(true);
  const loadingRef            = useRef(false);

  const normalize = (d) => {
    if (!d) return [];
    const items =
      d?.data         ?? d?.items        ?? d?.coins    ??
      d?.accounts     ?? d?.cards        ?? d?.loans    ??
      d?.transactions ?? d?.accountLocks ?? d?.services ??
      (Array.isArray(d) ? d : []);
    return Array.isArray(items) ? items : [];
  };

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    // Revisa caché
    const key = getCacheKey(fetchFn);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      if (mountedRef.current) {
        setData(cached.data);
        setLoading(false);
      }
      loadingRef.current = false;
      return;
    }

    try {
      const res = await fetchFn();
      if (!mountedRef.current) return;
      const items = normalize(res?.data);
      cache.set(key, { data: items, ts: Date.now() });
      setData(items);
    } catch (e) {
      if (!mountedRef.current) return;
      const status = e?.response?.status;
      if (status === 429) {
        setError('Demasiadas peticiones. Espera unos segundos y recarga.');
      } else if (status === 0 || e?.code === 'ERR_NETWORK') {
        setError('Servicio no disponible. Verifica que el servidor esté corriendo.');
      } else {
        setError(e?.response?.data?.message || 'Error al cargar datos');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
      loadingRef.current = false;
    }
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  const reload = useCallback(() => {
    // Invalida caché al recargar manualmente
    const key = getCacheKey(fetchFn);
    cache.delete(key);
    load();
  }, [fetchFn, load]);

  return { data, loading, error, reload, setData };
};

// Limpia toda la caché (útil al hacer logout)
export const clearDataCache = () => cache.clear();