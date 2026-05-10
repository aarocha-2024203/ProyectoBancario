import { useState, useEffect, useCallback, useRef } from 'react';

const cache = new Map();
const TTL = 90_000; // 90 segundos

export const clearDataCache = () => cache.clear();

export const useData = (fetchFn, deps = []) => {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const mountedRef            = useRef(true);
  const fetchingRef           = useRef(false);
  const keyRef                = useRef(fetchFn.toString().slice(0, 80));

  const normalize = (d) => {
    if (Array.isArray(d)) return d;
    if (!d || typeof d !== 'object') return [];
    for (const k of ['data','items','coins','accounts','cards','loans',
                      'transactions','accountLocks','services','users']) {
      if (Array.isArray(d[k]) && d[k].length >= 0) return d[k];
    }
    return [];
  };

  const load = useCallback(async (force = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    const key = keyRef.current;
    const hit = cache.get(key);

    // Solo usa caché si tiene datos reales (length > 0) o force=false
    if (!force && hit && Date.now() - hit.ts < TTL && hit.data.length > 0) {
      if (mountedRef.current) { setData(hit.data); setLoading(false); }
      fetchingRef.current = false;
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetchFn();
      if (!mountedRef.current) return;
      const raw   = res?.data;
      const items = normalize(raw);
      // Solo cachea si tiene datos
      if (items.length > 0) {
        cache.set(key, { data: items, ts: Date.now() });
      }
      setData(items);
    } catch (e) {
      if (!mountedRef.current) return;
      if (e?.response?.status === 429) {
        const old = cache.get(key);
        if (old && old.data.length > 0) {
          setData(old.data);
        } else {
          setError('Límite de peticiones. Espera 1 minuto y recarga.');
        }
      } else {
        setError(e?.response?.data?.message || 'Error al cargar');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
      fetchingRef.current = false;
    }
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  const reload = useCallback(() => {
    cache.delete(keyRef.current);
    load(true);
  }, [load]);

  return { data, loading, error, reload, setData };
};