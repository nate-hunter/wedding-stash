'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Album } from '@/app/api/google/albums/route';
import { getPhotoDisplayUrl } from '@/utils/google-photos';

interface AlbumCardProps {
  album: Album;
}

export default function AlbumCard({ album }: AlbumCardProps) {
  // Format the creation date
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

  // Get cover image URL or use placeholder
  const getCoverImageUrl = (): string => {
    if (album.coverPhotoBaseUrl) {
      return getPhotoDisplayUrl(album.coverPhotoBaseUrl, 300, 200);
    }
    // Return a placeholder image URL
    return '/placeholder-album.svg';
  };

  return (
    <Link
      href={`/albums/${album.id}`}
      className='group block bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200'
    >
      {/* Cover Image */}
      <div className='relative aspect-[3/2] bg-gray-100 overflow-hidden'>
        <Image
          src={getCoverImageUrl()}
          alt={`Cover for ${album.title}`}
          fill
          className='object-cover group-hover:scale-105 transition-transform duration-200'
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
        />

        {/* Album Info Overlay */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
          <div className='absolute bottom-4 left-4 right-4 text-white'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>{album.mediaItemsCount} photos</span>
              {album.isPublic && (
                <span className='px-2 py-1 bg-green-500 text-white text-xs rounded-full'>
                  Public
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Album Details */}
      <div className='p-4'>
        <h3 className='text-lg font-semibold text-gray-900 mb-2 truncate'>{album.title}</h3>

        <div className='flex items-center justify-between text-sm text-gray-600 mb-2'>
          <span>By {album.owner.fullName || album.owner.email || 'Unknown'}</span>
          <span>{formatDate(album.createdAt)}</span>
        </div>

        <div className='flex items-center gap-2 text-xs text-gray-500'>
          <span>{album.mediaItemsCount} items</span>
          {album.createdByApp && (
            <>
              <span>•</span>
              <span className='text-blue-600'>App-managed</span>
            </>
          )}
          {album.isPublic && (
            <>
              <span>•</span>
              <span className='text-green-600'>Public</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
