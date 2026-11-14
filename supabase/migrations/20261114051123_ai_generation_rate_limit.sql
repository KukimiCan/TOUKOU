-- Count costly AI generations per signed-in user across all app instances.
-- One row per user keeps the counter bounded; the UPSERT is atomic.
create table private.ai_generation_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  burst_window_start timestamptz not null,
  burst_count smallint not null check (burst_count between 1 and 3),
  day_window_start timestamptz not null,
  day_count smallint not null check (day_count between 1 and 20)
);

revoke all on private.ai_generation_rate_limits from public, anon, authenticated;
alter table private.ai_generation_rate_limits enable row level security;

create function private.consume_ai_generation_slot()
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
  where (limits.burst_window_start <> excluded.burst_window_start or limits.burst_count < 3)
    and (limits.day_window_start <> excluded.day_window_start or limits.day_count < 20)
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
    case when old_burst_start = burst_start and old_burst_count >= 3
      then pg_catalog.ceil(extract(epoch from (burst_start + interval '10 minutes' - now_at)))::integer
      else 0 end,
    case when old_day_start = day_start and old_day_count >= 20
      then pg_catalog.ceil(extract(epoch from (day_start + interval '1 day' - now_at)))::integer
      else 0 end
  );
  return query select false, greatest(1, retry_seconds);
end;
$$;

revoke all on function private.consume_ai_generation_slot() from public, anon, authenticated;
grant execute on function private.consume_ai_generation_slot() to authenticated;

-- Expose only the function, never the counter table, through the Data API.
create function public.consume_ai_generation_slot()
returns table (allowed boolean, retry_after_seconds integer)
language sql
volatile
security invoker
set search_path = ''
as $$
  select slot.allowed, slot.retry_after_seconds
  from private.consume_ai_generation_slot() as slot;
$$;

revoke all on function public.consume_ai_generation_slot() from public, anon, authenticated;
grant execute on function public.consume_ai_generation_slot() to authenticated;
