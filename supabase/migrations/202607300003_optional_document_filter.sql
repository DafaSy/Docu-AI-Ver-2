-- Allow the n8n retrieval tool to always send documentId in its metadata
-- filter. An empty documentId means search every document owned by the user.
create or replace function public.match_document_chunks(
  query_embedding extensions.vector(3072),
  match_count integer default 3,
  filter jsonb default '{}'::jsonb
)
returns table (id bigint, content text, metadata jsonb, similarity real)
language sql
stable
set search_path = public, extensions
as $$
  select
    document_chunks.id,
    document_chunks.content,
    document_chunks.metadata,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from public.document_chunks
  where document_chunks.metadata @> (filter - 'documentId')
    and (
      coalesce(filter ->> 'documentId', '') = ''
      or document_chunks.metadata ->> 'documentId' = filter ->> 'documentId'
    )
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;

revoke all on function public.match_document_chunks(extensions.vector, integer, jsonb) from public, anon, authenticated;
grant execute on function public.match_document_chunks(extensions.vector, integer, jsonb) to service_role;
