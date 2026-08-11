import { CheckCircle2, AlertTriangle, Loader2, X, Clock } from 'lucide-react';
import type { UploadItem } from '../types';
import { formatBytes, formatDuration, kindAccent, kindLabel } from '../lib/format';
import { FileTypeIcon } from './FileTypeIcon';

interface Props {
  item: UploadItem;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

export function FileRow({ item, onRemove, onRetry }: Props) {
  const accent = kindAccent(item.kind);
  const busy = item.status === 'uploading' || item.status === 'queued';

  return (
    <li
      className="group relative animate-fade-in overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20"
    >
      <div className="flex items-start gap-4">
        <FileTypeIcon kind={item.kind} size={20} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p
              className="truncate font-medium text-white"
              title={item.file.name}
            >
              {item.file.name}
            </p>
            <div className="flex items-center gap-2">
              <StatusBadge item={item} />
              {!busy && (
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="rounded-md p-1 text-ink-400 transition hover:bg-white/10 hover:text-white"
                  aria-label={`Remove ${item.file.name}`}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
            <span className={`font-semibold ${accent.text}`}>
              {kindLabel(item.kind)}
            </span>
            <span aria-hidden>·</span>
            <span>{formatBytes(item.file.size)}</span>
            {item.finishedAt && item.startedAt && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={11} />
                  {formatDuration(item.finishedAt - item.startedAt)}
                </span>
              </>
            )}
            {item.message && (
              <>
                <span aria-hidden>·</span>
                <span
                  className={
                    item.status === 'error'
                      ? 'text-danger-300'
                      : item.status === 'success'
                        ? 'text-success-300'
                        : 'text-ink-300'
                  }
                >
                  {item.message}
                </span>
              </>
            )}
          </div>

          {(busy || item.status === 'success' || item.status === 'error') && (
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${accent.bar} transition-[width] duration-300 ease-out ${
                    item.status === 'uploading' ? 'shimmer' : ''
                  }`}
                  style={{
                    width: `${
                      item.status === 'success'
                        ? 100
                        : item.status === 'queued'
                          ? 0
                          : item.progress
                    }%`,
                  }}
                />
              </div>
              {item.status === 'uploading' && (
                <p className="mt-1.5 text-right text-[11px] font-medium text-ink-400">
                  {item.progress}%
                </p>
              )}
            </div>
          )}

          {item.status === 'error' && (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onRetry(item.id)}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function StatusBadge({ item }: { item: UploadItem }) {
  switch (item.status) {
    case 'queued':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-ink-500/20 px-2.5 py-1 text-[11px] font-semibold text-ink-300 ring-1 ring-ink-500/30">
          <Clock size={11} /> Queued
        </span>
      );
    case 'uploading':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/15 px-2.5 py-1 text-[11px] font-semibold text-brand-300 ring-1 ring-brand-500/30">
          <Loader2 size={11} className="animate-spin" /> Uploading
        </span>
      );
    case 'success':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-success-500/15 px-2.5 py-1 text-[11px] font-semibold text-success-300 ring-1 ring-success-500/30">
          <CheckCircle2 size={11} /> Sent
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-danger-500/15 px-2.5 py-1 text-[11px] font-semibold text-danger-300 ring-1 ring-danger-500/30">
          <AlertTriangle size={11} /> Failed
        </span>
      );
    default:
      return null;
  }
}
