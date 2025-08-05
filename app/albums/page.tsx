'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Album, AlbumsResult } from '@/app/api/google/albums/route';
import AlbumGrid from './AlbumGrid';

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const supabase = createClient();

  // Fetch albums from API
  const fetchAlbums = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(`/api/google/albums?page=${page}&pageSize=20`, {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch albums: ${response.status}`);
      }

      const result: AlbumsResult = await response.json();

      if (append) {
        setAlbums((prev) => [...prev, ...result.albums]);
      } else {
        setAlbums(result.albums);
      }

      setNextPageToken(result.nextPageToken);
      setHasMore(!!result.nextPageToken);
      setTotalCount(result.totalCount);
    } catch (err) {
      console.error('Error fetching albums:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch albums');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Load more albums
  const handleLoadMore = async () => {
    if (!nextPageToken || loadingMore) return;

    const nextPage = parseInt(nextPageToken);
    await fetchAlbums(nextPage, true);
  };

  // Initial load
  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  // Check for authentication changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        // Refetch albums when authentication state changes
        fetchAlbums();
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchAlbums, supabase.auth]);

  return (
    <div className='min-h-screen surface-bg'>
      <div className='max-w-7xl mx-auto px-sp3 py-sp3'>
        {/* Header */}
        <div className='flex justify-between items-center mb-sp1'>
          <div>
            <h1 className='text-3xl font-bold'>Albums</h1>
            <p className='text-gray-600 mt-1'>Discover and explore photo collections</p>
            {totalCount > 0 && !loading && (
              <p className='text-sm text-gray-500 mt-2'>
                {totalCount} album{totalCount !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
        </div>

        {/* Filters/Sort (Future enhancement) */}
        <div className='mb-6'>
          <h4 className='text-md font-semibold mb-2'>Filter & Sort</h4>
          <div className='flex gap-4 text-sm text-gray-600'>
            <span>All Albums</span>
            {/* TODO: Add filter controls for Public Only, My Albums, etc. */}
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
                <h3 className='text-sm font-medium text-red-800'>Error loading albums</h3>
                <p className='text-sm text-red-700 mt-1'>{error}</p>
                <div className='mt-2'>
                  <button
                    onClick={() => fetchAlbums()}
                    className='text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors'
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Albums Grid */}
        <div className='border-2 border-lilikoi-300 rounded-md p-sp0 mx-auto'>
          <div className='flex justify-between items-center mb-4'>
            <h4 className='text-lg font-semibold'>Albums</h4>
            {albums.length > 0 && !loading && (
              <p className='text-sm text-gray-600'>{albums.length} albums loaded</p>
            )}
          </div>

          <AlbumGrid albums={albums} loading={loading} />

          {/* Load More Button */}
          {hasMore && !loading && (
            <div className='mt-8 text-center'>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {loadingMore ? 'Loading...' : 'Load More Albums'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
