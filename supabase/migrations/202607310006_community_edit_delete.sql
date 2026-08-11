create policy "Users delete their own community posts"
  on public.community_posts for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users update their own community comments"
  on public.community_comments for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete their own community comments"
  on public.community_comments for delete to authenticated
  using ((select auth.uid()) = user_id);
