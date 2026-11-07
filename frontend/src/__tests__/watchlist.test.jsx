import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useAuth } from '../context/AuthContext.jsx';
import { useWatchlist } from '../context/WatchlistContext.jsx';
import { installFetch, deferred, makeMovie, AccountWrapper } from '../test/helpers.jsx';

function WatchlistProbe() {
  const { logout } = useAuth();
  const { watchlist } = useWatchlist();
  return (
    <div>
      <span data-testid="count">{watchlist.length}</span>
      <button onClick={logout}>logout</button>
    </div>
  );
}

describe('WatchlistContext', () => {
  it('does not repopulate data from a request started before logout', async () => {
    localStorage.setItem('filmlog_token', 'tok');
    localStorage.setItem('filmlog_user', JSON.stringify({ id: 1, username: 'alice', email: 'alice@example.com' }));

    const api = installFetch();
    const pending = deferred();
    api.on('GET', '/watchlist', () => pending.promise.then((body) => ({ status: 200, body })));
    api.on('GET', '/watched', () => ({ status: 200, body: [] }));

    render(<AccountWrapper><WatchlistProbe /></AccountWrapper>);

    // Logout while the /watchlist request is still in flight.
    fireEvent.click(screen.getByRole('button', { name: 'logout' }));

    // Resolve the stale request with data for the *previous* session.
    await act(async () => {
      pending.resolve([{ movie_id: 1, movie: makeMovie(1), created_at: '2026-01-01T00:00:00Z' }]);
      await pending.promise;
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
});