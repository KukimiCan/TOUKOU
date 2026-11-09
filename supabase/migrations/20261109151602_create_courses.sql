-- Match the limits and field meanings in src/contracts/courses.ts.
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 50),
  day_of_week text not null
    check (day_of_week in ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')),
  period smallint not null check (period between 1 and 8),
  building text check (char_length(building) <= 50),
  floor text check (char_length(floor) <= 20),
  room text check (char_length(room) <= 50)
);

create index courses_user_id_idx on public.courses (user_id);

-- The project does not automatically expose new tables to Data API roles.
revoke all on public.courses from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, delete on public.courses to authenticated;
grant update (name, day_of_week, period, building, floor, room)
on public.courses to authenticated;

alter table public.courses enable row level security;

create policy "Users can read their courses"
on public.courses for select to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create their courses"
on public.courses for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update their courses"
on public.courses for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can delete their courses"
on public.courses for delete to authenticated
using (user_id = (select auth.uid()));
