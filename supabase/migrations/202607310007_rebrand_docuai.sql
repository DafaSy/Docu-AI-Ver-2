alter table public.community_posts
  alter column author_name set default 'DocuAI member';

alter table public.community_comments
  alter column author_name set default 'DocuAI member';

update public.community_posts
set author_name = 'DocuAI member'
where author_name ~ '^Docu[m]?AI member$'
  and author_name <> 'DocuAI member';

update public.community_comments
set author_name = 'DocuAI member'
where author_name ~ '^Docu[m]?AI member$'
  and author_name <> 'DocuAI member';
