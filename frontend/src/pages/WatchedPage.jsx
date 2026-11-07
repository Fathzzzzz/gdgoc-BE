import { Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useWatched } from '../context/WatchedContext.jsx';
import PosterImage from '../components/PosterImage.jsx';
import LoginPrompt from '../components/LoginPrompt.jsx';

function ratingStars(rating) {
  const value = Math.max(0, Math.min(5, Math.round(rating || 0)));
  return '★'.repeat(value) + '☆'.repeat(5 - value);
}

export default function WatchedPage({ onOpenDetail, onOpenAuth, onSwitchTab }) {
  const { isAuthenticated } = useAuth();
  const { entries, loading } = useWatched();

  if (!isAuthenticated) {
    return <LoginPrompt onOpenAuth={onOpenAuth} kind="watched" />;
  }

  return (
    <section className="space-y-6">
      <div className="border-b border-brand-border pb-4">
        <h2 className="text-2xl font-bold text-white">Watched Movies & Journal</h2>
        <p className="text-sm text-brand-muted">Your logged movie viewing history, ratings, and thoughts.</p>
      </div>

      {loading && entries.length === 0 ? (
        <div className="py-16 text-center text-brand-muted">
          <div className="animate-spin w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full mx-auto mb-3" />
          <p>Memuat riwayat...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 bg-brand-surface/40 rounded-2xl border border-dashed border-brand-border">
          <Star className="w-12 h-12 mx-auto text-brand-muted mb-3 opacity-40" />
          <h3 className="text-lg font-semibold text-white">No watched logs yet</h3>
          <p className="text-sm text-brand-muted max-w-sm mx-auto mt-1 mb-4">
            Mark movies as watched and record your personal reviews to see them here.
          </p>
          <button
            type="button"
            onClick={() => onSwitchTab('discover')}
            className="px-4 py-2 bg-brand-card hover:bg-brand-surface border border-brand-border rounded-xl text-sm font-medium text-white transition"
          >
            Discover Movies to Log
          </button>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {entries.map((entry) => {
            const movie = entry.movie || {};
            const dateStr = entry.created_at
              ? new Date(entry.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })
              : 'Baru saja';
            return (
              <div
                key={entry.id}
                className="bg-brand-surface p-4 sm:p-5 rounded-2xl border border-brand-border flex gap-4 sm:gap-6 items-start"
              >
                <PosterImage
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-16 sm:w-20 aspect-[2/3] object-cover rounded-lg shrink-0 border border-brand-border shadow-md"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(entry.movie_id)}
                      className="text-left font-bold text-base text-white hover:text-brand-green transition"
                    >
                      {movie.title}{' '}
                      <span className="text-xs text-brand-muted font-normal">({movie.year || ''})</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold text-sm tracking-wider">
                        {ratingStars(entry.rating)}
                      </span>
                      <span className="text-[11px] text-brand-muted">{dateStr}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed bg-brand-dark/40 p-3 rounded-xl border border-brand-border/40 font-normal">
                    {entry.review || 'Tidak ada catatan ulasan.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}