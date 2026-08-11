import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Database,
  FileCheck2,
  FileSearch,
  FileStack,
  FileUp,
  FolderLock,
  HardDrive,
  History,
  LockKeyhole,
  MessageSquare,
  Pause,
  Play,
  Search,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Workflow,
  X,
  type LucideIcon,
} from 'lucide-react';
import { gsap } from 'gsap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const technologies = [
  { name: 'React', logo: 'https://cdn.simpleicons.org/react/61DAFB' },
  { name: 'TypeScript', logo: 'https://cdn.simpleicons.org/typescript/3178C6' },
  { name: 'Vite', logo: 'https://cdn.simpleicons.org/vite/646CFF' },
  { name: 'Tailwind CSS', logo: 'https://cdn.simpleicons.org/tailwindcss/06B6D4' },
  { name: 'Supabase', logo: 'https://cdn.simpleicons.org/supabase/3ECF8E' },
  { name: 'PostgreSQL + pgvector', logo: 'https://cdn.simpleicons.org/postgresql/4169E1' },
  { name: 'n8n', logo: 'https://cdn.simpleicons.org/n8n/EA4B71' },
  { name: 'Google Gemini', logo: 'https://cdn.simpleicons.org/googlegemini/8E75B2' },
];

const faqItems = [
  { question: 'What kinds of files can I use with DocuAI?', answer: 'DocuAI currently accepts PDF, TXT, and CSV files up to 25 MB each. Every file is validated before entering the processing workflow.' },
  { question: 'Are my documents public?', answer: 'No. Original files live in a private Supabase Storage bucket, access is scoped to the signed-in owner, and raw document chunks are unavailable to browser roles.' },
  { question: 'Does DocuAI answer from general knowledge?', answer: 'The document assistant is designed to retrieve context from your selected documents first. If evidence is missing, it should say that the available documents do not contain the answer.' },
  { question: 'Why does an answer include sources?', answer: 'Source metadata makes a response easier to inspect. DocuAI carries the filename—and page information when available—from retrieval into the final response.' },
  { question: 'Can I continue an older conversation?', answer: 'Yes. Conversations and messages are stored per account, so a previous discussion can be reopened instead of starting from zero after a refresh.' },
  { question: 'What happens if processing fails?', answer: 'The library records a failed status and error message. You can inspect the document, correct the issue, and use Reprocess without uploading an unrelated duplicate.' },
];

const comparisons: Array<{ before: string; after: string; icon: LucideIcon; label: string; detail: string }> = [
  { before: 'Files scattered across folders', after: 'One organized document library', icon: FileStack, label: 'Organize', detail: 'Every upload returns to one private workspace with status, tags, folders, and searchable metadata.' },
  { before: 'Search every page manually', after: 'Semantic retrieval finds the context', icon: Search, label: 'Discover', detail: 'Search follows meaning, not just exact keywords, so the useful paragraph can surface in seconds.' },
  { before: 'Chats lose context after refresh', after: 'Conversations stay available', icon: History, label: 'Continue', detail: 'Saved conversations preserve the question trail so you can resume work without rebuilding context.' },
  { before: 'Answers without evidence', after: 'Answers connected to their sources', icon: FileCheck2, label: 'Verify', detail: 'Source metadata stays attached to the response, making important claims easier to inspect and trust.' },
];

type JourneyStage = {
  id: string;
  label: string;
  summary: string;
  icon: LucideIcon;
  technology: string;
  data: string;
  storage: string;
  security: string;
  error: string;
};

