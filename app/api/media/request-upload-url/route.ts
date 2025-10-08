import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/utils/supabase/helpers';
import { RequestUploadUrlBody, RequestUploadUrlResponse } from '@/utils/supabase/types';
import { randomUUID } from 'crypto';

/**
 * Request Upload URL Endpoint
 *
 * Part of the unified file upload system (Phase 1, Step 2.1)
 * Generates a secure signed URL for client-side uploads to Supabase Storage
 *
 * Flow:
 * 1. Client requests a signed URL with file metadata
 * 2. Server validates user authentication
 * 3. Server generates a structured file path with date organization
 * 4. Server creates a time-limited signed upload URL
 * 5. Client uploads file directly to Supabase using the signed URL
 * 6. Client calls /finalize-upload with the path and metadata
 */

/**
 * Generates a structured file path for organized storage
 * Pattern: users/{user_id}/{year}/{month}/{uuid}-{fileName}
 *
 * Benefits:
 * - Easy to browse files by user and date
 * - UUID prevents filename collisions
 * - Year/month organization aids in data lifecycle management
 */
function generateStructuredFilePath(userId: string, fileName: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Zero-padded month
  const uuid = randomUUID();

  // Sanitize filename: keep alphanumeric, dots, hyphens, underscores
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-_]/g, '_');

  return `users/${userId}/${year}/${month}/${uuid}-${sanitizedFileName}`;
}

export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate user (following existing pattern)
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Step 2: Parse and validate request body
    const body: RequestUploadUrlBody = await request.json();

    const { fileName, fileType, fileSize } = body;

    // Validate required fields
    if (!fileName || !fileType || !fileSize) {
      return createErrorResponse(
        'Missing required fields: fileName, fileType, and fileSize are required',
        400,
      );
    }

    // Validate file size (50MB limit, matching existing validation)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    if (fileSize > MAX_FILE_SIZE) {
      return createErrorResponse(
        `File size exceeds maximum allowed size of 50MB (received: ${Math.round(
          fileSize / 1024 / 1024,
        )}MB)`,
        400,
      );
    }

    // Step 3: Generate structured file path
    const filePath = generateStructuredFilePath(user.id, fileName);

    // Step 4: Create signed upload URL from Supabase Storage
    // The signed URL allows the client to upload directly to storage
    // without the file passing through our API server
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('media-items')
      .createSignedUploadUrl(filePath);

    if (signedUrlError || !signedUrlData) {
      console.error('Error creating signed upload URL:', signedUrlError);
      return createErrorResponse('Failed to generate upload URL. Please try again.', 500);
    }

    // Step 5: Return success response with signed URL and path
    // The path is returned so the client can send it to /finalize-upload
    // after successfully uploading the file
    const responseData: RequestUploadUrlResponse = {
      signedUrl: signedUrlData.signedUrl,
      path: filePath,
      token: signedUrlData.token, // Include token for upload verification
    };

    return createSuccessResponse(responseData, 'Upload URL generated successfully');
  } catch (error) {
    console.error('Request upload URL error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
    );
  }
}
