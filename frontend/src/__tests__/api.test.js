import { describe, it, expect, vi } from 'vitest';
import {
  API_URL_KEY,
  DEFAULT_API_BASE_URL,
  getConfiguredBaseUrl,
  setConfiguredBaseUrl,
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

describe('getConfiguredBaseUrl', () => {
  it('defaults to the local backend', () => {
    expect(getConfiguredBaseUrl()).toBe(DEFAULT_API_BASE_URL);
  });

  it('prefers the in-app setting over the default', () => {
    localStorage.setItem(API_URL_KEY, 'http://custom:9000/api/');
    expect(getConfiguredBaseUrl()).toBe('http://custom:9000/api');
  });

  it('normalizes and persists a new base URL', () => {
    expect(setConfiguredBaseUrl('localhost:5000/api/')).toBe('http://localhost:5000/api');
    expect(getConfiguredBaseUrl()).toBe('http://localhost:5000/api');
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