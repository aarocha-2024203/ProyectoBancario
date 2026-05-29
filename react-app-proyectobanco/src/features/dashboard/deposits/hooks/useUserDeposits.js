import { useState, useEffect } from 'react';
import { getAccountsByUser, getDeposits } from '../../../../shared/api/banking';
import useAuthStore from '../../../auth/store/authStore';

const useUserDeposits = () => {
  const { user } = useAuthStore();
  const [deposits, setDeposits]       = useState([]);
  const [myAccounts, setMyAccounts]   = useState([]);
  const [loading, setLoading]         = useState(true);

  const load = () => {
    setLoading(true);
    if (user?.id) {
      getAccountsByUser(user.id)
        .then(res => {
          const d = res.data?.data || res.data || [];
          setMyAccounts(Array.isArray(d) ? d : []);
        })
        .catch(() => setMyAccounts([]));
    }
    getDeposits('limit=100&status=exitosa')
      .then(res => {
        const d = res.data?.data || res.data || [];
        setDeposits(Array.isArray(d) ? d : []);
      })
      .catch(() => setDeposits([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user?.id]);

  return { deposits, myAccounts, loading, reload: load };
};

export default useUserDeposits;
