import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  GalleryUpdate,
  GalleryWithMediaItems,
  UpdateGalleryFormData,
  GalleryMediaItemJunction,
  DatabaseMediaItem,
} from '@/utils/supabase/types';
import {
  createSuccessResponse,
  createErrorResponse,
  executeQuery,
  parseRequestJSON,
  isValidUUID,
  addPublicUrlsToMediaItems,
} from '@/utils/supabase/helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { galleryId } = await params;

  if (!galleryId || !isValidUUID(galleryId)) {
    return createErrorResponse('Valid Gallery ID is required.', 400);
  }

  const { data: gallery, error } = await executeQuery(
    supabase.from('galleries').select('*').eq('id', galleryId).eq('creator_id', user.id).single(),
  );

  if (error) {
    return error;
  }

  if (!gallery) {
    return createErrorResponse('Gallery not found.', 404);
  }

  const { data: mediaItems, error: mediaError } = await executeQuery(
    supabase.from('gallery_media_items').select('media_items(*)').eq('gallery_id', galleryId),
  );

  if (mediaError) {
    return mediaError;
  }

  // Extract media items from the junction table results
  const extractedMediaItems: DatabaseMediaItem[] = Array.isArray(mediaItems)
    ? mediaItems
        .map((item: GalleryMediaItemJunction) => {
          const mediaItem = Array.isArray(item.media_items)
            ? item.media_items[0]
            : item.media_items;
          return mediaItem || null;
        })
        .filter((item): item is DatabaseMediaItem => item !== null)
    : [];

  const mediaItemsWithUrls = addPublicUrlsToMediaItems(supabase, extractedMediaItems);

  const galleryWithMediaItems = {
    ...gallery,
    media_items: mediaItemsWithUrls,
  } as GalleryWithMediaItems;

  return createSuccessResponse({ gallery: galleryWithMediaItems }, 'Gallery fetched successfully.');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { galleryId } = await params;
  const body = await parseRequestJSON<UpdateGalleryFormData>(request);

  if (!galleryId || !isValidUUID(galleryId)) {
    return createErrorResponse('Valid Gallery ID is required.', 400);
  }

  if (!body) {
    return createErrorResponse('Invalid JSON in request body', 400);
  }

  const { title, description } = body;

  if (!title?.trim()) {
    return createErrorResponse('Title is required.', 400);
  }

  const updateData: GalleryUpdate = {
    title: title.trim(),
    description: description?.trim() || null,
  };

  const { data: updatedGallery, error } = await executeQuery(
    supabase
      .from('galleries')
      .update(updateData)
      .eq('id', galleryId)
      .eq('creator_id', user.id)
      .select()
      .single(),
  );

  if (error) {
    // Check if this is our custom constraint error for default galleries
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error);

    if (errorMessage?.includes('Cannot change the title of the default "Uploads" gallery')) {
      return createErrorResponse(
        'The title of your default "Uploads" gallery cannot be changed.',
        400,
      );
    }

    if (errorMessage?.includes('Default galleries must have the title "Uploads"')) {
      return createErrorResponse('Default galleries must be titled "Uploads".', 400);
    }

    return error;
  }

  if (!updatedGallery) {
    return createErrorResponse('Gallery not found.', 404);
  }

  return createSuccessResponse({ gallery: updatedGallery }, 'Gallery updated successfully.');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { galleryId } = await params;

  if (!galleryId || !isValidUUID(galleryId)) {
    return createErrorResponse('Valid Gallery ID is required.', 400);
  }

  const { error } = await executeQuery(
    supabase.from('galleries').delete().eq('id', galleryId).eq('creator_id', user.id),
  );

  if (error) {
    return error;
  }

  return createSuccessResponse(null, 'Gallery deleted successfully.');
}
