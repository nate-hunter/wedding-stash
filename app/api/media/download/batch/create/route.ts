import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { media_item_ids, name } = await request.json();

  if (!media_item_ids || !Array.isArray(media_item_ids) || media_item_ids.length === 0) {
    return NextResponse.json(
      { success: false, message: 'An array of media_item_ids is required.' },
      { status: 400 },
    );
  }

  // 1. Verify media item ownership
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

  // 2. Create a new download collection
  const { data: newCollection, error: collectionError } = await supabase
    .from('download_collections')
    .insert({ user_id: user.id, name: name || 'Download Collection' })
    .select()
    .single();

  if (collectionError || !newCollection) {
    console.error('Error creating download collection:', collectionError);
    return NextResponse.json(
      { success: false, message: 'Failed to create download collection.' },
      { status: 500 },
    );
  }

  // 3. Add items to the collection
  const itemsToInsert = media_item_ids.map((media_item_id: string) => ({
    collection_id: newCollection.id,
    media_item_id: media_item_id,
  }));

  const { error: insertError } = await supabase
    .from('download_collection_items')
    .insert(itemsToInsert);

  if (insertError) {
    console.error('Error adding items to download collection:', insertError);
    // In a real-world scenario, you might want to delete the collection record if this fails.
    return NextResponse.json(
      { success: false, message: 'Failed to add items to download collection.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Download collection created successfully.',
    collection: newCollection,
  });
}
