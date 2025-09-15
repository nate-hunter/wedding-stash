import { Database, Tables, TablesInsert, TablesUpdate } from '@/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

// Type-safe client type
export type TypedSupabaseClient = SupabaseClient<Database>;

// Common API response types
export interface ApiResponse<T = null> {
  success: boolean;
  message?: string;
  error?: string;
  data: T;
}

export interface ApiSuccessResponse<T> extends ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse extends ApiResponse<null> {
  success: false;
  error: string;
  data: null; // Always null for consistent API shape
}

// Media-related types
export type MediaItem = Tables<'media_items'>;
export type MediaItemInsert = TablesInsert<'media_items'>;
export type MediaItemUpdate = TablesUpdate<'media_items'>;

export type MediaItemWithUrl = MediaItem & {
  url?: string;
  signedUrl?: string;
};

// Gallery-related types
export type Gallery = Tables<'galleries'>;
export type GalleryInsert = TablesInsert<'galleries'>;
export type GalleryUpdate = TablesUpdate<'galleries'>;

export type GalleryWithDetails = {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean | null;
  creator_id: string;
  cover_image_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  media_item_count: number;
  cover_image_path: string | null;
};

export type GalleryWithMediaItems = Gallery & {
  media_items?: MediaItemWithUrl[];
};

// Junction table types
export type GalleryMediaItem = Tables<'gallery_media_items'>;
export type GalleryMediaItemInsert = TablesInsert<'gallery_media_items'>;

// User profile types
export type Profile = Tables<'profiles'>;
export type ProfileInsert = TablesInsert<'profiles'>;
export type ProfileUpdate = TablesUpdate<'profiles'>;

// Google Photos types
export type GooglePhotosAlbum = Tables<'google_photos_albums'>;
export type GoogleMediaItem = Tables<'google_media_items'>;

// Download collection types
export type DownloadCollection = Tables<'download_collections'>;
export type DownloadCollectionInsert = TablesInsert<'download_collections'>;

export type DownloadCollectionItem = Tables<'download_collection_items'>;
export type DownloadCollectionItemInsert = TablesInsert<'download_collection_items'>;

// RPC function return types
export type GetUserGalleriesWithDetailsResult =
  Database['public']['Functions']['get_user_galleries_with_details']['Returns'][number];

// File upload types
export interface FileUploadResult {
  success: boolean;
  name: string;
  path?: string;
  type?: string;
  size?: number;
  error?: string;
}

export interface MediaItemUploadData {
  uploader_id: string;
  file_path: string;
  filename: string;
  original_filename: string;
  title: string;
  mime_type: string;
  file_size?: number;
  width?: number;
  height?: number;
}

// Storage-related types
export interface SignedUrlData {
  signedUrl: string;
  error?: string;
}

export interface PublicUrlData {
  publicUrl: string;
}

// Error handling types
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// Query result types with proper error handling
export type QueryResult<T> = {
  data: T | null;
  error: SupabaseError | null;
};

export type QueryResultArray<T> = {
  data: T[] | null;
  error: SupabaseError | null;
};

// Type guards for runtime type checking
export function isMediaItem(item: unknown): item is MediaItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'file_path' in item &&
    'mime_type' in item
  );
}

export function isGallery(item: unknown): item is Gallery {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'title' in item &&
    'creator_id' in item
  );
}

// Type for junction table query results
export interface GalleryMediaItemJunction {
  media_items: MediaItem | MediaItem[] | null;
}

// Type for media items from database queries
export type DatabaseMediaItem = Tables<'media_items'>;

export function isApiSuccessResponse<T>(
  response: ApiResponse<T>,
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

export function isApiErrorResponse(response: ApiResponse): response is ApiErrorResponse {
  return response.success === false;
}

// Utility types for form data
export interface CreateGalleryFormData {
  title: string;
  description?: string;
}

export interface UpdateGalleryFormData {
  title?: string;
  description?: string;
}

export interface FileUploadFormData {
  files: File[];
  galleryId?: string;
}
