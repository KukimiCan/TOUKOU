-- Keep who answered (when signed in) so people can see their answer history.
-- The back API passes the user ID it verified itself; browsers cannot choose it.
alter table public.answers
  add column user_id uuid null references auth.users(id) on delete set null;

create index answers_user_id_created_at_idx
on public.answers (user_id, created_at desc);

-- Replace the two-argument answer functions with a three-argument version.
drop function public.answer_shared_question(text, smallint);
drop function private.answer_shared_question(text, smallint);

create function private.answer_shared_question(
  target_share_id text,
  target_choice_index smallint,
  answerer_id uuid
)
returns table (is_correct boolean, correct_index smallint, explanation text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  target_question record;
  actual_correct boolean;
begin
  select q.id, q.answer_index, q.explanation, pg_catalog.jsonb_array_length(q.choices) as choice_count
    into target_question
  from public.questions as q
  where q.share_id = target_share_id
    and q.is_public = true;

  if not found then
    return;
  end if;

  if target_choice_index is null
     or target_choice_index < 0
     or target_choice_index >= target_question.choice_count then
    raise exception 'Invalid choice index' using errcode = '22023';
  end if;

  insert into public.answers as a (question_id, choice_index, user_id)
  values (target_question.id, target_choice_index, answerer_id)
  returning a.is_correct into actual_correct;

  return query select actual_correct, target_question.answer_index, target_question.explanation;
end;
$$;

create function public.answer_shared_question(
  target_share_id text,
  target_choice_index smallint,
  answerer_id uuid
)
returns table (is_correct boolean, correct_index smallint, explanation text)
language sql
volatile
security invoker
set search_path = ''
as $$
  select answer.is_correct, answer.correct_index, answer.explanation
  from private.answer_shared_question(target_share_id, target_choice_index, answerer_id) as answer;
$$;

revoke all on function private.answer_shared_question(text, smallint, uuid)
from public, anon, authenticated;
revoke all on function public.answer_shared_question(text, smallint, uuid)
from public, anon, authenticated;

grant execute on function private.answer_shared_question(text, smallint, uuid)
to service_role;
grant execute on function public.answer_shared_question(text, smallint, uuid)
to service_role;

-- People can read their own answers (question owners keep their existing policy).
create policy "Users can read their own answers"
on public.answers for select to authenticated
using (user_id = (select auth.uid()));

-- Answer history of the signed-in user: newest first, at most 100 rows.
-- Questions that were made private again are left out.
create function private.my_answer_history()
returns table (
  answered_at timestamptz,
  is_correct boolean,
  choice_index smallint,
  share_id text,
  prompt text
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.created_at, a.is_correct, a.choice_index, q.share_id, q.prompt
  from public.answers as a
  join public.questions as q on q.id = a.question_id
  where a.user_id = (select auth.uid())
    and q.is_public = true
    and q.share_id is not null
  order by a.created_at desc
  limit 100;
$$;

create function public.my_answer_history()
returns table (
  answered_at timestamptz,
  is_correct boolean,
  choice_index smallint,
  share_id text,
  prompt text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select h.answered_at, h.is_correct, h.choice_index, h.share_id, h.prompt
  from private.my_answer_history() as h;
$$;

revoke all on function private.my_answer_history() from public, anon, authenticated;
revoke all on function public.my_answer_history() from public, anon, authenticated;
grant execute on function private.my_answer_history() to authenticated;
grant execute on function public.my_answer_history() to authenticated;
