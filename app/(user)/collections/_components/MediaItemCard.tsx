import React from 'react';
import Image from 'next/image';

import { DownloadIcon, TrashIcon } from '@/app/components/Icon';

import { MediaItemCardProps } from '../types';

export function MediaItemCard({ item, onDownload, onDelete }: MediaItemCardProps) {
  const handleDownload = () => {
    onDownload(item);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
      onDelete(item);
    }
  };

  return (
    <div className='gallery-grid-item' key={item.id}>
      <Image
        src={item.signedUrl || item.url || '/placeholder-image.jpg'}
        alt={item.title || 'Uploaded media'}
        width={item.width || 300}
        height={item.height || 300}
        className='object-cover w-full h-full'
        loading='lazy'
      />

      <div className='flex flex-row gap-4 justify-between'>
        <div className='flex flex-row gap-4 items-center'>
          <button
            className='btn-icon'
            onClick={handleDownload}
            aria-label={`Download ${item.title || 'media item'}`}
          >
            <DownloadIcon size={16} />
          </button>
        </div>

        <button
          className='btn-icon btn-danger-inverted'
          onClick={handleDelete}
          aria-label={`Delete ${item.title || 'media item'}`}
        >
          <TrashIcon size={16} />
        </button>
      </div>
    </div>
  );
}
