create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke insert, update, delete on public.admin_users from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

drop policy if exists "Admins read their membership" on public.admin_users;
create policy "Admins read their membership"
  on public.admin_users for select to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.admin_users to authenticated;

alter table public.community_posts
  add column if not exists image_url text,
  add column if not exists is_official boolean not null default false;

alter table public.community_posts
  drop constraint if exists community_posts_image_url_check;
alter table public.community_posts
  add constraint community_posts_image_url_check
  check (image_url is null or image_url ~* '^https://');

drop policy if exists "Users create their own community posts" on public.community_posts;
create policy "Users create their own community posts"
  on public.community_posts for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (not is_official or public.is_admin())
  );

drop policy if exists "Users update their own community posts" on public.community_posts;
create policy "Users update their own community posts"
  on public.community_posts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (not is_official or public.is_admin())
  );

drop policy if exists "Public reads official updates" on public.community_posts;
create policy "Public reads official updates"
  on public.community_posts for select to anon
  using (is_official);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null default 'Reported from community feed'
    check (char_length(reason) between 3 and 500),
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

alter table public.community_reports enable row level security;

drop policy if exists "Users create their own reports" on public.community_reports;
create policy "Users create their own reports"
  on public.community_reports for insert to authenticated
  with check ((select auth.uid()) = reporter_id);

drop policy if exists "Users read their own reports" on public.community_reports;
create policy "Users read their own reports"
  on public.community_reports for select to authenticated
  using ((select auth.uid()) = reporter_id or public.is_admin());

drop policy if exists "Admins update reports" on public.community_reports;
create policy "Admins update reports"
  on public.community_reports for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins delete reports" on public.community_reports;
create policy "Admins delete reports"
  on public.community_reports for delete to authenticated
  using (public.is_admin());

grant select, insert, update, delete on public.community_reports to authenticated;

create index if not exists community_reports_status_created_idx
  on public.community_reports (status, created_at desc);
create index if not exists community_posts_official_created_idx
  on public.community_posts (is_official, created_at desc);

create or replace function public.get_admin_dashboard_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total_users', (select count(*) from auth.users),
    'active_users_30d', (
      select count(*)
      from auth.users
      where last_sign_in_at >= now() - interval '30 days'
    ),
    'total_documents', (select count(*) from public.documents),
    'storage_bytes', (select coalesce(sum(file_size), 0) from public.documents),
    'failed_workflows', (
      select count(*)
      from public.documents
      where processing_status = 'failed'
    ),
    'ai_responses', (
      select count(*)
      from public.messages
      where role = 'assistant'
    ),
    'ai_responses_30d', (
      select count(*)
      from public.messages
      where role = 'assistant'
        and created_at >= now() - interval '30 days'
    ),
    'open_reports', (
      select count(*)
      from public.community_reports
      where status in ('open', 'reviewing')
    ),
    'document_types', coalesce((
      select jsonb_object_agg(file_type, total)
      from (
        select upper(file_type) as file_type, count(*) as total
        from public.documents
        group by upper(file_type)
      ) types
    ), '{}'::jsonb),
    'recent_errors', coalesce((
      select jsonb_agg(to_jsonb(errors))
      from (
        select source, item, message, occurred_at
        from (
          select
            'Document workflow'::text as source,
            file_name::text as item,
            coalesce(error_message, 'Processing failed')::text as message,
            updated_at as occurred_at
          from public.documents
          where processing_status = 'failed'

          union all

          select
            'AI chat'::text as source,
            'Conversation message'::text as item,
            left(content, 240)::text as message,
            created_at as occurred_at
          from public.messages
          where role = 'error'
        ) combined_errors
        order by occurred_at desc
        limit 10
      ) errors
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_admin_dashboard_metrics() from public, anon;
grant execute on function public.get_admin_dashboard_metrics() to authenticated, service_role;
