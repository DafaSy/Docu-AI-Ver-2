import { Search, UploadCloud, Library, MessageSquare, Settings, X, type LucideIcon } from 'lucide-react';

interface WorkspaceCommandPaletteProps {
  query: string;
  onQueryChange: (value: string) => void;
  documentCount: number;
  selectedCount: number;
  onClose: () => void;
  onUpload: () => void;
  onLibrary: () => void;
  onChat: () => void;
  onSettings: () => void;
}

export function WorkspaceCommandPalette({
  query,
  onQueryChange,
  documentCount,
  selectedCount,
  onClose,
  onUpload,
  onLibrary,
  onChat,
  onSettings
}: WorkspaceCommandPaletteProps) {
  const actions: Array<{ title: string; description: string; keywords: string; icon: LucideIcon; shortcut: string; onClick: () => void }> = [
    { title: 'Upload documents', description: 'Add PDF, TXT, or CSV to this workspace', keywords: 'upload add file import', icon: UploadCloud, shortcut: 'U', onClick: onUpload },
    { title: 'Open document library', description: `${documentCount} documents available`, keywords: 'library documents files search', icon: Library, shortcut: 'L', onClick: onLibrary },
    { title: 'Ask DocuAI', description: selectedCount ? `Chat with ${selectedCount} selected sources` : 'Start a knowledge base conversation', keywords: 'chat ask ai assistant', icon: MessageSquare, shortcut: 'A', onClick: onChat },
    { title: 'Workspace preferences', description: 'Change theme and language', keywords: 'settings theme language preferences', icon: Settings, shortcut: 'S', onClick: onSettings },
  ];
  const normalized = query.trim().toLowerCase();
  const visible = actions.filter((action) => !normalized || `${action.title} ${action.description} ${action.keywords}`.toLowerCase().includes(normalized));

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]">
      <button type="button" aria-label="Close quick find" onClick={onClose} className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <div role="dialog" aria-modal="true" aria-label="Workspace quick find" className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-ink-200 dark:border-white/10 bg-white/95 dark:bg-[#0a0f18]/95 shadow-[0_35px_120px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
        <div className="flex items-center gap-3 border-b border-ink-200 dark:border-white/[0.08] px-5 py-4"><Search size={18} className="shrink-0 text-brand-300" /><input autoFocus value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search workspace actions..." className="min-w-0 flex-1 bg-transparent text-sm text-ink-950 dark:text-white outline-none placeholder:text-ink-600" /><button type="button" onClick={onClose} className="rounded-lg border border-ink-200 dark:border-white/10 p-1.5 text-ink-600 dark:text-ink-500 transition hover:bg-ink-200/30 dark:hover:bg-white/5 hover:text-ink-950 dark:hover:text-white"><X size={14} /></button></div>
        <div className="p-2">
          <p className="px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-700">Quick actions</p>
          {visible.map(({ title, description, icon: Icon, shortcut, onClick }) => <button key={title} type="button" onClick={onClick} className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-brand-500/[0.09]"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 dark:border-white/[0.07] bg-ink-200/20 dark:bg-white/[0.035] text-ink-700 dark:text-ink-400 transition group-hover:border-brand-400/20 group-hover:text-brand-300"><Icon size={17} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-ink-900 dark:text-ink-200 group-hover:text-ink-950 dark:group-hover:text-white">{title}</span><span className="mt-0.5 block text-[11px] text-ink-600">{description}</span></span><kbd className="rounded-md border border-ink-200 dark:border-white/[0.08] bg-ink-100 dark:bg-black/25 px-2 py-1 font-mono text-[9px] text-ink-600">{shortcut}</kbd></button>)}
          {!visible.length && <div className="px-4 py-10 text-center"><Search size={22} className="mx-auto text-ink-700" /><p className="mt-3 text-sm text-ink-600 dark:text-ink-500">No matching workspace action.</p></div>}
        </div>
        <div className="flex items-center justify-between border-t border-ink-200 dark:border-white/[0.07] px-5 py-3 text-[9px] uppercase tracking-[0.12em] text-ink-700"><span>DocuAI command center</span><span>ESC to close</span></div>
      </div>
    </div>
  );
}
