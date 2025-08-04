// API Route for downloading media items from Google Photos
// Supports individual media item downloads with proper authentication and access control

import { google } from 'googleapis';
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Type definitions
interface DownloadResponse {
  success: boolean;
  message: string;
  data?: {
    downloadUrl: string;
    filename: string;
    mimeType: string;
    fileSize?: number;
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

// GET handler for downloading media items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mediaItemId: string }> },
): Promise<NextResponse<DownloadResponse>> {
  try {
    const { mediaItemId } = await params;

    if (!mediaItemId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Media item ID is required',
          error: {
            code: 'MISSING_MEDIA_ITEM_ID',
            message: 'Please provide a valid media item ID',
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

    // Get media item from database (RLS will enforce access control)
    const { data: mediaItem, error: dbError } = await supabase
      .from('google_media_items')
      .select('id, google_media_item_id, filename, mime_type, base_url, user_id, album_id')
      .eq('id', mediaItemId)
      .single();

    if (dbError || !mediaItem) {
      return NextResponse.json(
        {
          success: false,
          message: 'Media item not found or access denied',
          error: {
            code: 'MEDIA_ITEM_NOT_FOUND',
            message:
              'The requested media item does not exist or you do not have permission to access it',
          },
        },
        { status: 404 },
      );
    }

    // Initialize Google client
    const { accessToken } = await initializeGoogleClient();

    // Get fresh media item data from Google Photos API
    const { baseUrl: freshBaseUrl, filename: freshFilename } = await getFreshMediaItem(
      mediaItem.google_media_item_id,
      accessToken,
    );

    // Generate download URL
    const downloadUrl = generateDownloadUrl(freshBaseUrl, mediaItem.mime_type);

    // Use the original filename from database, fallback to fresh filename
    const finalFilename = mediaItem.filename || freshFilename || 'download';

    return NextResponse.json({
      success: true,
      message: 'Download URL generated successfully',
      data: {
        downloadUrl,
        filename: finalFilename,
        mimeType: mediaItem.mime_type,
      },
    });
  } catch (error) {
    console.error('Error in download media API:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate download URL',
        error: {
          code: 'DOWNLOAD_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
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
