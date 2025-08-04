// API Route for bulk downloading media items from Google Photos
// Downloads multiple media items and provides them as individual download links

import { google } from 'googleapis';
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// Type definitions
interface BulkDownloadRequest {
  mediaItemIds: string[];
}

interface BulkDownloadResponse {
  success: boolean;
  message: string;
  data?: {
    downloads: Array<{
      mediaItemId: string;
      downloadUrl: string;
      filename: string;
      mimeType: string;
      status: 'success' | 'error';
      error?: string;
    }>;
    successCount: number;
    totalCount: number;
  };
  error?: {
    code: string;
    message: string;
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

// Get fresh media item data from Google Photos API
async function getFreshMediaItem(
  googleMediaItemId: string,
  accessToken: string,
): Promise<{ baseUrl: string; filename: string }> {
  const url = `https://photoslibrary.googleapis.com/v1/mediaItems/${googleMediaItemId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch media item from Google Photos: ${response.status} - ${errorText}`,
    );
  }

  const mediaItem = await response.json();
  return {
    baseUrl: mediaItem.baseUrl,
    filename: mediaItem.filename || 'download',
  };
}

// Generate download URL for media item
function generateDownloadUrl(baseUrl: string, mimeType: string): string {
  // For images, use =d for download
  // For videos, use =dv for download video
  const downloadParam = mimeType.startsWith('video/') ? '=dv' : '=d';
  return `${baseUrl}${downloadParam}`;
}

// Process individual media item for bulk download
async function processMediaItem(
  mediaItemId: string,
  supabase: SupabaseClient,
  accessToken: string,
): Promise<{
  mediaItemId: string;
  downloadUrl: string;
  filename: string;
  mimeType: string;
  status: 'success' | 'error';
  error?: string;
}> {
  try {
    // Get media item from database (RLS will enforce access control)
    const { data: mediaItem, error: dbError } = await supabase
      .from('google_media_items')
      .select('id, google_media_item_id, filename, mime_type, base_url, user_id, album_id')
      .eq('id', mediaItemId)
      .single();

    if (dbError || !mediaItem) {
      return {
        mediaItemId,
        downloadUrl: '',
        filename: '',
        mimeType: '',
        status: 'error',
        error: 'Media item not found or access denied',
      };
    }

    // Get fresh media item data from Google Photos API
    const { baseUrl: freshBaseUrl, filename: freshFilename } = await getFreshMediaItem(
      mediaItem.google_media_item_id,
      accessToken,
    );

    // Generate download URL
    const downloadUrl = generateDownloadUrl(freshBaseUrl, mediaItem.mime_type);

    // Use the original filename from database, fallback to fresh filename
    const finalFilename = mediaItem.filename || freshFilename || 'download';

    return {
      mediaItemId,
      downloadUrl,
      filename: finalFilename,
      mimeType: mediaItem.mime_type,
      status: 'success',
    };
  } catch (error) {
    return {
      mediaItemId,
      downloadUrl: '',
      filename: '',
      mimeType: '',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// POST handler for bulk downloading media items
export async function POST(request: NextRequest): Promise<NextResponse<BulkDownloadResponse>> {
  try {
    const body: BulkDownloadRequest = await request.json();
    const { mediaItemIds } = body;

    if (!mediaItemIds || !Array.isArray(mediaItemIds) || mediaItemIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Media item IDs are required',
          error: {
            code: 'MISSING_MEDIA_ITEM_IDS',
            message: 'Please provide an array of media item IDs',
          },
        },
        { status: 400 },
      );
    }

    // Limit bulk downloads to prevent abuse
    if (mediaItemIds.length > 50) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many items requested',
          error: {
            code: 'TOO_MANY_ITEMS',
            message: 'Maximum 50 items can be downloaded at once',
          },
        },
        { status: 400 },
      );
    }

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
            message: 'Please sign in to download media items',
          },
        },
        { status: 401 },
      );
    }

    // Initialize Google client
    const { accessToken } = await initializeGoogleClient();

    // Process all media items
    const downloadPromises = mediaItemIds.map((mediaItemId) =>
      processMediaItem(mediaItemId, supabase, accessToken),
    );

    const downloads = await Promise.all(downloadPromises);
    const successCount = downloads.filter((d) => d.status === 'success').length;

    return NextResponse.json({
      success: true,
      message: `Generated ${successCount} of ${downloads.length} download URLs`,
      data: {
        downloads,
        successCount,
        totalCount: downloads.length,
      },
    });
  } catch (error) {
    console.error('Error in bulk download media API:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate bulk download URLs',
        error: {
          code: 'BULK_DOWNLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      },
      { status: 500 },
    );
  }
}

// Handle other HTTP methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
