import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Check, Clock3, Loader2, Share2, ShieldCheck, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { normalizeRemoteImageUrl } from '../lib/remoteImages';

type OfficialPost = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  author_is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export function CommunityPostPage() {
  const { postId } = useParams();
  const [post, setPost] = useState<OfficialPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const loadPost = async () => {
      if (!postId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('community_posts')
        .select('id,title,content,image_url,author_name,author_avatar_url,author_is_admin,created_at,updated_at')
        .eq('id', postId)
        .eq('is_official', true)
        .maybeSingle();

      if (!active) return;
      if (error || !data) setNotFound(true);
      else setPost(data as OfficialPost);
      setLoading(false);
    };

    void loadPost();
    return () => { active = false; };
  }, [postId]);

  useEffect(() => {
    if (!post) return;
    const previous = document.title;
    document.title = `${post.title} · DocuAI`;
    return () => { document.title = previous; };
  }, [post]);

  const share = async () => {
    if (!post) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.content.slice(0, 140), url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  };

  if (loading) {
    return <main className="flex min-h-[65vh] items-center justify-center"><Loader2 size={21} className="animate-spin text-brand-300" /></main>;
  }

  if (notFound || !post) {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center px-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">Update unavailable</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">This article could not be found.</h1>
        <p className="mt-3 text-sm text-ink-400">It may have been removed or is not an official public update.</p>
        <Link to="/community" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink-950"><ArrowLeft size={15} /> Back to community</Link>
      </main>
    );
  }

  const readingMinutes = Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200));

  return (
    <main className="min-h-screen bg-ink-950 pb-24 text-ink-100">
      <article>
        <header className="relative overflow-hidden border-y border-white/[0.07]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(51,128,252,0.15),transparent_42%)]" />
          <div className="relative mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
            <Link to="/community" className="inline-flex items-center gap-2 text-xs font-medium text-ink-500 transition hover:text-white"><ArrowLeft size={14} /> Community</Link>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-200"><ShieldCheck size={12} /> Official update</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-500"><CalendarDays size={13} /> {formatLongDate(post.created_at)}</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-500"><Clock3 size={13} /> {readingMinutes} min read</span>
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-white sm:text-6xl">{post.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-ink-400">{excerpt(post.content)}</p>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-brand-400/25 bg-brand-500/10 text-brand-200">
                  {post.author_avatar_url ? <img src={post.author_avatar_url} alt="" className="h-full w-full object-cover" /> : <UserRound size={17} />}
                </span>
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-white">
                    {post.author_name || 'DocuAI Team'}
                    <span title="Verified DocuAI administrator" className="inline-flex items-center gap-1 rounded-full border border-brand-400/20 bg-brand-500/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-brand-200"><ShieldCheck size={10} /> Admin</span>
                  </p>
                  <p className="text-xs text-ink-600">Product & engineering updates</p>
                </div>
              </div>
              <button onClick={() => void share()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-ink-300 transition hover:bg-white/10 hover:text-white">
                {copied ? <Check size={14} className="text-success-300" /> : <Share2 size={14} />}{copied ? 'Link copied' : 'Share article'}
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-5 pt-8 sm:px-8 sm:pt-12">
          {post.image_url && (
            <figure className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] shadow-[0_30px_100px_rgba(0,0,0,0.32)]">
              <img src={normalizeRemoteImageUrl(post.image_url)} alt={post.title} referrerPolicy="no-referrer" className="max-h-[680px] w-full object-cover" />
            </figure>
          )}

          <div className="mx-auto mt-10 grid max-w-4xl gap-10 lg:grid-cols-[minmax(0,1fr)_190px]">
            <div className="space-y-6 text-[17px] leading-8 text-ink-300">
              {post.content.split(/\n{2,}/).filter(Boolean).map((paragraph, index) => (
                <p key={index} className="whitespace-pre-wrap">{paragraph}</p>
              ))}
            </div>
            <aside className="h-fit rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 lg:sticky lg:top-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-300">About this update</p>
              <p className="mt-3 text-xs leading-5 text-ink-500">Published by the verified DocuAI team. Images are served from their original public HTTPS source.</p>
              <Link to="/community" className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-white">More updates <ArrowLeft size={13} className="rotate-180" /></Link>
            </aside>
          </div>
        </div>
      </article>
    </main>
  );
}

function excerpt(content: string) {
  const first = content.split(/\n+/).find((line) => line.trim())?.trim() || '';
  return first.length > 220 ? `${first.slice(0, 217)}...` : first;
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date(value));
}