const journeyStages: JourneyStage[] = [
  {
    id: 'upload', label: 'Upload', icon: FileUp,
    summary: 'The browser prepares one PDF, TXT, or CSV file together with its document identity.',
    technology: 'React · Supabase Auth', data: 'Original file, filename, MIME type, size, documentId',
    storage: 'In transit to the authenticated Edge Function', security: 'Authenticated request and user-scoped JWT',
    error: 'Expired session, empty file, interrupted connection',
  },
  {
    id: 'validate', label: 'Validate', icon: ShieldCheck,
    summary: 'The server checks the file before it can reach the automation workflow.',
    technology: 'Supabase Edge Functions · Deno', data: 'Extension, MIME, binary signature, UTF-8 content, PDF structure',
    storage: 'Validation memory only; rejected files are not forwarded', security: '25 MB limit, safe filename, PDF and binary checks',
    error: 'Encrypted PDF, signature mismatch, binary text, unsafe filename',
  },
  {
    id: 'store', label: 'Private storage', icon: FolderLock,
    summary: 'The original document is kept in a private, user-scoped file path.',
    technology: 'Supabase Storage · PostgreSQL', data: 'Original file and document metadata',
    storage: 'Private documents bucket and public.documents', security: 'RLS ownership policies and short-lived signed URLs',
    error: 'Storage quota, policy rejection, metadata insert failure',
  },
  {
    id: 'extract', label: 'Extract', icon: FileSearch,
    summary: 'The workflow converts the uploaded file into readable document text.',
    technology: 'n8n · PDF/Text/CSV loaders', data: 'Page text, rows, headings, and source metadata',
    storage: 'Workflow memory during processing', security: 'Only the validated file is sent to the workflow',
    error: 'Unreadable PDF, unsupported encoding, extraction timeout',
  },
  {
    id: 'embed', label: 'Embed', icon: BrainCircuit,
    summary: 'Document text is divided into chunks and transformed into searchable vectors.',
    technology: 'Google embeddings · pgvector', data: 'Text chunks, embeddings, userID, documentId, filename',
    storage: 'public.document_chunks in PostgreSQL', security: 'Raw chunks are unavailable to browser roles',
    error: 'Embedding quota, model outage, invalid vector dimensions',
  },
  {
    id: 'retrieve', label: 'Retrieve', icon: Search,
    summary: 'A question searches only the document context available to the current user.',
    technology: 'PostgreSQL · pgvector · n8n', data: 'Question embedding, selected document IDs, relevant chunks',
    storage: 'Read-only retrieval from document_chunks', security: 'User and optional document filters are enforced server-side',
    error: 'No relevant chunks, incorrect filter, low similarity',
  },
  {
    id: 'answer', label: 'Answer', icon: MessageSquare,
    summary: 'The model turns retrieved evidence into a concise response with source metadata.',
    technology: 'Google Gemini · n8n AI Agent', data: 'Question, retrieved context, conversation memory, citations',
    storage: 'Conversation and messages in PostgreSQL', security: 'The answer is grounded in scoped document context',
    error: 'Model rate limit, malformed output, insufficient evidence',
  },
];

export function AboutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const start = () => navigate(user ? '/app' : '/signup');

  return (
    <main className="docuai-header-palette min-h-screen overflow-x-hidden text-ink-100">
      <section data-export-section="hero" className="mx-auto max-w-5xl px-5 pb-20 pt-16 text-center sm:px-8 sm:pb-24 sm:pt-24">
        <p className="inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-200">
          <Sparkles size={13} /> About DocuAI
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-white sm:text-6xl">
          A calmer way to work with the documents that matter.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-ink-300">
          DocuAI is built for people who need answers from their own documents—not another place to lose track of files. It combines a private library, document retrieval, and source-aware AI chat in one focused workspace.
        </p>
      </section>

      <section data-export-section="overview" className="border-y border-white/10 bg-gradient-to-r from-brand-950/25 via-white/[0.025] to-accent-600/10">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-14 sm:px-8 md:grid-cols-3">
          <Info title="Who it is for" text="Students, job seekers, researchers, and independent builders working across PDFs, notes, data, and project documents." icon={FolderLock} />
          <Info title="What it solves" text="It turns scattered uploads into a searchable personal knowledge base that answers questions in everyday language." icon={Database} />
          <Info title="Made by" text="Designed and developed by Dafa Syachrullah as a focused AI Document Assistant project." icon={Bot} />
        </div>
      </section>

      <WhyDocuAI />
      <DataJourney />

      <TechStackDepth />
      <AboutFAQ />

      <section data-export-section="cta" className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 sm:py-24">
        <h2 className="text-3xl font-semibold tracking-tight text-white">Ready to make your documents useful?</h2>
        <p className="mt-3 text-ink-400">Create your private workspace and start with the files you already have.</p>
        <button onClick={start} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(51,128,252,0.28)] transition hover:brightness-110">
          Try DocuAI <ArrowRight size={16} />
        </button>
      </section>
    </main>
  );
}

