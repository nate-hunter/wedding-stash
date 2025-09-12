--
-- create table: profiles
--
create table public.profiles (
    id uuid not null,
    updated_at timestamp with time zone,
    username text,
    full_name text,
    avatar_url text,
    website text,
    email text,
    google_photos_album_id uuid,
    constraint profiles_username_check check ((char_length(username) >= 3))
);

--
-- create table: google_photos_albums
--
create table public.google_photos_albums (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    google_album_id text not null unique,
    title text not null,
    product_url text,
    is_writeable boolean default true,
    share_info jsonb,
    media_items_count integer default 0,
    cover_photo_base_url text,
    cover_photo_media_item_id text,
    is_public boolean default false,
    created_by_app boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),

    unique(user_id, google_album_id)
);

--
-- create table: google_media_items
--
create table public.google_media_items (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    album_id uuid,
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
    updated_at timestamp with time zone default now(),
    media_type text generated always as (
      case
        when mime_type like 'image/%' then 'photo'
        when mime_type like 'video/%' then 'video'
        else 'other'
      end
    ) stored
);

--
-- add constraints and comments
--
alter table public.profiles add constraint profiles_pkey primary key (id);
alter table public.profiles add constraint profiles_username_key unique (username);
alter table public.profiles add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;
alter table public.profiles add constraint profiles_google_photos_album_id_fkey foreign key (google_photos_album_id) references public.google_photos_albums(id);
comment on table public.profiles is 'Stores public user data. For private data, refer to the auth.users table.';

comment on table public.google_photos_albums is 'Stores metadata for Google Photos albums linked to user profiles.';
comment on column public.google_photos_albums.is_public is 'Determines if the album is publicly viewable by all authenticated users.';
comment on column public.google_photos_albums.created_by_app is 'Indicates if the album was created by this application (true) or existed before in Google Photos (false).';

alter table public.google_photos_albums add constraint google_photos_albums_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;

comment on table public.google_media_items is 'Stores metadata for individual media items (photos and videos) from Google Photos.';
comment on column public.google_media_items.media_type is 'Generated column that categorizes the media as ''photo'', ''video'', or ''other'' based on the mime_type.';

alter table public.google_media_items add constraint google_media_items_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.google_media_items add constraint google_media_items_album_id_fkey foreign key (album_id) references public.google_photos_albums(id) on delete cascade;

--
-- create indexes
--
create index idx_google_photos_albums_user_id on public.google_photos_albums(user_id);
create index idx_google_photos_albums_google_id on public.google_photos_albums(google_album_id);
create index idx_google_photos_albums_is_public on public.google_photos_albums(is_public);

create index idx_google_media_items_user_id on public.google_media_items(user_id);
create index idx_google_media_items_album_id on public.google_media_items(album_id);
create index idx_google_media_items_google_id on public.google_media_items(google_media_item_id);
create index idx_google_media_items_creation_time on public.google_media_items(creation_time);
create index idx_google_media_items_media_type on public.google_media_items(media_type);
create index idx_google_media_items_public_access on public.google_media_items(creation_time desc, album_id, user_id);
create index idx_google_media_items_type_date on public.google_media_items(media_type, creation_time desc);

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
-- create functions and triggers
--
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


--
-- enable row level security (rls)
--
-- ❌ DON'T: Leave RLS policies undefined
-- ✅ DO: Document which policies exist elsewhere

-- Note: RLS policies for this table are managed in migration files:
-- - profiles: see migration 20250812040100_create_rls_policies_for_galleries_system.sql
-- - google_photos_albums: see migration 20250812040100_create_rls_policies_for_galleries_system.sql
alter table public.profiles enable row level security;
alter table public.google_photos_albums enable row level security;
alter table public.google_media_items enable row level security;
alter table public.galleries enable row level security;
alter table public.media_items enable row level security;
alter table public.gallery_media_items enable row level security;
alter table public.download_collections enable row level security;
alter table public.download_collection_items enable row level security;