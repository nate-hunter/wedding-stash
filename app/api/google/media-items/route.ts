import { google } from 'googleapis';
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// Types based on Google Photos Library API
interface GoogleMediaItem {
  id: string;
  description?: string;
  productUrl: string;
  baseUrl: string;
  mimeType: string;
  filename: string;
  mediaMetadata: {
    creationTime: string;
    width: string;
    height: string;
    photo?: {
      cameraMake?: string;
      cameraModel?: string;
      focalLength?: number;
      apertureFNumber?: number;
      isoEquivalent?: number;
      exposureTime?: string;
    };
    video?: {
      fps?: number;
      status?: string;
    };
  };
  contributorInfo?: {
    profilePictureBaseUrl?: string;
    displayName?: string;
  };
}

interface MediaItemsResponse {
  success: boolean;
  message: string;
  data?: {
    mediaItems: GoogleMediaItem[];
    nextPageToken?: string;
    totalCount?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Google OAuth2 client initialization
async function initializeGoogleClient() {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REFRESH_TOKEN
  ) {
    throw new Error('Missing required OAuth2 environment variables');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  try {
    const { token: accessToken } = await oauth2Client.getAccessToken();

    if (!accessToken) {
      throw new Error('Failed to obtain Google access token');
    }

    return { oauth2Client, accessToken };
  } catch (error) {
    throw new Error(
      `OAuth2 authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

// Fetch media items from Google Photos album
async function fetchMediaItemsFromAlbum(
  albumId: string,
  accessToken: string,
  pageSize: number = 50,
  pageToken?: string,
): Promise<{ mediaItems: GoogleMediaItem[]; nextPageToken?: string }> {
  const searchUrl = 'https://photoslibrary.googleapis.com/v1/mediaItems:search';

  const searchBody = {
    albumId: albumId,
    pageSize: pageSize,
    pageToken: pageToken,
  };

  const response = await fetch(searchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(searchBody),
  });

  if (!response.ok) {
    const errorJson = await response.json();
    throw new Error(
      `Failed to fetch media items: ${response.status} - ${JSON.stringify(errorJson)}`,
    );
  }

  const result = await response.json();
  return {
    mediaItems: result.mediaItems || [],
    nextPageToken: result.nextPageToken,
  };
}

// Sync media items to database
async function syncMediaItemsToDatabase(
  supabase: SupabaseClient,
  userId: string,
  albumInternalId: string,
  mediaItems: GoogleMediaItem[],
) {
  const mediaItemsToInsert = mediaItems.map((item) => ({
    user_id: userId,
    album_id: albumInternalId,
    google_media_item_id: item.id,
    description: item.description,
    product_url: item.productUrl,
    base_url: item.baseUrl,
    mime_type: item.mimeType,
    filename: item.filename,
    width: parseInt(item.mediaMetadata.width) || null,
    height: parseInt(item.mediaMetadata.height) || null,
    creation_time: item.mediaMetadata.creationTime,
    camera_make: item.mediaMetadata.photo?.cameraMake,
    camera_model: item.mediaMetadata.photo?.cameraModel,
    focal_length: item.mediaMetadata.photo?.focalLength,
    aperture_f_number: item.mediaMetadata.photo?.apertureFNumber,
    iso_equivalent: item.mediaMetadata.photo?.isoEquivalent,
    exposure_time: item.mediaMetadata.photo?.exposureTime,
    fps: item.mediaMetadata.video?.fps,
    processing_status: item.mediaMetadata.video?.status,
    contributor_info: item.contributorInfo ? JSON.stringify(item.contributorInfo) : null,
  }));

  // Use upsert to handle duplicates
  const { error } = await supabase.from('google_media_items').upsert(mediaItemsToInsert, {
    onConflict: 'google_media_item_id',
    ignoreDuplicates: false,
  });

  if (error) {
    console.error('Error syncing media items to database:', error);
    // Don't throw here - we still want to return the media items even if DB sync fails
  }
}

// GET handler for fetching media items
export async function GET(request: NextRequest): Promise<NextResponse<MediaItemsResponse>> {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const pageToken = url.searchParams.get('pageToken') || undefined;
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '50'), 100); // Max 100

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Please sign in to view your photos',
          },
        },
        { status: 401 },
      );
    }

    // Get user's album from database
    const { data: albumData, error: albumError } = await supabase
      .from('google_photos_albums')
      .select('id, google_album_id')
      .eq('user_id', user.id)
      .single();

    if (albumError || !albumData) {
      return NextResponse.json(
        {
          success: false,
          message: 'No album found for user',
          error: {
            code: 'NO_ALBUM',
            message: 'User has not created any albums yet',
          },
        },
        { status: 404 },
      );
    }

    // Initialize Google client
    const { accessToken } = await initializeGoogleClient();

    // Fetch media items from Google Photos
    const { mediaItems, nextPageToken } = await fetchMediaItemsFromAlbum(
      albumData.google_album_id,
      accessToken,
      pageSize,
      pageToken,
    );

    // Sync media items to database (async, don't wait)
    if (mediaItems.length > 0) {
      syncMediaItemsToDatabase(supabase, user.id, albumData.id, mediaItems).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      message: 'Media items fetched successfully',
      data: {
        mediaItems,
        nextPageToken,
        totalCount: mediaItems.length,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching media items:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch media items',
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details:
            process.env.NODE_ENV === 'development' && error instanceof Error
              ? error.stack
              : undefined,
        },
      },
      { status: 500 },
    );
  }
}

// Handle other HTTP methods
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
