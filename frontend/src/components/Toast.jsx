import { useToast } from '../context/ToastContext.jsx';

const ICONS = {
  success: '🟢',
  error: '🔴',
  warning: '🟡',
  info: '🔵',
};

export default function Toast() {
  const { toast } = useToast();
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-card border border-brand-border shadow-2xl text-sm text-white pointer-events-none"
    >
      <span aria-hidden="true">{ICONS[toast.type] || '🔵'}</span>
      <span>{toast.message}</span>
    </div>
  );
}