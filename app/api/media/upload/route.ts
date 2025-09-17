import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  MediaItemInsert,
  GalleryMediaItemInsert,
  FileUploadResult,
  DatabaseMediaItem,
} from '@/utils/supabase/types';
import {
  createSuccessResponse,
  createErrorResponse,
  executeQuery,
  extractFormDataFiles,
  generateFilePath,
  isValidMediaFile,
  isValidFileSize,
} from '@/utils/supabase/helpers';

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
  console.log('????? request formData ?????', formData);

  // Type-safe file extraction
  const files = extractFormDataFiles(formData, 'file');
  console.log('????? extracted files ?????', files.length, 'files');

  if (files.length === 0) {
    return createErrorResponse('No valid files provided', 400);
  }

  // Validate files
  const invalidFiles = files.filter((file) => !isValidMediaFile(file) || !isValidFileSize(file));
  if (invalidFiles.length > 0) {
    return createErrorResponse(
      `Invalid files detected: ${invalidFiles
        .map((f) => f.name)
        .join(', ')}. Only images and videos under 50MB are allowed.`,
      400,
    );
  }

  const uploadResults: FileUploadResult[] = [];

  for (const file of files) {
    const filePath = generateFilePath(user.id, file.name);
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

  const successfulUploads = uploadResults.filter(
    (r): r is FileUploadResult & { success: true } => r.success,
  );

  if (successfulUploads.length === 0) {
    return createErrorResponse('All file uploads failed.', 500);
  }

  const mediaItemsToInsert: MediaItemInsert[] = successfulUploads.map((upload) => ({
    uploader_id: user.id,
    file_path: upload.path!,
    filename: upload.name,
    original_filename: upload.name,
    title: upload.name,
    mime_type: upload.type!,
    file_size: upload.size,
  }));

  const { data: newMediaItems, error: dbError } = await executeQuery(
    supabase.from('media_items').insert(mediaItemsToInsert).select(),
  );

  if (dbError) {
    console.error('Error inserting media items into database:', dbError);
    return dbError;
  }

  // associate uploaded media items with the default gallery
  if (newMediaItems && Array.isArray(newMediaItems) && newMediaItems.length > 0) {
    const galleryMediaItemsToInsert: GalleryMediaItemInsert[] = newMediaItems.map(
      (item: DatabaseMediaItem) => ({
        gallery_id: galleryId,
        media_item_id: item.id,
        added_by: user.id,
      }),
    );

    const { error: galleryLinkError } = await executeQuery(
      supabase.from('gallery_media_items').insert(galleryMediaItemsToInsert),
    );

    if (galleryLinkError) {
      console.error('error linking media items to gallery:', galleryLinkError);
      return galleryLinkError;
    }
  }

  return createSuccessResponse(
    {
      mediaItems: newMediaItems,
      uploadResults,
    },
    `${successfulUploads.length} of ${files.length} files uploaded successfully.`,
  );
}
