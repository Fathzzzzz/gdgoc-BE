import { useState } from 'react';
import { Sparkles, Bot, Bookmark, BookmarkCheck } from 'lucide-react';
import { apiFetch } from '../services/api.js';
import { useMovies } from '../context/MoviesContext.jsx';
import { useWatchlist } from '../context/WatchlistContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import PosterImage from '../components/PosterImage.jsx';

const PROMPT_IDEAS = [
  'Film thriller kriminal dengan atmosfer gelap dan plot twist',
  'Animasi keluarga yang penuh petualangan dan visual memukau',
  'Film tentang ambisi, musik, dan obsesi psikologis yang intens',
];

export default function AiRecommendPage({ onOpenDetail }) {
  const { getMovie } = useMovies();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { showToast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      showToast('Tuliskan deskripsi atau suasana film yang ingin kamu cari', 'warning');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      const data = await apiFetch('/movies/recommend', {
        method: 'POST',
        body: JSON.stringify({ prompt: trimmed }),
      });
      const movieId = data.movie_id ?? data.movieId ?? (data.movie && data.movie.id);
      const matchedMovie = (data.movie && data.movie.id ? data.movie : getMovie(movieId)) || {
        id: movieId || 1,
        title: data.title || 'Recommended Film',
        year: data.year || '',
        rating: data.rating || 'N/A',
        poster_url: data.poster_url || '',
        director: data.director || 'Unknown',
      };
      const reasoning = data.reasoning || data.explanation || data.message
        || 'Film ini dipilih berdasarkan kecocokan tema, plot, dan atmosfer yang Anda minta.';
      setResult({ movie: matchedMovie, reasoning });
      showToast('Rekomendasi film siap! ✨', 'success');
    } catch (err) {
      showToast(`AI Recommendation Error: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 border border-brand-green/30 text-brand-green text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> Rekomendasi AI
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">AI Movie Recommendation</h2>
        <p className="text-brand-muted text-sm max-w-lg mx-auto">
          Describe the vibe, plot ideas, or mood you want. The AI will analyze your query and match the best film
          available directly in your database.
        </p>
      </div>

      <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-xl space-y-4">
        <label htmlFor="ai-prompt-input" className="block text-xs font-semibold text-brand-muted uppercase tracking-wider">
          Your Movie Mood / Description
        </label>
        <textarea
          id="ai-prompt-input"
          rows="3"
          maxLength={1000}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Contoh: 'Saya ingin film sci-fi misteri dengan twist akhir tak terduga yang bikin mikir keras seperti Inception atau Shutter Island'..."
          className="w-full bg-brand-dark border border-brand-border rounded-xl p-4 text-sm text-white placeholder-brand-muted/70 focus:outline-none focus:border-brand-green transition resize-none"
        />

        <div className="space-y-1.5">
          <span className="text-xs text-brand-muted">Try prompt ideas:</span>
          <div className="flex flex-wrap gap-2 text-xs">
            {PROMPT_IDEAS.map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => setPrompt(idea)}
                className="px-2.5 py-1 rounded-lg bg-brand-card border border-brand-border text-brand-muted hover:text-white hover:border-brand-green transition"
              >
                {idea}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-brand-border">
          <span className="text-xs text-brand-muted">
            Endpoint: <code className="text-brand-green">POST /api/movies/recommend</code>
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="px-5 py-2.5 bg-brand-green text-black font-bold text-sm rounded-xl hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-lg shadow-brand-green/20"
          >
            {submitting ? (
              <span className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {submitting ? 'Analyzing...' : 'Ask AI'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-gradient-to-br from-brand-surface via-brand-card to-brand-surface p-6 sm:p-8 rounded-2xl border-2 border-brand-green/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none" aria-hidden="true">
            <Sparkles className="w-32 h-32 text-brand-green" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/20 text-brand-green text-xs font-bold mb-4 border border-brand-green/40">
              ✨ Rekomendasi Terpilih dari Database Anda
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <PosterImage
                src={result.movie.poster_url}
                alt={result.movie.title}
                className="w-36 sm:w-44 aspect-[2/3] object-cover rounded-xl border border-brand-border shadow-xl shrink-0"
              />

              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">★ {result.movie.rating ?? 'N/A'}</span>
                    <span className="text-xs text-brand-muted">• {result.movie.year || ''}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenDetail(result.movie.id)}
                    className="text-2xl font-black text-white hover:text-brand-green transition text-left"
                  >
                    {result.movie.title}
                  </button>
                  <p className="text-xs text-brand-muted">Directed by {result.movie.director || 'Unknown'}</p>
                </div>

                <div className="bg-brand-dark/70 border border-brand-border/60 rounded-xl p-4 space-y-1.5">
                  <span className="text-xs font-bold text-brand-green flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5" /> Alasan Rekomendasi
                  </span>
                  <p className="text-xs text-gray-200 leading-relaxed italic">{result.reasoning}</p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenDetail(result.movie.id)}
                    className="px-4 py-2 bg-brand-surfaceHover border border-brand-border hover:border-brand-green text-xs font-semibold text-white rounded-xl transition"
                  >
                    Lihat Detail Lengkap
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWatchlist(result.movie.id)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                      isInWatchlist(result.movie.id)
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-brand-green text-black hover:brightness-110'
                    }`}
                  >
                    {isInWatchlist(result.movie.id) ? (
                      <BookmarkCheck className="w-3.5 h-3.5" />
                    ) : (
                      <Bookmark className="w-3.5 h-3.5" />
                    )}
                    {isInWatchlist(result.movie.id) ? 'Hapus dari Watchlist' : 'Masukkan ke Watchlist'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}