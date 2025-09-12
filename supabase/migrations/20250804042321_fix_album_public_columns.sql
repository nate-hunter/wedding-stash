/*
 * Migration: Add album sharing and management columns
 *
 * Purpose: Adds support for public album sharing and tracking app-managed albums
 * Affected tables: google_photos_albums, google_media_items (indexes only)
 *
 * Changes:
 * 1. Add is_public column to enable album sharing across users
 * 2. Add created_by_app column to distinguish app-created vs imported albums
 * 3. Add performance indexes for public album queries
 *
 * Special considerations:
 * - Uses IF NOT EXISTS to safely handle potential duplicate column additions
 * - Indexes are optimized for public album discovery and media access patterns
 */

-- Add missing columns to public.google_photos_albums table
alter table public.google_photos_albums
  add column if not exists is_public boolean default false,
  add column if not exists created_by_app boolean default true;

-- Add descriptive comments for new columns
comment on column public.google_photos_albums.is_public
  is 'Whether the album is shared publicly with all users';

comment on column public.google_photos_albums.created_by_app
  is 'Whether the album was created by this application or imported from Google Photos';

-- Create performance indexes for public album queries

-- Index for finding public albums efficiently
create index if not exists idx_google_photos_albums_is_public
  on public.google_photos_albums(is_public)
  where is_public = true;

-- Index for accessing media items by album_id (will help with public album queries)
create index if not exists idx_google_media_items_album_id
  on public.google_media_items(album_id);

-- Index for sorting media items by type and date (common query pattern)
create index if not exists idx_google_media_items_type_date
  on public.google_media_items(media_type, creation_time desc);
