import MovieCard from './MovieCard.jsx';

function LoadingState() {
  return (
    <div className="py-16 text-center text-brand-muted">
      <div className="animate-spin w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full mx-auto mb-3" />
      <p>Loading movies from your backend...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full py-16 text-center text-brand-muted">
      <p className="text-base font-semibold text-white">Tidak ada film yang cocok</p>
      <p className="text-xs mt-1">Coba ubah kata kunci pencarian atau filter genre.</p>
    </div>
  );
}

export default function MovieGrid({
  movies,
  loading,
  inWatchlist,
  onToggleWatchlist,
  onOpenDetail,
  onOpenReview,
}) {
  if (loading && movies.length === 0) return <LoadingState />;
  if (movies.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          inWatchlist={inWatchlist(movie.id)}
          onToggleWatchlist={onToggleWatchlist}
          onOpenDetail={onOpenDetail}
          onOpenReview={onOpenReview}
        />
      ))}
    </div>
  );
}