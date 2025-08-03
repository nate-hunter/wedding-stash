import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { getGoogleAccessToken } from '@/utils/google-auth';

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
    uploadUrl: string;
    accessToken: string;
    albumId: string;
    fileCount: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Google Photos requires actual file content to generate upload tokens
// So we'll return the upload URL and access token for client-side upload
function getGooglePhotosUploadInfo(accessToken: string): {
  uploadUrl: string;
  accessToken: string;
} {
  return {
    uploadUrl: 'https://photoslibrary.googleapis.com/v1/uploads',
    accessToken: accessToken,
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
    .select('album_id, album_title')
    .eq('user_id', user.id)
    .single();

  if (existingAlbum?.album_id) {
    return existingAlbum.album_id;
  }

  // Get user's email from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single();

  const userEmail = profile?.email || user.email || 'user';
  const timestamp = new Date().toISOString().replace('T', '__').substring(0, 19);
  const albumTitle = `${userEmail}__${timestamp}`;

  // Create new user-specific album
  const albumResponse = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      album: {
        title: albumTitle,
      },
    }),
  });

  if (!albumResponse.ok) {
    throw new Error('Failed to create Google Photos album');
  }

  const albumData = await albumResponse.json();
  const albumId = albumData.id;

  // Save user-specific album to database
  await supabase.from('google_photos_albums').insert({
    user_id: user.id,
    album_id: albumId,
    album_title: albumTitle,
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

    // Get Google access token using refresh token
    const accessToken = await getGoogleAccessToken();

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

    // Return upload info for client-side direct upload
    const uploadInfo = getGooglePhotosUploadInfo(accessToken);

    return NextResponse.json({
      success: true,
      message: `Ready to upload ${files.length} file${files.length > 1 ? 's' : ''}`,
      data: {
        uploadUrl: uploadInfo.uploadUrl,
        accessToken: uploadInfo.accessToken,
        albumId,
        fileCount: files.length,
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
