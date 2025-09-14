'use client';

import { useState, useEffect } from 'react';

type MediaItem = {
  id: string;
  title: string;
  url: string;
};

type MediaGridProps = {
  galleryId: string;
  onSelectionChange: (selectedIds: string[]) => void;
};

export function MediaGrid({ galleryId, onSelectionChange }: MediaGridProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    async function fetchMediaItems() {
      try {
        const response = await fetch(`/api/galleries/${galleryId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch media items');
        }
        const data = await response.json();
        if (data.success) {
          setMediaItems(data.gallery.media_items);
        } else {
          throw new Error(data.message || 'Failed to fetch media items');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMediaItems();
  }, [galleryId]);

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) => {
      const newSelection = prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id];
      onSelectionChange(newSelection);
      return newSelection;
    });
  };

  if (isLoading) {
    return GlimmerGrid();
  }

  if (error) {
    return <div className='text-red-500'>Error: {error}</div>;
  }

  if (mediaItems.length === 0) {
    return <p>This gallery is empty.</p>;
  }

  return (
    <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
      {mediaItems.map((item) => (
        <div
          key={item.id}
          className='relative overflow-hidden rounded-lg cursor-pointer aspect-square group'
          onClick={() => handleSelectItem(item.id)}
        >
          {/* TODO: Replace `img` with `Image` */}
          <img src={item.url} alt={item.title} className='object-cover w-full h-full' />
          <div
            className={`absolute inset-0 flex items-end p-2 transition-opacity duration-300 bg-gradient-to-t from-black via-transparent to-transparent ${
              selectedItems.includes(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <p className='text-sm text-white truncate'>{item.title}</p>
          </div>
          <div className='absolute top-2 right-2'>
            <input
              type='checkbox'
              checked={selectedItems.includes(item.id)}
              onChange={() => handleSelectItem(item.id)}
              className='w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500'
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const GlimmerGrid = () => (
  <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
    {Array.from({ length: 10 }).map((_, i) => (
      <div
        key={i}
        className='relative overflow-hidden rounded-lg bg-gray-200 animate-pulse aspect-square'
      />
    ))}
  </div>
);
