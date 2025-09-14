import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { galleryId: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { galleryId } = params;

  if (!galleryId) {
    return NextResponse.json(
      { success: false, message: 'Gallery ID is required.' },
      { status: 400 },
    );
  }

  const { data: gallery, error } = await supabase
    .from('galleries')
    .select('*')
    .eq('id', galleryId)
    .eq('creator_id', user.id)
    .single();

  if (error || !gallery) {
    return NextResponse.json({ success: false, message: 'Gallery not found.' }, { status: 404 });
  }

  const { data: mediaItems, error: mediaError } = await supabase
    .from('gallery_media_items')
    .select('media_items(*)')
    .eq('gallery_id', galleryId);

  if (mediaError) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch media items for the gallery.' },
      { status: 500 },
    );
  }

  const mediaItemsWithUrls = mediaItems
    .map((item) => {
      const mediaItem = Array.isArray(item.media_items) ? item.media_items[0] : item.media_items;
      if (!mediaItem) return null;

      const {
        data: { publicUrl },
      } = supabase.storage.from('media-items').getPublicUrl(mediaItem.file_path);

      return {
        ...mediaItem,
        url: publicUrl,
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    success: true,
    gallery: { ...gallery, media_items: mediaItemsWithUrls },
  });
}

export async function PUT(request: NextRequest, { params }: { params: { galleryId: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { galleryId } = params;
  const { title, description } = await request.json();

  if (!galleryId) {
    return NextResponse.json(
      { success: false, message: 'Gallery ID is required.' },
      { status: 400 },
    );
  }

  if (!title) {
    return NextResponse.json({ success: false, message: 'Title is required.' }, { status: 400 });
  }

  const { data: updatedGallery, error } = await supabase
    .from('galleries')
    .update({ title, description })
    .eq('id', galleryId)
    .eq('creator_id', user.id)
    .select()
    .single();

  if (error) {
    // Check if this is our custom constraint error for default galleries
    if (error.message?.includes('Cannot change the title of the default "Uploads" gallery')) {
      return NextResponse.json(
        {
          success: false,
          message: 'The title of your default "Uploads" gallery cannot be changed.',
        },
        { status: 400 },
      );
    }

    if (error.message?.includes('Default galleries must have the title "Uploads"')) {
      return NextResponse.json(
        { success: false, message: 'Default galleries must be titled "Uploads".' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, message: 'Gallery not found or update failed.' },
      { status: 404 },
    );
  }

  if (!updatedGallery) {
    return NextResponse.json({ success: false, message: 'Gallery not found.' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: 'Gallery updated successfully.',
    gallery: updatedGallery,
  });
}

export async function DELETE(request: NextRequest, { params }: { params: { galleryId: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { galleryId } = params;

  if (!galleryId) {
    return NextResponse.json(
      { success: false, message: 'Gallery ID is required.' },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from('galleries')
    .delete()
    .eq('id', galleryId)
    .eq('creator_id', user.id);

  if (error) {
    return NextResponse.json(
      { success: false, message: 'Gallery not found or delete failed.' },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, message: 'Gallery deleted successfully.' });
}
