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

  // get or create the default gallery for the user
  const { data: galleryId, error: galleryError } = await supabase.rpc(
    'get_or_create_default_gallery',
    {
      p_user_id: user.id,
    },
  );

  if (galleryError) {
    console.error('error getting or creating default gallery:', galleryError);
    return NextResponse.json(
      {
        success: false,
        message: 'could not prepare gallery for upload.',
        error: galleryError.message,
      },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  console.log('????? request formData ?????', formData); // $ has formdata: [ { name: 'file', value: [file] } ]
  // const files = formData.getAll('files') as File[];
  const files = formData.getAll('file') as Array<File>;
  console.log('????? request files ?????', files); // !!! No files found - empty array [] !!!

  if (!files || files.length === 0) {
    return new NextResponse('No files provided', { status: 400 });
  }

  const uploadResults = [];

  for (const file of files) {
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('media-items').upload(filePath, file);

    if (error) {
      console.error('Error uploading file:', error);
      uploadResults.push({ success: false, name: file.name, error: error.message });
      continue; // Continue to next file
    }

    uploadResults.push({
      success: true,
      name: file.name,
      path: data.path,
      type: file.type,
      size: file.size,
    });
  }

  const successfulUploads = uploadResults.filter((r) => r.success);

  if (successfulUploads.length === 0) {
    return NextResponse.json(
      { success: false, message: 'All file uploads failed.', results: uploadResults },
      { status: 500 },
    );
  }

  const mediaItemsToInsert = successfulUploads.map((upload) => ({
    uploader_id: user.id,
    file_path: upload.path,
    filename: upload.name,
    original_filename: upload.name,
    title: upload.name,
    mime_type: upload.type,
    file_size: upload.size,
  }));

  const { data: newMediaItems, error: dbError } = await supabase
    .from('media_items')
    .insert(mediaItemsToInsert)
    .select();

  if (dbError) {
    console.error('Error inserting media items into database:', dbError);
    // Note: This is a simplification. In a real-world scenario, you might want to
    // implement a cleanup process to delete the already uploaded files from storage
    // if the database insert fails.
    return NextResponse.json(
      { success: false, message: 'Failed to save file metadata.', error: dbError.message },
      { status: 500 },
    );
  }

  // associate uploaded media items with the default gallery
  if (newMediaItems && newMediaItems.length > 0) {
    const galleryMediaItemsToInsert = newMediaItems.map((item) => ({
      gallery_id: galleryId,
      media_item_id: item.id,
      added_by: user.id,
    }));

    const { error: galleryLinkError } = await supabase
      .from('gallery_media_items')
      .insert(galleryMediaItemsToInsert);

    if (galleryLinkError) {
      console.error('error linking media items to gallery:', galleryLinkError);
      // note: this is a simplification. in a real-world scenario, you might want to
      // implement a cleanup process to delete the already uploaded files from storage
      // and the media_items records if the gallery linking fails.
      return NextResponse.json(
        {
          success: false,
          message: 'failed to link media to gallery.',
          error: galleryLinkError.message,
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    success: true,
    message: `${successfulUploads.length} of ${files.length} files uploaded successfully.`,
    mediaItems: newMediaItems,
  });
}
