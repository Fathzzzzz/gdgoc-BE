export default function GenreFilters({ genres, selected, onSelect }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs" role="group" aria-label="Filter by genre">
      {genres.map((genre) => (
        <button
          key={genre}
          type="button"
          onClick={() => onSelect(genre)}
          aria-pressed={selected === genre}
          className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition ${
            selected === genre
              ? 'bg-white text-black'
              : 'bg-brand-surface border border-brand-border text-brand-muted hover:text-white'
          }`}
        >
          {genre === 'ALL' ? 'All Genres' : genre}
        </button>
      ))}
    </div>
  );
}