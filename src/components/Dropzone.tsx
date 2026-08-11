import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileText, FileType, Sheet, type LucideIcon } from 'lucide-react';

interface Props {
  onFiles: (files: FileList | File[]) => void;
  disabled?: boolean;
}

export function Dropzone({ onFiles, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      dragCounter.current += 1;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setDragging(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setDragging(false);
      }
    },
    [],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setDragging(false);
      if (disabled) return;
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        onFiles(e.dataTransfer.files);
      }
    },
    [disabled, onFiles],
  );

  const handleClick = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [disabled],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      aria-label="Upload files. Click or drop TXT, PDF, or CSV files here."
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={[
        'group relative flex cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all duration-300',
        dragging
          ? 'border-brand-400 bg-brand-500/10 shadow-glow scale-[1.01]'
          : 'border-white/15 bg-white/[0.02] hover:border-brand-400/60 hover:bg-white/[0.04]',
        disabled ? 'pointer-events-none opacity-60' : '',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".txt,.pdf,.csv,text/plain,application/pdf,text/csv"
        className="sr-only"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />

      <div className="relative">
        {dragging && (
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-500/40" />
        )}
        <div
          className={[
            'relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/10 ring-1 ring-white/10 transition-transform duration-300',
            dragging ? 'scale-110' : 'group-hover:scale-105',
          ].join(' ')}
        >
          <UploadCloud
            size={34}
            className={[
              'transition-colors',
              dragging ? 'text-brand-300' : 'text-brand-400 group-hover:text-brand-300',
            ].join(' ')}
            strokeWidth={1.75}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-lg font-semibold text-white">
          {dragging ? 'Drop to upload' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-ink-400">
          or{' '}
          <span className="font-semibold text-brand-300 underline-offset-4 group-hover:underline">
            browse from your device
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <Chip icon={FileText} label="TXT" tone="text-brand-300" />
        <Chip icon={FileType} label="PDF" tone="text-danger-300" />
        <Chip icon={Sheet} label="CSV" tone="text-success-300" />
        <span className="text-ink-500">·</span>
        <span className="text-ink-400">Up to 25 MB each</span>
      </div>
    </div>
  );
}

function Chip({
  icon: Icon,
  label,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  tone: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 font-semibold ring-1 ring-white/10">
      <Icon size={12} className={tone} />
      <span className="text-ink-200">{label}</span>
    </span>
  );
}
