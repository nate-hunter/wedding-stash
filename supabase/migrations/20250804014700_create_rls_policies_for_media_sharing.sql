--
-- Migration: Create RLS policies for media sharing functionality
-- Purpose: Enable secure access to albums and media items with support for public sharing
-- Tables affected: profiles, google_photos_albums, google_media_items
-- Created: 2025-08-01 00:00:00 UTC
--

--
-- profiles table policies
-- Allow users to manage their own profiles and view public profile information
--

-- profiles select policies
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can view other profiles for public information"
on public.profiles
for select
to authenticated
using (true);

-- profiles insert policies
create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

-- profiles update policies
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- profiles delete policies
create policy "Users can delete their own profile"
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = id);

--
-- google_photos_albums table policies
-- Allow users to manage their own albums and view public albums from others
--

-- albums select policies
create policy "Users can view their own albums"
on public.google_photos_albums
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can view public albums"
on public.google_photos_albums
for select
to authenticated
using (is_public = true);

-- albums insert policies
create policy "Users can create their own albums"
on public.google_photos_albums
for insert
to authenticated
with check (user_id = (select auth.uid()));

-- albums update policies
create policy "Users can update their own albums"
on public.google_photos_albums
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- albums delete policies
create policy "Users can delete their own albums"
on public.google_photos_albums
for delete
to authenticated
using (user_id = (select auth.uid()));

--
-- google_media_items table policies
-- Allow users to manage their own media items and view/download from accessible albums
--

-- media items select policies
create policy "Users can view their own media items"
on public.google_media_items
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can view media items from public albums"
on public.google_media_items
for select
to authenticated
using (
  album_id in (
    select id
    from public.google_photos_albums
    where is_public = true
  )
);

-- media items insert policies
create policy "Users can create their own media items"
on public.google_media_items
for insert
to authenticated
with check (user_id = (select auth.uid()));

-- media items update policies
create policy "Users can update their own media items"
on public.google_media_items
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- media items delete policies
create policy "Users can delete their own media items"
on public.google_media_items
for delete
to authenticated
using (user_id = (select auth.uid()));

--
-- Performance optimization indexes for RLS policies
-- These indexes support the policy conditions for efficient query execution
--

-- Index to support user_id lookups in policies (if not already exists)
create index if not exists idx_profiles_auth_uid on public.profiles(id);

-- Index to support album public access policies
create index if not exists idx_albums_public_user on public.google_photos_albums(is_public, user_id);

-- Index to support media items policy lookups
create index if not exists idx_media_items_user_album on public.google_media_items(user_id, album_id);