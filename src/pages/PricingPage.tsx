import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowLeft, ArrowRight, Building2, Check, FileText, FolderOpen, Gauge, MousePointer2, Sparkles, UserRound, Zap, type LucideIcon } from 'lucide-react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const workspaces = [
  {
    title: 'CV Review',
    eyebrow: 'Career workspace',
    description: 'Find strengths before your next application.',
    file: 'Resume_Dafa.pdf',
    surface: 'from-sky-100 via-blue-100 to-indigo-200 text-slate-900',
    icon: 'border-slate-900/10 bg-white/35',
    fileSurface: 'border-slate-900/10 bg-white/45',
  },
  {
    title: 'Research Notes',
    eyebrow: 'Study workspace',
    description: 'Trace arguments across readings and notes.',
    file: 'thesis-notes.pdf',
    surface: 'from-slate-200 via-violet-200 to-indigo-300 text-slate-900',
    icon: 'border-slate-900/10 bg-white/35',
    fileSurface: 'border-slate-900/10 bg-white/45',
  },
  {
    title: 'Project Brief',
    eyebrow: 'Product workspace',
    description: 'Keep product decisions connected to evidence.',
    file: 'roadmap.csv',
    surface: 'from-violet-200 via-purple-200 to-fuchsia-200 text-slate-900',
    icon: 'border-slate-900/10 bg-white/35',
    fileSurface: 'border-slate-900/10 bg-white/45',
  },
  {
    title: 'Portfolio',
    eyebrow: 'Creative workspace',
    description: 'Make project stories easier to revisit.',
    file: 'portfolio.pdf',
    surface: 'from-emerald-100 via-green-100 to-lime-200 text-slate-900',
    icon: 'border-slate-900/10 bg-white/35',
    fileSurface: 'border-slate-900/10 bg-white/45',
  },
  {
    title: 'Legal Review',
    eyebrow: 'Secure workspace',
    description: 'Surface clauses and important deadlines quickly.',
    file: 'agreement.pdf',
    surface: 'from-amber-100 via-amber-100 to-orange-200 text-slate-900',
    icon: 'border-slate-900/10 bg-white/35',
    fileSurface: 'border-slate-900/10 bg-white/45',
  },
  {
    title: 'Data Snapshot',
    eyebrow: 'Analytics workspace',
    description: 'Ask clear questions about structured data.',
    file: 'metrics.csv',
    surface: 'from-blue-200 via-indigo-200 to-violet-300 text-slate-900',
    icon: 'border-slate-900/10 bg-white/35',
    fileSurface: 'border-slate-900/10 bg-white/45',
  },
] as const;

const plans = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    description: 'A calm place to start building your private knowledge base.',
    features: ['Private document library', 'PDF, TXT, and CSV uploads', 'Basic AI chat', 'Conversation history'],
    cta: 'Start free',
    icon: UserRound,
    color: '#dcecff',
    ink: '#09152e',
  },
  {
    name: 'Pro',
    price: 'Coming soon',
    cadence: 'priority access',
    description: 'More context, stronger retrieval, and deeper document workflows.',
    features: ['Everything in Free', 'Larger document library', 'Multi-document chat', 'Page-level citations', 'Priority processing'],
    cta: 'Join waitlist',
    icon: Zap,
    color: '#d9c5ff',
    ink: '#160b2b',
  },
  {
    name: 'Team',
    price: 'Roadmap',
    cadence: 'built for collaboration',
    description: 'Shared document intelligence with roles, activity, and team context.',
    features: ['Everything in Pro', 'Shared workspaces', 'Roles and permissions', 'Team activity log', 'Centralized source governance'],
    cta: 'Follow updates',
    icon: Building2,
    color: '#bdf5e5',
    ink: '#071d19',
  },
] as const;

