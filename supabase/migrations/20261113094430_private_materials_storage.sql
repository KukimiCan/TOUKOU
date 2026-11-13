-- Keep the database kind aligned with src/contracts/materials.ts.
alter table public.materials drop constraint materials_kind_check;
update public.materials set kind = 'slide' where kind = 'document';
alter table public.materials add constraint materials_kind_check
  check (kind in ('board', 'slide'));

-- The bucket is private, and accepts only the image formats and size in the API contract.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materials',
  'materials',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp']
);

-- Object names must begin with <user_id>/, matching public.materials.storage_path.
create policy "Users can read files in their materials folder"
on storage.objects for select to authenticated
using (
  bucket_id = 'materials'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can upload files to their materials folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'materials'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can update files in their materials folder"
on storage.objects for update to authenticated
using (
  bucket_id = 'materials'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'materials'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can delete files in their materials folder"
on storage.objects for delete to authenticated
using (
  bucket_id = 'materials'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
