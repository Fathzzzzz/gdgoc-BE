import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuth } from '../context/AuthContext.jsx';
import { installFetch, AuthWrapper, AccountWrapper } from '../test/helpers.jsx';

function AuthProbe() {
  const { isAuthenticated, user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="authed">{String(isAuthenticated)}</span>
      <span data-testid="username">{user ? user.username : ''}</span>
      <button onClick={() => login('alice@example.com', 'secretpass123')}>doLogin</button>
      <button onClick={logout}>doLogout</button>
    </div>
  );
}

describe('AuthenticationContext', () => {
  it('logs in and persists the session', async () => {
    const api = installFetch();
    api.on('POST', '/auth/login', () => ({
      status: 200,
      body: { token: 'tok', user: { id: 1, username: 'alice', email: 'alice@example.com' } },
    }));

    render(<AuthWrapper><AuthProbe /></AuthWrapper>);

    fireEvent.click(screen.getByRole('button', { name: 'doLogin' }));

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('true'));
    expect(screen.getByTestId('username')).toHaveTextContent('alice');
    expect(localStorage.getItem('filmlog_token')).toBe('tok');
  });

  it('clears personal data on logout', async () => {
    localStorage.setItem('filmlog_token', 'tok');
    localStorage.setItem('filmlog_user', JSON.stringify({ id: 1, username: 'alice', email: 'alice@example.com' }));

    render(<AuthWrapper><AuthProbe /></AuthWrapper>);

    expect(screen.getByTestId('authed')).toHaveTextContent('true');
    fireEvent.click(screen.getByRole('button', { name: 'doLogout' }));

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('false'));
    expect(screen.getByTestId('username')).toHaveTextContent('');
    expect(localStorage.getItem('filmlog_token')).toBeNull();
    expect(localStorage.getItem('filmlog_user')).toBeNull();
  });

  it('logs out when a protected request returns 401 (expired token)', async () => {
    localStorage.setItem('filmlog_token', 'expired');
    localStorage.setItem('filmlog_user', JSON.stringify({ id: 1, username: 'alice', email: 'alice@example.com' }));

    const api = installFetch();
    api.on('GET', '/watchlist', () => ({ status: 401, body: { message: 'Token tidak valid.', code: 'TOKEN_INVALID' } }));
    api.on('GET', '/watched', () => ({ status: 200, body: [] }));

    render(<AccountWrapper><AuthProbe /></AccountWrapper>);

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('false'));
    expect(localStorage.getItem('filmlog_token')).toBeNull();
    expect(localStorage.getItem('filmlog_user')).toBeNull();
  });
});