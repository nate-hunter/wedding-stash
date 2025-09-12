import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/utils/supabase/server';

// Initialize Google OAuth2 client
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

// Get fresh media item from Google Photos
async function getFreshMediaItem(googleMediaItemId: string, accessToken: string) {
  const url = `https://photoslibrary.googleapis.com/v1/mediaItems/${googleMediaItemId}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch media item: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mediaItemId: string }> },
) {
  try {
    const { mediaItemId } = await params;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get media item from database (this enforces RLS)
    const { data: mediaItem, error: dbError } = await supabase
      .from('google_media_items')
      .select('google_media_item_id, filename, mime_type')
      .eq('id', mediaItemId)
      .single();

    if (dbError || !mediaItem) {
      return NextResponse.json({ error: 'Media item not found' }, { status: 404 });
    }

    // Initialize Google client and get fresh media item
    const { accessToken } = await initializeGoogleClient();
    const freshMediaItem = await getFreshMediaItem(mediaItem.google_media_item_id, accessToken);

    if (!freshMediaItem.baseUrl) {
      return NextResponse.json({ error: 'No base URL available' }, { status: 500 });
    }

    // Get size parameters from query string
    const width = request.nextUrl.searchParams.get('w') || '400';
    const height = request.nextUrl.searchParams.get('h') || '400';
    const imageUrl = `${freshMediaItem.baseUrl}=w${width}-h${height}`;

    // Fetch the image from Google Photos
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer();

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': mediaItem.mime_type || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Length': imageBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 });
  }
}
