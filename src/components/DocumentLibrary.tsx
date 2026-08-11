import {
  CheckSquare,
  Download,
  Eye,
  FilePenLine,
  Files,
  FolderInput,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Square,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DocumentRecord } from '../types';
import { formatBytes, getFileKind, kindLabel } from '../lib/format';
import { FileTypeIcon } from './FileTypeIcon';

type EditorMode = 'rename' | 'category' | 'tags';
type EditorState = { document: DocumentRecord; mode: EditorMode };

interface Props {
  documents: DocumentRecord[];
  loading?: boolean;
  selectedId?: string;
  selectedIds?: string[];
  busyId?: string;
  onChat: (document: DocumentRecord) => void;
  onChatSelected?: () => void;
  onPreview: (document: DocumentRecord) => void;
  onDetails: (document: DocumentRecord) => void;
  onReprocess: (document: DocumentRecord) => void;
  onDownload: (document: DocumentRecord) => void;
  onRename: (document: DocumentRecord, name: string) => void;
  onDelete: (document: DocumentRecord) => void;
  onUpdateOrganization: (document: DocumentRecord, input: Partial<Pick<DocumentRecord, 'category' | 'tags' | 'is_favorite'>>) => void;
  onToggleSelect?: (document: DocumentRecord) => void;
  onClearSelection?: () => void;
  copy?: {
    title: string;
    subtitle: string;
    empty: string;
    emptyFiltered: string;
    openUpload: string;
  };
}

const CATEGORIES = ['All categories', 'Uncategorized', 'CV', 'Kuliah', 'Project', 'Legal'];

