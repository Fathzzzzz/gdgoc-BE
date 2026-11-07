import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey.js';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function AuthModal({ open, mode, onModeChange, onClose }) {
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEscapeKey(() => { if (!submitting) onClose(); }, open);
  useLockBodyScroll(open);

  // Clear transient state whenever the modal opens.
  useEffect(() => {
    if (open) {
      setPassword('');
      setError('');
    }
  }, [open, mode]);

  if (!open) return null;

  const switchMode = (next) => {
    setError('');
    onModeChange(next);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'register') {
        const displayUsername = username.trim() || email.trim().split('@')[0];
        await register(displayUsername, email.trim(), password);
        showToast('Registrasi berhasil! Silakan login.', 'success');
        setUsername('');
        switchMode('login');
      } else {
        const result = await login(email.trim(), password);
        if (result && result.ok) {
          onClose();
        } else {
          setError((result && result.error) || 'Login gagal.');
        }
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'login' ? 'Login' : 'Register'}
      onClick={() => { if (!submitting) onClose(); }}
    >
      <div
        className="bg-brand-surface border border-brand-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => { if (!submitting) onClose(); }}
          aria-label="Close authentication"
          className="absolute top-4 right-4 text-brand-muted hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-4 border-b border-brand-border pb-3 mb-5">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`pb-1 ${mode === 'login' ? 'font-bold text-lg text-white border-b-2 border-brand-green' : 'font-medium text-lg text-brand-muted hover:text-white'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`pb-1 ${mode === 'register' ? 'font-bold text-lg text-white border-b-2 border-brand-green' : 'font-medium text-lg text-brand-muted hover:text-white'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label htmlFor="auth-username" className="text-xs font-semibold text-brand-muted uppercase">
                Username
              </label>
              <input
                id="auth-username"
                type="text"
                minLength={3}
                maxLength={50}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                required
                autoComplete="username"
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-green"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="auth-email" className="text-xs font-semibold text-brand-muted uppercase">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              autoComplete="email"
              className="w-full bg-brand-dark border border-brand-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-green"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="auth-password" className="text-xs font-semibold text-brand-muted uppercase">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full bg-brand-dark border border-brand-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-green"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/50 p-2.5 rounded-lg" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-brand-green text-black font-bold text-sm rounded-xl hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition mt-2"
          >
            {submitting ? 'Processing...' : mode === 'register' ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}