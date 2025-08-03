import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface CompleteUploadRequest {
  uploadTokens: Array<{
    filename: string;
    uploadToken: string;
  }>;
  albumId: string;
}

interface CompleteUploadResponse {
  success: boolean;
  message: string;
  data?: {
    filesUploaded: number;
    mediaItems: Array<{
      mediaItemId?: string;
      filename: string;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface GooglePhotosMediaItem {
  mediaItem?: {
    id?: string;
  };
}

interface GooglePhotosBatchResponse {
  newMediaItemResults?: GooglePhotosMediaItem[];
}

async function createBatchMediaItems(
  uploadTokens: Array<{ filename: string; uploadToken: string }>,
  albumId: string,
  accessToken: string,
): Promise<GooglePhotosBatchResponse> {
  const newMediaItems = uploadTokens.map((token) => ({
    description: `Uploaded: ${token.filename}`,
    simpleMediaItem: {
      fileName: token.filename,
      uploadToken: token.uploadToken,
    },
  }));

  const batchCreateResponse = await fetch(
    'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newMediaItems,
        albumId,
      }),
    },
  );

  if (!batchCreateResponse.ok) {
    const errorText = await batchCreateResponse.text();
    throw new Error(
      `Google Photos batch create failed: ${batchCreateResponse.status} ${errorText}`,
    );
  }

  return await batchCreateResponse.json();
}

export async function POST(request: NextRequest): Promise<NextResponse<CompleteUploadResponse>> {
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

    const body: CompleteUploadRequest = await request.json();
    const { uploadTokens, albumId } = body;

    if (!uploadTokens || uploadTokens.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No upload tokens provided',
          error: { code: 'VALIDATION_ERROR', message: 'Upload tokens array is required' },
        },
        { status: 400 },
      );
    }

    // Create media items using batch API
    const result = await createBatchMediaItems(uploadTokens, albumId, accessToken);

    const mediaItemResults = result?.newMediaItemResults || [];

    return NextResponse.json({
      success: true,
      message: `${uploadTokens.length} file${
        uploadTokens.length > 1 ? 's' : ''
      } uploaded successfully to Google Photos`,
      data: {
        filesUploaded: uploadTokens.length,
        mediaItems: mediaItemResults.map((item: GooglePhotosMediaItem, index: number) => ({
          mediaItemId: item?.mediaItem?.id,
          filename: uploadTokens[index]?.filename,
        })),
      },
    });
  } catch (error: unknown) {
    console.error('Upload completion error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to complete upload';

    return NextResponse.json(
      {
        success: false,
        message: 'Upload completion failed',
        error: { code: 'COMPLETION_ERROR', message: errorMessage },
      },
      { status: 500 },
    );
  }
}
