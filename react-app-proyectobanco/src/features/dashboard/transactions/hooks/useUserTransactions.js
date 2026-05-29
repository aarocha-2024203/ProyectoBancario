import { useState, useEffect } from 'react';
import { getFavorites } from '../../../../shared/api/banking';
import useAuthStore from '../../../auth/store/authStore';

const useUserTransactions = () => {
  const { user } = useAuthStore();
  const [data, setData]           = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(true);

  const load = () => {
    setLoading(true);
    const token = JSON.parse(localStorage.getItem('bancario-auth'))?.state?.token;
    fetch(`http://localhost:3006/api/v1/transaction/my?_t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setData(Array.isArray(d?.data) ? d.data : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));

    getFavorites()
      .then(res => setFavorites(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(() => setFavorites([]));
  };

  useEffect(() => { load(); }, [user?.id]);

  return { data, favorites, loading, reload: load };
};

export default useUserTransactions;
