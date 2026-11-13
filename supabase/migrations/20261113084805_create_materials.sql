-- Store metadata only; the files themselves belong in the private Storage bucket (#29).
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  kind text not null check (kind in ('board', 'document')),
  storage_path text not null
    check (storage_path like user_id::text || '/%'),
  created_at timestamptz not null default now()
);

create index materials_user_id_idx on public.materials (user_id);
create index materials_course_id_idx on public.materials (course_id);

-- The project does not automatically expose new tables to Data API roles.
revoke all on public.materials from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, delete on public.materials to authenticated;
grant update (course_id, kind, storage_path) on public.materials to authenticated;

alter table public.materials enable row level security;

create policy "Users can read their materials"
on public.materials for select to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create materials for their courses"
on public.materials for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.courses
    where id = course_id and user_id = (select auth.uid())
  )
);

create policy "Users can update their materials"
on public.materials for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.courses
    where id = course_id and user_id = (select auth.uid())
  )
);

create policy "Users can delete their materials"
on public.materials for delete to authenticated
using (user_id = (select auth.uid()));
