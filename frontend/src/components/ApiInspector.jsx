import { useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { useApi } from '../context/ApiContext.jsx';

export default function ApiInspector() {
  const { logs } = useApi();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-brand-border bg-brand-surface/90 text-xs text-brand-muted">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-green" />
          <span className="font-mono text-white font-semibold">API Inspector</span>
          <span className="text-[11px] text-brand-muted hidden sm:inline">
            — See real-time network requests sent to your backend
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-center gap-1 hover:text-white transition"
        >
          <span>{open ? 'Hide Logs' : 'Show Logs'}</span>
          <ChevronUp className={`w-3.5 h-3.5 transition-transform ${open ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {open && (
        <div className="max-w-7xl mx-auto px-4 pb-3 font-mono text-[11px] max-h-48 overflow-y-auto space-y-1">
          {logs.length === 0 ? (
            <div className="text-brand-muted italic py-1">No API requests recorded yet.</div>
          ) : (
            logs.map((log, index) => (
              <div
                key={`${log.time}-${index}`}
                className="flex items-center justify-between py-1 border-b border-brand-border/40"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      log.ok
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {log.method}
                  </span>
                  <span className="text-white truncate max-w-xs sm:max-w-md">{log.url}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`font-bold ${log.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{log.status}</span>
                  <span className="text-brand-muted text-[10px]">{log.duration}ms</span>
                  <span className="text-brand-muted text-[10px] hidden sm:inline">{log.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}