import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

export async function GET(request: NextRequest, { params }: { params: { collectionId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { collectionId } = params;

  if (!collectionId) {
    return NextResponse.json(
      { success: false, message: 'Collection ID is required.' },
      { status: 400 },
    );
  }

  // 1. Verify collection ownership and check expiration
  const { data: collection, error: collectionError } = await supabase
    .from('download_collections')
    .select('id, name, expires_at')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single();

  if (collectionError || !collection) {
    return NextResponse.json(
      { success: false, message: 'Download collection not found.' },
      { status: 404 },
    );
  }

  if (new Date(collection.expires_at) < new Date()) {
    return NextResponse.json(
      { success: false, message: 'This download link has expired.' },
      { status: 410 },
    );
  }

  // 2. Fetch media items in the collection
  const { data: items, error: itemsError } = await supabase
    .from('download_collection_items')
    .select('media_items(file_path, filename)')
    .eq('collection_id', collectionId);

  if (itemsError || !items || items.length === 0) {
    return NextResponse.json(
      { success: false, message: 'No items found in this collection.' },
      { status: 404 },
    );
  }

  const zip = new JSZip();

  // 3. Download files from storage and add to zip
  const downloadPromises = items.map(async (item) => {
    const mediaItem = item.media_items as { file_path: string; filename: string };
    if (!mediaItem) return;

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('media-items')
      .download(mediaItem.file_path);

    if (downloadError) {
      console.error(`Failed to download ${mediaItem.file_path}:`, downloadError);
      // Skip this file and continue
      return;
    }

    zip.file(mediaItem.filename, await fileData.arrayBuffer());
  });

  await Promise.all(downloadPromises);

  // 4. Generate and return the zip file
  const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
  const collectionName = collection.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  return new NextResponse(zipContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${collectionName || 'download'}.zip"`,
    },
  });
}
