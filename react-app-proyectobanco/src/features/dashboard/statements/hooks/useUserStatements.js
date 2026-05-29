import { useState, useEffect } from 'react';
import { getAccountsByUser } from '../../../../shared/api/banking';
import useAuthStore from '../../../auth/store/authStore';

const useUserStatements = () => {
  const { user } = useAuthStore();
  const [myAccounts, setMyAccounts]   = useState([]);
  const [statements, setStatements]   = useState([]);
  const [loadingStmt, setLoadingStmt] = useState(true);

  const token = () => JSON.parse(localStorage.getItem('bancario-auth'))?.state?.token;

  const load = () => {
    if (!user?.id) return;

    getAccountsByUser(user.id)
      .then(res => {
        const d = res.data?.data || res.data || [];
        setMyAccounts(Array.isArray(d) ? d.filter(a => a.status === 'activa') : []);
      })
      .catch(() => setMyAccounts([]));

    setLoadingStmt(true);
    fetch(`http://localhost:3006/api/v1/accountStatements/my?_t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(d => setStatements(Array.isArray(d?.data) ? d.data : []))
      .catch(() => setStatements([]))
      .finally(() => setLoadingStmt(false));
  };

  useEffect(() => { load(); }, [user?.id]);

  return { myAccounts, statements, loadingStmt, reload: load };
};

export default useUserStatements;
