alter table public.community_posts
  add column if not exists author_is_admin boolean not null default false;

alter table public.community_comments
  add column if not exists author_is_admin boolean not null default false;

create or replace function public.set_community_author_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.author_is_admin := exists (
    select 1 from public.admin_users where user_id = new.user_id
  );
  return new;
end;
$$;

revoke all on function public.set_community_author_role() from public, anon, authenticated;

drop trigger if exists community_posts_set_author_role on public.community_posts;
create trigger community_posts_set_author_role
before insert or update on public.community_posts
for each row execute function public.set_community_author_role();

drop trigger if exists community_comments_set_author_role on public.community_comments;
create trigger community_comments_set_author_role
before insert or update on public.community_comments
for each row execute function public.set_community_author_role();

update public.community_posts post
set author_is_admin = exists (
  select 1 from public.admin_users admin where admin.user_id = post.user_id
);

update public.community_comments comment
set author_is_admin = exists (
  select 1 from public.admin_users admin where admin.user_id = comment.user_id
);
