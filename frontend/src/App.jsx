import { useCallback, useState } from 'react';
import { ToastProvider } from './context/ToastContext.jsx';
import { ApiProvider } from './context/ApiContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { MoviesProvider, useMovies } from './context/MoviesContext.jsx';
import { WatchlistProvider, useWatchlist } from './context/WatchlistContext.jsx';
import { WatchedProvider } from './context/WatchedContext.jsx';
import { useToast } from './context/ToastContext.jsx';
import Navbar from './components/Navbar.jsx';
import ApiInspector from './components/ApiInspector.jsx';
import Toast from './components/Toast.jsx';
import MovieDetailModal from './components/MovieDetailModal.jsx';
import ReviewModal from './components/ReviewModal.jsx';
import AuthModal from './components/AuthModal.jsx';
import ApiConfigModal from './components/ApiConfigModal.jsx';
import DiscoverPage from './pages/DiscoverPage.jsx';
import WatchlistPage from './pages/WatchlistPage.jsx';
import WatchedPage from './pages/WatchedPage.jsx';
import AiRecommendPage from './pages/AiRecommendPage.jsx';

function FilmLogApp() {
  const { isAuthenticated } = useAuth();
  const { getMovie } = useMovies();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('discover');
  const [detailMovieId, setDetailMovieId] = useState(null);
  const [reviewMovieId, setReviewMovieId] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [apiConfigOpen, setApiConfigOpen] = useState(false);

  const switchTab = useCallback((tab) => {
    setActiveTab(tab);
    if ((tab === 'watchlist' || tab === 'watched') && !isAuthenticated) {
      showToast(
        tab === 'watchlist'
          ? 'Silakan login terlebih dahulu untuk melihat Watchlist'
          : 'Silakan login terlebih dahulu untuk melihat Watched list',
        'info',
      );
      setAuthMode('login');
      setAuthOpen(true);
    }
  }, [isAuthenticated, showToast]);

  const openDetail = useCallback((id) => setDetailMovieId(id), []);
  const closeDetail = useCallback(() => setDetailMovieId(null), []);
  const openReview = useCallback((id) => {
    setDetailMovieId(null);
    setReviewMovieId(id);
  }, []);
  const closeReview = useCallback(() => setReviewMovieId(null), []);
  const openAuth = useCallback((mode = 'login') => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);
  const closeAuth = useCallback(() => setAuthOpen(false), []);

  const detailMovie = detailMovieId != null ? getMovie(detailMovieId) : null;
  const reviewMovie = reviewMovieId != null ? getMovie(reviewMovieId) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        activeTab={activeTab}
        onSwitchTab={switchTab}
        onOpenAuth={openAuth}
        onOpenApiConfig={() => setApiConfigOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'discover' && <DiscoverPage onOpenDetail={openDetail} onOpenReview={openReview} />}
        {activeTab === 'watchlist' && (
          <WatchlistPage
            onOpenDetail={openDetail}
            onOpenReview={openReview}
            onOpenAuth={openAuth}
            onSwitchTab={switchTab}
          />
        )}
        {activeTab === 'watched' && (
          <WatchedPage onOpenDetail={openDetail} onOpenAuth={openAuth} onSwitchTab={switchTab} />
        )}
        {activeTab === 'ai' && <AiRecommendPage onOpenDetail={openDetail} />}
      </main>

      <ApiInspector />

      <MovieDetailModal
        movie={detailMovie}
        inWatchlist={detailMovie ? isInWatchlist(detailMovie.id) : false}
        onToggleWatchlist={toggleWatchlist}
        onOpenReview={openReview}
        onClose={closeDetail}
      />
      <ReviewModal movie={reviewMovie} onClose={closeReview} />
      <AuthModal open={authOpen} mode={authMode} onModeChange={setAuthMode} onClose={closeAuth} />
      <ApiConfigModal open={apiConfigOpen} onClose={() => setApiConfigOpen(false)} />
      <Toast />
    </div>
  );
}

/**
 * Provide shared state (toast, api config/inspector, auth, catalog, watchlist,
 * watched list) to the whole UI. Auth sits above the account-scoped contexts so
 * they can react to login/logout and discard stale requests.
 */
export default function App() {
  return (
    <ToastProvider>
      <ApiProvider>
        <AuthProvider>
          <MoviesProvider>
            <WatchlistProvider>
              <WatchedProvider>
                <FilmLogApp />
              </WatchedProvider>
            </WatchlistProvider>
          </MoviesProvider>
        </AuthProvider>
      </ApiProvider>
    </ToastProvider>
  );
}