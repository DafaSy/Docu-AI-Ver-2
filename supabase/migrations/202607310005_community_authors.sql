alter table public.community_posts
  add column if not exists author_name text not null default 'DocuAI member',
  add column if not exists author_avatar_url text;
alter table public.community_comments
  add column if not exists author_name text not null default 'DocuAI member',
  add column if not exists author_avatar_url text;
