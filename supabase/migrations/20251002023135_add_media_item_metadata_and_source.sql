-- migration: add enhanced metadata fields and source column to media_items
-- description: extends media_items table with geolocation, exif data, and content source tracking

-- add new metadata columns to media_items table
alter table "public"."media_items" add column "camera_make" text;
alter table "public"."media_items" add column "camera_model" text;
alter table "public"."media_items" add column "date_taken" timestamp with time zone;
alter table "public"."media_items" add column "exif_data" jsonb;
alter table "public"."media_items" add column "lat" numeric(10,8);
alter table "public"."media_items" add column "location_name" text;
alter table "public"."media_items" add column "lon" numeric(11,8);
alter table "public"."media_items" add column "source" text not null default 'user'::text;

-- add check constraint for source column
alter table "public"."media_items" add constraint "check_media_item_source" CHECK ((source = ANY (ARRAY['user'::text, 'vendor'::text]))) not valid;
alter table "public"."media_items" validate constraint "check_media_item_source";
