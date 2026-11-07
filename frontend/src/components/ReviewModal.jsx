import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey.js';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll.js';
import { useWatched } from '../context/WatchedContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function ReviewModal({ movie, onClose }) {
  const { logReview } = useWatched();
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const open = movie != null;
  useEscapeKey(() => { if (!submitting) onClose(); }, open);
  useLockBodyScroll(open);

  if (!movie) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await logReview(movie.id, rating, review.trim());
      showToast('Catatan film berhasil disimpan! ⭐', 'success');
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Log review"
      onClick={() => { if (!submitting) onClose(); }}
    >
      <div
        className="bg-brand-surface border border-brand-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => { if (!submitting) onClose(); }}
          aria-label="Close review"
          className="absolute top-4 right-4 text-brand-muted hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-4">
          <div className="border-b border-brand-border pb-3">
            <span className="text-xs font-bold text-brand-green uppercase tracking-wider">Log Review & Thoughts</span>
            <h2 className="text-2xl font-bold text-white mt-1">{movie.title}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="block text-xs font-semibold text-brand-muted uppercase mb-1.5">
                Rating Kamu (1 - 5 Bintang)
              </span>
              <div className="flex items-center gap-2" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    aria-label={`${value} star${value > 1 ? 's' : ''}`}
                    aria-checked={rating === value}
                    role="radio"
                    className={`text-2xl transition ${
                      value <= rating ? 'text-amber-400 scale-110' : 'text-brand-muted hover:text-amber-400'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="review-input" className="block text-xs font-semibold text-brand-muted uppercase mb-1.5">
                Opini & Review Kamu
              </label>
              <textarea
                id="review-input"
                rows="4"
                required
                maxLength={2000}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Tuliskan pendapatmu tentang alur cerita, akting, atau kesan setelah menonton film ini..."
                className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-green resize-none"
              />
            </div>

            <div className="pt-3 border-t border-brand-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-sm text-brand-muted hover:text-white transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-brand-green text-black font-bold text-sm rounded-xl hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {submitting ? 'Menyimpan...' : 'Simpan Catatan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}