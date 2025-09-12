'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { google } from 'googleapis';
import type { SupabaseClient } from '@supabase/supabase-js';

// Google Photos API response interface (for typing the raw response)
interface GooglePhotoApiMediaItem {
  id: string;
  description?: string;
  productUrl: string;
  baseUrl: string;
  mimeType: string;
  filename: string;
  mediaMetadata: {
    creationTime: string;
    width: string;
    height: string;
    photo?: {
      cameraMake?: string;
      cameraModel?: string;
      focalLength?: number;
      apertureFNumber?: number;
      isoEquivalent?: number;
      exposureTime?: string;
    };
    video?: {
      fps?: number;
      status?: string;
    };
  };
  contributorInfo?: {
    profilePictureBaseUrl?: string;
    displayName?: string;
  };
}

// Database media item interface
interface DatabaseMediaItem {
  id: string;
  google_media_item_id: string;
  description?: string;
  product_url: string;
  base_url: string;
  mime_type: string;
  filename: string;
  width?: number;
  height?: number;
  creation_time?: string;
  camera_make?: string;
  camera_model?: string;
  focal_length?: number;
  aperture_f_number?: number;
  iso_equivalent?: number;
  exposure_time?: string;
  fps?: number;
  processing_status?: string;
  media_type?: 'photo' | 'video' | 'other';
  contributor_info?: string; // JSON string
}

// Updated MediaItem interface to match Google Photos API response
export interface MediaItem {
  id: string;
  description?: string;
  productUrl: string;
  baseUrl: string;
  mimeType: string;
  filename: string;
  width?: number;
  height?: number;
  creationTime?: string;
  cameraMake?: string;
  cameraModel?: string;
  focalLength?: number;
  apertureFNumber?: number;
  isoEquivalent?: number;
  exposureTime?: string;
  fps?: number;
  processingStatus?: string;
  mediaType?: 'photo' | 'video' | 'other';
  contributorInfo?: {
    profilePictureBaseUrl?: string;
    displayName?: string;
  };
}

// Album information interface
export interface AlbumInfo {
  id: string;
  title: string;
  isPublic: boolean;
  createdByApp: boolean;
  mediaItemsCount: number;
  createdAt: string;
}

