-- Answer by share ID without exposing question IDs, answers, or explanations
-- through direct table SELECT. The private function performs one atomic insert.
create function private.answer_shared_question(
  target_share_id text,
  target_choice_index smallint
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

  insert into public.answers as a (question_id, choice_index)
  values (target_question.id, target_choice_index)
  returning a.is_correct into actual_correct;

  return query select actual_correct, target_question.answer_index, target_question.explanation;
end;
$$;

revoke all on function private.answer_shared_question(text, smallint) from public, anon, authenticated;
grant execute on function private.answer_shared_question(text, smallint) to anon, authenticated;

create function public.answer_shared_question(
  target_share_id text,
  target_choice_index smallint
)
returns table (is_correct boolean, correct_index smallint, explanation text)
language sql
volatile
security invoker
set search_path = ''
as $$
  select answer.is_correct, answer.correct_index, answer.explanation
  from private.answer_shared_question(target_share_id, target_choice_index) as answer;
$$;

revoke all on function public.answer_shared_question(text, smallint) from public, anon, authenticated;
grant execute on function public.answer_shared_question(text, smallint) to anon, authenticated;
