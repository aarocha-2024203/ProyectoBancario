import { useState, useEffect } from 'react';
import { getAccountsByUser } from '../../../../shared/api/banking';
import useAuthStore from '../../../auth/store/authStore';

const useUserAccounts = () => {
  const { user } = useAuthStore();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = () => {
    if (!user?.id) return;
    setLoading(true);
    getAccountsByUser(user.id)
      .then(res => {
        const d = res.data?.data || res.data || [];
        setAccounts(Array.isArray(d) ? d : []);
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user?.id]);

  return { accounts, loading, reload: load };
};

export default useUserAccounts;
