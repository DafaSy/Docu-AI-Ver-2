import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../types';

interface Props {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastStack({ toasts, onDismiss }: Props) {
  return (
    <div className="pointer-events-none fixed bottom-3 left-3 right-3 z-50 flex w-auto max-w-sm flex-col gap-3 sm:bottom-6 sm:left-auto sm:right-6 sm:w-full">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), 5000);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const palette = (() => {
    switch (toast.variant) {
      case 'success':
        return {
          ring: 'ring-success-500/40',
          icon: 'text-success-400',
          bar: 'bg-success-500',
          Icon: CheckCircle2,
        };
      case 'error':
        return {
          ring: 'ring-danger-500/40',
          icon: 'text-danger-400',
          bar: 'bg-danger-500',
          Icon: AlertTriangle,
        };
      default:
        return {
          ring: 'ring-brand-500/40',
          icon: 'text-brand-300',
          bar: 'bg-brand-500',
          Icon: Info,
        };
    }
  })();

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden rounded-xl bg-ink-900/90 p-4 pr-10 text-sm shadow-lift ring-1 ${palette.ring} backdrop-blur animate-scale-in`}
      role="status"
    >
      <span className={`absolute left-0 top-0 h-full w-1 ${palette.bar}`} />
      <div className="flex items-start gap-3">
        <palette.Icon size={18} className={`mt-0.5 shrink-0 ${palette.icon}`} />
        <div className="min-w-0">
          <p className="font-semibold text-white">{toast.title}</p>
          {toast.description && (
            <p className="mt-0.5 text-ink-300">{toast.description}</p>
          )}
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                onDismiss(toast.id);
              }}
              className="mt-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="absolute right-2 top-2 rounded-md p-1 text-ink-400 transition hover:bg-white/10 hover:text-white"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}
