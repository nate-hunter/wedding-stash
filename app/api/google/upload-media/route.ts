// API Route for uploading media to Google Photos (App Router)
// All users upload to a shared Google Photos album

import { google } from 'googleapis';
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { User, SupabaseClient } from '@supabase/supabase-js';

// Constants and configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for photos
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB for videos
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/mov',
  'video/avi',
  'video/wmv',
  'video/flv',
  'video/webm',
];
const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.mp4',
  '.mov',
  '.avi',
  '.wmv',
  '.flv',
  '.webm',
];

// Type definitions
interface GoogleAlbum {
  id: string;
  title: string;
  productUrl: string;
  isWriteable?: boolean;
}

interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    mediaItemId?: string;
    filename: string;
    fileSize: number;
    uploadTime: string;
    mimeType: string;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

interface NewMediaItem {
  description?: string;
  simpleMediaItem: {
    fileName: string;
    uploadToken: string;
  };
}

interface BatchCreateRequest {
  albumId?: string;
  newMediaItems: NewMediaItem[];
}

// Environment validation
function validateEnvironment(): void {
  const requiredEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REFRESH_TOKEN',
    // 'GOOGLE_PHOTOS_ALBUM_ID', // No longer required, will be dynamic
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// File validation
function validateFile(file: File, filename: string): { isValid: boolean; error?: string } {
  // Check file size
  const maxSize = ALLOWED_VIDEO_TYPES.includes(file.type) ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
    };
  }

  // Check MIME type
  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file extension
  const fileExtension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File extension ${fileExtension} is not allowed. Allowed extensions: ${ALLOWED_EXTENSIONS.join(
        ', ',
      )}`,
    };
  }

  return { isValid: true };
}

// Create a new album in Google Photos
async function createGoogleAlbum(title: string, accessToken: string): Promise<GoogleAlbum> {
  const createAlbumUrl = 'https://photoslibrary.googleapis.com/v1/albums';
  const response = await fetch(createAlbumUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ album: { title } }),
  });

  if (!response.ok) {
    const errorJson = await response.json();
    throw new Error(
      `Failed to create Google album: ${response.status} - ${JSON.stringify(errorJson)}`,
    );
  }

  return await response.json();
}

async function getOrCreateAlbum(
  supabase: SupabaseClient,
  user: User,
  accessToken: string,
): Promise<string> {
  // 1. Check for existing album in our DB
  const { data: existingAlbum, error: dbError } = await supabase
    .from('google_photos_albums')
    .select('google_album_id')
    .eq('user_id', user.id)
    .single();

  if (dbError && dbError.code !== 'PGRST116') {
    // PGRST116: no rows found
    throw new Error(`Database error fetching album: ${dbError.message}`);
  }

  if (existingAlbum) {
    return existingAlbum.google_album_id;
  }

  // 2. If no album, create one
  const datestamp = new Date().toISOString().split('T')[0]; // Gets YYYY-MM-DD format
  const albumTitle = `${user.email}__${datestamp}`;

  const newGoogleAlbum = await createGoogleAlbum(albumTitle, accessToken);

  if (!newGoogleAlbum || !newGoogleAlbum.id) {
    throw new Error('Failed to create Google Album, response was invalid.');
  }

  // 3. Save the new album to our DB
  const { data: newDbAlbum, error: insertError } = await supabase
    .from('google_photos_albums')
    .insert({
      user_id: user.id,
      google_album_id: newGoogleAlbum.id,
      title: newGoogleAlbum.title,
      product_url: newGoogleAlbum.productUrl,
      is_writeable: newGoogleAlbum.isWriteable,
    })
    .select('google_album_id')
    .single();

  if (insertError) {
    // For now, we'll just log and throw. A more robust solution might try to delete the Google Album.
    console.error(
      'Failed to save new album to database, orphan album created in Google Photos:',
      newGoogleAlbum.id,
    );
    throw new Error(`Database error saving new album: ${insertError.message}`);
  }

  return newDbAlbum.google_album_id;
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
      throw new Error('Failed to obtain Google access token - no token returned');
    }

    return { oauth2Client, accessToken };
  } catch (error) {
    throw new Error(
      `OAuth2 authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

// Upload file to Google Photos
async function uploadToGooglePhotos(
  fileContent: ArrayBuffer,
  mimeType: string,
  accessToken: string,
): Promise<string> {
  const uploadUrl = 'https://photoslibrary.googleapis.com/v1/uploads';

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': mimeType,
      'X-Goog-Upload-Protocol': 'raw',
      Authorization: `Bearer ${accessToken}`,
    },
    body: fileContent,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Google Photos upload failed: ${uploadResponse.status} - ${errorText}`);
  }

  return await uploadResponse.text();
}

// Create media item in Google Photos
async function createMediaItem(
  uploadToken: string,
  filename: string,
  description: string,
  albumId: string,
  accessToken: string,
): Promise<unknown> {
  const createMediaItemUrl = 'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate';

  const newMediaItem: NewMediaItem = {
    description: description,
    simpleMediaItem: {
      fileName: filename,
      uploadToken: uploadToken,
    },
  };

  const mediaItemBody: BatchCreateRequest = {
    albumId: albumId,
    newMediaItems: [newMediaItem],
  };

  const createMediaItemResponse = await fetch(createMediaItemUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(mediaItemBody),
  });

  if (!createMediaItemResponse.ok) {
    const errorJson = await createMediaItemResponse.json();
    throw new Error(
      `Failed to create media item: ${createMediaItemResponse.status} - ${JSON.stringify(
        errorJson,
      )}`,
    );
  }

  return await createMediaItemResponse.json();
}

// POST handler for App Router
export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  const startTime = Date.now();

  try {
    // Validate environment variables
    validateEnvironment();

    // Initialize Supabase client and authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          error: {
            code: 'AUTH_ERROR',
            message: 'User authentication required',
          },
        },
        { status: 401 },
      );
    }

    // Parse form data
    const formData = await request.formData();

    // Extract file and form data
    const mediaFile = formData.get('media') as File | null;
    const description = (formData.get('description') as string) || '';
    const filename = (formData.get('filename') as string) || mediaFile?.name || 'unnamed_file';

    if (!mediaFile) {
      return NextResponse.json(
        {
          success: false,
          message: 'No file provided',
          error: {
            code: 'NO_FILE',
            message: 'Please select a file to upload',
          },
        },
        { status: 400 },
      );
    }

    // Validate file
    const validation = validateFile(mediaFile, filename);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'File validation failed',
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error!,
          },
        },
        { status: 400 },
      );
    }

    // Initialize Google client
    const { accessToken } = await initializeGoogleClient();

    // Get or create album for the user
    const albumId = await getOrCreateAlbum(supabase, user, accessToken);

    // Convert File to ArrayBuffer for upload
    const fileContent = await mediaFile.arrayBuffer();

    // Upload to Google Photos
    const uploadToken = await uploadToGooglePhotos(
      fileContent,
      mediaFile.type || 'application/octet-stream',
      accessToken,
    );

    // Create media item
    const result = await createMediaItem(uploadToken, filename, description, albumId, accessToken);

    const uploadTime = Date.now() - startTime;

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Media uploaded successfully to Google Photos',
      data: {
        mediaItemId: (result as { newMediaItemResults?: Array<{ mediaItem?: { id?: string } }> })
          ?.newMediaItemResults?.[0]?.mediaItem?.id,
        filename,
        fileSize: mediaFile.size,
        uploadTime: `${uploadTime}ms`,
        mimeType: mediaFile.type || 'application/octet-stream',
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: 'Upload failed',
        error: {
          code: 'UPLOAD_ERROR',
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
