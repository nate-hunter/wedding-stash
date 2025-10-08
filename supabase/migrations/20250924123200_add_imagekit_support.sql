--
-- Migration: Add ImageKit integration support to media_items table
-- Purpose: Enable HEIC file upload support and CDN delivery through ImageKit
-- Tables affected: media_items (column additions only)
-- Created: 2025-09-24 12:32:00 UTC
--
-- This migration adds ImageKit-specific columns to the existing media_items table
-- to support HEIC file conversion and optimized CDN delivery for wedding photography.
-- No existing functionality or policies are modified.
--

--
-- Add ImageKit integration columns to media_items table
-- These columns enable HEIC conversion tracking and CDN optimization
--
alter table public.media_items
add column if not exists imagekit_file_id varchar(255),
add column if not exists imagekit_url text,
add column if not exists thumbnail_url text,
add column if not exists original_format varchar(20),
add column if not exists was_converted boolean default false,
add column if not exists conversion_metadata jsonb;

--
-- Create performance indexes for ImageKit fields
-- These indexes optimize queries for ImageKit-processed media
--
create index if not exists idx_media_items_imagekit_file_id
on public.media_items(imagekit_file_id)
where imagekit_file_id is not null;

create index if not exists idx_media_items_was_converted
on public.media_items(was_converted)
where was_converted = true;

create index if not exists idx_media_items_original_format
on public.media_items(original_format)
where original_format is not null;

--
-- Add column comments for documentation
-- These comments explain the purpose of each ImageKit field
--
comment on column public.media_items.imagekit_file_id is 'ImageKit unique file identifier for API operations and CDN delivery.';
comment on column public.media_items.imagekit_url is 'ImageKit CDN URL for optimized delivery and transformations.';
comment on column public.media_items.thumbnail_url is 'ImageKit thumbnail URL with wedding-optimized transformations.';
comment on column public.media_items.original_format is 'Original file format before any conversion (e.g., heic, jpeg, png).';
comment on column public.media_items.was_converted is 'True if file was converted from original format (e.g., HEIC to JPEG).';
comment on column public.media_items.conversion_metadata is 'JSON metadata for conversion process, quality settings, and processing time.';

--
-- Note: Existing RLS policies for media_items will automatically apply to new columns
-- since they are row-level policies based on uploader_id ownership.
-- No policy changes are needed for this migration.
--
