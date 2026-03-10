'use client';

import React from 'react';
import Image from 'next/image';
import { PhotoGalleryProps } from '../types';

export function PhotoGallery({ photos, loading = false, onPhotoClick }: PhotoGalleryProps) {
  if (loading) {
    return (
      <div className='gallery-grid'>
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className='gallery-grid-placeholder animate-pulse'
            style={{ aspectRatio: '1/1' }}
          />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <p className='text-h4 mb-2'>No photos in this category</p>
        <p className='text-caption'>Try selecting a different category</p>
      </div>
    );
  }

  return (
    <div className='gallery-grid'>
      {photos.map((photo) => (
        <div
          key={photo.id}
          className='gallery-grid-item cursor-pointer transition-transform hover:scale-[1.02]'
          onClick={() => onPhotoClick?.(photo)}
          style={{ aspectRatio: '1/1' }}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes='(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw'
            className='object-cover'
            quality={85}
          />
        </div>
      ))}
    </div>
  );
}
