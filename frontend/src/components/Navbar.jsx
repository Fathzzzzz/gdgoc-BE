import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useWatchlist } from '../context/WatchlistContext.jsx';

const TABS = [
  { id: 'discover', label: 'Discover' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'watched', label: 'Watched & Reviews' },
  { id: 'ai', label: 'AI Recommendations', pulse: true },
];

export default function Navbar({ activeTab, onSwitchTab, onOpenAuth }) {
  const { isAuthenticated, user, logout } = useAuth();
  const { watchlist } = useWatchlist();

  const watchlistCount = watchlist.length;

  return (
    <header className="sticky top-0 z-40 bg-brand-surface/95 backdrop-blur border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <button
            type="button"
            onClick={() => onSwitchTab('discover')}
            className="flex items-center space-x-2 group"
            aria-label="FilmLog home"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-green to-emerald-400 flex items-center justify-center text-black font-black text-xl shadow-lg shadow-brand-green/20 group-hover:scale-105 transition">
              F
            </div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Film<span className="text-brand-green">Log</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-brand-border text-brand-muted">
                GDGoC
              </span>
            </span>
          </button>

          <nav className="hidden md:flex items-center space-x-1" aria-label="Primary">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSwitchTab(tab.id)}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                  activeTab === tab.id ? 'text-white bg-brand-card' : 'text-brand-muted hover:text-white'
                }`}
              >
                {tab.pulse && <span className="inline-block w-2 h-2 rounded-full bg-brand-green animate-pulse" />}
                {tab.label}
                {tab.id === 'watchlist' && watchlistCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-brand-border text-white">
                    {watchlistCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-brand-border flex items-center justify-center font-bold text-xs text-white uppercase border border-brand-border" aria-hidden="true">
                {((user.username || user.email || 'U')[0] || '').toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-white hidden sm:inline">
                {user.username || user.email}
              </span>
              <button
                type="button"
                onClick={logout}
                title="Logout"
                aria-label="Logout"
                className="p-1.5 rounded-lg text-brand-muted hover:text-rose-400 hover:bg-rose-950/20 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-brand-surfaceHover transition"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-green text-black hover:brightness-110 transition"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="md:hidden flex items-center justify-around border-t border-brand-border py-2 px-2 bg-brand-surface text-xs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSwitchTab(tab.id)}
            className={`py-1 px-2 ${activeTab === tab.id ? 'text-white font-medium' : 'text-brand-muted'}`}
          >
            {tab.id === 'discover' ? 'Discover' : tab.id === 'watchlist' ? 'Watchlist' : tab.id === 'watched' ? 'Watched' : 'AI Assistant'}
          </button>
        ))}
      </div>
    </header>
  );
}