-- Keep privileged lookups outside the schemas exposed by the Data API.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create function private.is_published_question(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.questions as q
    where q.id = target_id and q.is_public = true and q.share_id is not null
  );
$$;

revoke all on function private.is_published_question(uuid) from public, anon, authenticated;
grant execute on function private.is_published_question(uuid) to anon, authenticated;

-- The exposed wrapper runs as the caller. Only its private implementation can
-- read the question table, and that implementation requires the exact share ID.
create function private.get_shared_question(target_share_id text)
returns table (prompt text, choices jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select q.prompt, q.choices
  from public.questions as q
  where q.share_id = target_share_id
    and q.is_public = true
  limit 1;
$$;

revoke all on function private.get_shared_question(text) from public, anon, authenticated;
grant execute on function private.get_shared_question(text) to anon, authenticated;

create function public.get_shared_question(target_share_id text)
returns table (prompt text, choices jsonb)
language sql
stable
security invoker
set search_path = ''
as $$
  select shared.prompt, shared.choices
  from private.get_shared_question(target_share_id) as shared;
$$;

revoke all on function public.get_shared_question(text) from public, anon, authenticated;
grant execute on function public.get_shared_question(text) to anon, authenticated;

-- Answer insertion still checks publication without granting question SELECT.
drop policy "Anyone can answer a published question" on public.answers;
create policy "Anyone can answer a published question"
on public.answers for insert to anon, authenticated
with check (private.is_published_question(question_id));

drop policy "Anyone can read published questions" on public.questions;
revoke select on public.questions from anon;
revoke select (id, is_public, share_id, prompt, choices) on public.questions from anon;
