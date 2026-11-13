-- Keep field limits aligned with src/lib/ai/question-schema.ts.
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  prompt text not null check (char_length(prompt) between 1 and 500),
  choices jsonb not null,
  answer_index smallint not null,
  explanation text not null check (char_length(explanation) between 1 and 1000),
  is_public boolean not null default false,
  share_id text unique check (share_id is null or char_length(share_id) >= 16),
  created_at timestamptz not null default now(),
  check (
    case when jsonb_typeof(choices) = 'array' then
      jsonb_array_length(choices) between 2 and 6
      and answer_index between 0 and jsonb_array_length(choices) - 1
    else false end
  )
);

create index questions_user_id_idx on public.questions (user_id);
create index questions_material_id_idx on public.questions (material_id);

-- The project does not automatically expose new tables to Data API roles.
revoke all on public.questions from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, delete on public.questions to authenticated;
grant update (material_id, prompt, choices, answer_index, explanation, is_public, share_id)
on public.questions to authenticated;

alter table public.questions enable row level security;

create policy "Users can read their questions"
on public.questions for select to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create questions for their materials"
on public.questions for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.materials as m
    where m.id = questions.material_id
      and m.user_id = (select auth.uid())
  )
);

create policy "Users can update their questions"
on public.questions for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.materials as m
    where m.id = questions.material_id
      and m.user_id = (select auth.uid())
  )
);

create policy "Users can delete their questions"
on public.questions for delete to authenticated
using (user_id = (select auth.uid()));
