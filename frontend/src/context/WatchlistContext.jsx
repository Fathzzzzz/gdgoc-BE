import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../services/api.js';
import { movieIdOf } from '../lib/utils.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const WatchlistContext = createContext(null);

function normalizeWatchlist(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.watchlist)) return data.watchlist;
  return [];
}

export function WatchlistProvider({ children }) {
  const { isAuthenticated, sessionId } = useAuth();
  const { showToast } = useToast();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mirror sessionId into a ref so async continuations can compare against the
  // *current* session rather than a stale closure value.
  const sessionRef = useRef(sessionId);
  sessionRef.current = sessionId;

  const loadWatchlist = useCallback(async () => {
    if (!isAuthenticated) return;
    const sid = sessionRef.current;
    setLoading(true);
    try {
      const data = await apiFetch('/watchlist');
      if (sid !== sessionRef.current) return; // session changed; discard stale data
      setWatchlist(normalizeWatchlist(data));
    } catch (err) {
      if (sid !== sessionRef.current) return;
      console.error('Failed to load watchlist:', err.message);
      // 401 is handled globally via the unauthorized subscription in AuthContext.
    } finally {
      if (sid === sessionRef.current) setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadWatchlist();
    } else {
      setWatchlist([]);
      setLoading(false);
    }
  }, [isAuthenticated, loadWatchlist]);

  const isInWatchlist = useCallback(
    (movieId) => watchlist.some((item) => String(movieIdOf(item)) === String(movieId)),
    [watchlist],
  );

  const toggleWatchlist = useCallback(async (movieId) => {
    if (!isAuthenticated) {
      showToast('Silakan login terlebih dahulu untuk mengelola Watchlist', 'info');
      return;
    }
    const sid = sessionRef.current;
    const isCurrentlyIn = isInWatchlist(movieId);
    try {
      if (isCurrentlyIn) {
        await apiFetch(`/watchlist/${movieId}`, { method: 'DELETE' });
      } else {
        await apiFetch('/watchlist', { method: 'POST', body: JSON.stringify({ movieId }) });
      }
      if (sid !== sessionRef.current) return;
      showToast(
        isCurrentlyIn ? 'Film dihapus dari watchlist' : 'Berhasil ditambahkan ke watchlist!',
        isCurrentlyIn ? 'info' : 'success',
      );
      // Re-sync with backend truth so the whole UI (Discover buttons, badge)
      // reflects the server's watchlist state.
      await loadWatchlist();
    } catch (err) {
      if (sid !== sessionRef.current) return;
      showToast(err.message, 'error');
    }
  }, [isAuthenticated, isInWatchlist, loadWatchlist, showToast]);

  const value = useMemo(
    () => ({ watchlist, loading, isInWatchlist, toggleWatchlist, loadWatchlist }),
    [watchlist, loading, isInWatchlist, toggleWatchlist, loadWatchlist],
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) throw new Error('useWatchlist must be used within a WatchlistProvider');
  return context;
}