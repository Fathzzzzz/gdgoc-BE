import { vi } from 'vitest';
import { ToastProvider } from '../context/ToastContext.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import { WatchlistProvider } from '../context/WatchlistContext.jsx';
import { WatchedProvider } from '../context/WatchedContext.jsx';

/** Minimal Response-like object understood by the api service. */
export function jsonResponse(body, status = 200) {
  const ok = status >= 200 && status < 300;
  return {
    ok,
    status,
    headers: { get: (name) => (name.toLowerCase() === 'content-type' ? 'application/json' : null) },
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : body == null ? '' : JSON.stringify(body)),
  };
}

export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * Install a fetch mock that dispatches by HTTP method + URL suffix.
 * `on(method, suffixOrFn, responder)` where responder returns
 * `{ status, body }` or a Promise of it.
 */
export function installFetch() {
  const routes = [];
  const fetchMock = vi.fn((url, options = {}) => {
    const method = (options.method || 'GET').toUpperCase();
    const route = routes.find((r) => r.method === method && r.match(url));
    if (!route) {
      return Promise.reject(new Error(`Unhandled fetch: ${method} ${url}`));
    }
    return Promise.resolve(route.responder(url, options)).then((res) => {
      if (res && typeof res.ok === 'boolean') return res;
      return jsonResponse(res && res.body, res && res.status);
    });
  });

  const on = (method, match, responder) => {
    const matcher = typeof match === 'string' ? (url) => url.endsWith(match) : match;
    routes.push({ method: method.toUpperCase(), match: matcher, responder });
  };

  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, on };
}

export function makeMovie(id, title = 'Inception') {
  return {
    id,
    title,
    year: 2010,
    director: 'Christopher Nolan',
    genres: ['Sci-Fi', 'Action'],
    rating: 8.8,
    duration: '148 min',
    synopsis: 'A thief enters dreams.',
    poster_url: 'https://example.com/poster.jpg',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt'],
  };
}

export function AuthWrapper({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
}

export function AccountWrapper({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <WatchlistProvider>
          <WatchedProvider>{children}</WatchedProvider>
        </WatchlistProvider>
      </AuthProvider>
    </ToastProvider>
  );
}