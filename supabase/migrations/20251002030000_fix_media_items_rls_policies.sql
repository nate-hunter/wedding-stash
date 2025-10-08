-- migration: fix media-items storage RLS policies for structured file paths
-- description: updates RLS policies to check folder[2] instead of folder[1] to match
--              the new path structure: users/{user_id}/{year}/{month}/{filename}
--
-- context: the original policies assumed paths like {user_id}/filename
--          but generateStructuredFilePath creates: users/{user_id}/{year}/{month}/filename
--          so we need to check folder[2] (the user_id) instead of folder[1] ('users')

-- drop existing policies
drop policy if exists "Users can upload their own media items" on storage.objects;
drop policy if exists "Users can view all media items" on storage.objects;
drop policy if exists "Users can update their own media items" on storage.objects;
drop policy if exists "Users can delete their own media items" on storage.objects;

-- recreate policies with correct folder index
-- note: PostgreSQL arrays are 1-indexed, so [2] gets the second element

-- policy: allow authenticated users to upload to their own folder
-- path structure: users/{user_id}/{year}/{month}/{filename}
-- example: users/abc-123.../2025/10/uuid-photo.jpg
-- checks: (storage.foldername(name))[2] = user_id
create policy "Users can upload their own media items"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'media-items'
    and (select auth.uid())::text = (storage.foldername(name))[2]
  );

-- policy: allow authenticated users to view all media items in the bucket
-- this is intentionally permissive to support wedding guest photo sharing
-- (users can see all photos from the wedding, not just their own)
create policy "Users can view all media items"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'media-items');

-- policy: allow authenticated users to update their own media items
create policy "Users can update their own media items"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'media-items'
    and (select auth.uid())::text = (storage.foldername(name))[2]
  );

-- policy: allow authenticated users to delete their own media items
create policy "Users can delete their own media items"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'media-items'
    and (select auth.uid())::text = (storage.foldername(name))[2]
  );

