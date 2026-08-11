import { CheckCircle2, FileText, HardDrive, Heart, XCircle } from 'lucide-react';
import type { DocumentRecord } from '../types';
import { formatBytes } from '../lib/format';

export function DocumentDashboard({ documents }: { documents: DocumentRecord[] }) {
  const totalSize = documents.reduce((sum, doc) => sum + doc.file_size, 0);
  const byType = ['pdf', 'txt', 'csv'].map((kind) => ({ kind: kind.toUpperCase(), count: documents.filter((doc) => doc.file_type === kind).length }));
  const cards = [
    { label: 'Documents', value: documents.length, icon: FileText, color: 'text-brand-300' },
    { label: 'Storage used', value: formatBytes(totalSize), icon: HardDrive, color: 'text-violet-300' },
    { label: 'Ready', value: documents.filter((doc) => doc.processing_status === 'ready').length, icon: CheckCircle2, color: 'text-success-300' },
    { label: 'Failed', value: documents.filter((doc) => doc.processing_status === 'failed').length, icon: XCircle, color: 'text-danger-300' },
    { label: 'Favorites', value: documents.filter((doc) => doc.is_favorite).length, icon: Heart, color: 'text-warning-300' },
  ];
  return <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{cards.map(({ label, value, icon: Icon, color }) => <div key={label} className="glass min-w-0 rounded-xl border border-white/10 p-3 sm:p-4"><Icon size={16} className={color} /><p className="mt-2 break-words text-lg font-semibold text-white">{value}</p><p className="text-[11px] text-ink-500">{label}</p></div>)}<div className="col-span-2 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:col-span-3 lg:col-span-5"><span className="text-xs text-ink-500">File types</span>{byType.map((item) => <span key={item.kind} className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-ink-300">{item.kind}: {item.count}</span>)}</div></section>;
}
