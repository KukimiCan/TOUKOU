-- The existing questions RLS exposes only published rows to anon.
-- These columns let the answers policy check publication without a callable
-- security-definer function.
grant select (id, is_public) on public.questions to anon;

drop policy "Anyone can answer a published question" on public.answers;
create policy "Anyone can answer a published question"
on public.answers for insert to anon, authenticated
with check (
  exists (
    select 1 from public.questions as q
    where q.id = answers.question_id
      and q.is_public = true
      and q.share_id is not null
  )
);

drop function public.is_published_question(uuid);
