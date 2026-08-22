import { UploadCloud, MessageSquare, Library, CheckCircle2, AlertTriangle, ArrowRight, type LucideIcon } from 'lucide-react';
import type { DocumentRecord, UploadItem } from '../types';
import type { WorkspaceCopy } from '../locales/workspace';

interface WorkspaceDashboardProps {
  greeting: string;
  accountName: string;
  documents: DocumentRecord[];
  readyDocuments: number;
  failedDocuments: number;
  selectedDocumentIds: string[];
  items: UploadItem[];
  copy: WorkspaceCopy;
  onUploadClick: () => void;
  onChatClick: () => void;
  onLibraryClick: () => void;
}

export function WorkspaceDashboard({
  greeting, accountName, documents, readyDocuments, failedDocuments, selectedDocumentIds,
  items, copy, onUploadClick, onChatClick, onLibraryClick
}: WorkspaceDashboardProps) {
  return (
    <>
      {/* Hero */}
      <section data-export-section="hero" className="relative mt-6 overflow-hidden rounded-[32px] border border-ink-200/70 dark:border-white/[0.06] bg-gradient-to-br from-brand-500/10 via-white to-accent-500/5 dark:from-[#080d14] dark:via-[#0b111c] dark:to-[#080d14] p-6 shadow-sm sm:mt-8 sm:p-10 lg:p-12">
        <div className="pointer-events-none absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay dark:opacity-[0.05]" />
        <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] -translate-y-1/3 translate-x-1/3 rounded-full bg-brand-500/20 blur-[100px] dark:bg-brand-500/10" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] -translate-x-1/3 translate-y-1/3 rounded-full bg-accent-500/10 blur-[80px]" />
        
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-success-400/20 bg-success-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-success-600 dark:text-success-400 shadow-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-500/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              </span> 
              Private workspace online
            </div>
            
            <p className="mt-8 text-sm font-medium text-ink-600 dark:text-ink-400">{greeting}, <span className="text-ink-950 dark:text-white">{accountName}</span></p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-ink-950 dark:text-white sm:text-5xl lg:text-[54px]">
              Turn documents into <span className="bg-gradient-to-r from-brand-600 to-accent-500 dark:from-brand-300 dark:via-brand-400 dark:to-accent-400 bg-clip-text text-transparent">working knowledge.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-600 dark:text-ink-400">
              Upload, organize, retrieve, and discuss your private files from one focused command center.
            </p>
            
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" onClick={onUploadClick} className="group inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(59,130,246,0.25)] transition hover:bg-brand-400 hover:shadow-[0_8px_25px_rgba(59,130,246,0.35)] dark:bg-white dark:text-ink-950 dark:hover:bg-brand-50 dark:shadow-[0_8px_20px_rgba(255,255,255,0.15)]">
                <UploadCloud size={18} /> Upload document <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
              <button type="button" onClick={onChatClick} className="inline-flex items-center gap-2 rounded-2xl border border-ink-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-5 py-3.5 text-sm font-semibold text-ink-700 dark:text-ink-300 shadow-sm backdrop-blur-md transition hover:border-brand-400/40 hover:bg-white dark:hover:bg-white/10 hover:text-ink-950 dark:hover:text-white">
                <MessageSquare size={18} /> Ask DocuAI
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[24px] border border-ink-200 dark:border-white/[0.08] bg-white/78 dark:bg-[#0c121c]/80 shadow-[0_20px_60px_rgba(17,25,40,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
            
            <div className="flex items-center justify-between border-b border-ink-200/60 dark:border-white/[0.06] px-5 py-4">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500">Workspace pulse</span>
              <span className="rounded-full border border-success-400/20 bg-success-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-success-600 dark:text-success-400">Live</span>
            </div>
            
            <div className="grid grid-cols-2 gap-px bg-ink-200/50 dark:bg-white/[0.05]">
              <WorkspacePulse value={documents.length} label="Documents" icon={Library} />
              <WorkspacePulse value={readyDocuments} label="Ready to ask" icon={CheckCircle2} tone="success" />
              <WorkspacePulse value={selectedDocumentIds.length} label="Selected sources" icon={MessageSquare} />
              <WorkspacePulse value={failedDocuments} label="Needs attention" icon={AlertTriangle} tone={failedDocuments ? 'danger' : 'muted'} />
            </div>
            
            <div className="bg-white/65 dark:bg-transparent p-5">
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.15em] text-ink-500 font-semibold">
                <span>Private data path</span>
                <span className="h-px flex-1 bg-gradient-to-r from-ink-200/80 dark:from-white/10 to-transparent" />
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[10px] font-semibold text-ink-700 dark:text-ink-400">
                {['Upload', 'Index', 'Retrieve', 'Answer'].map((stage, index) => (
                  <div key={stage} className="relative flex flex-col items-center justify-center rounded-xl border border-ink-200 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.02] py-2.5 shadow-sm transition hover:bg-white dark:hover:bg-white/[0.04]">
                    <span className="mb-1 block font-mono text-[9px] text-brand-500 dark:text-brand-400 opacity-80">0{index + 1}</span>
                    {stage}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding */}
      {items.length === 0 && documents.length === 0 && (
        <section data-export-section="onboarding" className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="glass rounded-2xl border border-ink-200 dark:border-white/10 p-4 shadow-soft sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-300">{copy.onboardingTitle}</p>
            <p className="mt-2 text-xs leading-relaxed text-ink-700 dark:text-ink-400">{copy.onboardingDescription}</p>
          </div>
          {copy.steps.map((step) => <div key={step.title} className="glass rounded-2xl border border-ink-200 dark:border-white/10 p-4 shadow-soft sm:p-5"><p className="text-sm font-semibold text-ink-950 dark:text-white">{step.title}</p><p className="mt-2 text-xs leading-relaxed text-ink-700 dark:text-ink-400">{step.text}</p></div>)}
          <div className="glass flex items-center rounded-2xl border border-ink-200 dark:border-white/10 p-4 shadow-soft sm:p-5">
            <div className="space-y-2">
              <button type="button" onClick={onUploadClick} className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-[11px] font-semibold text-brand-300 transition hover:bg-brand-500/20">{copy.openUpload}<ArrowRight size={12} /></button>
              <div className="flex flex-wrap gap-2 text-[11px] text-ink-600 dark:text-ink-500">
                <button type="button" onClick={onLibraryClick} className="rounded-full border border-ink-200 dark:border-white/10 px-3 py-1.5 hover:text-ink-950 dark:hover:text-white">{copy.openLibrary}</button>
                <button type="button" onClick={onChatClick} className="rounded-full border border-ink-200 dark:border-white/10 px-3 py-1.5 hover:text-ink-950 dark:hover:text-white">{copy.openChat}</button>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function WorkspacePulse({ value, label, icon: Icon, tone = 'brand' }: { value: number; label: string; icon: LucideIcon; tone?: 'brand' | 'success' | 'danger' | 'muted' }) {
  const toneClass = tone === 'success' ? 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-400/15' : tone === 'danger' ? 'text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/10 border-danger-200 dark:border-danger-400/15' : tone === 'muted' ? 'text-ink-500 dark:text-ink-500 bg-ink-50 dark:bg-white/[0.02] border-ink-200 dark:border-white/[0.05]' : 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-400/15';
  return (
    <div className="bg-white/60 dark:bg-[#0c121c]/80 p-5 transition hover:bg-white dark:hover:bg-[#0f1724]">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${toneClass}`}>
        <Icon size={18} />
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-tight text-ink-950 dark:text-white">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-500">{label}</p>
    </div>
  );
}
