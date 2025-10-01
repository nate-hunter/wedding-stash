import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { GalleryCardProps } from '../types';

export function GalleryCard({ gallery, coverImageUrl }: GalleryCardProps) {
  return (
    <Link href={`/galleries/${gallery.id}`} key={gallery.id}>
      <div className='overflow-hidden bg-white rounded-lg shadow-md cursor-pointer group hover:shadow-lg transition-shadow duration-200'>
        <div className='relative h-48 bg-gray-200'>
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={gallery.title}
              fill
              className='object-cover'
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw'
              priority={false}
            />
          ) : (
            <div className='flex items-center justify-center w-full h-full text-gray-400 bg-gray-100'>
              <div className='text-center'>
                <div className='text-4xl mb-2'>📁</div>
                <p className='text-sm'>No Cover Image</p>
              </div>
            </div>
          )}
          <div className='absolute inset-0 flex items-center justify-center transition-opacity duration-300 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100'>
            <p className='text-white font-medium'>View Gallery</p>
          </div>
        </div>
        <div className='p-4'>
          <h3 className='text-lg font-semibold text-gray-900 truncate'>{gallery.title}</h3>
          {gallery.description && (
            <p className='mt-1 text-sm text-gray-600 line-clamp-2'>{gallery.description}</p>
          )}
          <div className='mt-3 flex items-center justify-between'>
            <p className='text-xs text-gray-500'>
              {gallery.media_item_count} {gallery.media_item_count === 1 ? 'item' : 'items'}
            </p>
            <p className='text-xs text-gray-400'>
              {new Date(gallery.created_at || '').toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
