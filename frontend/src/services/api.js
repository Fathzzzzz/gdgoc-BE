// Centralized HTTP client and configuration for the FilmLog frontend.
//
// Responsibilities:
// - Resolve the API base URL with a clear priority (in-app setting > env > default).
// - Attach the JWT Authorization header to every request.
// - Normalize error responses into a single ApiError shape.
// - Emit request logs for the API Inspector and unauthorized events for the
//   AuthContext to react to (token expiry).

export const API_URL_KEY = 'filmlog_api_url';
export const TOKEN_KEY = 'filmlog_token';
export const USER_KEY = 'filmlog_user';

export const DEFAULT_API_BASE_URL = 'http://localhost:8000/api';

// Module-level token register; AuthContext keeps it in sync with the UI session.
let authToken = null;

const logListeners = new Set();
const unauthorizedListeners = new Set();

export function setAuthToken(token) {
  authToken = typeof token === 'string' && token ? token : null;
}

export function getAuthToken() {
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
}

function safeGet(key) {
  try {
    return globalThis.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    globalThis.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode / disabled): ignore.
  }
}

function safeRemove(key) {
  try {
    globalThis.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getEnvBaseUrl() {
  return import.meta.env?.VITE_API_BASE_URL || '';
}

/**
 * Priority (highest first):
 *   1. In-app setting persisted under `filmlog_api_url`.
 *   2. Build-time `VITE_API_BASE_URL`.
 *   3. Default `http://localhost:8000/api`.
 */
export function getConfiguredBaseUrl() {
  const fromStorage = safeGet(API_URL_KEY);
  const fromEnv = getEnvBaseUrl();
  const candidate = fromStorage || fromEnv || DEFAULT_API_BASE_URL;
  return String(candidate).trim().replace(/\/+$/, '');
}

export function setConfiguredBaseUrl(raw) {
  let value = String(raw ?? '').trim().replace(/\/+$/, '');
  if (value && !/^https?:\/\//i.test(value)) {
    value = `http://${value}`;
  }
  safeSet(API_URL_KEY, value);
  return value;
}

export function clearConfiguredBaseUrl() {
  safeRemove(API_URL_KEY);
}

export class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function emitLog(entry) {
  for (const listener of logListeners) listener(entry);
}

function emitUnauthorized() {
  for (const listener of unauthorizedListeners) listener();
}

export function subscribeApiLog(listener) {
  logListeners.add(listener);
  return () => logListeners.delete(listener);
}

export function subscribeUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

export async function apiFetch(endpoint, options = {}) {
  const base = getConfiguredBaseUrl();
  const url = `${base}/${String(endpoint).replace(/^\//, '')}`;
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...(options.headers || {}) };

  if (options.body != null && headers['Content-Type'] == null) {
    headers['Content-Type'] = 'application/json';
  }

  const hadToken = Boolean(authToken);
  if (hadToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const start = performance.now();
  let status = 0;
  let responseData = null;
  let ok = false;

  try {
    const res = await fetch(url, { ...options, method, headers });
    status = res.status;
    ok = res.ok;

    const contentType = (res.headers && res.headers.get && res.headers.get('content-type')) || '';
    responseData = contentType.includes('application/json') ? await res.json() : await res.text();

    emitLog({
      time: new Date().toLocaleTimeString(),
      method,
      url,
      status,
      ok,
      duration: Math.round(performance.now() - start),
    });

    if (!ok) {
      const body = responseData && typeof responseData === 'object' ? responseData : null;
      const message = body ? body.message || body.error : `Request failed with status ${status}`;
      const code = body ? body.code : undefined;

      // An expired/invalid token on a protected call should clear the session.
      // Login attempts (auth/…) never carry a valid session yet, so they are exempt.
      if (status === 401 && hadToken && !String(endpoint).startsWith('auth/')) {
        emitUnauthorized();
      }

      throw new ApiError(message, { status, code });
    }

    return responseData;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (status === 0) {
      emitLog({
        time: new Date().toLocaleTimeString(),
        method,
        url,
        status: 'CORS/ERR',
        ok: false,
        duration: Math.round(performance.now() - start),
      });
    }
    throw err;
  }
}

// --- Auth storage helpers ----------------------------------------------------

export function readStoredToken() {
  const token = safeGet(TOKEN_KEY);
  return typeof token === 'string' && token ? token : null;
}

export function readStoredUser() {
  const raw = safeGet(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && typeof parsed.email === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeStoredSession(token, user) {
  safeSet(TOKEN_KEY, token);
  safeSet(USER_KEY, JSON.stringify(user));
}

export function clearStoredSession() {
  safeRemove(TOKEN_KEY);
  safeRemove(USER_KEY);
}