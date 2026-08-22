import type { RefObject } from 'react';
import { Loader2, Send, Trash2, ShieldCheck, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { Dropzone } from './Dropzone';
import { FileRow } from './FileRow';
import { WEBHOOK_URL } from '../lib/upload';
import { formatBytes } from '../lib/format';
import type { UploadItem } from '../types';
import type { WorkspaceCopy } from '../locales/workspace';

interface UploadSectionProps {
  uploadRef: RefObject<HTMLElement>;
  copy: WorkspaceCopy;
  stats: { total: number; queued: number; uploading: number; success: number; error: number; totalBytes: number };
  isSending: boolean;
  canSend: boolean;
  items: UploadItem[];
  handleFiles: (files: FileList | File[]) => void;
  handleSendAll: () => void;
  handleCancel: () => void;
  handleClearAll: () => void;
  handleClearCompleted: () => void;
  handleRemove: (id: string) => void;
  handleRetry: (id: string) => void;
}

export function UploadSection({
  uploadRef, copy, stats, isSending, canSend, items,
  handleFiles, handleSendAll, handleCancel, handleClearAll, handleClearCompleted,
  handleRemove, handleRetry
}: UploadSectionProps) {
  return (
    <main data-export-section="ingestion" className="mt-4 grid gap-4 sm:gap-6 lg:grid-cols-[1.45fr_0.75fr]">
      {/* Upload panel */}
      <section ref={uploadRef} className="workspace-panel min-w-0 rounded-3xl border border-ink-200 dark:border-white/[0.09] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.2)] sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-800 dark:text-ink-300">
            {copy.uploadTitle}
          </h2>
          <span className="shrink-0 font-mono text-xs text-ink-600 dark:text-ink-500">
            {stats.total} file{stats.total === 1 ? '' : 's'}
          </span>
        </div>

        <Dropzone onFiles={handleFiles} disabled={isSending} />

        {/* Action bar */}
        <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-5">
          <button
            type="button"
            onClick={handleSendAll}
            disabled={!canSend}
            className={[
              'group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
              canSend
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-ink-950 dark:text-white shadow-lift hover:from-brand-400 hover:to-brand-500'
                : 'cursor-not-allowed bg-ink-200/30 dark:bg-white/5 text-ink-600 dark:text-ink-500',
            ].join(' ')}
          >
            {isSending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send
                size={16}
                className={canSend ? 'transition group-hover:-translate-y-0.5' : ''}
              />
            )}
            {isSending
              ? 'Sending…'
              : `Send ${stats.queued + stats.error > 0 ? `(${stats.queued + stats.error})` : 'all'} to n8n`}
          </button>

          {isSending && (
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-2 rounded-xl border border-ink-200 dark:border-white/15 bg-ink-200/30 dark:bg-white/5 px-4 py-2.5 text-sm font-semibold text-ink-950 dark:text-white transition hover:bg-ink-200/50 dark:hover:bg-white/10"
            >
              Cancel
            </button>
          )}

          {stats.total > 0 && !isSending && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-2 rounded-xl border border-ink-200 dark:border-white/10 px-3 py-2.5 text-sm font-medium text-ink-800 dark:text-ink-300 transition hover:border-danger-500/40 hover:text-danger-300"
            >
              <Trash2 size={14} />
              Clear all
            </button>
          )}

          {stats.success + stats.error > 0 && (
            <button
              type="button"
              onClick={handleClearCompleted}
              className="ml-auto text-xs font-medium text-ink-700 dark:text-ink-400 transition hover:text-ink-900 dark:hover:text-ink-200"
            >
              Clear finished
            </button>
          )}
        </div>

        {/* File list */}
        {items.length > 0 ? (
          <ul className="scrollbar-thin mt-5 max-h-[50vh] space-y-3 overflow-y-auto pr-1 lg:max-h-[420px]">
            {items.map((item) => (
              <FileRow
                key={item.id}
                item={item}
                onRemove={handleRemove}
                onRetry={handleRetry}
              />
            ))}
          </ul>
        ) : (
          <div className="mt-6 flex items-center justify-center rounded-xl border border-dashed border-ink-200 dark:border-white/10 bg-ink-200/10 dark:bg-white/[0.02] px-4 py-8 text-center">
            <p className="text-sm text-ink-700 dark:text-ink-400">
              {copy.uploadEmpty}
            </p>
          </div>
        )}
      </section>

      {/* Side panel */}
      <aside className="min-w-0 space-y-4">
        {/* Stats */}
        <div className="workspace-panel rounded-3xl border border-ink-200 dark:border-white/[0.09] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-800 dark:text-ink-300">
            Session
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Total" value={String(stats.total)} />
            <Stat label="Sent" value={String(stats.success)} tone="success" />
            <Stat label="Queued" value={String(stats.queued)} tone="muted" />
            <Stat label="Failed" value={String(stats.error)} tone="danger" />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-ink-200/20 dark:bg-white/[0.03] px-3 py-2.5 text-xs">
            <span className="text-ink-700 dark:text-ink-400">Total payload</span>
            <span className="font-mono font-semibold text-ink-950 dark:text-ink-100">
              {formatBytes(stats.totalBytes)}
            </span>
          </div>
        </div>

        {/* Webhook info */}
        <div className="workspace-panel rounded-3xl border border-ink-200 dark:border-white/[0.09] p-5">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-accent-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-800 dark:text-ink-300">
              Webhook
            </h3>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-ink-950/60 px-3 py-2.5 ring-1 ring-ink-200 dark:ring-white/10">
            <code className="truncate font-mono text-xs text-ink-900 dark:text-ink-200">
              {WEBHOOK_URL}
            </code>
            <span className="shrink-0 rounded-md bg-brand-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-300">
              POST
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-700 dark:text-ink-400">
            Files are sent as <span className="font-mono text-ink-900 dark:text-ink-200">multipart/form-data</span> with the
            field name <span className="font-mono text-ink-900 dark:text-ink-200">data</span>. n8n's Webhook
            node exposes the upload as <span className="font-mono text-ink-900 dark:text-ink-200">data</span> (binary) in the workflow.
          </p>
        </div>

        {/* Tips */}
        <div className="workspace-panel rounded-3xl border border-ink-200 dark:border-white/[0.09] p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-success-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-800 dark:text-ink-300">
              Good to know
            </h3>
          </div>
          <ul className="mt-3 space-y-2.5 text-xs text-ink-700 dark:text-ink-400">
            <li className="flex gap-2">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-success-400" />
              <span>Accepted: TXT, PDF, CSV — up to 25 MB each.</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-success-400" />
              <span>Files are sent directly from your browser to n8n.</span>
            </li>
            <li className="flex gap-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warning-400" />
              <span>
                If n8n runs on another host, enable CORS on the webhook
                response.
              </span>
            </li>
          </ul>
        </div>
      </aside>
    </main>
  );
}

function Stat({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'danger' | 'muted';
}) {
  const toneClass = (() => {
    switch (tone) {
      case 'success':
        return 'text-success-300';
      case 'danger':
        return 'text-danger-300';
      case 'muted':
        return 'text-ink-800 dark:text-ink-300';
      default:
        return 'text-ink-950 dark:text-white';
    }
  })();
  return (
    <div className="rounded-xl bg-ink-200/20 dark:bg-white/[0.03] px-3 py-2.5 ring-1 ring-ink-200 dark:ring-white/5">
      <p className="text-[11px] uppercase tracking-wider text-ink-600 dark:text-ink-500">{label}</p>
      <p className={`mt-0.5 text-xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
