import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  Database,
  FileText,
  Flag,
  Image,
  Loader2,
  Megaphone,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import { normalizeRemoteImageUrl } from '../lib/remoteImages';

type Metrics = {
  total_users: number;
  active_users_30d: number;
  total_documents: number;
  storage_bytes: number;
  failed_workflows: number;
  ai_responses: number;
  ai_responses_30d: number;
  open_reports: number;
  document_types: Record<string, number>;
  recent_errors: Array<{
    source: string;
    item: string;
    message: string;
    occurred_at: string;
  }>;
};

type OfficialPost = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
};

type CommunityReport = {
  id: string;
  post_id: string;
  reason: string;
  status: string;
  created_at: string;
  post: { title?: string; author_name?: string } | null;
};

const emptyMetrics: Metrics = {
  total_users: 0,
  active_users_30d: 0,
  total_documents: 0,
  storage_bytes: 0,
  failed_workflows: 0,
  ai_responses: 0,
  ai_responses_30d: 0,
  open_reports: 0,
  document_types: {},
  recent_errors: [],
};

export function AdminPage() {
  const navigate = useNavigate();
  const { user, loading, isAdmin, adminLoading, displayName } = useAuth();
  const [metrics, setMetrics] = useState<Metrics>(emptyMetrics);
  const [updates, setUpdates] = useState<OfficialPost[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login?mode=admin', { replace: true });
    if (!loading && !adminLoading && user && !isAdmin) navigate('/app', { replace: true });
  }, [adminLoading, isAdmin, loading, navigate, user]);

  const loadDashboard = useCallback(async (quiet = false) => {
    if (!user || !isAdmin) return;
    quiet ? setRefreshing(true) : setPageLoading(true);
    setError('');

    const [metricsResult, updatesResult, reportsResult] = await Promise.all([
      supabase.rpc('get_admin_dashboard_metrics'),
      supabase
        .from('community_posts')
        .select('id,title,content,image_url,created_at')
        .eq('is_official', true)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('community_reports')
        .select('id,post_id,reason,status,created_at,post:community_posts(title,author_name)')
        .in('status', ['open', 'reviewing'])
        .order('created_at', { ascending: false })
        .limit(12),
    ]);

    if (metricsResult.error || updatesResult.error || reportsResult.error) {
      setError(
        metricsResult.error?.message ||
        updatesResult.error?.message ||
        reportsResult.error?.message ||
        'Could not load the admin dashboard.',
      );
    } else {
      setMetrics({ ...emptyMetrics, ...(metricsResult.data as Metrics) });
      setUpdates((updatesResult.data ?? []) as OfficialPost[]);
      setReports((reportsResult.data ?? []) as unknown as CommunityReport[]);
    }

    setPageLoading(false);
    setRefreshing(false);
  }, [isAdmin, user]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const publishUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !title.trim() || !content.trim()) return;

    const cleanImageUrl = normalizeRemoteImageUrl(imageUrl);
    if (cleanImageUrl && !/^https:\/\//i.test(cleanImageUrl)) {
      setError('Image URL must start with https://');
      return;
    }

    setPublishing(true);
    setError('');
    setNotice('');
    const { error: publishError } = await supabase.from('community_posts').insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      image_url: cleanImageUrl || null,
      is_official: true,
      author_name: displayName || 'DocuAI Team',
      author_avatar_url: user.user_metadata?.avatar_url ?? null,
    });

    if (publishError) {
      setError(publishError.message);
    } else {
      setTitle('');
      setContent('');
      setImageUrl('');
      setNotice('Official community update published.');
      await loadDashboard(true);
    }
    setPublishing(false);
  };

  const deleteUpdate = async (postId: string) => {
    const { error: deleteError } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId);
    if (deleteError) setError(deleteError.message);
    else {
      setNotice('Official update deleted.');
      setUpdates((current) => current.filter((post) => post.id !== postId));
    }
  };

  const resolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    const { error: reportError } = await supabase
      .from('community_reports')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', reportId);
    if (reportError) setError(reportError.message);
    else {
      setReports((current) => current.filter((report) => report.id !== reportId));
      setMetrics((current) => ({
        ...current,
        open_reports: Math.max(0, current.open_reports - 1),
      }));
      setNotice(`Report ${status}.`);
    }
  };

  const fileBreakdown = useMemo(
    () => Object.entries(metrics.document_types ?? {}).sort((a, b) => b[1] - a[1]),
    [metrics.document_types],
  );

  if (loading || adminLoading || pageLoading) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-ink-400">
          <Loader2 className="animate-spin text-brand-300" size={20} />
          Loading secure admin workspace...
        </div>
      </main>
    );
  }

  if (!user || !isAdmin) return null;

  const cards = [
    { label: 'Total users', value: metrics.total_users, detail: `${metrics.active_users_30d} active in 30 days`, icon: Users },
    { label: 'Documents', value: metrics.total_documents, detail: formatBytes(metrics.storage_bytes), icon: FileText },
    { label: 'Workflow failures', value: metrics.failed_workflows, detail: 'Documents requiring attention', icon: AlertTriangle },
    { label: 'AI responses', value: metrics.ai_responses, detail: `${metrics.ai_responses_30d} in 30 days`, icon: Bot },
    { label: 'Open reports', value: metrics.open_reports, detail: 'Community moderation queue', icon: Flag },
    { label: 'Active users', value: metrics.active_users_30d, detail: 'Last 30 days', icon: Activity },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <section data-export-section="hero" className="relative overflow-hidden rounded-3xl border border-brand-400/15 bg-[#0a111d] p-6 sm:p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-brand-500/15 blur-[90px]" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-200">
              <ShieldCheck size={13} /> Restricted access
            </span>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Admin control center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-400">
              Monitor DocuAI health, publish trusted updates, and keep the community safe from one workspace.
            </p>
          </div>
          <button
            onClick={() => void loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-ink-200 transition hover:bg-white/10 disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh data
          </button>
        </div>
      </section>

      {(error || notice) && (
        <div className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
          error
            ? 'border-danger-500/30 bg-danger-500/10 text-danger-200'
            : 'border-success-500/25 bg-success-500/10 text-success-200'
        }`}>
          {error || notice}
        </div>
      )}

      <section data-export-section="metrics" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, detail, icon: Icon }) => (
          <article key={label} className="group rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 transition hover:-translate-y-0.5 hover:border-brand-400/25 hover:bg-white/[0.055]">
            <div className="flex items-start justify-between">
              <p className="text-sm text-ink-400">{label}</p>
              <span className="rounded-xl border border-white/10 bg-white/5 p-2 text-brand-300">
                <Icon size={17} />
              </span>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value.toLocaleString()}</p>
            <p className="mt-1.5 text-xs text-ink-500">{detail}</p>
          </article>
        ))}
      </section>

      <section data-export-section="publishing-storage" className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-brand-500/10 p-2 text-brand-300"><Megaphone size={18} /></span>
            <div>
              <h2 className="font-semibold text-white">Publish community update</h2>
              <p className="text-xs text-ink-500">Text is stored in Supabase; images stay on their HTTPS origin.</p>
            </div>
          </div>

          <form onSubmit={publishUpdate} className="mt-5 space-y-4">
            <Field label="Title">
              <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} placeholder="What changed in DocuAI?" className="admin-input" />
            </Field>
            <Field label="Update">
              <textarea value={content} onChange={(event) => setContent(event.target.value)} required rows={5} maxLength={4000} placeholder="Explain the release, improvement, or announcement..." className="admin-input resize-y" />
            </Field>
            <Field label="Remote image URL" hint="Optional. HTTPS only.">
              <div className="relative">
                <Image size={16} className="absolute left-3.5 top-3 text-ink-500" />
                <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} type="url" placeholder="https://images.example.com/update.jpg" className="admin-input pl-10" />
              </div>
            </Field>
            {imageUrl.trim() && /^https:\/\//i.test(imageUrl.trim()) && (
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                <img src={normalizeRemoteImageUrl(imageUrl)} alt="Update preview" referrerPolicy="no-referrer" className="max-h-72 w-full object-cover" />
                <p className="border-t border-white/10 px-3 py-2 text-[11px] text-ink-500">Preview uses the public image rendition. Google Drive files must be shared with “Anyone with the link”.</p>
              </div>
            )}
            <button disabled={publishing} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-brand-100 disabled:opacity-60">
              {publishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Publish official update
            </button>
          </form>
        </article>

        <article className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-accent-500/10 p-2 text-accent-300"><Database size={18} /></span>
            <div>
              <h2 className="font-semibold text-white">Document storage</h2>
              <p className="text-xs text-ink-500">Library composition by file type.</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {fileBreakdown.length ? fileBreakdown.map(([type, count]) => {
              const width = metrics.total_documents ? Math.max(6, count / metrics.total_documents * 100) : 0;
              return (
                <div key={type}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium uppercase text-ink-300">{type || 'unknown'}</span>
                    <span className="text-ink-500">{count} files</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            }) : (
              <EmptyLine icon={BarChart3} text="No document data yet." />
            )}
          </div>
        </article>
      </section>

      <section data-export-section="moderation" className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-semibold text-white"><Flag size={17} className="text-warning-300" /> Community reports</h2>
          <div className="mt-5 space-y-3">
            {reports.length ? reports.map((report) => (
              <div key={report.id} className="rounded-xl border border-white/[0.08] bg-black/15 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-white">{report.post?.title || 'Deleted community post'}</p>
                    <p className="mt-1 text-xs text-ink-500">by {report.post?.author_name || 'Unknown'} · {formatDate(report.created_at)}</p>
                  </div>
                  <span className="rounded-full border border-warning-500/20 bg-warning-500/10 px-2.5 py-1 text-[10px] uppercase tracking-wide text-warning-300">{report.status}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink-300">{report.reason}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => void resolveReport(report.id, 'resolved')} className="inline-flex items-center gap-1.5 rounded-lg bg-success-500/10 px-3 py-1.5 text-xs text-success-300 transition hover:bg-success-500/20"><CheckCircle2 size={13} /> Resolve</button>
                  <button onClick={() => void resolveReport(report.id, 'dismissed')} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-ink-400 transition hover:text-white">Dismiss</button>
                </div>
              </div>
            )) : <EmptyLine icon={CheckCircle2} text="The moderation queue is clear." />}
          </div>
        </article>

        <article className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-semibold text-white"><AlertTriangle size={17} className="text-danger-300" /> Recent errors</h2>
          <div className="mt-5 space-y-3">
            {metrics.recent_errors?.length ? metrics.recent_errors.map((item, index) => (
              <div key={`${item.source}-${item.occurred_at}-${index}`} className="rounded-xl border border-white/[0.08] bg-black/15 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-danger-500/20 bg-danger-500/10 px-2.5 py-1 text-[10px] uppercase tracking-wide text-danger-300">{item.source}</span>
                  <span className="text-[11px] text-ink-600">{formatDate(item.occurred_at)}</span>
                </div>
                <p className="mt-2 truncate text-sm font-medium text-ink-200">{item.item}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-500">{item.message}</p>
              </div>
            )) : <EmptyLine icon={CheckCircle2} text="No recent application errors." />}
          </div>
        </article>
      </section>

      <section data-export-section="updates" className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
        <h2 className="font-semibold text-white">Official update history</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {updates.length ? updates.map((post) => (
            <div key={post.id} className="flex gap-3 rounded-xl border border-white/[0.08] bg-black/15 p-3">
              {post.image_url ? (
                <img src={normalizeRemoteImageUrl(post.image_url)} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-16 w-20 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300"><Megaphone size={18} /></span>
              )}
              <div className="min-w-0 flex-1">
                <Link to={`/community/post/${post.id}`} className="block truncate text-sm font-medium text-white transition hover:text-brand-200">{post.title}</Link>
                <p className="mt-1 line-clamp-2 text-xs text-ink-500">{post.content}</p>
                <p className="mt-1 text-[10px] text-ink-600">{formatDate(post.created_at)}</p>
              </div>
              <button onClick={() => void deleteUpdate(post.id)} aria-label={`Delete ${post.title}`} className="self-start rounded-lg p-2 text-ink-600 transition hover:bg-danger-500/10 hover:text-danger-300">
                <Trash2 size={14} />
              </button>
            </div>
          )) : <EmptyLine icon={Megaphone} text="No official updates published yet." />}
        </div>
      </section>
    </main>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-xs font-medium text-ink-300">
        {label}
        {hint && <span className="font-normal text-ink-600">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function EmptyLine({ icon: Icon, text }: { icon: typeof Activity; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 px-4 py-6 text-sm text-ink-500">
      <Icon size={17} className="text-ink-600" />
      {text}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B stored';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]} stored`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
