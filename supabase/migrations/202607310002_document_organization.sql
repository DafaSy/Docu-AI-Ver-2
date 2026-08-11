-- Document organization metadata. Run in the Supabase SQL Editor.
alter table public.documents
  add column if not exists category text not null default 'Uncategorized',
  add column if not exists tags text[] not null default '{}',
  add column if not exists is_favorite boolean not null default false;

create index if not exists documents_user_favorite_updated_idx
  on public.documents (user_id, is_favorite desc, updated_at desc);
create index if not exists documents_tags_idx
  on public.documents using gin (tags);
