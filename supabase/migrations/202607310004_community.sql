  create table if not exists public.community_posts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null check (char_length(title) between 3 and 120),
    content text not null check (char_length(content) between 3 and 2000),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
  create table if not exists public.community_votes (
    post_id uuid not null references public.community_posts(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    value smallint not null check (value in (-1, 1)),
    created_at timestamptz not null default now(),
    primary key (post_id, user_id)
  );
  create table if not exists public.community_comments (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references public.community_posts(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    content text not null check (char_length(content) between 1 and 1000),
    created_at timestamptz not null default now()
  );
  alter table public.community_posts enable row level security;
  alter table public.community_votes enable row level security;
  alter table public.community_comments enable row level security;
  create policy "Anyone signed in reads community posts" on public.community_posts for select to authenticated using (true);
  create policy "Users create their own community posts" on public.community_posts for insert to authenticated with check ((select auth.uid()) = user_id);
  create policy "Users update their own community posts" on public.community_posts for update to authenticated using ((select auth.uid()) = user_id);
  create policy "Anyone signed in reads community votes" on public.community_votes for select to authenticated using (true);
  create policy "Users manage their own vote" on public.community_votes for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  create policy "Anyone signed in reads community comments" on public.community_comments for select to authenticated using (true);
  create policy "Users create their own comments" on public.community_comments for insert to authenticated with check ((select auth.uid()) = user_id);
