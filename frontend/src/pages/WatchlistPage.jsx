import { Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useWatchlist } from '../context/WatchlistContext.jsx';
import MovieCard from '../components/MovieCard.jsx';
import LoginPrompt from '../components/LoginPrompt.jsx';

export default function WatchlistPage({ onOpenDetail, onOpenReview, onOpenAuth, onSwitchTab }) {
  const { isAuthenticated } = useAuth();
  const { watchlist, loading, isInWatchlist, toggleWatchlist } = useWatchlist();

  if (!isAuthenticated) {
    return <LoginPrompt onOpenAuth={onOpenAuth} kind="watchlist" />;
  }

  const movies = watchlist.map((entry) => entry.movie).filter(Boolean);

  return (
    <section className="space-y-6">
      <div className="border-b border-brand-border pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">My Watchlist</h2>
          <p className="text-sm text-brand-muted">Films you plan to watch soon.</p>
        </div>
        <span className="text-sm font-medium px-3 py-1 rounded-full bg-brand-surface border border-brand-border text-brand-muted">
          {movies.length} film{movies.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading && movies.length === 0 ? (
        <div className="py-16 text-center text-brand-muted">
          <div className="animate-spin w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full mx-auto mb-3" />
          <p>Memuat watchlist...</p>
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center py-20 bg-brand-surface/40 rounded-2xl border border-dashed border-brand-border">
          <Bookmark className="w-12 h-12 mx-auto text-brand-muted mb-3 opacity-40" />
          <h3 className="text-lg font-semibold text-white">Your watchlist is empty</h3>
          <p className="text-sm text-brand-muted max-w-sm mx-auto mt-1 mb-4">
            Browse movies in the Discover tab and click the bookmark icon to start building your watchlist.
          </p>
          <button
            type="button"
            onClick={() => onSwitchTab('discover')}
            className="px-4 py-2 bg-brand-card hover:bg-brand-surface border border-brand-border rounded-xl text-sm font-medium text-white transition"
          >
            Browse Films
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              inWatchlist={isInWatchlist(movie.id)}
              onToggleWatchlist={toggleWatchlist}
              onOpenDetail={onOpenDetail}
              onOpenReview={onOpenReview}
            />
          ))}
        </div>
      )}
    </section>
  );
}