export function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const start = () => navigate(user ? '/app' : '/signup');

  return (
    <main className="docuai-header-palette min-h-screen overflow-x-hidden text-ink-100">
      <section data-export-section="hero" className="relative px-4 pb-14 pt-12 text-center sm:px-8 sm:pb-20 sm:pt-24">
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[780px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[110px]" />
        <p className="inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-500/10 px-3 py-1 text-xs text-brand-200">
          <Sparkles size={13} />
          Simple pricing, private by design
        </p>
        <h1 className="relative mt-6 text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-white min-[380px]:text-5xl sm:text-7xl">
          Start focused.
          <br /><span className="bg-gradient-to-r from-brand-300 via-violet-400 to-accent-400 bg-clip-text text-transparent">Scale when context grows.</span>
        </h1>
        <p className="relative mx-auto mt-6 max-w-xl text-sm leading-relaxed text-ink-400 sm:text-base">
          Start with a secure document library today. Upgrade when your workflow needs more context and capacity.
        </p>
      </section>

      <section data-export-section="workspaces" className="border-y border-white/10 bg-[#090b10]/80 py-12 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px]">
          <p className="mb-8 text-center text-xs font-medium tracking-wide text-ink-500">
            ONE WORKSPACE. MANY WAYS TO WORK WITH YOUR DOCUMENTS.
          </p>

          <div className="workspace-marquee-viewport overflow-hidden px-5 pb-10 pt-2">
            <div className="workspace-marquee flex w-max">
              {[0, 1].map((groupIndex) => (
                <div key={groupIndex} className="flex shrink-0 gap-5 pr-5 lg:gap-6 lg:pr-6" aria-hidden={groupIndex === 1}>
                  {workspaces.map((workspace) => (
                    <WorkspaceCard key={`${groupIndex}-${workspace.title}`} workspace={workspace} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PricingDeck onStart={start} />
      <UsageEstimator onStart={start} />

      <section data-export-section="cta" className="mx-auto max-w-5xl px-5 pb-24 pt-4 text-center sm:px-8">
        <div className="rounded-3xl border border-brand-400/20 bg-gradient-to-br from-brand-500/10 via-white/[0.035] to-violet-500/10 p-8 shadow-[0_28px_90px_rgba(69,52,146,0.12)] sm:p-12">
          <Sparkles className="mx-auto text-brand-300" size={22} />
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Your first workspace is free.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-400">Build your library now. The plan can grow later without losing your documents or conversation history.</p>
          <button onClick={start} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(91,67,230,0.22)] transition hover:brightness-110">Open DocuAI <ArrowRight size={15} /></button>
        </div>
      </section>
    </main>
  );
}

function PricingDeck({ onStart }: { onStart: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(1);
  const [paused, setPaused] = useState(false);

  const move = (direction: number) => setActiveIndex((current) => (current + direction + plans.length) % plans.length);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => move(1), 4800);
    return () => window.clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    if (!paused || dragStart.current !== null) return;
    const timer = window.setTimeout(() => setPaused(false), 5200);
    return () => window.clearTimeout(timer);
  }, [activeIndex, paused]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const cards = gsap.utils.toArray<HTMLElement>('[data-plan-card]', stage);
    const compact = window.matchMedia('(max-width: 767px)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cards.forEach((card, index) => {
      let distance = index - activeIndex;
      if (distance > plans.length / 2) distance -= plans.length;
      if (distance < -plans.length / 2) distance += plans.length;
      gsap.to(card, {
        x: distance * (compact ? 110 : 285),
        y: Math.abs(distance) * (compact ? 28 : 38),
        z: Math.abs(distance) * -170,
        rotationY: distance * -18,
        rotationZ: distance * 2.5,
        scale: distance === 0 ? 1 : 0.86,
        opacity: distance === 0 ? 1 : 0.62,
        zIndex: distance === 0 ? 20 : 10 - Math.abs(distance),
        duration: reduced ? 0 : 0.8,
        ease: 'power3.out',
      });
    });
  }, [activeIndex]);

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    const delta = event.clientX - dragStart.current;
    dragStart.current = null;
    gsap.to(stageRef.current, { rotationY: 0, x: 0, duration: 0.5, ease: 'power3.out' });
    if (Math.abs(delta) > 48) move(delta < 0 ? 1 : -1);
    window.setTimeout(() => setPaused(false), 2400);
  };

  return (
    <section data-export-section="plans" className="relative overflow-hidden px-4 py-16 sm:px-8 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/[0.09] blur-[120px]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="text-center"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">Interactive plans</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Pick a plan by feel, not by pressure.</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-ink-400">Click a card, drag the deck, or let it rotate automatically. Your documents remain portable between every stage.</p></div>

        <div
          ref={stageRef}
          tabIndex={0}
          onKeyDown={(event) => { if (event.key === 'ArrowRight') { setPaused(true); move(1); } if (event.key === 'ArrowLeft') { setPaused(true); move(-1); } }}
          onPointerDown={(event) => { dragStart.current = event.clientX; setPaused(true); event.currentTarget.setPointerCapture(event.pointerId); }}
          onPointerMove={(event) => { if (dragStart.current === null) return; const delta = event.clientX - dragStart.current; gsap.to(stageRef.current, { rotationY: delta / 30, x: delta * 0.07, duration: 0.2 }); }}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          className="relative mx-auto mt-10 h-[570px] max-w-6xl cursor-grab touch-pan-y select-none outline-none active:cursor-grabbing sm:mt-12 sm:h-[650px]"
          style={{ perspective: '1500px', transformStyle: 'preserve-3d' }}
          aria-label="Pricing plan carousel. Use arrow keys or drag to navigate."
        >
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const active = index === activeIndex;
            return (
              <article key={plan.name} data-plan-card onClick={() => { setPaused(true); setActiveIndex(index); }} className="absolute left-1/2 top-0 flex h-[530px] w-[min(calc(100vw-48px),390px)] -translate-x-1/2 flex-col overflow-hidden rounded-[26px] border border-black/10 p-5 shadow-[0_38px_100px_rgba(31,22,72,0.26)] will-change-transform sm:h-[560px] sm:rounded-[30px] sm:p-8" style={{ background: plan.color, color: plan.ink, transformStyle: 'preserve-3d' }}>
                <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-55">DocuAI plan · 0{index + 1}</span><span className={`rounded-full border border-current/10 bg-white/25 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] transition ${active ? 'opacity-70' : 'opacity-40'}`}>{active ? 'Selected' : 'Explore'}</span></div>
                <div className="mt-6 flex items-start justify-between gap-4 sm:mt-8"><div><p className="text-2xl font-semibold tracking-tight">{plan.name}</p><p className="mt-1 text-xs font-medium opacity-55">{plan.cadence}</p></div><span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-white/30 shadow-sm sm:h-14 sm:w-14" style={{ transform: 'translateZ(34px)' }}><Icon size={22} /></span></div>
                <p className="mt-6 text-3xl font-semibold tracking-[-0.04em] sm:mt-8 sm:text-4xl">{plan.price}</p>
                <p className="mt-3 min-h-12 text-sm leading-6 opacity-65">{plan.description}</p>
                <div className="mt-5 space-y-2.5 border-t border-black/10 pt-5 sm:mt-7 sm:space-y-3 sm:pt-6">{plan.features.map((feature) => <p key={feature} className="flex items-start gap-2.5 text-[13px] font-medium opacity-75 sm:text-sm"><span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/10"><Check size={10} /></span>{feature}</p>)}</div>
                <button onClick={(event) => { event.stopPropagation(); onStart(); }} className="theme-inverse mt-auto flex w-full items-center justify-between rounded-2xl bg-black/85 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-black"><span>{plan.cta}</span><ArrowRight size={16} /></button>
              </article>
            );
          })}
        </div>

        <div className="relative -mt-8 flex flex-col items-center gap-4 sm:-mt-4">
          <div className="flex items-center gap-3"><button onClick={() => { setPaused(true); move(-1); }} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-ink-400 transition hover:border-brand-400/30 hover:text-white" aria-label="Previous plan"><ArrowLeft size={16} /></button><div className="flex gap-2">{plans.map((plan, index) => <button key={plan.name} onClick={() => { setPaused(true); setActiveIndex(index); }} aria-label={`Select ${plan.name}`} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-10 bg-violet-500' : 'w-5 bg-white/15 hover:bg-white/30'}`} />)}</div><button onClick={() => { setPaused(true); move(1); }} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-ink-400 transition hover:border-brand-400/30 hover:text-white" aria-label="Next plan"><ArrowRight size={16} /></button></div>
          <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.13em] text-ink-600"><MousePointer2 size={12} /> Drag or click to move the deck</p>
        </div>
      </div>
    </section>
  );
}

