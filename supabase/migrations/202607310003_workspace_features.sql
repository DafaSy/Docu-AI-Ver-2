-- Workspace preferences and document activity log.
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  language text not null default 'id' check (language in ('id', 'en')),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_activities (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists document_activities_user_created_idx on public.document_activities (user_id, created_at desc);
create index if not exists document_activities_document_created_idx on public.document_activities (document_id, created_at desc);

alter table public.user_preferences enable row level security;
alter table public.document_activities enable row level security;
create policy "Users manage their own preferences" on public.user_preferences for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users read their own document activity" on public.document_activities for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add their own document activity" on public.document_activities for insert to authenticated with check ((select auth.uid()) = user_id);

create or replace function public.log_document_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  record_id uuid := coalesce(new.id, old.id);
  owner_id uuid := coalesce(new.user_id, old.user_id);
  event_name text := case tg_op when 'INSERT' then 'uploaded' when 'DELETE' then 'deleted' else 'updated' end;
begin
  insert into public.document_activities (user_id, document_id, action, details)
  values (owner_id, record_id, event_name, jsonb_build_object('fileName', coalesce(new.file_name, old.file_name)));
  return coalesce(new, old);
end;
$$;
drop trigger if exists documents_activity_log on public.documents;
create trigger documents_activity_log after insert or update or delete on public.documents for each row execute function public.log_document_activity();
