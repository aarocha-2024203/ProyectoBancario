import { useState, useEffect } from 'react';
import { getAccountsByUser } from '../../../../shared/api/banking';
import useAuthStore from '../../../auth/store/authStore';

const useUserLoans = () => {
  const { user } = useAuthStore();
  const [data, setData]               = useState([]);
  const [myAccounts, setMyAccounts]   = useState([]);
  const [loading, setLoading]         = useState(true);

  const load = () => {
    setLoading(true);
    const token = JSON.parse(localStorage.getItem('bancario-auth'))?.state?.token;
    fetch(`http://localhost:3006/api/v1/loan/my?_t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setData(Array.isArray(d?.data) ? d.data : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));

    if (user?.id) {
      getAccountsByUser(user.id)
        .then(res => {
          const d = res.data?.data || res.data || [];
          setMyAccounts(Array.isArray(d) ? d.filter(a => a.status === 'activa') : []);
        })
        .catch(() => setMyAccounts([]));
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  return { data, myAccounts, loading, reload: load };
};

export default useUserLoans;
