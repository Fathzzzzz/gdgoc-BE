import { useMemo, useState } from 'react';
import { Shuffle, Search } from 'lucide-react';
import { useMovies } from '../context/MoviesContext.jsx';
import { useWatchlist } from '../context/WatchlistContext.jsx';
import GenreFilters from '../components/GenreFilters.jsx';
import MovieGrid from '../components/MovieGrid.jsx';

export default function DiscoverPage({ onOpenDetail, onOpenReview }) {
  const { movies, loading, isFallback, shuffleMovies } = useMovies();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');

  const genres = useMemo(() => {
    const set = new Set();
    movies.forEach((m) => (Array.isArray(m.genres) ? m.genres : []).forEach((g) => set.add(g)));
    return ['ALL', ...Array.from(set)];
  }, [movies]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return movies.filter((movie) => {
      const matchSearch =
        !q ||
        String(movie.title || '').toLowerCase().includes(q) ||
        String(movie.director || '').toLowerCase().includes(q);
      const movieGenres = Array.isArray(movie.genres)
        ? movie.genres.map((g) => String(g).trim())
        : movie.genres
          ? [String(movie.genres).trim()]
          : [];
      const matchGenre = selectedGenre === 'ALL' || movieGenres.includes(selectedGenre);
      return matchSearch && matchGenre;
    });
  }, [movies, searchQuery, selectedGenre]);

  return (
    <section className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brand-surface via-brand-surface to-brand-card p-6 rounded-2xl border border-brand-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Explore Films</h1>
          <p className="text-sm text-brand-muted mt-1">Discover, track, and share your personal movie journey.</p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={shuffleMovies}
            className="px-4 py-2 rounded-xl bg-brand-green text-black font-semibold text-sm hover:brightness-110 active:scale-95 transition flex items-center gap-2 shadow-lg shadow-brand-green/20"
          >
            <Shuffle className="w-4 h-4" /> Shuffle Movies
          </button>
          <div className="relative">
            <Search className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter title or director..."
              aria-label="Filter title or director"
              className="bg-brand-dark border border-brand-border rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-green w-48 sm:w-64 transition"
            />
          </div>
        </div>
      </div>

      <GenreFilters genres={genres} selected={selectedGenre} onSelect={setSelectedGenre} />

      {isFallback && (
        <div
          role="status"
          className="flex items-start gap-3 p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-300 text-sm"
        >
          <span aria-hidden="true">⚠️</span>
          <p>
            Backend belum aktif — menampilkan <strong>data lokal (fallback)</strong>. Pastikan server backend
            berjalan dan kembali tekan <em>Shuffle</em> atau muat ulang halaman.
          </p>
        </div>
      )}

      <MovieGrid
        movies={filtered}
        loading={loading}
        inWatchlist={isInWatchlist}
        onToggleWatchlist={toggleWatchlist}
        onOpenDetail={onOpenDetail}
        onOpenReview={onOpenReview}
      />
    </section>
  );
}