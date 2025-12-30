import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, executeQuery } from '@/utils/supabase/helpers';
import {
  FinalizeUploadRequest,
  MediaItemInsert,
  GalleryMediaItemInsert,
  DatabaseMediaItem,
} from '@/utils/supabase/types';
import { reverseGeocode } from '@/lib/geocoding';
import { getDefaultTitle } from '@/utils/file-helpers';

/**
 * Finalize Upload Endpoint
 *
 * Part of the unified file upload system (Phase 1, Step 2.2)
 * Creates the database record after file has been uploaded to Supabase Storage
 *
 * Flow:
 * 1. Client has already uploaded file to Supabase using signed URL
 * 2. Client sends file path and all extracted metadata to this endpoint
 * 3. Server performs reverse geocoding if coordinates present
 * 4. Server creates media_items record with enriched metadata
 * 5. Server links media item to user's default gallery
 * 6. Server returns created record
 */

export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Step 2: Parse and validate request body
    const body: FinalizeUploadRequest = await request.json();

    // Validate required fields
    if (!body.path || !body.filename || !body.mime_type || !body.file_size) {
      return createErrorResponse(
        'Missing required fields: path, filename, mime_type, and file_size are required',
        400,
      );
    }

    // Step 3: Perform reverse geocoding if coordinates are present
    let locationName: string | null = null;
    if (body.lat && body.lon) {
      console.log(`Reverse geocoding coordinates: ${body.lat}, ${body.lon}`);
      locationName = await reverseGeocode(body.lat, body.lon);
      if (locationName) {
        console.log(`Geocoded location: ${locationName}`);
      }
    }

    // Step 4: Get or create default gallery for the user
    const { data: galleryId, error: galleryError } = await supabase.rpc(
      'get_or_create_default_gallery',
      {
        p_user_id: user.id,
      },
    );

    if (galleryError) {
      console.error('Error getting or creating default gallery:', galleryError);
      return NextResponse.json(
        {
          success: false,
          message: 'Could not prepare gallery for upload.',
          error: galleryError.message,
        },
        { status: 500 },
      );
    }

    // Step 5: Prepare media item data with all enriched metadata
    const mediaItemData: MediaItemInsert = {
      // Required fields
      uploader_id: user.id,
      file_path: body.path,
      filename: body.filename,
      original_filename: body.filename,
      // Use provided title or default to filename without extension
      title: body.title || getDefaultTitle(body.filename),
      mime_type: body.mime_type,
      file_size: body.file_size,

      // Optional metadata from client (dimensions)
      width: body.width,
      height: body.height,

      // Geolocation metadata
      lat: body.lat,
      lon: body.lon,
      location_name: locationName, // Server-enriched from reverse geocoding

      // Camera metadata from EXIF
      camera_make: body.camera_make,
      camera_model: body.camera_model,

      // Timestamp metadata
      date_taken: body.date_taken,

      // Complete EXIF data for future use
      exif_data: body.exif_data as never, // Cast to satisfy JSON type

      // Content source
      source: 'user', // All user uploads are marked as 'user' source

      // Optional description
      description: body.description,
    };

    // Step 6: Insert media item into database
    const { data: newMediaItem, error: dbError } = await executeQuery<DatabaseMediaItem>(
      supabase.from('media_items').insert(mediaItemData).select().single(),
      'Failed to insert media item',
    );

    if (dbError) {
      console.error('Error inserting media item into database:', dbError);
      return dbError;
    }

    // Step 7: Link media item to default gallery
    if (newMediaItem) {
      const galleryMediaItemToInsert: GalleryMediaItemInsert = {
        gallery_id: galleryId,
        media_item_id: newMediaItem.id,
        added_by: user.id,
      };

      const { error: galleryLinkError } = await executeQuery(
        supabase.from('gallery_media_items').insert(galleryMediaItemToInsert),
        'Failed to link media item to gallery',
      );

      if (galleryLinkError) {
        console.error('Error linking media item to gallery:', galleryLinkError);
        return galleryLinkError;
      }
    }

    // Step 8: Return success response with created media item
    return createSuccessResponse(
      {
        mediaItem: newMediaItem,
        metadata: {
          hasLocation: !!(body.lat && body.lon),
          locationName: locationName,
          hasCameraInfo: !!(body.camera_make || body.camera_model),
          hasDateTaken: !!body.date_taken,
        },
      },
      'Media item created successfully',
      201, // 201 Created
    );
  } catch (error) {
    console.error('Finalize upload error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
    );
  }
}
