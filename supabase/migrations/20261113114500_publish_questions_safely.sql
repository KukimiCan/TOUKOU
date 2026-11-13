-- Public visitors may read only the fields needed to display a question.
-- Correct answers and explanations stay available to the owner and answer API.
grant usage on schema public to anon;
grant select (share_id, prompt, choices) on public.questions to anon;

create policy "Anyone can read published questions"
on public.questions for select to anon
using (is_public = true and share_id is not null);

-- Published questions have a UUID share ID; unpublished questions have none.
alter table public.questions
  add constraint questions_share_id_uuid_check
  check (
    (is_public = false and share_id is null)
    or (
      is_public = true
      and share_id is not null
      and share_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    )
  );
