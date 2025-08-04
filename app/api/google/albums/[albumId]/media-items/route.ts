import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { MediaItem } from '@/app/gallery/actions';

// Response interface for album media items
export interface AlbumMediaItemsResult {
  albumId: string;
  albumTitle: string;
  mediaItems: MediaItem[];
  nextPageToken?: string;
  totalCount: number;
}

// Transform database result to MediaItem
function transformDbItemToMediaItem(dbItem: any): MediaItem {
  return {
    id: dbItem.id,
    description: dbItem.description,
    productUrl: dbItem.product_url,
    baseUrl: dbItem.base_url,
    mimeType: dbItem.mime_type,
    filename: dbItem.filename,
    width: dbItem.width,
    height: dbItem.height,
    creationTime: dbItem.creation_time,
    cameraMake: dbItem.camera_make,
    cameraModel: dbItem.camera_model,
    focalLength: dbItem.focal_length,
    apertureFNumber: dbItem.aperture_f_number,
    isoEquivalent: dbItem.iso_equivalent,
    exposureTime: dbItem.exposure_time,
    fps: dbItem.fps,
    processingStatus: dbItem.processing_status,
    contributorInfo: dbItem.contributor_info,
    mediaType: dbItem.media_type,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> },
) {
  try {
    const { albumId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pagination parameters
    const url = new URL(request.url);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    const page = parseInt(url.searchParams.get('page') || '1');
    const offset = (page - 1) * pageSize;

    // First, verify the album exists and user has access (own album or public)
    const { data: albumData, error: albumError } = await supabase
      .from('google_photos_albums')
      .select('id, title, user_id, is_public')
      .eq('id', albumId)
      .single();

    if (albumError || !albumData) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Check if user has access to this album
    const hasAccess = albumData.user_id === user.id || albumData.is_public;
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get media items from the album
    const { data: mediaItemsData, error: mediaError } = await supabase
      .from('google_media_items')
      .select(
        `
        id,
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
      .eq('album_id', albumId)
      .order('creation_time', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (mediaError) {
      console.error('Error fetching album media items:', mediaError);
      return NextResponse.json({ error: 'Failed to fetch album media items' }, { status: 500 });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('google_media_items')
      .select('*', { count: 'exact', head: true })
      .eq('album_id', albumId);

    if (countError) {
      console.error('Error counting album media items:', countError);
    }

    // Transform the data
    const mediaItems: MediaItem[] = (mediaItemsData || []).map(transformDbItemToMediaItem);

    // Calculate next page token
    const hasMore = (count || 0) > offset + pageSize;
    const nextPageToken = hasMore ? (page + 1).toString() : undefined;

    const result: AlbumMediaItemsResult = {
      albumId: albumData.id,
      albumTitle: albumData.title,
      mediaItems,
      nextPageToken,
      totalCount: count || 0,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in album media items API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
