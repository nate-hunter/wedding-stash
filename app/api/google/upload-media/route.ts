// API Route for uploading media to Google Photos (App Router)
// All users upload to a shared Google Photos album

import { google } from 'googleapis';
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { User, SupabaseClient } from '@supabase/supabase-js';

// Constants and configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for photos
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB for videos
const MAX_FILES_PER_BATCH = 50; // Google Photos API limit
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
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    filesUploaded: number;
    totalSize: number;
    uploadTime: string;
    mediaItems: Array<{
      mediaItemId?: string;
      filename: string;
      fileSize: number;
      mimeType: string;
    }>;
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
function validateFile(file: File, filename: string): ValidationResult {
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
async function createGoogleAlbum(
  title: string,
  accessToken: string,
): Promise<{ id: string; title: string; productUrl: string; isWriteable?: boolean }> {
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
  const timestamp = new Date().toISOString().replace('T', '_').substring(0, 19);
  const albumTitle = `${user.email}_${timestamp}`;

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
// Create multiple media items using batch API
async function createBatchMediaItems(
  uploadResults: Array<{ uploadToken: string; filename: string; originalFile: File }>,
  description: string,
  albumId: string,
  accessToken: string,
): Promise<unknown> {
  const createMediaItemUrl = 'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate';

  const newMediaItems: NewMediaItem[] = uploadResults.map(({ uploadToken, filename }) => ({
    description: description,
    simpleMediaItem: {
      fileName: filename,
      uploadToken: uploadToken,
    },
  }));

  const mediaItemBody: BatchCreateRequest = {
    albumId: albumId,
    newMediaItems: newMediaItems,
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
      `Failed to create media items: ${createMediaItemResponse.status} - ${JSON.stringify(
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

    // Parse form data with error handling for large payloads
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseError) {
      // Handle non-JSON responses from hosting platform payload limits
      const errorMessage =
        parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      return NextResponse.json(
        {
          success: false,
          message: 'Request payload too large',
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message:
              'The request payload exceeds the server limit. Please try uploading fewer files at once.',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
          },
        },
        { status: 413 },
      );
    }

    // Extract files and form data
    const mediaFiles = formData.getAll('media') as File[];
    const description = (formData.get('description') as string) || '';
    const filenamePrefix = (formData.get('filename') as string) || '';

    if (mediaFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No files provided',
          error: {
            code: 'NO_FILES',
            message: 'Please select files to upload',
          },
        },
        { status: 400 },
      );
    }

    // Check Google Photos API limits (50 files max)
    if (mediaFiles.length > MAX_FILES_PER_BATCH) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many files',
          error: {
            code: 'TOO_MANY_FILES',
            message: `Maximum ${MAX_FILES_PER_BATCH} files allowed per upload (Google Photos API limit).`,
          },
        },
        { status: 400 },
      );
    }

    // Note: Client-side chunking ensures we stay within Vercel's payload limits

    // Validate all files
    const validationErrors: string[] = [];
    mediaFiles.forEach((file, index) => {
      const filename = filenamePrefix || file.name || `file_${index + 1}`;
      const validation = validateFile(file, filename);
      if (!validation.isValid) {
        validationErrors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'File validation failed',
          error: {
            code: 'VALIDATION_ERROR',
            message: validationErrors.join('; '),
          },
        },
        { status: 400 },
      );
    }

    // Initialize Google client
    const { accessToken } = await initializeGoogleClient();

    // Get or create album for the user
    const albumId = await getOrCreateAlbum(supabase, user, accessToken);

    // Process all files in parallel (client-side chunking ensures reasonable payload sizes)
    const uploadPromises = mediaFiles.map(async (file, index) => {
      const fileContent = await file.arrayBuffer();
      const uploadToken = await uploadToGooglePhotos(
        fileContent,
        file.type || 'application/octet-stream',
        accessToken,
      );

      const filename = filenamePrefix || file.name || `file_${index + 1}`;
      return {
        uploadToken,
        filename,
        originalFile: file,
      };
    });

    const uploadResults = await Promise.all(uploadPromises);

    // Create media items using batch API
    const result = await createBatchMediaItems(uploadResults, description, albumId, accessToken);

    const uploadTime = Date.now() - startTime;

    // Extract media item results
    const batchResult = result as { newMediaItemResults?: Array<{ mediaItem?: { id?: string } }> };
    const mediaItemResults = batchResult?.newMediaItemResults || [];

    // Return success response
    return NextResponse.json({
      success: true,
      message: `${mediaFiles.length} file${
        mediaFiles.length > 1 ? 's' : ''
      } uploaded successfully to Google Photos`,
      data: {
        filesUploaded: mediaFiles.length,
        totalSize: mediaFiles.reduce((sum, file) => sum + file.size, 0),
        uploadTime: `${uploadTime}ms`,
        mediaItems: mediaItemResults.map((item, index) => ({
          mediaItemId: item?.mediaItem?.id,
          filename: uploadResults[index]?.filename,
          fileSize: uploadResults[index]?.originalFile.size,
          mimeType: uploadResults[index]?.originalFile.type || 'application/octet-stream',
        })),
      },
    });
  } catch (error: unknown) {
    // Improved error handling for non-JSON responses
    let errorMessage = 'An unexpected error occurred';
    let errorCode = 'UPLOAD_ERROR';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      // Check if this might be a payload size error
      if (
        error.message.includes('Entity Too Large') ||
        error.message.includes('payload') ||
        error.message.includes('too large')
      ) {
        errorCode = 'PAYLOAD_TOO_LARGE';
        errorMessage = 'Request payload too large. Please try uploading fewer files at once.';
        statusCode = 413;
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Upload failed',
        error: {
          code: errorCode,
          message: errorMessage,
          details:
            process.env.NODE_ENV === 'development' && error instanceof Error
              ? error.stack
              : undefined,
        },
      },
      { status: statusCode },
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
