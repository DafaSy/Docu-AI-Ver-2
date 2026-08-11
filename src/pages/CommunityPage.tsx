import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowBigDown,
  ArrowBigUp,
  ArrowRight,
  Flag,
  MessageCircle,
  Pencil,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import { normalizeRemoteImageUrl } from '../lib/remoteImages';

type Author = { author_name?: string; author_avatar_url?: string | null; author_is_admin?: boolean };
type Comment = {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
} & Author;
type Post = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  image_url?: string | null;
  is_official?: boolean;
  created_at: string;
  votes?: { user_id: string; value: number }[];
  comments?: Comment[];
} & Author;

const fallbackUpdates = [
  {
    date: 'July 2026',
    title: 'DocuAI community is now open',
    copy: 'A home for product updates, feedback, and ideas from people building their document workspace.',
  },
  {
    date: 'July 2026',
    title: 'Document Library gets organization tools',
    copy: 'Categories, tags, favorites, previews, and saved conversation history are now available.',
  },
];

export function CommunityPage() {
  const { user, isAdmin, displayName } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'blog' | 'support'>('blog');
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [comment, setComment] = useState<Record<string, string>>({});
  const [editingPost, setEditingPost] = useState<string>();
  const [editingComment, setEditingComment] = useState<string>();
  const [notice, setNotice] = useState('');

  const officialUpdates = useMemo(
    () => allPosts.filter((post) => post.is_official),
    [allPosts],
  );
  const feedbackPosts = useMemo(
    () => allPosts.filter((post) => !post.is_official),
    [allPosts],
  );

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('community_posts')
      .select('*, votes:community_votes(user_id,value), comments:community_comments(id,content,user_id,created_at,author_name,author_avatar_url,author_is_admin)')
      .order('created_at', { ascending: false });
    const resolvedName = displayName || user?.user_metadata?.name || user?.email?.split('@')[0];
    const posts = ((data ?? []) as Post[]).map((post) => ({
      ...post,
      ...(post.user_id === user?.id && resolvedName ? { author_name: resolvedName, author_is_admin: isAdmin } : {}),
      comments: post.comments?.map((item) => ({
        ...item,
        ...(item.user_id === user?.id && resolvedName ? { author_name: resolvedName, author_is_admin: isAdmin } : {}),
      })),
    }));
    setAllPosts(posts);
  }, [displayName, isAdmin, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const mustLogin = () => {
    if (user) return true;
    navigate('/login');
    return false;
  };

  const author = () => ({
    author_name:
      user?.user_metadata?.display_name ||
      user?.user_metadata?.name ||
      user?.email?.split('@')[0] ||
      'DocuAI member',
    author_avatar_url: user?.user_metadata?.avatar_url || null,
  });

  const publish = async () => {
    if (!mustLogin() || !title.trim() || !content.trim()) return;
    await supabase.from('community_posts').insert({
      user_id: user!.id,
      title: title.trim(),
      content: content.trim(),
      is_official: false,
      ...author(),
    });
    setTitle('');
    setContent('');
    setNotice('Feedback published.');
    void load();
  };

  const vote = async (post: Post, value: number) => {
    if (!mustLogin()) return;
    const current = post.votes?.find((item) => item.user_id === user!.id);
    if (current?.value === value) {
      await supabase.from('community_votes').delete().eq('post_id', post.id).eq('user_id', user!.id);
    } else {
      await supabase.from('community_votes').upsert({ post_id: post.id, user_id: user!.id, value });
    }
    void load();
  };

  const reportPost = async (postId: string) => {
    if (!mustLogin()) return;
    const { error } = await supabase.from('community_reports').upsert({
      post_id: postId,
      reporter_id: user!.id,
      reason: 'Reported from the community feed.',
      status: 'open',
    }, { onConflict: 'post_id,reporter_id' });
    setNotice(error ? error.message : 'Report sent to the moderation team.');
  };

  const addComment = async (postId: string) => {
    if (!mustLogin() || !comment[postId]?.trim()) return;
    await supabase.from('community_comments').insert({
      post_id: postId,
      user_id: user!.id,
      content: comment[postId].trim(),
      ...author(),
    });
    setComment((current) => ({ ...current, [postId]: '' }));
    void load();
  };

  const updatePost = async (post: Post) => {
    if (!title.trim() || !content.trim()) return;
    await supabase
      .from('community_posts')
      .update({ title: title.trim(), content: content.trim() })
      .eq('id', post.id);
    setEditingPost(undefined);
    setTitle('');
    setContent('');
    void load();
  };

  const deletePost = async (post: Post) => {
    if (!window.confirm('Delete this post?')) return;
    await supabase.from('community_posts').delete().eq('id', post.id);
    void load();
  };

  const editComment = async (item: Comment) => {
    const next = comment[item.id]?.trim();
    if (!next) return;
    await supabase.from('community_comments').update({ content: next }).eq('id', item.id);
    setEditingComment(undefined);
    setComment((current) => ({ ...current, [item.id]: '' }));
    void load();
  };

  const deleteComment = async (item: Comment) => {
    if (!window.confirm('Delete this comment?')) return;
    await supabase.from('community_comments').delete().eq('id', item.id);
    void load();
  };

  return (
    <main className="min-h-screen bg-ink-950 text-ink-100">
      <section className="mx-auto max-w-4xl px-5 pb-24 pt-16 text-center">
        <div data-export-section="hero">
          <p className="inline-flex gap-2 rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-1 text-xs text-brand-200">
            <Sparkles size={13} /> Build DocuAI with us
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Updates, ideas, and help from the community.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-ink-400">
            Follow official releases, share product feedback, and discuss ideas with other DocuAI users.
          </p>

          <div className="mt-10 flex gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
            <button onClick={() => setTab('blog')} className={`flex-1 rounded-lg py-2.5 text-sm transition ${tab === 'blog' ? 'bg-white/10 text-white' : 'text-ink-500 hover:text-ink-300'}`}>
              Product blog
            </button>
            <button onClick={() => setTab('support')} className={`flex-1 rounded-lg py-2.5 text-sm transition ${tab === 'support' ? 'bg-white/10 text-white' : 'text-ink-500 hover:text-ink-300'}`}>
              Support & feedback
            </button>
          </div>
        </div>

        {notice && (
          <button onClick={() => setNotice('')} className="mt-4 w-full rounded-xl border border-brand-400/15 bg-brand-500/[0.08] px-4 py-3 text-left text-xs text-brand-200">
            {notice}
          </button>
        )}

        {tab === 'blog' ? (
          <div data-export-section="product-blog" className="mt-7 space-y-4 text-left">
            {officialUpdates.length ? officialUpdates.map((post) => (
              <article key={post.id} className="group overflow-hidden rounded-2xl border border-brand-400/15 bg-white/[0.035] transition hover:-translate-y-0.5 hover:border-brand-300/30 hover:bg-white/[0.05]">
                {post.image_url && (
                  <Link to={`/community/post/${post.id}`} className="block overflow-hidden border-b border-white/10">
                    <img src={normalizeRemoteImageUrl(post.image_url)} alt="" loading="lazy" referrerPolicy="no-referrer" className="aspect-[16/7] w-full object-cover transition duration-500 group-hover:scale-[1.015]" />
                  </Link>
                )}
                <div className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <AuthorLine author={post} date={post.created_at} official />
                    {isAdmin && post.user_id === user?.id && (
                      <button onClick={() => void deletePost(post)} className="rounded-lg p-2 text-ink-500 transition hover:bg-danger-500/10 hover:text-danger-300" aria-label="Delete update">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <Link to={`/community/post/${post.id}`} className="block rounded-lg outline-none ring-brand-400/50 focus-visible:ring-2">
                    <h2 className="mt-5 text-2xl font-semibold tracking-tight text-white transition group-hover:text-brand-100">{post.title}</h2>
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-ink-400">{post.content}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-brand-300">Read update <ArrowRight size={14} /></span>
                  </Link>
                </div>
              </article>
            )) : fallbackUpdates.map((post) => (
              <article key={post.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-xs text-brand-300">{post.date}</p>
                <h2 className="mt-3 text-xl font-semibold text-white">{post.title}</h2>
                <p className="mt-2 text-sm leading-6 text-ink-400">{post.copy}</p>
              </article>
            ))}
          </div>
        ) : (
          <div data-export-section="support-feedback" className="mt-7 text-left">
            <div className="rounded-2xl border border-brand-400/20 bg-brand-500/5 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-white"><Plus size={16} /> Share feedback</p>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What would you like to improve?" className="admin-input mt-4" />
              <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Describe your idea, issue, or feedback..." className="admin-input mt-3 min-h-24 resize-y" />
              <button onClick={() => void publish()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400"><Send size={14} /> Publish feedback</button>
            </div>

            <div className="mt-5 space-y-4">
              {feedbackPosts.map((post) => {
                const own = post.user_id === user?.id;
                const score = post.votes?.reduce((sum, item) => sum + item.value, 0) ?? 0;
                const edit = editingPost === post.id;
                return (
                  <article key={post.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <button onClick={() => void vote(post, 1)} className="text-ink-500 hover:text-success-300"><ArrowBigUp /></button>
                        <b className="text-sm">{score}</b>
                        <button onClick={() => void vote(post, -1)} className="text-ink-500 hover:text-danger-300"><ArrowBigDown /></button>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-3">
                          <AuthorLine author={post} date={post.created_at} />
                          <div className="flex gap-1">
                            {!own && (
                              <button onClick={() => void reportPost(post.id)} className="rounded p-1.5 text-ink-500 hover:text-warning-300" aria-label="Report post"><Flag size={14} /></button>
                            )}
                            {own && (
                              <>
                                <button onClick={() => { setEditingPost(post.id); setTitle(post.title); setContent(post.content); }} className="rounded p-1.5 text-ink-500 hover:text-brand-300"><Pencil size={14} /></button>
                                <button onClick={() => void deletePost(post)} className="rounded p-1.5 text-ink-500 hover:text-danger-300"><Trash2 size={14} /></button>
                              </>
                            )}
                          </div>
                        </div>
                        {edit ? (
                          <>
                            <input value={title} onChange={(event) => setTitle(event.target.value)} className="admin-input mt-4" />
                            <textarea value={content} onChange={(event) => setContent(event.target.value)} className="admin-input mt-2 min-h-24" />
                            <button onClick={() => void updatePost(post)} className="mt-2 rounded-lg bg-brand-500 px-3 py-1.5 text-xs text-white">Save changes</button>
                          </>
                        ) : (
                          <>
                            <h2 className="mt-4 font-semibold text-white">{post.title}</h2>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-400">{post.content}</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                      {post.comments?.map((item) => {
                        const ownComment = item.user_id === user?.id;
                        const edit = editingComment === item.id;
                        return (
                          <div key={item.id} className="rounded-xl bg-black/20 p-3">
                            <div className="flex justify-between">
                              <AuthorLine author={item} date={item.created_at} />
                              {ownComment && (
                                <div className="flex">
                                  <button onClick={() => { setEditingComment(item.id); setComment((current) => ({ ...current, [item.id]: item.content })); }} className="p-1 text-ink-500 hover:text-brand-300"><Pencil size={13} /></button>
                                  <button onClick={() => void deleteComment(item)} className="p-1 text-ink-500 hover:text-danger-300"><Trash2 size={13} /></button>
                                </div>
                              )}
                            </div>
                            {edit ? (
                              <>
                                <input value={comment[item.id] ?? ''} onChange={(event) => setComment((current) => ({ ...current, [item.id]: event.target.value }))} className="admin-input mt-2 py-1.5 text-xs" />
                                <button onClick={() => void editComment(item)} className="mt-2 rounded bg-brand-500 px-2 py-1 text-[11px] text-white">Save</button>
                              </>
                            ) : <p className="mt-2 text-xs leading-5 text-ink-300">{item.content}</p>}
                          </div>
                        );
                      })}
                      <div className="flex gap-2">
                        <input value={comment[post.id] ?? ''} onChange={(event) => setComment((current) => ({ ...current, [post.id]: event.target.value }))} placeholder="Write a comment..." className="admin-input min-w-0 flex-1 py-2 text-xs" />
                        <button onClick={() => void addComment(post.id)} className="rounded-lg border border-white/10 px-3 text-ink-300 transition hover:border-brand-400/30 hover:text-brand-200"><MessageCircle size={14} /></button>
                      </div>
                    </div>
                  </article>
                );
              })}
              {!feedbackPosts.length && (
                <div className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-ink-500">
                  No feedback posts yet. Start the first conversation.
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Avatar({ author }: { author: Author }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-400/30 bg-brand-500/15 text-brand-200">
      {author.author_avatar_url
        ? <img src={author.author_avatar_url} alt="" className="h-full w-full object-cover" />
        : <UserRound size={15} />}
    </span>
  );
}

function AuthorLine({ author, date, official = false }: { author: Author; date: string; official?: boolean }) {
  const verifiedAdmin = official || author.author_is_admin;
  return (
    <div className="flex items-center gap-2">
      <Avatar author={author} />
      <div>
        <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-ink-200">
          {author.author_name || (official ? 'DocuAI Team' : 'DocuAI member')}
          {verifiedAdmin && (
            <span title="Verified DocuAI administrator" className="inline-flex items-center gap-1 rounded-full border border-brand-400/20 bg-brand-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-brand-200">
              <ShieldCheck size={10} className="text-brand-300" /> Admin
            </span>
          )}
        </p>
        <p className="text-[10px] text-ink-600">{new Date(date).toLocaleString()}</p>
      </div>
    </div>
  );
}
