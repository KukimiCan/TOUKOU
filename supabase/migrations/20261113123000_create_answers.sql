create table public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  choice_index smallint not null check (choice_index between 0 and 5),
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

create index answers_question_id_idx on public.answers (question_id);

-- The anonymous role cannot read question IDs or publication flags directly.
create function public.is_published_question(target_id uuid)
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

revoke all on function public.is_published_question(uuid) from public;
grant execute on function public.is_published_question(uuid) to anon, authenticated;

-- Use the question's actual answer rather than trusting a client-supplied result.
create function public.set_answer_correctness()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  correct_index smallint;
  choice_count integer;
begin
  select q.answer_index, jsonb_array_length(q.choices)
    into correct_index, choice_count
  from public.questions as q
  where q.id = new.question_id
    and q.is_public = true
    and q.share_id is not null;

  if not found or new.choice_index >= choice_count then
    raise exception 'Question is unavailable or choice is invalid';
  end if;

  new.is_correct := new.choice_index = correct_index;
  return new;
end;
$$;

revoke all on function public.set_answer_correctness() from public, anon, authenticated;

create trigger set_answer_correctness_before_insert
before insert on public.answers
for each row execute function public.set_answer_correctness();

revoke all on public.answers from public, anon, authenticated;
grant insert (question_id, choice_index) on public.answers to anon, authenticated;
grant select on public.answers to authenticated;

alter table public.answers enable row level security;

create policy "Anyone can answer a published question"
on public.answers for insert to anon, authenticated
with check (
  public.is_published_question(question_id)
);

create policy "Question owners can read answers"
on public.answers for select to authenticated
using (
  exists (
    select 1 from public.questions as q
    where q.id = answers.question_id
      and q.user_id = (select auth.uid())
  )
);
