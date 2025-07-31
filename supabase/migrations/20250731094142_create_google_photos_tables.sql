-- migration: create_google_photos_tables
-- description: Creates tables for storing Google Photos albums and media items, with RLS policies.
-- links:
--   - https://developers.google.com/photos/library/reference/rest/v1/albums#Album
--   - https://developers.google.com/photos/library/reference/rest/v1/mediaItems#MediaItem

--
-- create table: google_photos_albums
--
create table public.google_photos_albums (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    google_album_id text not null unique,
    title text not null,
    product_url text,
    is_writeable boolean default true,
    share_info jsonb,
    media_items_count integer default 0,
    cover_photo_base_url text,
    cover_photo_media_item_id text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),

    unique(user_id, google_album_id)
);

comment on table public.google_photos_albums is 'Stores metadata for Google Photos albums linked to user profiles.';

-- create indexes for google_photos_albums
create index idx_google_photos_albums_user_id on public.google_photos_albums(user_id);
create index idx_google_photos_albums_google_id on public.google_photos_albums(google_album_id);

--
-- create table: google_media_items
--
create table public.google_media_items (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    album_id uuid references public.google_photos_albums(id) on delete cascade,
    google_media_item_id text not null unique,
    description text,
    product_url text,
    base_url text,
    mime_type text not null,
    filename text,

    -- media metadata from google photos api
    width integer,
    height integer,
    creation_time timestamp with time zone,
    camera_make text,
    camera_model text,
    focal_length real,
    aperture_f_number real,
    iso_equivalent integer,
    exposure_time text,

    -- video specific metadata
    fps real,
    processing_status text,

    -- contributor info for shared albums
    contributor_info jsonb,

    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

comment on table public.google_media_items is 'Stores metadata for individual media items (photos and videos) from Google Photos.';

-- create indexes for google_media_items
create index idx_google_media_items_user_id on public.google_media_items(user_id);
create index idx_google_media_items_album_id on public.google_media_items(album_id);
create index idx_google_media_items_google_id on public.google_media_items(google_media_item_id);
create index idx_google_media_items_creation_time on public.google_media_items(creation_time);

--
-- add column to profiles table to link to google photos album
--
alter table public.profiles
add column google_photos_album_id uuid references public.google_photos_albums(id);

--
-- enable row level security (rls)
--
alter table public.google_photos_albums enable row level security;
alter table public.google_media_items enable row level security;

--
-- rls policies for google_photos_albums
--
create policy "users can view their own albums"
on public.google_photos_albums for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "users can insert their own albums"
on public.google_photos_albums for insert
to authenticated
with check ( (select auth.uid()) = user_id );

create policy "users can update their own albums"
on public.google_photos_albums for update
to authenticated
using ( (select auth.uid()) = user_id );

create policy "users can delete their own albums"
on public.google_photos_albums for delete
to authenticated
using ( (select auth.uid()) = user_id );

--
-- rls policies for google_media_items
--
create policy "users can view their own media items"
on public.google_media_items for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "users can insert their own media items"
on public.google_media_items for insert
to authenticated
with check ( (select auth.uid()) = user_id );

create policy "users can update their own media items"
on public.google_media_items for update
to authenticated
using ( (select auth.uid()) = user_id );

create policy "users can delete their own media items"
on public.google_media_items for delete
to authenticated
using ( (select auth.uid()) = user_id );
