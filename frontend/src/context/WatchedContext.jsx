import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const WatchedContext = createContext(null);

function normalizeWatched(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.watched)) return data.watched;
  return [];
}

export function WatchedProvider({ children }) {
  const { isAuthenticated, sessionId } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const sessionRef = useRef(sessionId);
  sessionRef.current = sessionId;

  const loadWatched = useCallback(async () => {
    if (!isAuthenticated) return;
    const sid = sessionRef.current;
    setLoading(true);
    try {
      const data = await apiFetch('/watched');
      if (sid !== sessionRef.current) return;
      setEntries(normalizeWatched(data));
    } catch (err) {
      if (sid !== sessionRef.current) return;
      console.error('Failed to load watched list:', err.message);
    } finally {
      if (sid === sessionRef.current) setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadWatched();
    } else {
      setEntries([]);
      setLoading(false);
    }
  }, [isAuthenticated, loadWatched]);

  const logReview = useCallback(async (movieId, rating, review) => {
    const sid = sessionRef.current;
    await apiFetch('/watched', {
      method: 'POST',
      body: JSON.stringify({ movieId, rating, review }),
    });
    if (sid !== sessionRef.current) return;
    await loadWatched();
  }, [loadWatched]);

  const value = useMemo(
    () => ({ entries, loading, loadWatched, logReview }),
    [entries, loading, loadWatched, logReview],
  );

  return <WatchedContext.Provider value={value}>{children}</WatchedContext.Provider>;
}

export function useWatched() {
  const context = useContext(WatchedContext);
  if (!context) throw new Error('useWatched must be used within a WatchedProvider');
  return context;
}