import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Response interface
interface CreateAlbumResponse {
  success: boolean;
  message: string;
  data?: {
    albumId: string;
    title: string;
    productUrl: string;
    isWriteable: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Google OAuth2 client initialization
async function initializeGoogleClient() {
  console.log('Initializing Google OAuth2 client for album creation...');

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

    console.log('Successfully obtained access token for album creation');
    return { oauth2Client, accessToken };
  } catch (error) {
    console.error('OAuth2 error details:', error);
    throw new Error(
      `OAuth2 authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

// Create album in Google Photos
async function createAlbum(title: string, accessToken: string): Promise<unknown> {
  const createAlbumUrl = 'https://photoslibrary.googleapis.com/v1/albums';

  const albumData = {
    album: {
      title: title,
    },
  };

  const response = await fetch(createAlbumUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(albumData),
  });

  if (!response.ok) {
    const errorJson = await response.json();
    throw new Error(`Failed to create album: ${response.status} - ${JSON.stringify(errorJson)}`);
  }

  return await response.json();
}

// POST handler for creating albums
export async function POST(request: NextRequest): Promise<NextResponse<CreateAlbumResponse>> {
  const correlationId = `create-album-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  console.log(`[${correlationId}] Starting album creation request`);

  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log(`[${correlationId}] Authentication failed:`, authError);
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Please sign in to create albums',
          },
        },
        { status: 401 },
      );
    }

    console.log(`[${correlationId}] User authenticated: ${user.id}`);

    // Parse request body
    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid album title',
          error: {
            code: 'INVALID_TITLE',
            message: 'Album title is required and must be a non-empty string',
          },
        },
        { status: 400 },
      );
    }

    const sanitizedTitle = title.trim();
    console.log(`[${correlationId}] Creating album with title: "${sanitizedTitle}"`);

    // Initialize Google client
    const { accessToken } = await initializeGoogleClient();

    // Create album
    const result = await createAlbum(sanitizedTitle, accessToken);

    const creationTime = Date.now() - startTime;
    console.log(`[${correlationId}] Album created successfully in ${creationTime}ms`);

    // Extract album data from response
    const albumData = result as {
      id?: string;
      title?: string;
      productUrl?: string;
      isWriteable?: boolean;
    };

    return NextResponse.json({
      success: true,
      message: 'Album created successfully',
      data: {
        albumId: albumData.id || '',
        title: albumData.title || sanitizedTitle,
        productUrl: albumData.productUrl || '',
        isWriteable: albumData.isWriteable || false,
      },
    });
  } catch (error: unknown) {
    console.error(`[${correlationId}] Album creation failed:`, error);

    return NextResponse.json(
      {
        success: false,
        message: 'Album creation failed',
        error: {
          code: 'CREATION_ERROR',
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
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
