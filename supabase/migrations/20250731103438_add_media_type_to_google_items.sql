-- migration: add_media_type_to_google_items
-- description: Adds a generated column 'media_type' to the google_media_items table to easily distinguish between photos and videos.

--
-- add generated column: media_type
--
alter table public.google_media_items
add column media_type text generated always as (
  case
    when mime_type like 'image/%' then 'photo'
    when mime_type like 'video/%' then 'video'
    else 'other'
  end
) stored;

comment on column public.google_media_items.media_type is 'Generated column that categorizes the media as ''photo'', ''video'', or ''other'' based on the mime_type.';

--
-- create index on the new generated column
--
create index idx_google_media_items_media_type on public.google_media_items(media_type);
