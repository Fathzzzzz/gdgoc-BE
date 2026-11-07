import { Check, X, Bookmark, Star } from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey.js';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll.js';
import { asList } from '../lib/utils.js';
import PosterImage from './PosterImage.jsx';

export default function MovieDetailModal({ movie, inWatchlist, onToggleWatchlist, onOpenReview, onClose }) {
  const open = movie != null;
  useEscapeKey(onClose, open);
  useLockBodyScroll(open);

  if (!movie) return null;

  const genres = asList(movie.genres);
  const cast = asList(movie.cast);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Movie details"
      onClick={onClose}
    >
      <div
        className="bg-brand-surface border border-brand-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-brand-dark/80 text-brand-muted hover:text-white flex items-center justify-center border border-brand-border transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-full sm:w-52 shrink-0">
              <PosterImage
                src={movie.poster_url}
                alt={movie.title}
                className="w-full rounded-xl shadow-xl border border-brand-border"
              />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-green/20 text-brand-green border border-brand-green/30">
                    {movie.year}
                  </span>
                  <span className="text-xs text-brand-muted">{movie.duration || ''}</span>
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5 ml-auto">
                    ★ {movie.rating ?? 'N/A'}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">{movie.title}</h2>
                <p className="text-sm text-brand-muted mt-1">
                  Directed by <span className="text-white font-medium">{movie.director || 'Unknown'}</span>
                </p>
              </div>

              {genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {genres.map((genre) => (
                    <span
                      key={genre}
                      className="px-2 py-0.5 rounded-full bg-brand-dark border border-brand-border text-[11px] text-brand-muted"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-1">Synopsis</h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {movie.synopsis || 'No synopsis available.'}
                </p>
              </div>

              {cast.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-1">Cast</h4>
                  <p className="text-xs text-brand-muted">{cast.join(' • ')}</p>
                </div>
              )}

              <div className="pt-4 border-t border-brand-border flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onToggleWatchlist(movie.id)}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    inWatchlist
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-brand-green text-black hover:brightness-110'
                  }`}
                >
                  {inWatchlist ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  <span>{inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenReview(movie.id)}
                  className="py-2.5 px-4 rounded-xl font-bold text-xs bg-brand-surfaceHover hover:bg-amber-400 hover:text-black border border-brand-border text-white flex items-center justify-center gap-2 transition"
                >
                  <Star className="w-4 h-4" />
                  <span>Log Review</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}