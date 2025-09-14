-- This migration adds restrictions to prevent users from changing the title of default galleries.
-- Default galleries should always maintain their "Uploads" title for consistency.

-- Create a function to check if title changes are allowed for default galleries
create or replace function public.check_default_gallery_title_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- if this is a default gallery and the title is being changed from "Uploads"
  if new.is_default = true and old.is_default = true and old.title = 'Uploads' and new.title != 'Uploads' then
    raise exception 'Cannot change the title of the default "Uploads" gallery. Default galleries must maintain their original title.';
  end if;

  -- if a gallery is being set as default, ensure it has the correct title
  if new.is_default = true and new.title != 'Uploads' then
    raise exception 'Default galleries must have the title "Uploads".';
  end if;

  return new;
end;
$$;

-- Create trigger to enforce default gallery title restrictions
create trigger enforce_default_gallery_title_trigger
  before update on public.galleries
  for each row
  execute function public.check_default_gallery_title_update();

-- Add a comment explaining the restriction
comment on function public.check_default_gallery_title_update() is 'Prevents users from changing the title of default galleries to maintain consistency across the application.';
