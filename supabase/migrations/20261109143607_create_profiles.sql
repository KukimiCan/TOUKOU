-- Keep the database shape aligned with src/contracts/settings.ts.
-- A JSON array lets each university set its own period times (1 through 8).
create function public.profile_periods_are_valid(value jsonb)
returns boolean
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  entry jsonb;
  period_number integer;
  seen_periods integer[] := '{}';
  start_time text;
  end_time text;
begin
  if jsonb_typeof(value) is distinct from 'array' then
    return false;
  end if;

  if jsonb_array_length(value) not between 1 and 8 then
    return false;
  end if;

  for entry in select jsonb_array_elements(value) loop
    if jsonb_typeof(entry) is distinct from 'object'
       or jsonb_typeof(entry -> 'period') is distinct from 'number'
       or (entry ->> 'period') !~ '^[1-8]$'
       or jsonb_typeof(entry -> 'start') is distinct from 'string'
       or jsonb_typeof(entry -> 'end') is distinct from 'string' then
      return false;
    end if;

    period_number := (entry ->> 'period')::integer;
    start_time := entry ->> 'start';
    end_time := entry ->> 'end';

    if period_number = any(seen_periods)
       or start_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       or end_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       or start_time >= end_time then
      return false;
    end if;

    seen_periods := array_append(seen_periods, period_number);
  end loop;

  return true;
end;
$$;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  travel_buffer_minutes smallint not null default 10
    check (travel_buffer_minutes between 0 and 60),
  periods jsonb not null default '[
    {"period": 1, "start": "09:00", "end": "10:30"},
    {"period": 2, "start": "10:40", "end": "12:10"},
    {"period": 3, "start": "12:20", "end": "13:50"},
    {"period": 4, "start": "14:00", "end": "15:30"},
    {"period": 5, "start": "15:40", "end": "17:10"},
    {"period": 6, "start": "17:20", "end": "18:50"},
    {"period": 7, "start": "19:00", "end": "20:30"},
    {"period": 8, "start": "20:40", "end": "22:10"}
  ]'::jsonb check (public.profile_periods_are_valid(periods))
);

-- The project disables automatic Data API grants for new tables.
revoke all on public.profiles from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;

alter table public.profiles enable row level security;

create policy "Users can read their profile"
on public.profiles for select to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create their profile"
on public.profiles for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update their profile"
on public.profiles for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- Auth creates the row even though the normal client has no direct Auth schema access.
create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

-- Also create a profile for anyone who signed up before this migration.
insert into public.profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;
