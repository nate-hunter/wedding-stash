import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Album data interface
export interface Album {
  id: string;
  title: string;
  productUrl?: string;
  mediaItemsCount: number;
  coverPhotoBaseUrl?: string;
  isPublic: boolean;
  createdByApp: boolean;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    email?: string;
    fullName?: string;
    username?: string;
  };
}

// Response interface for paginated album results
export interface AlbumsResult {
  albums: Album[];
  nextPageToken?: string;
  totalCount: number;
}

// Database query result interface (matches Supabase return type)
interface DatabaseAlbumQuery {
  id: string;
  title: string;
  product_url?: string;
  media_items_count: number;
  cover_photo_base_url?: string;
  is_public: boolean;
  created_by_app: boolean;
  created_at: string;
  updated_at: string;
  profiles?:
    | {
        id: string;
        email?: string;
        full_name?: string;
        username?: string;
      }[]
    | null;
}

export async function GET(request: NextRequest) {
  try {
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
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const page = parseInt(url.searchParams.get('page') || '1');
    const offset = (page - 1) * pageSize;

    // Query albums visible to the user (their own + public ones)
    const { data: albumsData, error: albumsError } = await supabase
      .from('google_photos_albums')
      .select(
        `
        id,
        title,
        product_url,
        media_items_count,
        cover_photo_base_url,
        is_public,
        created_by_app,
        created_at,
        updated_at,
        profiles!google_photos_albums_user_id_fkey (
          id,
          email,
          full_name,
          username
        )
      `,
      )
      .or(`user_id.eq.${user.id},is_public.eq.true`)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (albumsError) {
      console.error('Error fetching albums:', albumsError);
      return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('google_photos_albums')
      .select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${user.id},is_public.eq.true`);

    if (countError) {
      console.error('Error counting albums:', countError);
    }

    // Transform the data to match our interface
    const albums: Album[] = ((albumsData as DatabaseAlbumQuery[]) || []).map((album) => ({
      id: album.id,
      title: album.title,
      productUrl: album.product_url,
      mediaItemsCount: album.media_items_count || 0,
      coverPhotoBaseUrl: album.cover_photo_base_url,
      isPublic: album.is_public,
      createdByApp: album.created_by_app,
      createdAt: album.created_at,
      updatedAt: album.updated_at,
      owner: {
        id: album.profiles?.[0]?.id || '',
        email: album.profiles?.[0]?.email,
        fullName: album.profiles?.[0]?.full_name,
        username: album.profiles?.[0]?.username,
      },
    }));

    // Calculate next page token
    const hasMore = (count || 0) > offset + pageSize;
    const nextPageToken = hasMore ? (page + 1).toString() : undefined;

    const result: AlbumsResult = {
      albums,
      nextPageToken,
      totalCount: count || 0,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in albums API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