function WhyDocuAI() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = comparisons[activeIndex];
  const ActiveIcon = active.icon;

  return (
    <section id="why-docuai" data-export-section="why-docuai" className="relative overflow-hidden px-5 py-20 sm:px-8 sm:py-28">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-35" />
      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-end gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">Why DocuAI exists</p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-white sm:text-6xl">
              Your files contain answers.
              <span className="mt-2 block text-ink-500">Finding them should not feel like work.</span>
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-ink-400 lg:justify-self-end">
            Important context is often buried across PDFs, notes, spreadsheets, and old conversations. DocuAI keeps the path from question to evidence visible, organized, and easier to revisit.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-white/10 bg-[#0a0f19]/85 shadow-[0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
            <div className="border-b border-white/10 lg:border-b-0 lg:border-r">
              <div className="hidden grid-cols-[1fr_64px_1fr] border-b border-white/10 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-600 sm:grid">
                <span>Before DocuAI</span><span /><span>With DocuAI</span>
              </div>
              <div className="divide-y divide-white/[0.07]">
                {comparisons.map(({ before, after, icon: Icon }, index) => {
                  const selected = index === activeIndex;
                  return (
                    <button key={before} onClick={() => setActiveIndex(index)} aria-pressed={selected} className={`group grid w-full grid-cols-1 items-center gap-3 px-4 py-5 text-left transition duration-300 sm:grid-cols-[1fr_64px_1fr] sm:gap-0 sm:px-6 ${selected ? 'bg-brand-500/[0.09] shadow-[inset_3px_0_0_#60a5fa]' : 'hover:bg-white/[0.025]'}`}>
                      <span className="flex min-w-0 items-center gap-3 text-sm text-ink-500">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-danger-500/15 bg-danger-500/[0.06] text-danger-300"><X size={15} /></span>
                        <span>{before}</span>
                      </span>
                      <span className={`mx-auto flex h-7 w-7 rotate-90 items-center justify-center rounded-full border transition duration-300 sm:rotate-0 ${selected ? 'border-brand-400/40 bg-brand-500/15 text-brand-200 sm:translate-x-1' : 'border-white/10 bg-white/5 text-ink-600 group-hover:text-brand-300'}`}><ArrowRight size={13} /></span>
                      <span className="flex min-w-0 items-center gap-3 text-sm font-medium text-ink-200">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${selected ? 'border-brand-300/40 bg-brand-500/20 text-white shadow-[0_0_24px_rgba(51,128,252,0.18)]' : 'border-brand-400/20 bg-brand-500/10 text-brand-300'}`}><Icon size={16} /></span>
                        <span>{after}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative flex min-h-[360px] flex-col justify-between overflow-hidden p-6 sm:p-8">
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-500/15 blur-[80px]" />
              <div className="relative flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-300">Friction removed</span>
                <span className="rounded-full border border-success-400/20 bg-success-500/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-success-300">Live comparison</span>
              </div>
              <div key={active.label} className="relative animate-[inspector-enter_420ms_cubic-bezier(0.22,1,0.36,1)_both]">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-400/30 bg-brand-500/10 text-brand-200 shadow-[0_18px_55px_rgba(51,128,252,0.18)]"><ActiveIcon size={27} /></span>
                <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-600">{active.label}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">{active.after}</h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-ink-400">{active.detail}</p>
              </div>
              <div className="relative mt-8 flex gap-2" aria-label="Comparison selection">
                {comparisons.map((item, index) => <button key={item.label} onClick={() => setActiveIndex(index)} aria-label={`Show ${item.label}`} className={`h-1.5 rounded-full transition-all duration-300 ${index === activeIndex ? 'w-10 bg-brand-400' : 'w-4 bg-white/10 hover:bg-white/25'}`} />)}
              </div>
            </div>
          </div>
          <div className="grid gap-px border-t border-white/10 bg-white/10 sm:grid-cols-3">
            <ComparisonMetric value="1" label="Focused workspace" />
            <ComparisonMetric value="7" label="Connected processing stages" />
            <ComparisonMetric value="0" label="Public document access" />
          </div>
        </div>
      </div>
    </section>
  );
}

function DataJourney() {
  const [activeId, setActiveId] = useState('validate');
  const [playing, setPlaying] = useState(true);
  const activeIndex = Math.max(0, journeyStages.findIndex((stage) => stage.id === activeId));
  const active = journeyStages[activeIndex];
  const ActiveIcon = active.icon;

  const moveTo = (index: number) => setActiveId(journeyStages[(index + journeyStages.length) % journeyStages.length].id);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => moveTo(activeIndex + 1), 5200);
    return () => window.clearInterval(timer);
  }, [activeIndex, playing]);

  return (
    <section id="data-journey" data-export-section="data-journey" className="relative overflow-hidden border-y border-white/10 bg-[#080c13] px-5 py-20 sm:px-8 sm:py-28">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-45" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[780px] -translate-x-1/2 rounded-full bg-brand-600/10 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">Interactive data journey</p>
          <h2 className="mx-auto mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">One document. Seven controlled steps.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-ink-400">Select any stage to inspect what moves, which technology is responsible, where data lives, and what can fail.</p>
        </div>

        <div
          className="mt-12 grid gap-5 xl:grid-cols-[0.72fr_1.28fr_1fr]"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') { event.preventDefault(); setPlaying(false); moveTo(activeIndex + 1); }
            if (event.key === 'ArrowLeft') { event.preventDefault(); setPlaying(false); moveTo(activeIndex - 1); }
          }}
        >
          <aside className="flex flex-col rounded-3xl border border-white/10 bg-black/25 p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-600">The DocuAI path</p>
            <h3 className="mt-6 text-4xl font-semibold leading-[1.03] tracking-[-0.04em] text-white">Upload.<br />Understand.<br />Retrieve.<br /><span className="text-ink-500">Answer.</span></h3>
            <p className="mt-5 text-sm leading-6 text-ink-400">Every layer has one clear job: move a private file toward a useful, source-aware answer.</p>
            <div className="mt-auto pt-8">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-ink-600"><span>Journey progress</span><span>{activeIndex + 1} / {journeyStages.length}</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all duration-500" style={{ width: `${((activeIndex + 1) / journeyStages.length) * 100}%` }} /></div>
              <div className="mt-5 flex items-center gap-2">
                <button onClick={() => { setPlaying(false); moveTo(activeIndex - 1); }} aria-label="Previous stage" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-ink-300 transition hover:border-brand-400/30 hover:text-white"><ChevronLeft size={17} /></button>
                <button onClick={() => setPlaying((value) => !value)} aria-label={playing ? 'Pause journey' : 'Play journey'} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-brand-400/25 bg-brand-500/10 text-xs font-semibold text-brand-200 transition hover:bg-brand-500/15">{playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause tour' : 'Play tour'}</button>
                <button onClick={() => { setPlaying(false); moveTo(activeIndex + 1); }} aria-label="Next stage" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-ink-300 transition hover:border-brand-400/30 hover:text-white"><ChevronRight size={17} /></button>
              </div>
              <Link to="/app" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-brand-100">Open workspace <ArrowRight size={15} /></Link>
            </div>
          </aside>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b111c]/90">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.17em] text-ink-600">Pipeline map</span>
              <span className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em] text-success-300"><span className="h-1.5 w-1.5 rounded-full bg-success-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" /> Authenticated path</span>
            </div>
            <div className="relative h-1 overflow-hidden bg-white/[0.035]">
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-500 via-cyan-300 to-accent-400 transition-all duration-700" style={{ width: `${((activeIndex + 1) / journeyStages.length) * 100}%` }} />
              <span key={active.id} className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_16px_#60a5fa] transition-all duration-700" style={{ left: `calc(${((activeIndex + 1) / journeyStages.length) * 100}% - 5px)` }} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {journeyStages.map((stage, index) => {
                const Icon = stage.icon;
                const selected = stage.id === active.id;
                return (
                  <button key={stage.id} onClick={() => { setPlaying(false); setActiveId(stage.id); }} aria-pressed={selected} className={`group relative min-h-36 border-b border-r border-white/[0.07] p-4 text-left transition duration-300 ${selected ? 'bg-brand-500/10 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.45)]' : 'bg-white/[0.01] hover:-translate-y-0.5 hover:bg-white/[0.04]'}`}>
                    <span className="text-[10px] font-mono text-ink-700">0{index + 1}</span>
                    <span className={`mt-5 flex h-11 w-11 items-center justify-center rounded-xl border transition ${selected ? 'border-brand-400/40 bg-brand-500/15 text-brand-200' : 'border-white/10 bg-white/5 text-ink-500 group-hover:text-ink-200'}`}><Icon size={19} /></span>
                    <span className={`mt-3 block text-xs font-semibold ${selected ? 'text-white' : 'text-ink-400'}`}>{stage.label}</span>
                    {selected && <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-success-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />}
                  </button>
                );
              })}
              <div className="hidden min-h-36 items-center justify-center border-b border-r border-white/[0.07] bg-white/[0.01] text-center text-[10px] uppercase tracking-[0.16em] text-ink-700 sm:flex">Source-aware<br />result</div>
            </div>
            <div className="border-t border-white/10 p-5">
              <div key={active.id} className="flex animate-[inspector-enter_420ms_cubic-bezier(0.22,1,0.36,1)_both] items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand-400/25 bg-brand-500/10 text-brand-200"><ActiveIcon size={21} /></span>
                <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-300">Stage {activeIndex + 1}</p><h3 className="mt-1 text-xl font-semibold text-white">{active.label}</h3><p className="mt-2 text-sm leading-6 text-ink-400">{active.summary}</p></div>
              </div>
            </div>
          </div>

          <aside className="overflow-hidden rounded-3xl border border-white/10 bg-black/35">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-brand-400" /><span className="h-2 w-2 rounded-full bg-accent-400" /><span className="h-2 w-2 rounded-full bg-success-400" /></div>
              <span className="font-mono text-[10px] uppercase tracking-[0.17em] text-ink-600">Stage inspector</span>
            </div>
            <div key={`inspector-${active.id}`} className="animate-[inspector-enter_420ms_cubic-bezier(0.22,1,0.36,1)_both] p-5">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-400/30 bg-brand-500/10 text-brand-200"><ActiveIcon size={24} /></span>
                <div><h3 className="text-xl font-semibold text-white">{active.label}</h3><p className="mt-1 text-xs text-ink-500">Pipeline stage {activeIndex + 1} of {journeyStages.length}</p></div>
              </div>
              <div className="mt-6 space-y-2.5">
                <InspectorRow icon={ServerCog} label="Technology" value={active.technology} />
                <InspectorRow icon={Workflow} label="Data processed" value={active.data} />
                <InspectorRow icon={HardDrive} label="Stored in" value={active.storage} />
                <InspectorRow icon={LockKeyhole} label="Protection" value={active.security} positive />
                <InspectorRow icon={AlertTriangle} label="Possible error" value={active.error} warning />
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-5 grid overflow-hidden rounded-2xl border border-white/10 bg-black/20 sm:grid-cols-4">
          <JourneyMetric value="7" label="Controlled stages" />
          <JourneyMetric value="3" label="Persistent data layers" />
          <JourneyMetric value="1" label="Authenticated user scope" />
          <JourneyMetric value="0" label="Public document access" />
        </div>
      </div>
    </section>
  );
}

function TechStackDepth() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cleanups: Array<() => void> = [];
    const context = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('[data-tech-card]');
      cards.forEach((card, index) => {
        const logo = card.querySelector<HTMLElement>('[data-tech-logo]');
        const rotateX = gsap.quickTo(card, 'rotationX', { duration: 0.45, ease: 'power3.out' });
        const rotateY = gsap.quickTo(card, 'rotationY', { duration: 0.45, ease: 'power3.out' });
        const moveLogoX = logo ? gsap.quickTo(logo, 'x', { duration: 0.45, ease: 'power3.out' }) : null;
        const moveLogoY = logo ? gsap.quickTo(logo, 'y', { duration: 0.45, ease: 'power3.out' }) : null;
        const pointerMove = (event: PointerEvent) => {
          const bounds = card.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width - 0.5;
          const y = (event.clientY - bounds.top) / bounds.height - 0.5;
          rotateY(x * 18); rotateX(y * -16); moveLogoX?.(x * 12); moveLogoY?.(y * 10);
        };
        const pointerLeave = () => { rotateX(0); rotateY(0); moveLogoX?.(0); moveLogoY?.(0); };
        card.addEventListener('pointermove', pointerMove);
        card.addEventListener('pointerleave', pointerLeave);
        gsap.fromTo(card, { opacity: 0, y: 28, rotationX: -9 }, { opacity: 1, y: 0, rotationX: 0, duration: 0.75, delay: index * 0.055, ease: 'power3.out' });
        cleanups.push(() => { card.removeEventListener('pointermove', pointerMove); card.removeEventListener('pointerleave', pointerLeave); });
      });
    }, root);
    return () => {
      cleanups.forEach((cleanup) => cleanup());
      context.revert();
    };
  }, []);

  return (
    <section ref={rootRef} data-export-section="technology" className="relative overflow-hidden border-y border-white/10 bg-[#070b12] px-5 py-20 sm:px-8 sm:py-28">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-end gap-6 md:grid-cols-[1fr_0.8fr]">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">Technology in depth</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">A real stack you can almost touch.</h2></div>
          <p className="text-sm leading-7 text-ink-400 md:justify-self-end">Move your pointer across each card. GSAP translates cursor position into lightweight CSS perspective—no Canvas or WebGL.</p>
        </div>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" style={{ perspective: '1100px' }}>
          {technologies.map((tech, index) => (
            <article key={tech.name} data-tech-card className="group relative min-h-44 overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.055] to-white/[0.018] p-5 shadow-[0_22px_55px_rgba(0,0,0,0.22)] will-change-transform" style={{ transformStyle: 'preserve-3d' }}>
              <span className="absolute right-4 top-4 font-mono text-[9px] text-ink-700">0{index + 1}</span>
              <div data-tech-logo className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/25 shadow-[0_15px_35px_rgba(0,0,0,0.25)] will-change-transform" style={{ transform: 'translateZ(36px)' }}><img src={tech.logo} alt="" className="h-7 w-7 object-contain" loading="lazy" /></div>
              <h3 className="mt-7 text-base font-semibold text-white" style={{ transform: 'translateZ(22px)' }}>{tech.name}</h3>
              <p className="mt-1.5 text-[11px] leading-5 text-ink-500">Connected layer · Production stack</p>
              <div className="pointer-events-none absolute inset-x-5 bottom-0 h-px scale-x-0 bg-gradient-to-r from-brand-400 to-accent-400 transition duration-300 group-hover:scale-x-100" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutFAQ() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section data-export-section="faq" className="relative overflow-hidden px-5 py-20 sm:px-8 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/[0.08] blur-[120px]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="lg:sticky lg:top-28 lg:h-fit">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">Frequently asked</p>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-white sm:text-6xl">Clear answers.<br /><span className="text-ink-500">Before you upload.</span></h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-ink-400">The practical details about supported files, privacy, grounded responses, and what happens when processing needs attention.</p>
          <Link to="/community" className="mt-7 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm font-medium text-ink-200 transition hover:border-brand-400/30 hover:text-white">Ask the community <ArrowRight size={15} /></Link>
        </div>
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0a0f18]/80 p-2 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          {faqItems.map((item, index) => {
            const open = openIndex === index;
            return (
              <article key={item.question} className={`overflow-hidden rounded-2xl border transition duration-300 ${open ? 'border-brand-400/25 bg-brand-500/[0.075]' : 'border-transparent hover:bg-white/[0.025]'}`}>
                <button type="button" onClick={() => setOpenIndex(open ? -1 : index)} aria-expanded={open} className="flex w-full items-start gap-4 px-4 py-5 text-left sm:px-5">
                  <span className={`mt-0.5 font-mono text-[10px] transition ${open ? 'text-brand-300' : 'text-ink-700'}`}>0{index + 1}</span><span className="min-w-0 flex-1 text-sm font-semibold text-white sm:text-base">{item.question}</span><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition duration-300 ${open ? 'rotate-180 border-brand-400/30 bg-brand-500/15 text-brand-200' : 'border-white/10 bg-white/[0.03] text-ink-500'}`}><ChevronDown size={14} /></span>
                </button>
                <div className={`grid transition-[grid-template-rows,opacity] duration-400 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}><div className="overflow-hidden"><p className="max-w-2xl px-12 pb-5 text-sm leading-6 text-ink-400 sm:px-14">{item.answer}</p></div></div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Info({ title, text, icon: Icon }: { title: string; text: string; icon: LucideIcon }) {
  return <article className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-brand-400/30 hover:bg-brand-500/[0.06]"><Icon size={20} className="text-brand-300" /><h2 className="mt-5 font-semibold text-white">{title}</h2><p className="mt-2 text-sm leading-relaxed text-ink-400">{text}</p></article>;
}

function ComparisonMetric({ value, label }: { value: string; label: string }) {
  return <div className="bg-[#090e17] px-5 py-5 text-center"><p className="text-2xl font-semibold text-white">{value}</p><p className="mt-1 text-[9px] font-medium uppercase tracking-[0.16em] text-ink-600">{label}</p></div>;
}

function JourneyMetric({ value, label }: { value: string; label: string }) {
  return <div className="border-b border-white/10 px-4 py-5 text-center last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><p className="text-2xl font-semibold text-white">{value}</p><p className="mt-1.5 text-[9px] font-medium uppercase tracking-[0.16em] text-ink-600">{label}</p></div>;
}

function InspectorRow({ icon: Icon, label, value, positive = false, warning = false }: { icon: LucideIcon; label: string; value: string; positive?: boolean; warning?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
      <div className="flex items-center gap-2"><Icon size={13} className={positive ? 'text-success-300' : warning ? 'text-warning-300' : 'text-brand-300'} /><span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-600">{label}</span></div>
      <p className="mt-2 text-xs leading-5 text-ink-300">{value}</p>
    </div>
  );
}
