import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  apiFetch,
  setAuthToken,
  clearAuthToken,
  readStoredToken,
  readStoredUser,
  writeStoredSession,
  clearStoredSession,
  subscribeUnauthorized,
} from '../services/api.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

// Resolve the initial session from localStorage without ever throwing on
// corrupt data (issue #3): a token without a valid user (or vice versa) is
// treated as logged out and cleared.
function resolveInitialAuth() {
  const storedToken = readStoredToken();
  const storedUser = readStoredUser();
  if (storedToken && storedUser) {
    setAuthToken(storedToken);
    return { token: storedToken, user: storedUser };
  }
  if (storedToken || storedUser) {
    clearStoredSession();
    clearAuthToken();
  }
  return { token: null, user: null };
}

export function AuthProvider({ children }) {
  const { showToast } = useToast();
  const [auth, setAuth] = useState(resolveInitialAuth);
  // Monotonic session counter: bumped on every login and logout so that
  // in-flight requests from a previous session can be discarded.
  const [sessionId, setSessionId] = useState(0);

  const isAuthenticated = Boolean(auth.token && auth.user);

  const login = useCallback(async (email, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const token = data && data.token;
    const user = data && data.user;
    if (!token || !user) return { ok: false, error: 'Respons login tidak valid.' };
    writeStoredSession(token, user);
    setAuthToken(token);
    setAuth({ token, user });
    setSessionId((s) => s + 1);
    showToast(`Berhasil masuk sebagai ${user.username || user.email}! 👋`, 'success');
    return { ok: true };
  }, [showToast]);

  const register = useCallback(async (username, email, password) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    return data;
  }, []);

  const logout = useCallback(() => {
    setAuth({ token: null, user: null });
    setSessionId((s) => s + 1);
    clearAuthToken();
    clearStoredSession();
    showToast('Anda telah keluar (Logged out)', 'info');
  }, [showToast]);

  // Token expiry/invalidation detected by the API client on protected calls.
  useEffect(() => subscribeUnauthorized(() => {
    setAuth({ token: null, user: null });
    setSessionId((s) => s + 1);
    clearAuthToken();
    clearStoredSession();
    showToast('Sesi Anda berakhir. Silakan login kembali.', 'warning');
  }), [showToast]);

  const value = {
    user: auth.user,
    token: auth.token,
    isAuthenticated,
    sessionId,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}