export default function LoginPrompt({ onOpenAuth, kind }) {
  return (
    <div className="text-center py-20 bg-brand-surface/40 rounded-2xl border border-dashed border-brand-border">
      <h3 className="text-lg font-semibold text-white">Silakan login terlebih dahulu</h3>
      <p className="text-sm text-brand-muted max-w-sm mx-auto mt-1 mb-4">
        {kind === 'watchlist'
          ? 'Login untuk melihat dan mengelola watchlist Anda.'
          : 'Login untuk melihat riwayat tontonan dan ulasan Anda.'}
      </p>
      <button
        type="button"
        onClick={() => onOpenAuth('login')}
        className="px-4 py-2 bg-brand-card hover:bg-brand-surface border border-brand-border rounded-xl text-sm font-medium text-white transition"
      >
        Login
      </button>
    </div>
  );
}