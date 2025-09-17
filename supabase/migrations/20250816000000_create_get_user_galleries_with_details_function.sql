-- migration: 20240718001005_create_get_user_galleries_with_details_function.sql
-- description: Creates a function to get all galleries for a user with details.
--
-- This function retrieves all galleries for a given user, including the count of
-- media items in each gallery and a public URL for the cover image. It is
-- designed to be called from the API to efficiently load the gallery list.

create or replace function public.get_user_galleries_with_details(p_user_id uuid)
returns table (
    id uuid,
    title text,
    description text,
    is_public boolean,
    creator_id uuid,
    cover_image_id uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    media_item_count bigint,
    cover_image_path text
)
language sql
stable
security invoker
set search_path = ''
as $$
    with gallery_counts as (
        select
            gallery_id,
            count(media_item_id) as item_count
        from
            public.gallery_media_items
        group by
            gallery_id
    )
    select
        g.id,
        g.title,
        g.description,
        g.is_public,
        g.creator_id,
        g.cover_image_id,
        g.created_at,
        g.updated_at,
        coalesce(gc.item_count, 0) as media_item_count,
        mi.file_path as cover_image_path
    from
        public.galleries as g
    left join
        gallery_counts gc on g.id = gc.gallery_id
    left join
        public.media_items mi on g.cover_image_id = mi.id
    where
        g.creator_id = p_user_id;
$$;
