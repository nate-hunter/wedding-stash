/**
 * MIGRATION: create_vendor_media_bucket
 *
 * DESCRIPTION:
 * This migration creates a new storage bucket named 'vendor-media' for storing files
 * provided by external vendors (e.g., professional photographers/videographers).
 *
 * AFFECTED TABLES:
 * - storage.buckets
 * - storage.objects (RLS policies)
 *
 * SPECIAL CONSIDERATIONS:
 * - The bucket is created as public (`public = true`).
 * - RLS policies are added to allow universal read access and authenticated uploads.
 */

-- step 1: create the 'vendor-media' storage bucket
-- this bucket will hold all media files provided by official wedding vendors.
insert into storage.buckets (id, name, public)
values ('vendor-media', 'vendor-media', true)
on conflict (id) do nothing;

-- step 2: create rls policies for the 'vendor-media' bucket

-- policy: allow anonymous users read access
-- grants public, non-authenticated read access to all files in the bucket.
create policy "allow_public_read_access_on_vendor_media_anon"
on storage.objects for select
to anon
using (bucket_id = 'vendor-media');

-- policy: allow authenticated users read access
-- grants authenticated users read access to all files in the bucket.
create policy "allow_public_read_access_on_vendor_media_authenticated"
on storage.objects for select
to authenticated
using (bucket_id = 'vendor-media');

-- policy: allow authenticated users to upload
-- grants authenticated users permission to upload new files.
-- note: for enhanced security, this could be restricted to a specific admin role in the future.
create policy "allow_authenticated_uploads_on_vendor_media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'vendor-media');
