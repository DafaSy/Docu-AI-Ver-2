import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, BrainCircuit, Briefcase, Check, ChevronRight, FileCheck2, FileText, FolderKanban, GraduationCap, History, Layers3, LockKeyhole, MessageSquare, Send, ShieldCheck, Sparkles, Workflow, type LucideIcon } from 'lucide-react';
import { gsap } from 'gsap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const workspaceScenarios = [
  {
    label: 'Career',
    title: 'Application review',
    description: 'Turn a CV, cover letter, and portfolio into focused preparation.',
    icon: Briefcase,
    prompt: 'What strengths should I emphasize for this product role?',
    answer: 'Lead with full-stack delivery, cross-functional project leadership, and evidence of continuous learning. Your portfolio supports this with a shipped capstone project.',
    files: [
      ['Dafa_CV.pdf', 'Experience · 2 pages'],
      ['Cover_letter.pdf', 'Motivation · 1 page'],
      ['Portfolio.pdf', 'Projects · 4 pages'],
    ],
    action: ['Extract strengths', 'Match the role', 'Draft talking points'],
    citation: 'Dafa_CV.pdf · Page 2',
  },
  {
    label: 'Study',
    title: 'Research synthesis',
    description: 'Find arguments, compare sources, and build a clearer study plan.',
    icon: GraduationCap,
    prompt: 'Compare the two arguments about energy transition policy.',
    answer: 'Both sources support international coordination. The research brief prioritizes financing, while the lecture notes emphasize local implementation and accountability.',
    files: [
      ['Energy_policy.pdf', 'Article · 18 pages'],
      ['Lecture_notes.txt', 'Notes · 12 topics'],
      ['Reading_list.pdf', 'References · 5 pages'],
    ],
    action: ['Compare claims', 'Generate flashcards', 'List open questions'],
    citation: 'Energy_policy.pdf · Page 7',
  },
  {
    label: 'Projects',
    title: 'Decision desk',
    description: 'Keep product requirements, plans, and important decisions together.',
    icon: Layers3,
    prompt: 'What should the team decide before the next release?',
    answer: 'Confirm the onboarding metric, approve the ownership model, and resolve the two open dependencies before committing to the release date.',
    files: [
      ['Product_brief.pdf', 'Brief · 6 pages'],
      ['Roadmap.csv', 'Timeline · 16 items'],
      ['Meeting_notes.txt', 'Decisions · 9 notes'],
    ],
    action: ['Summarize risks', 'Find decisions', 'Create next steps'],
    citation: 'Product_brief.pdf · Page 4',
  },
] as const;

const technologyStack = [
  {
    name: 'React',
    company: 'UI library',
    layer: 'Interface',
    role: 'Builds the interactive document library, chat, and public pages.',
    logo: 'https://cdn.simpleicons.org/react/61DAFB',
  },
  {
    name: 'TypeScript',
    company: 'Application language',
    layer: 'Interface',
    role: 'Keeps data contracts and application logic predictable as features grow.',
    logo: 'https://cdn.simpleicons.org/typescript/3178C6',
  },
  {
    name: 'Vite',
    company: 'Build system',
    layer: 'Interface',
    role: 'Provides a fast local development experience and optimized production builds.',
    logo: 'https://cdn.simpleicons.org/vite/646CFF',
  },
  {
    name: 'Tailwind CSS',
    company: 'Design system',
    layer: 'Interface',
    role: 'Powers the responsive visual system and reusable interface states.',
    logo: 'https://cdn.simpleicons.org/tailwindcss/06B6D4',
  },
  {
    name: 'Supabase',
    company: 'Backend platform',
    layer: 'Data & identity',
    role: 'Handles authentication, private file storage, database access, and edge functions.',
    logo: 'https://cdn.simpleicons.org/supabase/3ECF8E',
  },
  {
    name: 'PostgreSQL',
    company: 'Database + pgvector',
    layer: 'Data & identity',
    role: 'Stores document metadata, chat history, community data, and vector embeddings.',
    logo: 'https://cdn.simpleicons.org/postgresql/4169E1',
  },
  {
    name: 'Deno',
    company: 'Edge runtime',
    layer: 'Data & identity',
    role: 'Runs the secure Supabase functions that connect the app to external workflows.',
    logo: 'https://cdn.simpleicons.org/deno/FFFFFF',
  },
  {
    name: 'n8n',
    company: 'Workflow automation',
    layer: 'AI orchestration',
    role: 'Processes uploads, chunks documents, retrieves context, and coordinates AI responses.',
    logo: 'https://cdn.simpleicons.org/n8n/EA4B71',
  },
  {
    name: 'Google Gemini',
    company: 'AI model',
    layer: 'AI orchestration',
    role: 'Generates grounded answers from the document context retrieved by the workflow.',
    logo: 'https://cdn.simpleicons.org/googlegemini/8E75B2',
  },
] as const;

