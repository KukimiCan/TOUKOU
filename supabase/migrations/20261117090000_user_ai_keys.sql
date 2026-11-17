-- Each user now registers their own AI API key (#220).
-- The key is encrypted by the app server (AES-256-GCM, server-only secret) before it reaches the DB,
-- so the DB never holds a usable key. RLS keeps each row readable and writable only by its owner.
create table public.user_ai_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null check (provider in ('openai', 'google')),
  encrypted_key text not null check (char_length(encrypted_key) between 1 and 1000),
  key_hint text not null check (char_length(key_hint) between 1 and 8),
  updated_at timestamptz not null default now()
);

-- The project does not automatically expose new tables to Data API roles.
revoke all on public.user_ai_keys from public, anon, authenticated;
grant usage on schema public to authenticated;
-- Full-row UPDATE is needed because the app saves with an upsert (ON CONFLICT DO UPDATE
-- also sets user_id); the policy's WITH CHECK still pins user_id to the caller.
grant select, insert, update, delete on public.user_ai_keys to authenticated;

alter table public.user_ai_keys enable row level security;

create policy "Users can read their AI key"
on public.user_ai_keys for select to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create their AI key"
on public.user_ai_keys for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update their AI key"
on public.user_ai_keys for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can delete their AI key"
on public.user_ai_keys for delete to authenticated
using (user_id = (select auth.uid()));

-- The generation limit protected one shared key. With per-user keys, relax it to
-- 10 per 10 minutes and 100 per day (still bounds server time per user).
alter table private.ai_generation_rate_limits
  drop constraint if exists ai_generation_rate_limits_burst_count_check,
  drop constraint if exists ai_generation_rate_limits_day_count_check,
  add constraint ai_generation_rate_limits_burst_count_check
    check (burst_count between 1 and 10),
  add constraint ai_generation_rate_limits_day_count_check
    check (day_count between 1 and 100);

create or replace function private.consume_ai_generation_slot()
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  now_at timestamptz := clock_timestamp();
  burst_start timestamptz;
  day_start timestamptz;
  old_burst_start timestamptz;
  old_day_start timestamptz;
  old_burst_count smallint;
  old_day_count smallint;
  claimed integer;
  retry_seconds integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  burst_start := pg_catalog.to_timestamp(
    (pg_catalog.floor(extract(epoch from now_at) / 600) * 600)::double precision
  );
  day_start := pg_catalog.to_timestamp(
    (pg_catalog.floor(extract(epoch from now_at) / 86400) * 86400)::double precision
  );

  insert into private.ai_generation_rate_limits as limits (
    user_id, burst_window_start, burst_count, day_window_start, day_count
  ) values (current_user_id, burst_start, 1, day_start, 1)
  on conflict (user_id) do update set
    burst_window_start = excluded.burst_window_start,
    burst_count = case
      when limits.burst_window_start = excluded.burst_window_start
      then limits.burst_count + 1 else 1 end,
    day_window_start = excluded.day_window_start,
    day_count = case
      when limits.day_window_start = excluded.day_window_start
      then limits.day_count + 1 else 1 end
  where (limits.burst_window_start <> excluded.burst_window_start or limits.burst_count < 10)
    and (limits.day_window_start <> excluded.day_window_start or limits.day_count < 100)
  returning 1 into claimed;

  if found then
    return query select true, 0;
    return;
  end if;

  select limits.burst_window_start, limits.burst_count,
         limits.day_window_start, limits.day_count
    into old_burst_start, old_burst_count, old_day_start, old_day_count
  from private.ai_generation_rate_limits as limits
  where limits.user_id = current_user_id;

  retry_seconds := greatest(
    case when old_burst_start = burst_start and old_burst_count >= 10
      then pg_catalog.ceil(extract(epoch from (burst_start + interval '10 minutes' - now_at)))::integer
      else 0 end,
    case when old_day_start = day_start and old_day_count >= 100
      then pg_catalog.ceil(extract(epoch from (day_start + interval '1 day' - now_at)))::integer
      else 0 end
  );
  return query select false, greatest(1, retry_seconds);
end;
$$;