function UsageEstimator({ onStart }: { onStart: () => void }) {
  const orbitRef = useRef<HTMLDivElement>(null);
  const [documents, setDocuments] = useState(25);
  const [questions, setQuestions] = useState(100);
  const [members, setMembers] = useState(1);
  const recommendation = members > 5 ? plans[2] : documents > 25 || questions > 100 || members > 1 ? plans[1] : plans[0];
  const score = Math.min(100, Math.round((documents / 500) * 40 + (questions / 1000) * 40 + (members / 25) * 20));

  useLayoutEffect(() => {
    if (!orbitRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const context = gsap.context(() => {
      gsap.to('[data-orbit-ring]', { rotationZ: 360, duration: 16, repeat: -1, ease: 'none', stagger: { each: 1.3, from: 'end' } });
      gsap.to('[data-orbit-core]', { y: -10, rotationY: 12, duration: 2.4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }, orbitRef);
    return () => context.revert();
  }, []);

  return (
    <section data-export-section="estimator" className="border-y border-white/10 bg-gradient-to-r from-brand-950/15 via-white/[0.025] to-violet-600/10 px-4 py-16 sm:px-8 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-[0_26px_80px_rgba(46,35,100,0.12)] backdrop-blur-xl sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">Workspace fit estimator</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">Shape the plan around your work.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-ink-400">Adjust expected usage. This is a product-fit guide, not a billing quote—paid pricing remains unannounced.</p>
          <div className="mt-8 space-y-7">
            <RangeControl icon={FileText} label="Documents" value={documents} min={5} max={500} step={5} suffix=" files" onChange={setDocuments} />
            <RangeControl icon={Sparkles} label="AI questions" value={questions} min={10} max={1000} step={10} suffix=" / month" onChange={setQuestions} />
            <RangeControl icon={UserRound} label="Workspace members" value={members} min={1} max={25} step={1} suffix={members === 1 ? ' person' : ' people'} onChange={setMembers} />
          </div>
        </div>

        <div className="theme-inverse relative overflow-hidden rounded-3xl border border-brand-400/20 bg-gradient-to-br from-[#111a3f] via-[#292069] to-[#6040d4] p-6 text-white shadow-[0_30px_100px_rgba(69,52,146,0.25)] sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(160,139,255,0.34),transparent_28%)]" />
          <div className="relative flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200">Recommended fit</p><h3 className="mt-2 text-3xl font-semibold">{recommendation.name}</h3><p className="mt-1 text-xs text-violet-200/70">Based on your expected workspace shape</p></div><Gauge size={22} className="text-violet-200" /></div>
          <div ref={orbitRef} className="relative mx-auto my-7 h-48 w-48" style={{ perspective: '900px' }}><div data-orbit-ring className="absolute inset-1 rounded-[42%] border border-violet-200/25" /><div data-orbit-ring className="absolute inset-5 rotate-45 rounded-[38%] border border-cyan-200/25" /><div data-orbit-ring className="absolute inset-9 -rotate-12 rounded-[35%] border border-white/20" /><div data-orbit-core className="absolute inset-12 flex items-center justify-center rounded-3xl border border-white/20 bg-white/15 text-center shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-md"><div><p className="text-4xl font-semibold">{score}</p><p className="text-[9px] uppercase tracking-[0.15em] text-violet-100/70">usage signal</p></div></div></div>
          <div className="relative grid grid-cols-3 gap-2"><EstimatorMetric value={documents} label="Files" /><EstimatorMetric value={questions} label="Questions" /><EstimatorMetric value={members} label="Members" /></div>
          <button onClick={onStart} className="relative mt-5 flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#171133] transition hover:bg-violet-50"><span>{recommendation.cta}</span><ArrowRight size={15} /></button>
        </div>
      </div>
    </section>
  );
}

function RangeControl({ icon: Icon, label, value, min, max, step, suffix, onChange }: { icon: LucideIcon; label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (value: number) => void }) {
  const percentage = ((value - min) / (max - min)) * 100;
  return <label className="block"><span className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 font-medium text-ink-300"><Icon size={15} className="text-brand-300" />{label}</span><strong className="text-white">{value}{suffix}</strong></span><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="pricing-range mt-3 w-full" style={{ '--range-progress': `${percentage}%` } as CSSProperties} /></label>;
}

function EstimatorMetric({ value, label }: { value: number; label: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/10 px-2 py-3 text-center backdrop-blur"><p className="text-sm font-semibold text-white">{value}</p><p className="mt-1 text-[8px] uppercase tracking-[0.12em] text-violet-100/60">{label}</p></div>;
}

function WorkspaceCard({ workspace }: { workspace: (typeof workspaces)[number] }) {
  return (
    <article
      className={`group relative flex h-[330px] w-[220px] shrink-0 cursor-default flex-col overflow-hidden rounded-[22px] border border-white/20 bg-gradient-to-br p-4 shadow-[0_16px_36px_rgba(0,0,0,0.18)] transition-all duration-500 ease-out hover:z-10 hover:-translate-y-2 hover:scale-[1.035] hover:border-white/50 hover:shadow-[0_24px_60px_rgba(51,128,252,0.22)] sm:h-[360px] sm:w-[248px] sm:rounded-[24px] sm:p-5 ${workspace.surface}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.34),transparent_43%)] opacity-70 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex min-h-4 items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.09em] opacity-65">{workspace.eyebrow}</p>
        <span className="h-2 w-2 rounded-full bg-current opacity-40 transition duration-500 group-hover:scale-150 group-hover:opacity-75" />
      </div>

      <div className="relative mt-7">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-sm sm:h-16 sm:w-16 ${workspace.icon}`}>
          <FileText size={26} strokeWidth={2.1} />
        </div>
        <h2 className="mt-4 min-h-[52px] text-2xl font-semibold leading-[1.02] tracking-[-0.045em] sm:min-h-[58px] sm:text-[28px]">{workspace.title}</h2>
        <p className="mt-2 min-h-[54px] max-w-[195px] text-[13px] leading-5 opacity-70 sm:min-h-[60px] sm:text-sm">{workspace.description}</p>
      </div>

      <div className="relative mt-auto pb-1 pt-4">
        <div className={`flex min-h-12 items-center gap-2 rounded-xl border px-3.5 py-3 text-xs font-semibold shadow-sm backdrop-blur-sm ${workspace.fileSurface}`}>
          <FolderOpen size={15} strokeWidth={2} className="shrink-0" />
          <span className="min-w-0 truncate">{workspace.file}</span>
        </div>
      </div>
    </article>
  );
}
