'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { AlbumMediaItemsResult } from '@/app/api/google/albums/[albumId]/media-items/route';
import { MediaItem } from '@/app/gallery/actions';
import PhotoGrid from '@/app/gallery/photo-grid';

export default function AlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = params.albumId as string;

  const [albumTitle, setAlbumTitle] = useState<string>('');
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const supabase = createClient();

  // Fetch album media items from API
  const fetchAlbumMediaItems = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        if (!append) {
          setLoading(true);
          setError(null);
        } else {
          setLoadingMore(true);
        }

        const response = await fetch(
          `/api/google/albums/${albumId}/media-items?page=${page}&pageSize=50`,
          {
            credentials: 'same-origin',
          },
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError('Album not found');
            return;
          }
          if (response.status === 403) {
            setError('You do not have access to this album');
            return;
          }
          throw new Error(`Failed to fetch album media items: ${response.status}`);
        }

        const result: AlbumMediaItemsResult = await response.json();

        if (append) {
          setPhotos((prev) => [...prev, ...result.mediaItems]);
        } else {
          setPhotos(result.mediaItems);
          setAlbumTitle(result.albumTitle);
        }

        setNextPageToken(result.nextPageToken);
        setHasMore(!!result.nextPageToken);
        setTotalCount(result.totalCount);
      } catch (err) {
        console.error('Error fetching album media items:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch album media items');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [albumId],
  );

  // Load more photos
  const handleLoadMore = async () => {
    if (!nextPageToken || loadingMore) return;

    const nextPage = parseInt(nextPageToken);
    await fetchAlbumMediaItems(nextPage, true);
  };

  // Initial load
  useEffect(() => {
    if (albumId) {
      fetchAlbumMediaItems();
    }
  }, [albumId, fetchAlbumMediaItems]);

  // Check for authentication changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        // Refetch album when authentication state changes
        fetchAlbumMediaItems();
      }
    });

    return () => subscription.unsubscribe();
  }, [albumId, fetchAlbumMediaItems, supabase.auth]);

  return (
    <div className='min-h-screen surface-bg'>
      <div className='max-w-7xl mx-auto px-sp3 py-sp3'>
        {/* Breadcrumb */}
        <nav className='flex items-center space-x-2 text-sm text-gray-600 mb-4'>
          <Link href='/albums' className='hover:text-blue-600 transition-colors'>
            Albums
          </Link>
          <span>/</span>
          <span className='text-gray-900'>{albumTitle || 'Loading...'}</span>
        </nav>

        {/* Header */}
        <div className='flex justify-between items-center mb-sp1'>
          <div>
            <h1 className='text-3xl font-bold'>{albumTitle || 'Album'}</h1>
            <p className='text-gray-600 mt-1'>Album gallery</p>
            {totalCount > 0 && !loading && (
              <p className='text-sm text-gray-500 mt-2'>
                {totalCount} photo{totalCount !== 1 ? 's' : ''} in this album
              </p>
            )}
          </div>

          <div className='flex gap-2'>
            <button
              onClick={() => router.back()}
              className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className='bg-red-50 border border-red-200 rounded-md p-4 mb-6'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <svg className='h-5 w-5 text-red-400' viewBox='0 0 20 20' fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800'>Error loading album</h3>
                <p className='text-sm text-red-700 mt-1'>{error}</p>
                <div className='mt-2'>
                  <button
                    onClick={() => fetchAlbumMediaItems()}
                    className='text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors'
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photo Grid */}
        <div className='border-2 border-lilikoi-300 rounded-md p-sp0 mx-auto'>
          <div className='flex justify-between items-center mb-4'>
            <h4 className='text-lg font-semibold'>Photos</h4>
            {photos.length > 0 && !loading && (
              <p className='text-sm text-gray-600'>{photos.length} photos loaded</p>
            )}
          </div>

          {loading ? (
            <div className='text-center py-12'>
              <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              <p className='mt-2 text-gray-600'>Loading album photos...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className='text-center py-12'>
              <div className='mx-auto h-12 w-12 text-gray-400 mb-4'>
                <svg fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
              </div>
              <h3 className='text-sm font-medium text-gray-900'>No photos in this album</h3>
              <p className='mt-1 text-sm text-gray-500'>This album is currently empty.</p>
            </div>
          ) : (
            <PhotoGrid photos={photos} />
          )}

          {/* Load More Button */}
          {hasMore && !loading && (
            <div className='mt-8 text-center'>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {loadingMore ? 'Loading...' : 'Load More Photos'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
