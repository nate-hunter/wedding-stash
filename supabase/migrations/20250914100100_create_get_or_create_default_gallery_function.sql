-- This migration creates the 'get_or_create_default_gallery' function.
-- This function is designed to be called from the API to ensure that a default gallery
-- exists for a user before uploading media. It handles race conditions by attempting
-- to insert a new default gallery and catching a unique violation exception if one
-- was created by a concurrent process, in which case it selects the existing one.

create or replace function public.get_or_create_default_gallery(p_user_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_gallery_id uuid;
begin
  -- first, try to get the existing default gallery to avoid an insert if possible.
  -- this is an optimization to reduce writes.
  select id into v_gallery_id from public.galleries where creator_id = p_user_id and is_default = true;

  if v_gallery_id is not null then
    return v_gallery_id;
  end if;

  -- if no default gallery, attempt to create one.
  -- the unique index on (creator_id) where (is_default = true) will prevent duplicates.
  -- in case of a race condition where another process inserts a default gallery
  -- between the select and insert, the insert will fail.
  begin
    insert into public.galleries (creator_id, title, description, is_default)
    values (p_user_id, 'Uploads', 'Default gallery for all uploaded media.', true)
    returning id into v_gallery_id;
  exception when unique_violation then
    -- the gallery was created by another concurrent process. select it.
    select id into v_gallery_id from public.galleries where creator_id = p_user_id and is_default = true;
  end;

  return v_gallery_id;
end;
$$;
