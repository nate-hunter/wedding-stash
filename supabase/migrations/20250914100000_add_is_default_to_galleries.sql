-- This migration adds an 'is_default' column to the 'galleries' table to mark a user's default gallery for uploads.
-- It also includes a unique partial index to ensure that each user can have only one default gallery, preventing data inconsistencies.

-- add is_default column to galleries table
alter table public.galleries
add column is_default boolean not null default false;

-- add a comment for the new column
comment on column public.galleries.is_default is 'indicates if this is the default gallery for a user (e.g., for all uploads).';

-- add a unique index to ensure only one default gallery per user.
-- this is crucial for the upsert logic to handle race conditions correctly.
create unique index galleries_creator_id_is_default_unique_idx
on public.galleries (creator_id)
where (is_default = true);
