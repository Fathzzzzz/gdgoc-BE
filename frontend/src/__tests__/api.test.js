import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import {
  DEFAULT_API_BASE_URL,
  getConfiguredBaseUrl,
  setAuthToken,
  clearAuthToken,
  apiFetch,
  ApiError,
  subscribeUnauthorized,
} from '../services/api.js';

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => (name.toLowerCase() === 'content-type' ? 'application/json' : null) },
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : body == null ? '' : JSON.stringify(body)),
  };
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getConfiguredBaseUrl', () => {
  it('defaults to the local backend', () => {
    expect(getConfiguredBaseUrl()).toBe(DEFAULT_API_BASE_URL);
  });

  it('sends requests to the environment URL despite an old browser override', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/api/');
    localStorage.setItem('filmlog_api_url', 'https://old-api.example.com/api');
    const fetchMock = vi.fn(async () => jsonResponse([], 200));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/movies');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/movies',
      expect.any(Object),
    );
  });
});

describe('apiFetch', () => {
  it('attaches the JWT header and parses JSON', async () => {
    setAuthToken('tok123');
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true, data: [1] }, 200));
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiFetch('/movies');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/movies',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer tok123' }),
      }),
    );
    expect(result).toEqual({ ok: true, data: [1] });
    clearAuthToken();
  });

  it('throws ApiError with status and code', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ message: 'Film tidak ditemukan.', code: 'MOVIE_NOT_FOUND' }, 404));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch('/movies/999', { method: 'GET' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      code: 'MOVIE_NOT_FOUND',
      message: 'Film tidak ditemukan.',
    });
  });

  it('emits unauthorized on a 401 protected call', async () => {
    setAuthToken('tok123');
    const listener = vi.fn();
    const unsubscribe = subscribeUnauthorized(listener);
    const fetchMock = vi.fn(async () => jsonResponse({ message: 'Token tidak valid.', code: 'TOKEN_INVALID' }, 401));
    vi.stubGlobal('fetch', fetchMock);

    try {
      await apiFetch('/watchlist');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(401);
    }
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    clearAuthToken();
  });

  it('does not emit unauthorized for a failed login', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeUnauthorized(listener);
    const fetchMock = vi.fn(async () => jsonResponse({ message: 'Kredensial salah.', code: 'AUTH_FAILED' }, 401));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({}) })).rejects.toBeInstanceOf(ApiError);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});