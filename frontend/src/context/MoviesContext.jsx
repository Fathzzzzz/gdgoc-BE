import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../services/api.js';
import { shuffleArray } from '../lib/utils.js';
import { useToast } from './ToastContext.jsx';
import fallbackMovies from '../data/movies.json';

const MoviesContext = createContext(null);

function normalizeMovies(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.movies)) return data.movies;
  return [];
}

export function MoviesProvider({ children }) {
  const { showToast } = useToast();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFallback, setIsFallback] = useState(false);

  const loadMovies = useCallback(async ({ shuffle = false } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/movies');
      let list = normalizeMovies(data);
      if (shuffle) list = shuffleArray(list);
      setMovies(list);
      setIsFallback(false);
      if (shuffle) showToast('Daftar film berhasil diacak (shuffle)!', 'success');
    } catch (err) {
      console.warn('Backend not reachable, loading fallback local seed:', err.message);
      let list = fallbackMovies.slice();
      if (shuffle) list = shuffleArray(list);
      setMovies(list);
      setIsFallback(true);
      setError(err.message);
      showToast('Backend belum aktif. Menampilkan data lokal (fallback).', 'warning');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadMovies();
  }, [loadMovies]);

  const shuffleMovies = useCallback(() => loadMovies({ shuffle: true }), [loadMovies]);

  const getMovie = useCallback(
    (id) => movies.find((m) => String(m.id) === String(id)) || null,
    [movies],
  );

  return (
    <MoviesContext.Provider value={{ movies, loading, error, isFallback, loadMovies, shuffleMovies, getMovie }}>
      {children}
    </MoviesContext.Provider>
  );
}

export function useMovies() {
  const context = useContext(MoviesContext);
  if (!context) throw new Error('useMovies must be used within a MoviesProvider');
  return context;
}