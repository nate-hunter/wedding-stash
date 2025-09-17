import React from 'react';

import { MediaGridProps } from '../types';

import { MediaItemCard } from './MediaItemCard';

export function MediaGrid({ mediaItems, loading, error, onDownload, onDelete }: MediaGridProps) {
  if (loading) {
    return (
      <section className='gallery-grid'>
        <div className='col-span-full flex justify-center items-center py-8'>
          <div className='text-lg'>Loading media items...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className='gallery-grid'>
        <div className='col-span-full flex flex-col justify-center items-center py-8 text-center'>
          <div className='text-danger-500 text-lg mb-2'>Error loading media</div>
          <div className='text-sm text-gray-600'>{error}</div>
        </div>
      </section>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <section className='gallery-grid'>
        <div className='col-span-full flex flex-col justify-center items-center py-12 text-center'>
          <div className='text-lg mb-2'>No media items yet</div>
          <div className='text-sm text-gray-600 mb-4'>
            Upload some photos or videos to get started
          </div>
          <button className='btn-cta'>Upload Your First Photo</button>
        </div>
      </section>
    );
  }

  return (
    <section className='gallery-grid'>
      {mediaItems.map((item) => (
        <MediaItemCard key={item.id} item={item} onDownload={onDownload} onDelete={onDelete} />
      ))}
    </section>
  );
}
