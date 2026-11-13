create table public.material_notes (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  kind text not null check (kind in ('summary', 'explanation')),
  body text not null check (char_length(body) > 0)
);

create index material_notes_material_id_idx on public.material_notes (material_id);

-- The project does not automatically expose new tables to Data API roles.
revoke all on public.material_notes from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, delete on public.material_notes to authenticated;
grant update (kind, body) on public.material_notes to authenticated;

alter table public.material_notes enable row level security;

create policy "Users can read notes for their materials"
on public.material_notes for select to authenticated
using (
  exists (
    select 1 from public.materials as m
    where m.id = material_notes.material_id
      and m.user_id = (select auth.uid())
  )
);

create policy "Users can create notes for their materials"
on public.material_notes for insert to authenticated
with check (
  exists (
    select 1 from public.materials as m
    where m.id = material_notes.material_id
      and m.user_id = (select auth.uid())
  )
);

create policy "Users can update notes for their materials"
on public.material_notes for update to authenticated
using (
  exists (
    select 1 from public.materials as m
    where m.id = material_notes.material_id
      and m.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.materials as m
    where m.id = material_notes.material_id
      and m.user_id = (select auth.uid())
  )
);

create policy "Users can delete notes for their materials"
on public.material_notes for delete to authenticated
using (
  exists (
    select 1 from public.materials as m
    where m.id = material_notes.material_id
      and m.user_id = (select auth.uid())
  )
);
