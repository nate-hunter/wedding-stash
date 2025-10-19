import { NextResponse } from 'next/server';
import {
  ApiSuccessResponse,
  ApiErrorResponse,
  TypedSupabaseClient,
  MediaItemWithUrl,
  SignedUrlData,
  PublicUrlData,
  SupabaseError,
  DatabaseMediaItem,
} from './types';

/**
 * Creates a standardized success response for API routes
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200,
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status },
  );
}

/**
 * Creates a standardized error response for API routes
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  message?: string,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      message: message || error,
      data: null, // Always include data as null for consistent API shape
    },
    { status },
  );
}

/**
 * Handles Supabase errors and converts them to standardized error responses
 */
export function handleSupabaseError(
  error: SupabaseError | null,
  defaultMessage: string = 'An error occurred',
  status: number = 500,
): NextResponse<ApiErrorResponse> | null {
  if (!error) return null;

  return createErrorResponse(error.message || defaultMessage, status, error.details || error.hint);
}

/**
 * Type-safe wrapper for Supabase queries that handles errors consistently
 */
export async function executeQuery<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryBuilder: any, // Complex Supabase internal types - intentionally using any
  errorMessage: string = 'Query failed',
): Promise<{ data: T | null; error: NextResponse<ApiErrorResponse> | null }> {
  try {
    const { data, error } = await queryBuilder;

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error, errorMessage),
      };
    }

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: createErrorResponse(
        err instanceof Error ? err.message : 'Unknown error occurred',
        500,
        errorMessage,
      ),
    };
  }
}

/**
 * Generates signed URLs for media items with proper error handling
 */
export async function generateSignedUrl(
  supabase: TypedSupabaseClient,
  filePath: string,
  expiresIn: number = 3600,
): Promise<SignedUrlData> {
  try {
    const { data, error } = await supabase.storage
      .from('media-items')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      return {
        signedUrl: '',
        error: error.message,
      };
    }

    return {
      signedUrl: data?.signedUrl || '',
      error: data?.signedUrl ? undefined : 'Failed to generate signed URL',
    };
  } catch (err) {
    return {
      signedUrl: '',
      error: err instanceof Error ? err.message : 'Unknown error generating signed URL',
    };
  }
}

/**
 * Generates public URLs for media items
 */
export function generatePublicUrl(supabase: TypedSupabaseClient, filePath: string): PublicUrlData {
  const { data } = supabase.storage.from('media-items').getPublicUrl(filePath);

  return {
    publicUrl: data.publicUrl,
  };
}

/**
 * Adds signed URLs to media items array
 */
export async function addSignedUrlsToMediaItems(
  supabase: TypedSupabaseClient,
  mediaItems: DatabaseMediaItem[],
  expiresIn: number = 3600,
): Promise<MediaItemWithUrl[]> {
  if (!Array.isArray(mediaItems)) {
    return [];
  }

  const mediaItemsWithUrls = await Promise.all(
    mediaItems.map(async (item: DatabaseMediaItem) => {
      if (!item?.file_path) {
        return { ...item, signedUrl: undefined };
      }

      const { signedUrl } = await generateSignedUrl(supabase, item.file_path, expiresIn);

      return {
        ...item,
        signedUrl: signedUrl || undefined,
      };
    }),
  );

  return mediaItemsWithUrls;
}

/**
 * Adds public URLs to media items array
 */
export function addPublicUrlsToMediaItems(
  supabase: TypedSupabaseClient,
  mediaItems: DatabaseMediaItem[],
): MediaItemWithUrl[] {
  if (!Array.isArray(mediaItems)) {
    return [];
  }

  return mediaItems.map((item: DatabaseMediaItem) => {
    if (!item?.file_path) {
      return { ...item, url: undefined };
    }

    const { publicUrl } = generatePublicUrl(supabase, item.file_path);

    return {
      ...item,
      url: publicUrl,
    };
  });
}

/**
 * Validates file types for media uploads
 */
export function isValidMediaFile(file: File): boolean {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/mov',
    'video/avi',
    'video/webm',
  ];

  return validTypes.includes(file.type.toLowerCase());
}

/**
 * Validates file size (default: 50MB)
 */
export function isValidFileSize(file: File, maxSizeInMB: number = 50): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

/**
 * Generates a unique file path for storage
 */
export function generateFilePath(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${userId}/${timestamp}-${sanitizedFileName}`;
}

/**
 * Extracts media type from MIME type
 */
export function getMediaTypeFromMimeType(mimeType: string): 'photo' | 'video' | 'other' {
  if (mimeType.startsWith('image/')) return 'photo';
  if (mimeType.startsWith('video/')) return 'video';
  return 'other';
}

/**
 * Type-safe form data extraction
 */
export function extractFormDataFiles(formData: FormData, fieldName: string = 'file'): File[] {
  const files = formData.getAll(fieldName);

  return files.filter((file): file is File => {
    return file instanceof File && file.size > 0;
  });
}

/**
 * Validates UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Type-safe JSON parsing with error handling
 */
export async function parseRequestJSON<T>(request: Request): Promise<T | null> {
  try {
    const json = await request.json();
    return json as T;
  } catch {
    return null;
  }
}
