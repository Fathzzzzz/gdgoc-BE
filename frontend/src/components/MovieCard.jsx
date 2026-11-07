import { Bookmark, BookmarkCheck, Star } from 'lucide-react';
import PosterImage from './PosterImage.jsx';

/**
 * Poster card used across Discover and Watchlist. Actions are real buttons
 * with aria-labels so they remain reachable by keyboard and on touch devices.
 */
export default function MovieCard({ movie, inWatchlist, onToggleWatchlist, onOpenDetail, onOpenReview }) {
  return (
    <div className="group relative bg-brand-card rounded-xl overflow-hidden border border-brand-border/70 hover:border-brand-green/60 transition-all duration-300 hover:shadow-xl hover:shadow-brand-green/10 flex flex-col">
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-brand-dark">
        <button
          type="button"
          onClick={() => onOpenDetail(movie.id)}
          aria-label={`Open details for ${movie.title}`}
          className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer"
        >
          <PosterImage
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </button>

        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur text-xs font-bold text-amber-400 flex items-center gap-1 border border-white/10 pointer-events-none">
          ★ <span>{movie.rating ?? 'N/A'}</span>
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
        <div>
          <button
            type="button"
            onClick={() => onOpenDetail(movie.id)}
            className="w-full text-left font-bold text-sm text-white line-clamp-1 group-hover:text-brand-green transition cursor-pointer"
          >
            {movie.title}
          </button>
          <p className="text-xs text-brand-muted mt-0.5">
            {movie.year} • {movie.director || 'Unknown'}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-brand-border pt-2 mt-1">
          <button
            type="button"
            onClick={() => onToggleWatchlist(movie.id)}
            aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            aria-pressed={inWatchlist}
            title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            className={`p-1.5 rounded-lg transition flex items-center gap-1.5 text-xs font-semibold ${
              inWatchlist
                ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/20'
                : 'text-brand-muted hover:text-brand-green hover:bg-brand-green/10'
            }`}
          >
            {inWatchlist ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            <span className="hidden sm:inline">{inWatchlist ? 'Saved' : 'Add'}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenReview(movie.id)}
            aria-label="Mark watched"
            title="Mark watched"
            className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Watched</span>
          </button>
        </div>
      </div>
    </div>
  );
}