export function DocumentLibrary({
  documents,
  loading,
  selectedId,
  selectedIds = [],
  busyId,
  onChat,
  onChatSelected,
  onPreview,
  onDetails,
  onReprocess,
  onDownload,
  onRename,
  onDelete,
  onUpdateOrganization,
  onToggleSelect,
  onClearSelection,
  copy,
}: Props) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('All categories');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [editor, setEditor] = useState<EditorState>();

  const filtered = useMemo(() => documents.filter((doc) => {
    const searchable = `${doc.file_name} ${doc.category ?? ''} ${(doc.tags ?? []).join(' ')}`.toLowerCase();
    return (!query || searchable.includes(query.toLowerCase())) && (type === 'all' || doc.file_type === type) && (category === 'All categories' || (doc.category ?? 'Uncategorized') === category) && (status === 'all' || doc.processing_status === status) && (!favoritesOnly || doc.is_favorite);
  }).sort((a, b) => sort === 'name' ? a.file_name.localeCompare(b.file_name) : sort === 'size' ? b.file_size - a.file_size : sort === 'oldest' ? +new Date(a.created_at) - +new Date(b.created_at) : +new Date(b.created_at) - +new Date(a.created_at)), [documents, query, type, category, status, sort, favoritesOnly]);

  const selectedCount = selectedIds.length;

  const saveEditor = (value: string) => {
    if (!editor) return;
    if (editor.mode === 'rename') onRename(editor.document, value.trim());
    if (editor.mode === 'category' && value.trim()) onUpdateOrganization(editor.document, { category: value.trim() });
    if (editor.mode === 'tags') onUpdateOrganization(editor.document, { tags: value.split(',').map((tag) => tag.trim()).filter(Boolean) });
    setEditor(undefined);
  };

  const handleToggleAllVisible = () => {
    if (!onToggleSelect) return;
    const visibleIds = filtered.map((doc) => doc.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      onClearSelection?.();
      return;
    }
    const visibleDocuments = filtered.filter((doc) => !selectedIds.includes(doc.id));
    visibleDocuments.forEach((document) => onToggleSelect(document));
  };

  return (
    <section className="glass min-w-0 rounded-2xl border border-white/10 p-4 shadow-soft sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-300">
            {copy?.title ?? 'Document library'}
          </h2>
          <p className="mt-1 text-xs text-ink-500">
            {copy?.subtitle ?? 'Search, organize, preview, and chat with private documents.'}
          </p>
        </div>
        <span className="font-mono text-xs text-ink-500">{filtered.length}/{documents.length}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <label className="relative col-span-2 sm:col-span-3 lg:col-span-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or tag" className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs text-white placeholder:text-ink-600 focus:border-brand-500 focus:outline-none" />
        </label>
        <Select value={type} onChange={setType} values={['all', 'pdf', 'txt', 'csv']} />
        <Select value={category} onChange={setCategory} values={CATEGORIES} />
        <Select value={status} onChange={setStatus} values={['all', 'ready', 'processing', 'failed']} />
        <Select value={sort} onChange={setSort} values={['newest', 'oldest', 'name', 'size']} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button onClick={() => setFavoritesOnly((value) => !value)} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] ${favoritesOnly ? 'border-warning-400/50 bg-warning-400/10 text-warning-300' : 'border-white/10 text-ink-400'}`}>
          <Star size={12} fill={favoritesOnly ? 'currentColor' : 'none'} /> Favorites
        </button>
        <button onClick={handleToggleAllVisible} className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-ink-300 transition hover:bg-white/10">
          <CheckSquare size={12} /> Select visible
        </button>
        <span className="inline-flex items-center gap-1 text-[11px] text-ink-600"><SlidersHorizontal size={12} /> Filters update instantly</span>
        {selectedCount > 0 && <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-[11px] font-medium text-brand-300"><CheckSquare size={12} /> {selectedCount} selected</span>}
      </div>

      {selectedCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-brand-500/20 bg-brand-500/10 px-3 py-2.5 text-xs text-brand-100">
          <span className="inline-flex items-center gap-1 font-medium text-brand-200"><Files size={13} /> Multi-select active</span>
          <span className="text-brand-100/80">Use these documents as chat sources.</span>
          <button type="button" onClick={onChatSelected} disabled={!onChatSelected} className="ml-auto rounded-lg bg-white px-3 py-1.5 font-semibold text-ink-950 transition hover:bg-brand-50 disabled:opacity-50">Chat selected</button>
          <button type="button" onClick={onClearSelection} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-medium text-white transition hover:bg-white/10">Clear selection</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-brand-400" size={22} /></div>
      ) : documents.length === 0 ? (
        <Empty>
          {copy?.empty ?? 'No saved documents yet. Upload a file to build your library.'}
          <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('docuai:jump-to-upload'))} className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-[11px] font-semibold text-brand-300 transition hover:bg-brand-500/20">
            {copy?.openUpload ?? 'Open upload guide'}
          </button>
        </Empty>
      ) : filtered.length === 0 ? (
        <Empty>{copy?.emptyFiltered ?? 'No documents match these filters.'}</Empty>
      ) : (
        <ul className="scrollbar-thin mt-5 max-h-[540px] space-y-3 overflow-y-auto pr-1">
          {filtered.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              busy={busyId === document.id}
              selected={selectedId === document.id}
              selectedMulti={selectedIds.includes(document.id)}
              onChat={onChat}
              onPreview={onPreview}
              onDetails={onDetails}
              onReprocess={onReprocess}
              onDownload={onDownload}
              onDelete={onDelete}
              onFavorite={() => onUpdateOrganization(document, { is_favorite: !document.is_favorite })}
              onEdit={(mode) => setEditor({ document, mode })}
              onToggleSelect={onToggleSelect ? () => onToggleSelect(document) : undefined}
              showSelect={Boolean(onToggleSelect)}
            />
          ))}
        </ul>
      )}

      {editor && <DocumentEditorModal editor={editor} onClose={() => setEditor(undefined)} onSave={saveEditor} />}
    </section>
  );
}

function DocumentCard({
  document,
  busy,
  selected,
  selectedMulti,
  onChat,
  onPreview,
  onDetails,
  onReprocess,
  onDownload,
  onDelete,
  onFavorite,
  onEdit,
  onToggleSelect,
  showSelect,
}: {
  document: DocumentRecord;
  busy: boolean;
  selected: boolean;
  selectedMulti: boolean;
  onChat: Props['onChat'];
  onPreview: Props['onPreview'];
  onDetails: Props['onDetails'];
  onReprocess: Props['onReprocess'];
  onDownload: Props['onDownload'];
  onDelete: Props['onDelete'];
  onFavorite: () => void;
  onEdit: (mode: EditorMode) => void;
  onToggleSelect?: () => void;
  showSelect?: boolean;
}) {
  void onDetails;
  const kind = getFileKind({ name: document.file_name, type: document.file_type } as File);

  return (
    <li className={`rounded-xl border bg-white/[0.03] p-3.5 ${selected || selectedMulti ? 'border-brand-500/50' : 'border-white/10'}`}>
      <div className="flex items-start gap-3">
        {showSelect && (
          <button type="button" onClick={onToggleSelect} className="mt-0.5 rounded-md p-1 text-ink-400 transition hover:bg-white/10 hover:text-white" aria-label={`Toggle ${document.file_name}`}>
            {selectedMulti ? <CheckSquare size={16} className="text-brand-300" /> : <Square size={16} />}
          </button>
        )}
        <FileTypeIcon kind={kind} size={19} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white" title={document.file_name}>{document.file_name}</p>
              <p className="mt-1 text-xs text-ink-500">{kindLabel(kind)} · {formatBytes(document.file_size)} · {new Date(document.created_at).toLocaleDateString()} · {document.page_count > 0 ? `${document.page_count} pages` : 'page metadata pending'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onFavorite} className={document.is_favorite ? 'text-warning-300' : 'text-ink-600 hover:text-warning-300'} title="Favorite"><Star size={16} fill={document.is_favorite ? 'currentColor' : 'none'} /></button>
              <Status status={document.processing_status} />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {document.category && document.category !== 'Uncategorized' && <span className="rounded bg-brand-500/10 px-2 py-0.5 text-[10px] text-brand-300">{document.category}</span>}
            {(document.tags ?? []).map((tag) => <span key={tag} className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-ink-400">#{tag}</span>)}
          </div>

          {document.error_message && <p className="mt-2 text-xs text-danger-300">{document.error_message}</p>}

          <div className="mt-3 flex flex-wrap gap-2">
            <Action label="Chat" icon={MessageSquare} disabled={document.processing_status !== 'ready' || busy} onClick={() => onChat(document)} />
            <Action label="Preview" icon={Eye} disabled={busy} onClick={() => onPreview(document)} />
            <Action label="Reprocess" icon={busy ? Loader2 : RefreshCw} spinning={busy} disabled={busy} onClick={() => onReprocess(document)} />
            <Action label="Download" icon={Download} disabled={busy} onClick={() => onDownload(document)} />
            <Action label="Rename" icon={FilePenLine} disabled={busy} onClick={() => onEdit('rename')} />
            <Action label="Folder" icon={FolderInput} disabled={busy} onClick={() => onEdit('category')} />
            <Action label="Tags" icon={FilePenLine} disabled={busy} onClick={() => onEdit('tags')} />
            <Action label="Delete" icon={Trash2} disabled={busy} onClick={() => onDelete(document)} />
          </div>
        </div>
      </div>
    </li>
  );
}

function DocumentEditorModal({ editor, onClose, onSave }: { editor: EditorState; onClose: () => void; onSave: (value: string) => void }) {
  const initial = editor.mode === 'rename' ? editor.document.file_name : editor.mode === 'category' ? editor.document.category ?? 'Uncategorized' : (editor.document.tags ?? []).join(', ');
  const [value, setValue] = useState(initial);
  const isCategory = editor.mode === 'category';
  const label = editor.mode === 'rename' ? 'Rename document' : isCategory ? 'Move to folder' : 'Document tags';
  const hint = editor.mode === 'tags' ? 'Separate tags with commas, for example: job, engineering, 2026' : isCategory ? 'Choose one folder for this document.' : 'Keep the extension, for example .pdf';
  return <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-0 sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true"><div className="glass w-full rounded-t-2xl border border-white/15 p-5 shadow-2xl sm:max-w-md sm:rounded-2xl"><div className="flex items-start justify-between gap-3"><div><h3 className="text-base font-semibold text-white">{label}</h3><p className="mt-1 text-xs text-ink-500">{editor.document.file_name}</p></div><button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-white/5 hover:text-white" aria-label="Close"><X size={17} /></button></div><label className="mt-6 block rounded-xl border border-white/5 bg-black/10 p-3 text-xs font-medium text-ink-300">{isCategory ? 'Folder' : editor.mode === 'tags' ? 'Tags' : 'File name'}{isCategory ? <select autoFocus value={value} onChange={(event) => setValue(event.target.value)} className="mt-3 block w-full rounded-xl border border-white/10 bg-[#161a25] px-3 py-3 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40">{CATEGORIES.filter((item) => item !== 'All categories').map((item) => <option key={item} value={item}>{item}</option>)}</select> : <input autoFocus value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onSave(value); }} className="mt-3 block w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40" />}</label><p className="mt-3 text-[11px] leading-relaxed text-ink-500">{hint}</p><div className="mt-7 flex justify-end gap-2"><button onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-ink-300 hover:bg-white/5">Cancel</button><button onClick={() => onSave(value)} disabled={!value.trim() && editor.mode !== 'tags'} className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400 disabled:opacity-40">Save</button></div></div></div>;
}

function Empty({ children }: { children: React.ReactNode }) { return <p className="mt-5 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-7 text-center text-sm text-ink-400">{children}</p>; }
function Select({ value, onChange, values }: { value: string; onChange: (value: string) => void; values: string[] }) { return <select value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 rounded-lg border border-white/10 bg-[#161a25] px-2 py-2 text-xs text-ink-300 focus:border-brand-500 focus:outline-none">{values.map((item) => <option key={item} value={item}>{item === 'all' ? 'All types' : item === 'newest' ? 'Newest first' : item === 'oldest' ? 'Oldest first' : item === 'name' ? 'Name A-Z' : item === 'size' ? 'Largest first' : item}</option>)}</select>; }
function Action({ label, icon: Icon, disabled, spinning, onClick }: { label: string; icon: typeof RefreshCw; disabled?: boolean; spinning?: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} disabled={disabled} title={label} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-2 text-[11px] font-medium text-ink-300 transition hover:border-brand-500/40 hover:text-brand-200 disabled:cursor-not-allowed disabled:opacity-40 sm:px-2.5 sm:py-1.5"><Icon size={13} className={spinning ? 'animate-spin' : ''} /><span className="hidden sm:inline">{label}</span></button>; }
function Status({ status }: { status: DocumentRecord['processing_status'] }) { const style = status === 'ready' ? 'bg-success-500/15 text-success-300 ring-success-500/30' : status === 'failed' ? 'bg-danger-500/15 text-danger-300 ring-danger-500/30' : status === 'processing' ? 'bg-brand-500/15 text-brand-300 ring-brand-500/30' : 'bg-ink-500/20 text-ink-300 ring-ink-500/30'; return <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold capitalize ring-1 ${style}`}>{status}</span>; }
