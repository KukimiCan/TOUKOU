-- The back API calls this RPC with a server-only secret key after rate limiting.
-- Browser roles cannot write answers directly through the Data API.

revoke insert on public.answers from anon, authenticated;
revoke insert (question_id, choice_index) on public.answers from anon, authenticated;

drop policy "Anyone can answer a published question" on public.answers;

revoke all on function public.answer_shared_question(text, smallint)
from public, anon, authenticated;
revoke all on function private.answer_shared_question(text, smallint)
from public, anon, authenticated;

grant usage on schema private to service_role;
grant execute on function private.answer_shared_question(text, smallint)
to service_role;
grant execute on function public.answer_shared_question(text, smallint)
to service_role;

-- The insert policy was the last user of this privileged publication helper.
revoke all on function private.is_published_question(uuid)
from public, anon, authenticated;
drop function private.is_published_question(uuid);
