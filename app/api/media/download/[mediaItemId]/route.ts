import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { mediaItemId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { mediaItemId } = params;

  if (!mediaItemId) {
    return NextResponse.json(
      { success: false, message: 'Media Item ID is required.' },
      { status: 400 },
    );
  }

  // 1. Fetch the media item and verify ownership
  const { data: mediaItem, error: itemError } = await supabase
    .from('media_items')
    .select('file_path')
    .eq('id', mediaItemId)
    .eq('uploader_id', user.id)
    .single();

  if (itemError || !mediaItem) {
    return NextResponse.json(
      {
        success: false,
        message: 'Media item not found or you do not have permission to access it.',
      },
      { status: 404 },
    );
  }

  // 2. Create a signed URL for the file
  const { data, error: urlError } = await supabase.storage
    .from('media-items')
    .createSignedUrl(mediaItem.file_path, 3600); // Expires in 1 hour

  if (urlError || !data) {
    console.error('Error creating signed URL:', urlError);
    return NextResponse.json(
      { success: false, message: 'Could not create download link.' },
      { status: 500 },
    );
  }

  // 3. Redirect to the signed URL to trigger download
  return NextResponse.redirect(data.signedUrl);
}