// Response interface for paginated results
export interface MediaItemsResult {
  mediaItems: MediaItem[];
  nextPageToken?: string;
  totalCount: number;
  album?: AlbumInfo;
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
      throw new Error('Failed to obtain Google access token');
    }

    return { oauth2Client, accessToken };
  } catch (error) {
    throw new Error(
      `OAuth2 authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

// Fetch media items from Google Photos album
async function fetchMediaItemsFromAlbum(
  albumId: string,
  accessToken: string,
  pageSize: number = 50,
  pageToken?: string,
): Promise<{ mediaItems: GooglePhotoApiMediaItem[]; nextPageToken?: string }> {
  const searchUrl = 'https://photoslibrary.googleapis.com/v1/mediaItems:search';

  const searchBody = {
    albumId: albumId,
    pageSize: pageSize,
    pageToken: pageToken,
  };

  const response = await fetch(searchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(searchBody),
  });

  if (!response.ok) {
    const errorJson = await response.json();
    throw new Error(
      `Failed to fetch media items: ${response.status} - ${JSON.stringify(errorJson)}`,
    );
  }

  const result = await response.json();
  return {
    mediaItems: result.mediaItems || [],
    nextPageToken: result.nextPageToken,
  };
}

// Sync media items to database
async function syncMediaItemsToDatabase(
  supabase: SupabaseClient,
  userId: string,
  albumInternalId: string,
  mediaItems: GooglePhotoApiMediaItem[],
) {
  const mediaItemsToInsert = mediaItems.map((item) => ({
    user_id: userId,
    album_id: albumInternalId,
    google_media_item_id: item.id,
    description: item.description,
    product_url: item.productUrl,
    base_url: item.baseUrl,
    mime_type: item.mimeType,
    filename: item.filename,
    width: parseInt(item.mediaMetadata.width) || null,
    height: parseInt(item.mediaMetadata.height) || null,
    creation_time: item.mediaMetadata.creationTime,
    camera_make: item.mediaMetadata.photo?.cameraMake,
    camera_model: item.mediaMetadata.photo?.cameraModel,
    focal_length: item.mediaMetadata.photo?.focalLength,
    aperture_f_number: item.mediaMetadata.photo?.apertureFNumber,
    iso_equivalent: item.mediaMetadata.photo?.isoEquivalent,
    exposure_time: item.mediaMetadata.photo?.exposureTime,
    fps: item.mediaMetadata.video?.fps,
    processing_status: item.mediaMetadata.video?.status,
    contributor_info: item.contributorInfo ? JSON.stringify(item.contributorInfo) : null,
  }));

  // Use upsert to handle duplicates
  const { error } = await supabase.from('google_media_items').upsert(mediaItemsToInsert, {
    onConflict: 'google_media_item_id',
    ignoreDuplicates: false,
  });

  if (error) {
    console.error('Error syncing media items to database:', error);
    // Don't throw here - we still want to return the media items even if DB sync fails
  }
}

// New function to fetch media items from database with fresh Google Photos data
export async function getUserGoogleMediaItems(
  pageToken?: string,
  pageSize: number = 50,
): Promise<MediaItemsResult> {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  try {
    // First, get user's album information
    const { data: albumData, error: albumError } = await supabase
      .from('google_photos_albums')
      .select(
        `
        id,
        title,
        is_public,
        created_by_app,
        media_items_count,
        created_at
      `,
      )
      .eq('user_id', user.id)
      .single();

    let albumInfo: AlbumInfo | undefined;
    if (albumData && !albumError) {
      albumInfo = {
        id: albumData.id,
        title: albumData.title,
        isPublic: albumData.is_public,
        createdByApp: albumData.created_by_app,
        mediaItemsCount: albumData.media_items_count,
        createdAt: albumData.created_at,
      };
    }

    // Then get media items from database (this gives us proper UUIDs and RLS enforcement)
    const { data: dbMediaItems, error: dbError } = await supabase
      .from('google_media_items')
      .select(
        `
        id,
        google_media_item_id,
        description,
        product_url,
        base_url,
        mime_type,
        filename,
        width,
        height,
        creation_time,
        camera_make,
        camera_model,
        focal_length,
        aperture_f_number,
        iso_equivalent,
        exposure_time,
        fps,
        processing_status,
        contributor_info,
        media_type
      `,
      )
      .eq('user_id', user.id)
      .order('creation_time', { ascending: false })
      .limit(pageSize);

    if (dbError) {
      console.error('Database error fetching media items:', dbError);
      throw new Error(`Failed to fetch media items from database: ${dbError.message}`);
    }

    // If no items in database, try to sync from Google Photos
    if (!dbMediaItems || dbMediaItems.length === 0) {
      await syncFromGooglePhotos(supabase, user.id, pageSize);

      // Try fetching from database again after sync
      const { data: freshDbMediaItems, error: freshDbError } = await supabase
        .from('google_media_items')
        .select(
          `
          id,
          google_media_item_id,
          description,
          product_url,
          base_url,
          mime_type,
          filename,
          width,
          height,
          creation_time,
          camera_make,
          camera_model,
          focal_length,
          aperture_f_number,
          iso_equivalent,
          exposure_time,
          fps,
          processing_status,
          contributor_info,
          media_type
        `,
        )
        .eq('user_id', user.id)
        .order('creation_time', { ascending: false })
        .limit(pageSize);

      if (freshDbError || !freshDbMediaItems) {
        return {
          mediaItems: [],
          nextPageToken: undefined,
          totalCount: 0,
          album: albumInfo,
        };
      }

      return {
        mediaItems: transformDbItemsToMediaItems(freshDbMediaItems),
        nextPageToken: undefined, // TODO: Implement pagination
        totalCount: freshDbMediaItems.length,
        album: albumInfo,
      };
    }

    return {
      mediaItems: transformDbItemsToMediaItems(dbMediaItems),
      nextPageToken: undefined, // TODO: Implement pagination
      totalCount: dbMediaItems.length,
      album: albumInfo,
    };
  } catch (error) {
    console.error('Error in getUserGoogleMediaItems:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch photos from database',
    );
  }
}

// Helper function to sync from Google Photos when database is empty
async function syncFromGooglePhotos(supabase: SupabaseClient, userId: string, pageSize: number) {
  try {
    // Get user's album from database
    const { data: albumData, error: albumError } = await supabase
      .from('google_photos_albums')
      .select('id, google_album_id')
      .eq('user_id', userId)
      .single();

    if (albumError || !albumData) {
      return; // No album to sync from
    }

    // Initialize Google client
    const { accessToken } = await initializeGoogleClient();

    // Fetch media items from Google Photos
    const { mediaItems } = await fetchMediaItemsFromAlbum(
      albumData.google_album_id,
      accessToken,
      pageSize,
    );

    // Sync to database
    if (mediaItems.length > 0) {
      await syncMediaItemsToDatabase(supabase, userId, albumData.id, mediaItems);
    }
  } catch (error) {
    console.error('Error syncing from Google Photos:', error);
    // Don't throw - this is a fallback operation
  }
}

// Helper function to transform database items to MediaItem interface
function transformDbItemsToMediaItems(dbItems: DatabaseMediaItem[]): MediaItem[] {
  return dbItems.map((item) => ({
    id: item.id, // This is now the database UUID
    description: item.description,
    productUrl: item.product_url,
    baseUrl: item.base_url,
    mimeType: item.mime_type,
    filename: item.filename,
    width: item.width,
    height: item.height,
    creationTime: item.creation_time,
    cameraMake: item.camera_make,
    cameraModel: item.camera_model,
    focalLength: item.focal_length,
    apertureFNumber: item.aperture_f_number,
    isoEquivalent: item.iso_equivalent,
    exposureTime: item.exposure_time,
    fps: item.fps,
    processingStatus: item.processing_status,
    mediaType: item.media_type,
    contributorInfo: item.contributor_info ? JSON.parse(item.contributor_info) : undefined,
  }));
}

// Legacy function - keeping for backward compatibility but now throws error
export async function getUserSupabaseMediaItems(): Promise<Array<MediaItem>> {
  throw new Error('getUserSupabaseMediaItems is deprecated. Use getUserGoogleMediaItems instead.');
}
