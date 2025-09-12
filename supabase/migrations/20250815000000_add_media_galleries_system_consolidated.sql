--
-- Migration: Create media galleries system (consolidated)
-- Purpose: Add tables, RLS policies, storage, and functions for the media gallery system
-- Created: 2025-08-15 00:00:00 UTC
--

--
-- create table: galleries (user-created photo collections)
--
create table public.galleries (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    is_public boolean default false,
    creator_id uuid not null,
    cover_image_id uuid,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

--
-- create table: media_items (supabase-stored files)
--
create table public.media_items (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    is_public boolean default false,

    -- file metadata (supabase storage specific)
    filename text not null,
    original_filename text not null,
    file_path text not null,
    file_size bigint,
    mime_type text not null,
    media_type text generated always as (
        case
            when mime_type like 'image/%' then 'photo'
            when mime_type like 'video/%' then 'video'
            else 'other'
        end
    ) stored,
    width integer,
    height integer,

    -- video specific metadata
    duration interval,

    -- relationships
    uploader_id uuid,

    -- google photos sync (optional)
    google_photos_id text unique,
    google_photos_url text,
    google_photos_album_id text,

    project_name text default 'WEDDING_STASH',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

--
-- create table: gallery_media_items (junction table)
--
create table public.gallery_media_items (
    id uuid primary key default gen_random_uuid(),
    gallery_id uuid not null,
    media_item_id uuid not null,
    added_by uuid,
    added_at timestamp with time zone default now(),
    unique(gallery_id, media_item_id)
);

--
-- create table: download_collections (temporary collections)
--
create table public.download_collections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    name text default 'Download Collection',
    expires_at timestamp with time zone default (now() + interval '24 hours'),
    created_at timestamp with time zone default now()
);

--
-- create table: download_collection_items (junction table)
--
create table public.download_collection_items (
    id uuid primary key default gen_random_uuid(),
    collection_id uuid not null,
    media_item_id uuid not null,
    added_at timestamp with time zone default now(),
    unique(collection_id, media_item_id)
);

--
-- add constraints and comments (new tables)
--
alter table public.galleries add constraint galleries_creator_id_fkey foreign key (creator_id) references public.profiles(id) on delete cascade;
alter table public.galleries add constraint galleries_cover_image_id_fkey foreign key (cover_image_id) references public.media_items(id) on delete set null;
comment on table public.galleries is 'User-created photo galleries/albums for organizing media items uploaded to Supabase Storage.';
comment on column public.galleries.is_public is 'Whether the gallery is publicly viewable by all authenticated users.';
comment on column public.galleries.cover_image_id is 'Optional reference to a media item to use as the gallery cover image.';

alter table public.media_items add constraint media_items_uploader_id_fkey foreign key (uploader_id) references public.profiles(id) on delete set null;
comment on table public.media_items is 'Stores metadata for individual media items (photos and videos) uploaded directly to Supabase Storage.';
comment on column public.media_items.file_path is 'Full path in Supabase Storage bucket: media-items/{user-id}/{filename}';
comment on column public.media_items.media_type is 'Generated column that categorizes the media as photo, video, or other based on the mime_type.';
comment on column public.media_items.google_photos_id is 'Optional Google Photos media item ID if synced to Google Photos.';
comment on column public.media_items.project_name is 'Project identifier for organizing media across different applications.';

alter table public.gallery_media_items add constraint gallery_media_items_gallery_id_fkey foreign key (gallery_id) references public.galleries(id) on delete cascade;
alter table public.gallery_media_items add constraint gallery_media_items_media_item_id_fkey foreign key (media_item_id) references public.media_items(id) on delete cascade;
alter table public.gallery_media_items add constraint gallery_media_items_added_by_fkey foreign key (added_by) references public.profiles(id) on delete set null;
comment on table public.gallery_media_items is 'Junction table enabling many-to-many relationships between galleries and media items.';

alter table public.download_collections add constraint download_collections_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
comment on table public.download_collections is 'Temporary collections for organizing media items for batch downloads. Collections expire after 24 hours.';

alter table public.download_collection_items add constraint download_collection_items_collection_id_fkey foreign key (collection_id) references public.download_collections(id) on delete cascade;
alter table public.download_collection_items add constraint download_collection_items_media_item_id_fkey foreign key (media_item_id) references public.media_items(id) on delete cascade;
comment on table public.download_collection_items is 'Junction table for download collections and media items.';

--
-- create indexes (new tables)
--
create index idx_galleries_creator_id on public.galleries(creator_id);
create index idx_galleries_is_public on public.galleries(is_public);
create index idx_galleries_cover_image_id on public.galleries(cover_image_id) where cover_image_id is not null;

create index idx_media_items_uploader_id on public.media_items(uploader_id);
create index idx_media_items_media_type on public.media_items(media_type);
create index idx_media_items_created_at on public.media_items(created_at desc);
create index idx_media_items_file_path on public.media_items(file_path);
create index idx_media_items_google_photos_id on public.media_items(google_photos_id) where google_photos_id is not null;

create index idx_gallery_media_items_gallery_id on public.gallery_media_items(gallery_id);
create index idx_gallery_media_items_media_item_id on public.gallery_media_items(media_item_id);
create index idx_gallery_media_items_added_by on public.gallery_media_items(added_by);

create index idx_download_collections_user_id on public.download_collections(user_id);
create index idx_download_collections_expires_at on public.download_collections(expires_at);

create index idx_download_collection_items_collection_id on public.download_collection_items(collection_id);
create index idx_download_collection_items_media_item_id on public.download_collection_items(media_item_id);

--
-- enable row level security (rls)
--
alter table public.galleries enable row level security;
alter table public.media_items enable row level security;
alter table public.gallery_media_items enable row level security;
alter table public.download_collections enable row level security;
alter table public.download_collection_items enable row level security;

--
-- RLS policies
--

-- galleries table policies
create policy "Users can view their own galleries" on public.galleries for select to authenticated using ((select auth.uid()) = creator_id);
create policy "Users can view public galleries" on public.galleries for select to authenticated using (is_public = true);
create policy "Users can create their own galleries" on public.galleries for insert to authenticated with check ((select auth.uid()) = creator_id);
create policy "Users can update their own galleries" on public.galleries for update to authenticated using ((select auth.uid()) = creator_id) with check ((select auth.uid()) = creator_id);
create policy "Users can delete their own galleries" on public.galleries for delete to authenticated using ((select auth.uid()) = creator_id);

-- media_items table policies
create policy "Users can view all media items" on public.media_items for select to authenticated using (true);
create policy "Users can create their own media items" on public.media_items for insert to authenticated with check ((select auth.uid()) = uploader_id);
create policy "Users can update their own media items" on public.media_items for update to authenticated using ((select auth.uid()) = uploader_id) with check ((select auth.uid()) = uploader_id);
create policy "Users can delete their own media items" on public.media_items for delete to authenticated using ((select auth.uid()) = uploader_id);

-- gallery_media_items table policies
create policy "Users can view gallery media items from accessible galleries" on public.gallery_media_items for select to authenticated using (exists (select 1 from public.galleries where galleries.id = gallery_id and (galleries.creator_id = (select auth.uid()) or galleries.is_public = true)));
create policy "Gallery owners can add media items to their galleries" on public.gallery_media_items for insert to authenticated with check (exists (select 1 from public.galleries where galleries.id = gallery_id and galleries.creator_id = (select auth.uid())));
create policy "Gallery owners can update their gallery media items" on public.gallery_media_items for update to authenticated using (exists (select 1 from public.galleries where galleries.id = gallery_id and galleries.creator_id = (select auth.uid()))) with check (exists (select 1 from public.galleries where galleries.id = gallery_id and galleries.creator_id = (select auth.uid())));
create policy "Gallery owners can remove media items from their galleries" on public.gallery_media_items for delete to authenticated using (exists (select 1 from public.galleries where galleries.id = gallery_id and galleries.creator_id = (select auth.uid())));

-- download_collections table policies
create policy "Users can view their own download collections" on public.download_collections for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own download collections" on public.download_collections for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own download collections" on public.download_collections for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own download collections" on public.download_collections for delete to authenticated using ((select auth.uid()) = user_id);

-- download_collection_items table policies
create policy "Users can view their own download collection items" on public.download_collection_items for select to authenticated using (exists (select 1 from public.download_collections where download_collections.id = collection_id and download_collections.user_id = (select auth.uid())));
create policy "Users can add items to their own download collections" on public.download_collection_items for insert to authenticated with check (exists (select 1 from public.download_collections where download_collections.id = collection_id and download_collections.user_id = (select auth.uid())));
create policy "Users can update their own download collection items" on public.download_collection_items for update to authenticated using (exists (select 1 from public.download_collections where download_collections.id = collection_id and download_collections.user_id = (select auth.uid()))) with check (exists (select 1 from public.download_collections where download_collections.id = collection_id and download_collections.user_id = (select auth.uid())));
create policy "Users can remove items from their own download collections" on public.download_collection_items for delete to authenticated using (exists (select 1 from public.download_collections where download_collections.id = collection_id and download_collections.user_id = (select auth.uid())));

--
-- storage bucket
--
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media-items',
  'media-items',
  false, -- private bucket
  104857600, -- 100mb limit (100 * 1024 * 1024 bytes)
  array[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic',
    'video/mp4', 'video/mov', 'video/avi', 'video/quicktime'
  ]
);

-- storage policies
create policy "Users can upload their own media items" on storage.objects for insert to authenticated with check (bucket_id = 'media-items' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "Users can view all media items" on storage.objects for select to authenticated using (bucket_id = 'media-items');
create policy "Users can update their own media items" on storage.objects for update to authenticated using (bucket_id = 'media-items' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "Users can delete their own media items" on storage.objects for delete to authenticated using (bucket_id = 'media-items' and (select auth.uid())::text = (storage.foldername(name))[1]);

--
-- functions and triggers
--
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.update_updated_at_column() is 'Trigger function to automatically update the updated_at column when a row is modified.';

create trigger update_galleries_updated_at
  before update on public.galleries
  for each row execute function public.update_updated_at_column();

create trigger update_media_items_updated_at
  before update on public.media_items
  for each row execute function public.update_updated_at_column();

create or replace function public.cleanup_expired_download_collections()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.download_collections where expires_at < now();
end;
$$;

comment on function public.cleanup_expired_download_collections() is 'Removes expired download collections and their associated items. Should be called periodically via cron job or manual cleanup.';

grant execute on function public.cleanup_expired_download_collections() to authenticated;
