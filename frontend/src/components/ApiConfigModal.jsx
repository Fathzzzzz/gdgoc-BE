import { useEffect, useState } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey.js';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll.js';
import { useApi } from '../context/ApiContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const PRESETS = [
  'http://localhost:8000/api',
  'http://localhost:3000/api',
  'http://localhost:5000/api',
];

export default function ApiConfigModal({ open, onClose }) {
  const { apiBaseUrl, setApiBaseUrl } = useApi();
  const { showToast } = useToast();
  const [value, setValue] = useState(apiBaseUrl);

  useEffect(() => {
    if (open) setValue(apiBaseUrl);
  }, [open, apiBaseUrl]);

  useEscapeKey(onClose, open);
  useLockBodyScroll(open);

  if (!open) return null;

  const handleSave = () => {
    const next = setApiBaseUrl(value);
    showToast(`API URL diubah ke: ${next}`, 'success');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Backend API settings"
      onClick={onClose}
    >
      <div
        className="bg-brand-surface border border-brand-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close API settings"
          className="absolute top-4 right-4 text-brand-muted hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <SlidersHorizontal className="w-5 h-5 text-brand-green" />
          <h3 className="text-lg font-bold text-white">Backend API Settings</h3>
        </div>
        <p className="text-xs text-brand-muted mb-4">
          Set the base endpoint where your backend server is running (local or deployed URL).
        </p>

        <div className="space-y-3">
          <div>
            <label htmlFor="api-base-url-input" className="text-xs font-semibold text-brand-muted uppercase block mb-1">
              API Base URL
            </label>
            <input
              id="api-base-url-input"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full bg-brand-dark border border-brand-border rounded-xl px-3.5 py-2 text-sm font-mono text-white focus:outline-none focus:border-brand-green"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-brand-muted self-center">Presets:</span>
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setValue(preset)}
                className="px-2 py-1 rounded bg-brand-dark border border-brand-border text-brand-muted hover:text-white font-mono"
              >
                :{preset.split('//')[1]?.split(':')[0] || 'localhost'}/{preset.split('/').pop()}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full py-2.5 bg-brand-green text-black font-bold text-sm rounded-xl hover:brightness-110 transition mt-2"
          >
            Save & Reconnect
          </button>
        </div>
      </div>
    </div>
  );
}