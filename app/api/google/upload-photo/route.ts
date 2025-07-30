// API Route for uploading photos to Google Photos (App Router)
// This route addresses security, performance, and code quality concerns from the audit
// All users upload to a shared Google Photos album

import { google } from 'googleapis';
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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
    'GOOGLE_PHOTOS_ALBUM_ID',
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

// Google OAuth2 client initialization
async function initializeGoogleClient() {
  console.log('Initializing Google OAuth2 client...');
  console.log('Client ID exists:', !!process.env.GOOGLE_CLIENT_ID);
  console.log('Client Secret exists:', !!process.env.GOOGLE_CLIENT_SECRET);
  console.log('Refresh Token exists:', !!process.env.GOOGLE_REFRESH_TOKEN);

  // Log partial values for debugging (first 10 chars)
  if (process.env.GOOGLE_CLIENT_ID) {
    console.log('Client ID starts with:', process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '...');
  }
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    console.log(
      'Refresh Token starts with:',
      process.env.GOOGLE_REFRESH_TOKEN.substring(0, 10) + '...',
    );
  }

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

  console.log('Setting OAuth2 credentials...');
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  console.log('Getting access token...');
  try {
    const { token: accessToken } = await oauth2Client.getAccessToken();

    if (!accessToken) {
      throw new Error('Failed to obtain Google access token - no token returned');
    }

    console.log('Successfully obtained access token');

    // Debug: Check what scopes the access token has
    try {
      const tokenInfoResponse = await fetch(
        'https://oauth2.googleapis.com/tokeninfo?access_token=' + accessToken,
      );
      if (tokenInfoResponse.ok) {
        const tokenInfo = await tokenInfoResponse.json();
        console.log('Access token scopes:', tokenInfo.scope);
        console.log('Access token audience:', tokenInfo.aud);
      }
    } catch (error) {
      console.log('Could not decode token info:', error);
    }

    return { oauth2Client, accessToken };
  } catch (error) {
    console.error('OAuth2 error details:', error);

    // More detailed error analysis
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Error code:', (error as any).code);
      console.error('Error status:', (error as any).status);
    }

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

// List albums to find the correct album ID
async function listAlbums(accessToken: string): Promise<unknown> {
  const listAlbumsUrl = 'https://photoslibrary.googleapis.com/v1/albums';

  const response = await fetch(listAlbumsUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorJson = await response.json();
    throw new Error(`Failed to list albums: ${response.status} - ${JSON.stringify(errorJson)}`);
  }

  return await response.json();
}

// Create media item in Google Photos
async function createMediaItem(
  uploadToken: string,
  filename: string,
  description: string,
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
    newMediaItems: [newMediaItem],
  };

  // Only add albumId if it's provided and not empty
  if (process.env.GOOGLE_PHOTOS_ALBUM_ID && process.env.GOOGLE_PHOTOS_ALBUM_ID.trim() !== '') {
    mediaItemBody.albumId = process.env.GOOGLE_PHOTOS_ALBUM_ID;
    console.log('Using album ID:', process.env.GOOGLE_PHOTOS_ALBUM_ID);
  } else {
    console.log('No album ID provided, uploading to main library');
  }

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
  console.log('************ google-upload-v2/route.ts / POST(req) ************');

  const startTime = Date.now();
  const correlationId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[${correlationId}] Starting photo upload request`);

  try {
    // Validate environment variables
    validateEnvironment();

    // Initialize Supabase client and authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('$ { user } =>', user);

    if (authError || !user) {
      console.log(`[${correlationId}] Authentication failed:`, authError);
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

    console.log(`[${correlationId}] User authenticated:`, user.id);

    // Parse form data using native Next.js formData()
    const formData = await request.formData();

    // Extract file and form data
    const mediaFile = formData.get('media') as File | null;
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';
    const filename = (formData.get('filename') as string) || mediaFile?.name || 'unnamed_file';

    console.log(`[${correlationId}] Form data parsed:`, {
      hasFile: !!mediaFile,
      title,
      description,
      filename,
      fileSize: mediaFile?.size,
      fileType: mediaFile?.type,
    });

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

    console.log(`[${correlationId}] File validated: ${filename} (${mediaFile.size} bytes)`);

    // Initialize Google client
    const { accessToken } = await initializeGoogleClient();

    // Convert File to ArrayBuffer for upload
    const fileContent = await mediaFile.arrayBuffer();

    // Upload to Google Photos
    const uploadToken = await uploadToGooglePhotos(
      fileContent,
      mediaFile.type || 'application/octet-stream',
      accessToken,
    );

    console.log(`[${correlationId}] File uploaded to Google Photos, creating media item`);

    // Create media item
    const result = await createMediaItem(uploadToken, filename, description, accessToken);

    const uploadTime = Date.now() - startTime;

    console.log(`[${correlationId}] Upload completed successfully in ${uploadTime}ms`);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully to Google Photos',
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
    console.error(`[${correlationId}] Upload failed:`, error);

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
  try {
    console.log('Testing OAuth2 authentication...');
    const { accessToken } = await initializeGoogleClient();

    // Test multiple endpoints to isolate the issue
    const endpoints = [
      { name: 'albums', url: 'https://photoslibrary.googleapis.com/v1/albums' },
      { name: 'mediaItems', url: 'https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=1' },
      { name: 'sharedAlbums', url: 'https://photoslibrary.googleapis.com/v1/sharedAlbums' },
    ];

    const results = {};

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          results[endpoint.name] = { success: true, data };
        } else {
          const errorData = await response.json();
          results[endpoint.name] = { success: false, error: errorData };
        }
      } catch (error) {
        results[endpoint.name] = { success: false, error: error.message };
      }
    }

    console.log('API test results:', results);
    return NextResponse.json({
      success: true,
      message: 'OAuth2 authentication working',
      results,
    });
  } catch (error) {
    console.error('Failed to test OAuth2:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
