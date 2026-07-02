// src/features/client/screens/cards/useCards.js
import { useState, useCallback } from 'react';
import userClient from '../../../../shared/api/userClient.js';

const extract = (r) => {
  const d = r?.data;
  if (!d) return [];
  if (Array.isArray(d?.data))  return d.data;
  if (Array.isArray(d))        return d;
  if (Array.isArray(d?.cards)) return d.cards;
  for (const k of Object.keys(d)) {
    if (Array.isArray(d[k]) && d[k].length > 0) return d[k];
  }
  return [];
};

export default function useCards() {
  const [cards,   setCards]   = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const r = await userClient.get('/cards/').catch(
        () => userClient.get('/cards/my')
      );
      setCards(extract(r));
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  return { cards, setCards, loading, fetchCards };
}
