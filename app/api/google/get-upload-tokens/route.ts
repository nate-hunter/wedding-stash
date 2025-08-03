import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SupabaseClient, User } from '@supabase/supabase-js';

interface UploadTokenRequest {
  files: Array<{
    filename: string;
    mimeType: string;
    size: number;
  }>;
}

interface UploadTokenResponse {
  success: boolean;
  message: string;
  data?: {
    tokens: Array<{
      filename: string;
      uploadToken: string;
      uploadUrl: string;
    }>;
    albumId: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

async function uploadToGooglePhotos(
  mimeType: string,
  accessToken: string,
): Promise<{ uploadToken: string; uploadUrl: string }> {
  const uploadResponse = await fetch('https://photoslibrary.googleapis.com/v1/uploads', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
      'X-Goog-Upload-Content-Type': mimeType,
      'X-Goog-Upload-Protocol': 'raw',
    },
    body: '', // Empty body to get upload token
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Google Photos upload token failed: ${uploadResponse.status} ${errorText}`);
  }

  const uploadToken = await uploadResponse.text();
  return {
    uploadToken,
    uploadUrl: 'https://photoslibrary.googleapis.com/v1/uploads',
  };
}

async function getOrCreateAlbum(
  supabase: SupabaseClient,
  user: User,
  accessToken: string,
): Promise<string> {
  // Check if user already has an album
  const { data: existingAlbum } = await supabase
    .from('google_photos_albums')
    .select('album_id')
    .eq('user_id', user.id)
    .single();

  if (existingAlbum?.album_id) {
    return existingAlbum.album_id;
  }

  // Create new album
  const albumResponse = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      album: {
        title: 'Wedding Photos',
      },
    }),
  });

  if (!albumResponse.ok) {
    throw new Error('Failed to create Google Photos album');
  }

  const albumData = await albumResponse.json();
  const albumId = albumData.id;

  // Save album to database
  await supabase.from('google_photos_albums').insert({
    user_id: user.id,
    album_id: albumId,
    album_title: 'Wedding Photos',
  });

  return albumId;
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadTokenResponse>> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
          error: { code: 'AUTH_ERROR', message: 'User not authenticated' },
        },
        { status: 401 },
      );
    }

    // Get user's Google access token
    const { data: profile } = await supabase
      .from('profiles')
      .select('google_access_token')
      .eq('id', user.id)
      .single();

    const accessToken = profile?.google_access_token;
    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Google Photos access not configured',
          error: { code: 'AUTH_ERROR', message: 'Google Photos access token required' },
        },
        { status: 401 },
      );
    }

    const body: UploadTokenRequest = await request.json();
    const { files } = body;

    if (!files || files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No files specified',
          error: { code: 'VALIDATION_ERROR', message: 'Files array is required' },
        },
        { status: 400 },
      );
    }

    // Get or create album
    const albumId = await getOrCreateAlbum(supabase, user, accessToken);

    // Generate upload tokens for each file
    const tokens = await Promise.all(
      files.map(async (file) => {
        const { uploadToken, uploadUrl } = await uploadToGooglePhotos(file.mimeType, accessToken);
        return {
          filename: file.filename,
          uploadToken,
          uploadUrl,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      message: `Generated ${tokens.length} upload token${tokens.length > 1 ? 's' : ''}`,
      data: {
        tokens,
        albumId,
      },
    });
  } catch (error: unknown) {
    console.error('Upload token generation error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to generate upload tokens';

    return NextResponse.json(
      {
        success: false,
        message: 'Token generation failed',
        error: { code: 'TOKEN_ERROR', message: errorMessage },
      },
      { status: 500 },
    );
  }
}
