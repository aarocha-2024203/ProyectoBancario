import { useState, useEffect } from 'react';
import { getAccountsByUser } from '../../../../shared/api/banking';
import useAuthStore from '../../../auth/store/authStore';

const useUserWithdrawals = () => {
  const { user } = useAuthStore();
  const [myAccounts, setMyAccounts] = useState([]);

  const load = () => {
    if (!user?.id) return;
    getAccountsByUser(user.id)
      .then(res => {
        const d = res.data?.data || res.data || [];
        setMyAccounts(Array.isArray(d) ? d.filter(a => a.status === 'activa') : []);
      })
      .catch(() => setMyAccounts([]));
  };

  useEffect(() => { load(); }, [user?.id]);

  return { myAccounts, reload: load };
};

export default useUserWithdrawals;
