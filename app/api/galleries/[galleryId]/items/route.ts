import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
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
  const { media_item_ids } = await request.json();

  if (!galleryId) {
    return NextResponse.json(
      { success: false, message: 'Gallery ID is required.' },
      { status: 400 },
    );
  }

  if (!media_item_ids || !Array.isArray(media_item_ids) || media_item_ids.length === 0) {
    return NextResponse.json(
      { success: false, message: 'An array of media_item_ids is required.' },
      { status: 400 },
    );
  }

  // 1. Verify gallery ownership
  const { data: gallery, error: galleryError } = await supabase
    .from('galleries')
    .select('id')
    .eq('id', galleryId)
    .eq('creator_id', user.id)
    .single();

  if (galleryError || !gallery) {
    return NextResponse.json(
      { success: false, message: 'Gallery not found or you do not have permission to modify it.' },
      { status: 404 },
    );
  }

  // 2. Verify media item ownership
  const { data: mediaItems, error: mediaItemsError } = await supabase
    .from('media_items')
    .select('id')
    .in('id', media_item_ids)
    .eq('uploader_id', user.id);

  if (mediaItemsError) {
    console.error('Error verifying media items:', mediaItemsError);
    return NextResponse.json(
      { success: false, message: 'An error occurred while verifying media items.' },
      { status: 500 },
    );
  }

  if (mediaItems.length !== media_item_ids.length) {
    return NextResponse.json(
      {
        success: false,
        message: 'One or more media items were not found or do not belong to you.',
      },
      { status: 403 },
    );
  }

  // 3. Insert into gallery_media_items
  const itemsToInsert = media_item_ids.map((media_item_id) => ({
    gallery_id: galleryId,
    media_item_id: media_item_id,
    added_by: user.id,
  }));

  const { error: insertError } = await supabase.from('gallery_media_items').insert(itemsToInsert);

  if (insertError) {
    console.error('Error adding media items to gallery:', insertError);
    // This could be a unique constraint violation if the items are already in the gallery.
    // A more robust implementation would handle this gracefully.
    return NextResponse.json(
      { success: false, message: 'Failed to add media items to gallery.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Media items added to gallery successfully.',
  });
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
  const { media_item_ids } = await request.json();

  if (!galleryId) {
    return NextResponse.json(
      { success: false, message: 'Gallery ID is required.' },
      { status: 400 },
    );
  }

  if (!media_item_ids || !Array.isArray(media_item_ids) || media_item_ids.length === 0) {
    return NextResponse.json(
      { success: false, message: 'An array of media_item_ids is required.' },
      { status: 400 },
    );
  }

  // 1. Verify gallery ownership (ensures user can modify this gallery)
  const { data: gallery, error: galleryError } = await supabase
    .from('galleries')
    .select('id')
    .eq('id', galleryId)
    .eq('creator_id', user.id)
    .single();

  if (galleryError || !gallery) {
    return NextResponse.json(
      { success: false, message: 'Gallery not found or you do not have permission to modify it.' },
      { status: 404 },
    );
  }

  // 2. Delete from gallery_media_items
  const { error: deleteError } = await supabase
    .from('gallery_media_items')
    .delete()
    .eq('gallery_id', galleryId)
    .in('media_item_id', media_item_ids);

  if (deleteError) {
    console.error('Error removing media items from gallery:', deleteError);
    return NextResponse.json(
      { success: false, message: 'Failed to remove media items from gallery.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Media items removed from gallery successfully.',
  });
}