const confidenceSteps: Array<{ kicker: string; title: string; description: string; icon: LucideIcon; accent: string; ink: string }> = [
  { kicker: '01 · Organize', title: 'One library', description: 'Bring PDFs, notes, and structured files into one private, searchable home.', icon: FolderKanban, accent: '#8ec5ff', ink: '#07111f' },
  { kicker: '02 · Understand', title: 'Ask naturally', description: 'Turn a question into semantic retrieval across the sources that matter.', icon: BrainCircuit, accent: '#8ff3db', ink: '#071713' },
  { kicker: '03 · Verify', title: 'Trace the answer', description: 'Keep filename and page context close to every grounded response.', icon: ShieldCheck, accent: '#d9c4ff', ink: '#150c24' },
  { kicker: '04 · Continue', title: 'Keep momentum', description: 'Return to saved conversations without rebuilding the same context again.', icon: History, accent: '#f7e0a6', ink: '#201604' },
];

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const start = () => navigate(user ? '/app' : '/signup');

  return (
    <main className="docuai-header-palette min-h-screen overflow-x-hidden text-ink-100">
      <section data-export-section="hero" className="mx-auto max-w-6xl px-5 pb-20 pt-16 text-center sm:px-8 sm:pt-24">
        <p className="inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-1 text-xs text-brand-200">
          <Sparkles size={13} /> Your private AI document workspace
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-white min-[380px]:text-5xl sm:text-7xl">
          Welcome to <span className="docuai-glow bg-gradient-to-r from-brand-300 via-white to-violet-300 bg-clip-text text-transparent">DocuAI.</span>
          <br />
          Ask better questions.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-300 sm:text-lg">
          Upload important documents, keep them private, and turn them into clear answers with an AI assistant that understands your context.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={start} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(51,128,252,0.28)] transition hover:brightness-110">
            Try DocuAI <ArrowRight size={16} />
          </button>
          <a href="#product" className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm text-ink-200">Explore workspace</a>
        </div>

        <div className="mx-auto mt-16 max-w-5xl text-left">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0f1422]/90 p-4 shadow-[0_30px_120px_rgba(3,8,20,0.55)] sm:p-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(68,141,255,0.24),transparent_28%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_30%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="absolute -left-12 top-10 h-40 w-40 rounded-full bg-brand-500/15 blur-3xl motion-safe:animate-[float_8s_ease-in-out_infinite]" />
            <div className="absolute -right-10 bottom-2 h-32 w-32 rounded-full bg-accent-500/15 blur-3xl motion-safe:animate-[float_10s_ease-in-out_infinite]" />

            <div className="relative grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="rounded-[22px] border border-white/10 bg-black/25 p-4 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">Document library</p>
                    <p className="mt-1 text-xs text-ink-400">Live context, ready to cite</p>
                  </div>
                  <span className="rounded-full border border-success-400/20 bg-success-500/10 px-2 py-1 text-[10px] font-semibold uppercase text-success-300">Synced</span>
                </div>

                <div className="mt-4 space-y-2.5">
                  {['Research brief.pdf', 'Product roadmap.csv', 'Project notes.txt'].map((name, index) => (
                    <button
                      key={name}
                      className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition duration-200 ${index === 0 ? 'border-brand-400/40 bg-brand-500/12 shadow-[0_0_0_1px_rgba(68,141,255,0.1)]' : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'}`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${index === 0 ? 'bg-brand-500/20 text-brand-300' : 'bg-white/5 text-ink-400'}`}>
                        <FileText size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">{name}</span>
                        <span className="mt-0.5 block text-[11px] text-ink-500">
                          {index === 0 ? '3 relevant chunks' : index === 1 ? '2 summaries' : '1 note thread'}
                        </span>
                      </span>
                      <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-ink-400 group-hover:text-white">Open</span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-ink-400">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">PDF</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Search</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Citations</span>
                </div>
              </aside>

              <section className="rounded-[22px] border border-white/10 bg-black/20 p-4 backdrop-blur-xl sm:p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/25 to-accent-500/20 text-brand-200">
                      <Workflow size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Assistant workspace</p>
                      <p className="text-xs text-ink-500">Source-aware conversation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-success-400 shadow-[0_0_18px_rgba(74,222,128,0.8)]" />
                    <span className="text-[11px] text-ink-500">Live</span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-3xl border border-brand-400/20 bg-brand-500/10 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-200">Prompt</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['Summarize the risks', 'Show page citations', 'Compare sources', 'Draft next steps'].map((chip, index) => (
                        <button
                          key={chip}
                          className={`rounded-full border px-3 py-1.5 text-[11px] transition ${index === 0 ? 'border-brand-300/40 bg-white text-ink-950' : 'border-white/15 bg-white/5 text-ink-200 hover:bg-white/10'}`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                    <p className="mt-4 rounded-3xl bg-white/10 px-4 py-3 text-sm text-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
                      What are the three main recommendations?
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">Answer</p>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-ink-400">Page 4</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-ink-200">
                      Prioritize onboarding, reduce manual steps, and measure retention weekly.
                    </p>
                    <div className="mt-4 space-y-2">
                      <SourcePill label="Research brief.pdf" meta="Page 4" active />
                      <SourcePill label="Product roadmap.csv" meta="Budget + milestones" />
                      <SourcePill label="Project notes.txt" meta="Open questions" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <MetricCard label="Relevant chunks" value="12" tone="brand" />
                  <MetricCard label="Confidence" value="94%" tone="success" />
                  <MetricCard label="Response time" value="1.8s" tone="accent" />
                </div>
              </section>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-ink-500">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"><span className="h-2 w-2 rounded-full bg-brand-400" /> drag to explore</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"><span className="h-2 w-2 rounded-full bg-success-400" /> grounded answers</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"><span className="h-2 w-2 rounded-full bg-accent-400" /> source citations</span>
            </div>
          </div>
        </div>
      </section>

      <section id="product" data-export-section="product" className="border-y border-white/10 bg-gradient-to-r from-brand-950/25 via-white/[0.025] to-accent-600/10">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 md:grid-cols-2">
          <div>
            <p className="text-sm text-brand-300">ONE PLACE FOR YOUR DOCUMENTS</p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">From scattered files to useful knowledge.</h2>
          </div>
          <div className="space-y-4 text-ink-300">
            <p>DocuAI turns PDFs, text files, and CSVs into a private library you can search, organize, preview, and discuss.</p>
            {['Private document storage', 'Source-aware AI chat', 'Persistent conversation history'].map((item) => (
              <p key={item} className="flex gap-2 text-sm"><Check size={16} className="text-success-300" />{item}</p>
            ))}
          </div>
        </div>
      </section>

      <section id="use-cases" data-export-section="use-cases" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <p className="text-center text-sm text-brand-300">USE CASES</p>
        <h2 className="mt-3 text-center text-3xl font-semibold text-white sm:text-4xl">One workspace. Different kinds of clarity.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-ink-400">Choose a scenario to see how DocuAI keeps the right sources, question, and answer in one focused place.</p>
        <UseCaseStudio />
      </section>

      <ConfidenceDeck onStart={start} />
      <TechnologyStackSection onStart={start} />

      <section id="security" data-export-section="security" className="mx-auto max-w-4xl px-5 pb-20 pt-20 text-center sm:px-8 sm:pt-24">
        <div className="rounded-2xl border border-brand-400/20 bg-gradient-to-br from-brand-500/15 via-white/[0.04] to-accent-500/10 p-8 shadow-[0_24px_80px_rgba(51,128,252,0.12)] sm:p-12">
          <LockKeyhole className="mx-auto text-brand-300" size={24} />
          <h2 className="mt-4 text-3xl font-semibold text-white">Your documents stay yours.</h2>
          <p className="mt-3 text-sm text-ink-300">Access is scoped to your account. Start when you are ready.</p>
          <button onClick={start} className="mt-7 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink-950">Get started</button>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black/20">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="font-semibold text-white">DocuAI</p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-500">A private AI workspace for the documents that drive your work.</p>
            </div>
            <FooterSection title="Explore" links={[['Product', '#product'], ['Use cases', '#use-cases'], ['About', '/about']]} />
            <FooterSection title="Coming next" links={[['Multi-document chat', '/about'], ['Page-level citations', '/about'], ['Document activity', '/about'], ['Team workspaces', '/about']]} />
            <FooterSection title="Start" links={[['Create workspace', '/signup'], ['Sign in', '/login'], ['Privacy & security', '/about']]} />
          </div>
          <div className="mt-10 flex flex-col justify-between gap-3 border-t border-white/10 pt-5 text-xs text-ink-600 sm:flex-row">
            <span>© {new Date().getFullYear()} DocuAI. Built by Dafa Syachrullah.</span>
            <span>Private by design.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function UseCaseStudio() {
  const [activeScenario, setActiveScenario] = useState(0);
  const [question, setQuestion] = useState<string>(workspaceScenarios[0].prompt);
  const [activeFile, setActiveFile] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const scenario = workspaceScenarios[activeScenario];
  const ScenarioIcon = scenario.icon;

  const selectScenario = (index: number) => {
    setActiveScenario(index);
    setQuestion(workspaceScenarios[index].prompt);
    setActiveFile(0);
    setIsRunning(false);
  };

  const runAnalysis = () => {
    if (isRunning) return;
    setIsRunning(true);
    window.setTimeout(() => setIsRunning(false), 700);
  };

  return (
    <div className="relative mt-10 overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0f19] shadow-[0_28px_110px_rgba(0,0,0,0.42)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(51,128,252,0.18),transparent_26%),radial-gradient(circle_at_94%_100%,rgba(34,211,238,0.12),transparent_25%)]" />
      <div className="relative flex items-center gap-2 border-b border-white/10 bg-white/[0.025] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-danger-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success-400/70" />
        <div className="mx-auto hidden w-full max-w-sm items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] text-ink-500 sm:flex">
          <LockKeyhole size={12} /> app.docuai.ai/workspace
        </div>
        <span className="ml-auto text-[11px] font-medium text-ink-500">Interactive demo</span>
      </div>

      <div className="relative grid min-h-[570px] lg:grid-cols-[220px_minmax(0,1fr)_260px]">
        <aside className="border-b border-white/10 bg-black/15 p-3 lg:border-b-0 lg:border-r">
          <p className="px-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Workspace mode</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {workspaceScenarios.map((item, index) => {
              const Icon = item.icon;
              const active = index === activeScenario;

              return (
                <button
                  key={item.label}
                  onClick={() => selectScenario(index)}
                  className={`group min-w-[168px] rounded-2xl border p-3 text-left transition duration-300 lg:min-w-0 ${active ? 'border-brand-400/45 bg-brand-500/12 shadow-[0_10px_30px_rgba(51,128,252,0.12)]' : 'border-transparent hover:border-white/10 hover:bg-white/[0.04]'}`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? 'bg-brand-500 text-white' : 'bg-white/5 text-ink-400 group-hover:text-ink-200'}`}><Icon size={17} /></span>
                  <span className={`mt-3 block text-sm font-semibold ${active ? 'text-white' : 'text-ink-300'}`}>{item.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-ink-500">{item.title}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-5 hidden rounded-2xl border border-white/10 bg-white/[0.025] p-3 lg:block">
            <p className="text-xs font-medium text-ink-300">Grounded by sources</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-500">Answers stay connected to the documents you selected.</p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-400/25 bg-brand-500/10 text-brand-200"><ScenarioIcon size={19} /></span>
              <div>
                <p className="text-sm font-semibold text-white">{scenario.title}</p>
                <p className="mt-0.5 text-xs text-ink-500">{scenario.description}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-success-400/20 bg-success-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-success-300"><span className="h-1.5 w-1.5 rounded-full bg-success-400" /> Private context</span>
          </div>

          <div className="mt-5 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Ask DocuAI</p>
            <div className="mt-3 rounded-2xl border border-brand-400/20 bg-brand-500/[0.08] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={2}
                className="w-full resize-none bg-transparent text-sm leading-relaxed text-white outline-none placeholder:text-ink-600"
                aria-label="Question for DocuAI"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                <div className="flex flex-wrap gap-1.5">
                  {scenario.action.map((action) => (
                    <button key={action} onClick={() => setQuestion(action)} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-ink-300 transition hover:border-brand-400/40 hover:text-white">{action}</button>
                  ))}
                </div>
                <button onClick={runAnalysis} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-ink-950 transition hover:bg-brand-100">
                  {isRunning ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-ink-950/20 border-t-ink-950" /> Reading sources</> : <>Analyze <Send size={13} /></>}
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2"><MessageSquare size={16} className="text-brand-300" /><p className="text-sm font-semibold text-white">Evidence-based answer</p></div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-ink-400">{isRunning ? 'Searching…' : 'Ready'}</span>
              </div>
              <p className={`mt-4 text-sm leading-6 text-ink-200 transition duration-300 ${isRunning ? 'translate-y-1 opacity-35' : 'translate-y-0 opacity-100'}`}>
                {isRunning ? 'Reading the selected sources and checking the relevant context…' : scenario.answer}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-400/25 bg-brand-500/10 px-2.5 py-1.5 text-[11px] font-medium text-brand-200"><FileCheck2 size={13} /> {scenario.citation}</span>
                <button className="inline-flex items-center gap-1 text-[11px] text-ink-500 transition hover:text-white">View citation <ChevronRight size={13} /></button>
              </div>
            </div>
          </div>
        </section>

        <aside className="border-t border-white/10 bg-black/15 p-4 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Selected sources</p>
            <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-ink-400">{scenario.files.length} files</span>
          </div>
          <div className="mt-4 space-y-2">
            {scenario.files.map(([file, meta], index) => {
              const active = index === activeFile;
              return (
                <button
                  key={file}
                  onClick={() => setActiveFile(index)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition duration-200 ${active ? 'border-brand-400/40 bg-brand-500/10' : 'border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]'}`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-brand-500/20 text-brand-200' : 'bg-white/5 text-ink-400'}`}><FileText size={16} /></span>
                  <span className="min-w-0"><span className="block truncate text-xs font-medium text-white">{file}</span><span className="mt-0.5 block text-[10px] text-ink-500">{meta}</span></span>
                </button>
              );
            })}
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-3.5">
            <p className="text-xs font-semibold text-white">Citation ready</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-500">Every answer can point back to the document that supports it.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ConfidenceDeck({ onStart }: { onStart: () => void }) {
  const rootRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(2);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cards = gsap.utils.toArray<HTMLElement>('[data-confidence-card]', root);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const compact = window.matchMedia('(max-width: 767px)').matches;
    const context = gsap.context(() => {
      cards.forEach((card, index) => {
        const distance = index - activeIndex;
        gsap.to(card, {
          x: compact ? distance * 18 : distance * 150,
          y: Math.abs(distance) * (compact ? 12 : 18),
          rotationZ: compact ? distance * 2.5 : distance * 5.5,
          rotationY: compact ? distance * -3 : distance * -8,
          scale: index === activeIndex ? 1 : Math.max(0.82, 0.94 - Math.abs(distance) * 0.035),
          opacity: Math.abs(distance) > 2 ? 0.35 : 1,
          zIndex: 20 - Math.abs(distance),
          duration: reduced ? 0 : 0.72,
          ease: 'power3.out',
        });
      });
    }, root);
    return () => context.revert();
  }, [activeIndex]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const stage = root?.querySelector<HTMLElement>('[data-deck-stage]');
    if (!root || !stage || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rotateX = gsap.quickTo(stage, 'rotationX', { duration: 0.7, ease: 'power3.out' });
    const rotateY = gsap.quickTo(stage, 'rotationY', { duration: 0.7, ease: 'power3.out' });
    const move = (event: PointerEvent) => {
      const bounds = stage.getBoundingClientRect();
      rotateY(((event.clientX - bounds.left) / bounds.width - 0.5) * 7);
      rotateX(((event.clientY - bounds.top) / bounds.height - 0.5) * -5);
    };
    const leave = () => { rotateX(0); rotateY(0); };
    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerleave', leave);
    return () => { stage.removeEventListener('pointermove', move); stage.removeEventListener('pointerleave', leave); };
  }, []);

  return (
    <section ref={rootRef} data-export-section="confidence" className="relative overflow-hidden border-y border-white/10 bg-[#070a0f] px-5 py-20 sm:px-8 sm:py-28">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-end gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">From file to confidence</p><h2 className="mt-4 text-4xl font-semibold leading-[1.03] tracking-[-0.04em] text-white sm:text-6xl">Four moves.<br /><span className="text-ink-500">One clearer answer.</span></h2></div>
          <div className="lg:justify-self-end"><p className="max-w-xl text-sm leading-7 text-ink-400">This is the missing bridge between product features and the result: how DocuAI changes a scattered file into work you can trust and revisit.</p><button onClick={onStart} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-brand-100">Try the workflow <ArrowRight size={15} /></button></div>
        </div>

        <div data-deck-stage className="relative mx-auto mt-14 h-[460px] max-w-5xl touch-pan-y will-change-transform sm:h-[500px]" style={{ perspective: '1400px', transformStyle: 'preserve-3d' }}>
          {confidenceSteps.map((step, index) => {
            const Icon = step.icon;
            const active = activeIndex === index;
            return (
              <button key={step.title} data-confidence-card type="button" onClick={() => setActiveIndex(index)} aria-pressed={active} className="absolute left-1/2 top-0 flex h-[390px] w-[min(78vw,310px)] -translate-x-1/2 flex-col overflow-hidden rounded-[28px] border border-black/10 p-6 text-left shadow-[0_35px_90px_rgba(0,0,0,0.38)] outline-none ring-white/70 focus-visible:ring-2 sm:h-[430px] sm:w-[330px] sm:p-7" style={{ background: step.accent, color: step.ink, transformStyle: 'preserve-3d' }}>
                <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-60">{step.kicker}</span><span className={`h-2.5 w-2.5 rounded-full transition ${active ? 'scale-100 bg-current opacity-70' : 'scale-75 bg-current opacity-25'}`} /></div>
                <div className="mt-12 flex h-16 w-16 items-center justify-center rounded-2xl border border-black/10 bg-white/30" style={{ transform: 'translateZ(34px)' }}><Icon size={27} /></div>
                <h3 className="mt-9 text-4xl font-semibold leading-none tracking-[-0.05em] sm:text-5xl" style={{ transform: 'translateZ(26px)' }}>{step.title}</h3>
                <span className="mt-auto text-7xl font-semibold leading-none opacity-[0.13]">0{index + 1}</span>
                <p className="mt-3 text-sm font-medium leading-6 opacity-70">{step.description}</p>
              </button>
            );
          })}
        </div>
        <div className="relative -mt-6 flex justify-center gap-2 sm:-mt-2">{confidenceSteps.map((step, index) => <button key={step.title} onClick={() => setActiveIndex(index)} aria-label={`Show ${step.title}`} className={`h-1.5 rounded-full transition-all ${activeIndex === index ? 'w-10 bg-brand-400' : 'w-5 bg-white/15 hover:bg-white/30'}`} />)}</div>
      </div>
    </section>
  );
}

function TechnologyStackSection({ onStart }: { onStart: () => void }) {
  const [activeTechnology, setActiveTechnology] = useState(4);
  const technology = technologyStack[activeTechnology];

  return (
    <section id="technology" data-export-section="technology" className="tech-stack-section relative overflow-hidden border-y border-white/10">
      <div className="pointer-events-none absolute inset-0 opacity-[0.13]" aria-hidden="true">
        <div className="absolute left-4 top-8 font-mono text-[10px] leading-6 text-brand-300">
          [INIT] document workspace ready<br />
          [AUTH] private session verified<br />
          [INDEX] vector search online<br />
          [RAG] grounded response enabled
        </div>
        <div className="absolute right-5 top-10 hidden text-right font-mono text-[10px] leading-6 text-accent-300 md:block">
          storage.private ........ OK<br />
          postgres.rls ........... ON<br />
          n8n.workflow ........ ACTIVE<br />
          citations ........... READY
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.12fr_0.92fr] lg:items-center">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300">The DocuAI stack</p>
            <h2 className="mt-5 text-4xl font-semibold leading-[0.98] tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              One product.
              <br />
              Connected layers.
              <br />
              <span className="text-ink-500">Private context.</span>
            </h2>
            <p className="mt-6 max-w-md text-sm leading-6 text-ink-400">
              Every layer has one job: move a private document from upload to a useful, source-aware answer.
            </p>
            <button
              onClick={onStart}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-brand-100"
            >
              Open workspace <ArrowRight size={15} />
            </button>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500">Works with our stack</p>
              <p className="font-mono text-[10px] text-success-400">● ALL SYSTEMS ONLINE</p>
            </div>
            <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-black/25 sm:grid-cols-3">
              {technologyStack.map((item, index) => {
                const active = activeTechnology === index;

                return (
                  <button
                    key={item.name}
                    onClick={() => setActiveTechnology(index)}
                    className={`group relative flex min-h-[122px] flex-col items-center justify-center border-b border-r border-white/10 p-3 text-center transition duration-300 even:border-r-0 sm:min-h-[132px] sm:even:border-r sm:[&:nth-child(3n)]:border-r-0 sm:[&:nth-child(n+7)]:border-b-0 ${active ? 'bg-brand-500/12 shadow-[inset_0_0_0_1px_rgba(89,163,255,0.38)]' : 'bg-white/[0.015] hover:bg-white/[0.05]'}`}
                    aria-pressed={active}
                  >
                    <span className={`flex h-12 w-12 items-center justify-center rounded-xl border transition duration-300 ${active ? 'scale-105 border-brand-400/40 bg-brand-500/15 shadow-[0_8px_28px_rgba(51,128,252,0.18)]' : 'border-white/10 bg-white/[0.04] group-hover:border-white/20'}`}>
                      <img src={item.logo} alt="" className="h-6 w-6 object-contain" loading="lazy" />
                    </span>
                    <span className={`mt-3 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${active ? 'text-white' : 'text-ink-400 group-hover:text-ink-200'}`}>{item.name}</span>
                    {active && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-success-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="tech-stack-scan relative overflow-hidden rounded-2xl border border-white/10 bg-black/35 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-400/70" />
                <span className="h-2 w-2 rounded-full bg-accent-400/70" />
                <span className="h-2 w-2 rounded-full bg-success-400/70" />
              </div>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-600">Stack inspector</span>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-400/30 bg-brand-500/10">
                  <img src={technology.logo} alt={technology.name} className="h-6 w-6 object-contain" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{technology.name}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{technology.company}</p>
                </div>
                <span className="ml-auto rounded-full border border-success-400/20 bg-success-500/10 px-2 py-1 font-mono text-[9px] text-success-300">CONNECTED</span>
              </div>

              <p className="mt-5 min-h-[72px] text-sm leading-6 text-ink-300">{technology.role}</p>

              <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                <StackRow label="Layer" value={technology.layer} active />
                <StackRow label="Access" value="Private workspace" />
                <StackRow label="Status" value="Production ready" />
              </div>

              <div className="mt-5 rounded-xl border border-brand-400/15 bg-brand-500/[0.06] p-3">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-brand-300">Data path</p>
                  <Workflow size={13} className="text-brand-300" />
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  {['Upload', 'Index', 'Retrieve', 'Answer'].map((stage, index) => (
                    <div key={stage} className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span className="truncate rounded-md bg-white/[0.05] px-1.5 py-1 text-[8px] text-ink-300">{stage}</span>
                      {index < 3 && <ChevronRight size={10} className="shrink-0 text-ink-600" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid overflow-hidden rounded-2xl border border-white/10 bg-black/25 sm:grid-cols-2 lg:grid-cols-4">
          <TechMetric value="9" label="Core technologies" />
          <TechMetric value="3" label="Connected layers" />
          <TechMetric value="1" label="Private data path" />
          <TechMetric value="0" label="Public document access" />
        </div>
      </div>
    </section>
  );
}

function StackRow({ label, value, active = false }: { label: string; value: string; active?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2">
      <span className="text-[11px] text-ink-500">{label}</span>
      <span className={`flex items-center gap-1.5 text-[11px] font-medium ${active ? 'text-brand-200' : 'text-ink-300'}`}>
        {active && <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />}
        {value}
      </span>
    </div>
  );
}

function TechMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-b border-white/10 px-5 py-6 text-center last:border-b-0 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
      <p className="text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-ink-500">{label}</p>
    </div>
  );
}

function SourcePill({ label, meta, active = false }: { label: string; meta: string; active?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 transition ${active ? 'border-brand-400/40 bg-brand-500/10 text-white' : 'border-white/10 bg-white/[0.03] text-ink-300'}`}>
      <span className="min-w-0 truncate text-sm">{label}</span>
      <span className="shrink-0 text-[11px] text-ink-500">{meta}</span>
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: 'brand' | 'success' | 'accent' }) {
  const toneClass = tone === 'success' ? 'text-success-300' : tone === 'accent' ? 'text-accent-300' : 'text-brand-300';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-ink-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function FooterSection({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-300">{title}</p>
      <div className="mt-3 space-y-2.5">
        {links.map(([label, href]) =>
          href.startsWith('/') ? (
            <Link key={label} to={href} className="block text-sm text-ink-500 hover:text-white">{label}</Link>
          ) : (
            <a key={label} href={href} className="block text-sm text-ink-500 hover:text-white">{label}</a>
          ),
        )}
      </div>
    </div>
  );
}
