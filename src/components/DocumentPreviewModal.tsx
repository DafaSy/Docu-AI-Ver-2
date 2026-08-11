import { useEffect, useState } from 'react';
import { Download, Loader2, X } from 'lucide-react';
import type { DocumentRecord } from '../types';
import { getDocumentDownloadUrl } from '../lib/documents';

export function DocumentPreviewModal({ document, onClose }: { document?: DocumentRecord; onClose: () => void }) {
  const [url, setUrl] = useState<string>();
  const [text, setText] = useState<string>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    if (!document) return;
    let active = true;
    setUrl(undefined); setText(undefined); setError(undefined);
    void (async () => {
      try {
        const signedUrl = await getDocumentDownloadUrl(document);
        if (!active) return;
        setUrl(signedUrl);
        if (document.file_type === 'txt' || document.file_type === 'csv') {
          const response = await fetch(signedUrl);
          if (!response.ok) throw new Error('Could not load file preview.');
          const content = await response.text();
          if (active) setText(content);
        }
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : 'Could not load preview.'); }
    })();
    return () => { active = false; };
  }, [document]);
  if (!document) return null;
  const loading = !url || ((document.file_type === 'txt' || document.file_type === 'csv') && text === undefined);
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
    <div className="glass flex h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-white/15 shadow-2xl sm:h-[85vh] sm:rounded-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{document.file_name}</p><p className="text-xs text-ink-500">Private preview</p></div><div className="flex items-center gap-2">{url && <a href={url} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 p-2 text-ink-300 hover:text-white" title="Download"><Download size={16} /></a>}<button onClick={onClose} className="rounded-lg border border-white/10 p-2 text-ink-300 hover:text-white" aria-label="Close preview"><X size={16} /></button></div></div>
      <div className="min-h-0 flex-1 bg-black/20 p-3">{error ? <p className="p-4 text-sm text-danger-300">{error}</p> : loading ? <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-brand-400" /></div> : document.file_type === 'pdf' ? <iframe title={`Preview ${document.file_name}`} src={url} className="h-full w-full rounded-lg bg-white" /> : <pre className="scrollbar-thin h-full overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/30 p-4 text-xs leading-relaxed text-ink-200">{text}</pre>}</div>
    </div>
  </div>;
}
