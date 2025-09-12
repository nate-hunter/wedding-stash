'use client';

import { Album } from '@/app/api/google/albums/route';
import AlbumCard from './AlbumCard';

interface AlbumGridProps {
  albums: Album[];
  loading?: boolean;
}

export default function AlbumGrid({ albums, loading = false }: AlbumGridProps) {
  // Loading skeleton
  if (loading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className='bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 animate-pulse'
          >
            <div className='aspect-[3/2] bg-gray-200'></div>
            <div className='p-4'>
              <div className='h-5 bg-gray-200 rounded mb-2'></div>
              <div className='h-4 bg-gray-200 rounded mb-2 w-3/4'></div>
              <div className='h-3 bg-gray-200 rounded w-1/2'></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!albums || albums.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='mx-auto h-12 w-12 text-gray-400 mb-4'>
          <svg fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
            />
          </svg>
        </div>
        <h3 className='text-sm font-medium text-gray-900'>No albums found</h3>
        <p className='mt-1 text-sm text-gray-500'>
          Albums will appear here once they&apos;re created or shared publicly.
        </p>
      </div>
    );
  }

  // Albums grid
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  );
}
