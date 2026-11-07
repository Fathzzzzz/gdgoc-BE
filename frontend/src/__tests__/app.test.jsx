import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App.jsx';
import { installFetch, makeMovie } from '../test/helpers.jsx';

function seedSession() {
  localStorage.setItem('filmlog_token', 'tok');
  localStorage.setItem('filmlog_user', JSON.stringify({ id: 1, username: 'alice', email: 'alice@example.com' }));
}

describe('FilmLog App integration', () => {
  it('reflects backend watchlist state on Discover buttons after load (issue #1)', async () => {
    seedSession();
    const movie = makeMovie(1, 'Inception');
    const api = installFetch();
    api.on('GET', '/movies', () => ({ status: 200, body: [movie] }));
    api.on('GET', '/watchlist', () => ({
      status: 200,
      body: [{ movie_id: 1, movie, created_at: '2026-01-01T00:00:00Z' }],
    }));
    api.on('GET', '/watched', () => ({ status: 200, body: [] }));

    render(<App />);

    // The card button must reflect the server state without any extra action.
    expect(await screen.findByRole('button', { name: 'Remove from watchlist' })).toBeInTheDocument();
  });

  it('does not reopen a closed detail modal when toggling watchlist (issue #2)', async () => {
    seedSession();
    const movie = makeMovie(1, 'Inception');
    const api = installFetch();
    let watchlist = [];
    api.on('GET', '/movies', () => ({ status: 200, body: [movie] }));
    api.on('GET', '/watchlist', () => ({ status: 200, body: watchlist }));
    api.on('POST', '/watchlist', () => {
      watchlist = [{ movie_id: 1, movie, created_at: '2026-01-01T00:00:00Z' }];
      return { status: 201, body: { data: watchlist[0] } };
    });
    api.on('GET', '/watched', () => ({ status: 200, body: [] }));

    render(<App />);

    // Open and then close the details modal.
    fireEvent.click(await screen.findByRole('button', { name: 'Open details for Inception' }));
    expect(screen.getByRole('dialog', { name: 'Movie details' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close details' }));
    expect(screen.queryByRole('dialog', { name: 'Movie details' })).not.toBeInTheDocument();

    // Toggle watchlist from the Discover card.
    fireEvent.click(screen.getByRole('button', { name: 'Add to watchlist' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Remove from watchlist' })).toBeInTheDocument(),
    );

    // The modal must remain closed.
    expect(screen.queryByRole('dialog', { name: 'Movie details' })).not.toBeInTheDocument();
  });

  it('starts normally when localStorage holds corrupt user data (issue #3)', async () => {
    localStorage.setItem('filmlog_token', 'abc');
    localStorage.setItem('filmlog_user', '{corrupt');
    const api = installFetch();
    api.on('GET', '/movies', () => ({ status: 200, body: [] }));

    render(<App />);

    expect(await screen.findByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();

    // The corrupt partial session was cleared so the app can start logged out.
    expect(localStorage.getItem('filmlog_token')).toBeNull();
    expect(localStorage.getItem('filmlog_user')).toBeNull();
  });
});