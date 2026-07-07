import { useState, useEffect } from 'react';
import useAuthStore from '../../../auth/store/authStore';
import { getMyCards } from '../../../../shared/api/banking'; // ajusta la ruta según donde esté tu banking.js

const useUserCards = () => {
  const { user } = useAuthStore();
  const [cards, setCards]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getMyCards()
      .then(r => setCards(Array.isArray(r.data?.data) ? r.data.data : []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user?.id]);

  return { cards, loading, reload: load };
};

export default useUserCards;