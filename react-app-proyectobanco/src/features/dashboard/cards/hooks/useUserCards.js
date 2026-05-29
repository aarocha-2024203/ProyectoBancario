import { useState, useEffect } from 'react';
import useAuthStore from '../../../auth/store/authStore';

const useUserCards = () => {
  const { user } = useAuthStore();
  const [cards, setCards]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const token = JSON.parse(localStorage.getItem('bancario-auth'))?.state?.token;
    fetch(`http://localhost:3006/api/v1/cards/my?_t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setCards(Array.isArray(d?.data) ? d.data : []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user?.id]);

  return { cards, loading, reload: load };
};

export default useUserCards;
