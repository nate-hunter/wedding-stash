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

create index idx_google_media_items_user_id on public.google_media_items(user_id);
create index idx_google_media_items_album_id on public.google_media_items(album_id);
create index idx_google_media_items_google_id on public.google_media_items(google_media_item_id);
create index idx_google_media_items_creation_time on public.google_media_items(creation_time);
create index idx_google_media_items_media_type on public.google_media_items(media_type);

--
-- enable row level security (rls)
--
alter table public.google_photos_albums enable row level security;
alter table public.google_media_items enable row level security;
alter table public.profiles enable row level security;