import { FileText, FileType, Sheet, File } from 'lucide-react';
import type { FileKind } from '../types';
import { kindAccent } from '../lib/format';

interface Props {
  kind: FileKind;
  size?: number;
  className?: string;
}

export function FileTypeIcon({ kind, size = 22, className = '' }: Props) {
  const accent = kindAccent(kind);
  const base = `rounded-lg ${accent.bg} ${accent.text} ring-1 ${accent.ring} flex items-center justify-center`;

  const Icon = (() => {
    switch (kind) {
      case 'txt':
        return FileText;
      case 'pdf':
        return FileType;
      case 'csv':
        return Sheet;
      default:
        return File;
    }
  })();

  return (
    <span
      className={`${base} ${className}`}
      style={{ width: size + 18, height: size + 18 }}
      aria-hidden
    >
      <Icon size={size} strokeWidth={2} />
    </span>
  );
}
