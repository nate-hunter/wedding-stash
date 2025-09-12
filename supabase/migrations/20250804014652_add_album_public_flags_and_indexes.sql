-- Note: Removed drop policy statements to preserve existing RLS policies
-- These will be replaced/updated by the subsequent RLS policies migration

-- Drop constraint to recreate with proper name
alter table "public"."profiles" drop constraint if exists "username_length";

alter table "public"."google_photos_albums" add column "created_by_app" boolean default true;

alter table "public"."google_photos_albums" add column "is_public" boolean default false;

CREATE INDEX idx_google_media_items_public_access ON public.google_media_items USING btree (creation_time DESC, album_id, user_id);

CREATE INDEX idx_google_media_items_type_date ON public.google_media_items USING btree (media_type, creation_time DESC);

CREATE INDEX idx_google_photos_albums_is_public ON public.google_photos_albums USING btree (is_public);

-- Add constraint if it doesn't exist (schema sync)
alter table "public"."profiles" add constraint "profiles_username_check" CHECK ((char_length(username) >= 3)) not valid;
alter table "public"."profiles" validate constraint "profiles_username_check";


