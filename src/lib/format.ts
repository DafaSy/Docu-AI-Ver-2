import type { FileKind } from '../types';
import { ACCEPTED_EXTENSIONS } from '../types';

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / Math.pow(1024, i);
  const decimals = i === 0 ? 0 : value < 10 ? 1 : 0;
  return `${value.toFixed(decimals)} ${units[i]}`;
}

export function getFileKind(file: File): FileKind {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if ((ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) {
    return ext as FileKind;
  }
  if (file.type === 'text/plain') return 'txt';
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.includes('csv')) return 'csv';
  return 'unknown';
}

export function kindLabel(kind: FileKind): string {
  switch (kind) {
    case 'txt':
      return 'Text';
    case 'pdf':
      return 'PDF';
    case 'csv':
      return 'CSV';
    default:
      return 'File';
  }
}

export function kindAccent(kind: FileKind): {
  text: string;
  bg: string;
  ring: string;
  bar: string;
} {
  switch (kind) {
    case 'txt':
      return {
        text: 'text-brand-300',
        bg: 'bg-brand-500/15',
        ring: 'ring-brand-500/30',
        bar: 'from-brand-500 to-brand-400',
      };
    case 'pdf':
      return {
        text: 'text-danger-300',
        bg: 'bg-danger-500/15',
        ring: 'ring-danger-500/30',
        bar: 'from-danger-500 to-danger-400',
      };
    case 'csv':
      return {
        text: 'text-success-300',
        bg: 'bg-success-500/15',
        ring: 'ring-success-500/30',
        bar: 'from-success-500 to-success-400',
      };
    default:
      return {
        text: 'text-ink-300',
        bg: 'bg-ink-500/15',
        ring: 'ring-ink-500/30',
        bar: 'from-ink-500 to-ink-400',
      };
  }
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}
