'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

// This type should match the structure returned by the get_user_galleries_with_details function
type Gallery = {
  id: string;
  title: string;
  description: string | null;
  media_item_count: number;
  cover_image_path: string | null;
};

export function GalleryList() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchGalleries() {
      try {
        const response = await fetch('/api/galleries');
        if (!response.ok) {
          throw new Error('Failed to fetch galleries');
        }
        const data = await response.json();
        if (data.success) {
          setGalleries(data.galleries);
        } else {
          throw new Error(data.message || 'Failed to fetch galleries');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchGalleries();
  }, []);

  if (isLoading) {
    return <div>Loading galleries...</div>;
  }

  if (error) {
    return <div className='text-red-500'>Error: {error}</div>;
  }

  if (galleries.length === 0) {
    return (
      <div>
        <p>You haven&apos;t created any galleries yet.</p>
        {/* <button className='btn btn-cta-inverted'>
          Create New Gallery
        </button> */}
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {galleries.map((gallery) => {
        const coverImageUrl = gallery.cover_image_path
          ? supabase.storage.from('media-items').getPublicUrl(gallery.cover_image_path).data
              .publicUrl
          : null;

        return (
          <Link href={`/galleries/${gallery.id}`} key={gallery.id}>
            <div className='overflow-hidden bg-white rounded-lg shadow-md cursor-pointer group'>
              <div className='relative h-48 bg-gray-200'>
                {coverImageUrl ? (
                  <img
                    // TODO: Replace `img` with `Image`
                    src={coverImageUrl}
                    alt={gallery.title}
                    className='object-cover w-full h-full'
                  />
                ) : (
                  <div className='flex items-center justify-center w-full h-full text-gray-400 bg-gray-100'>
                    <p>No Cover Image</p>
                  </div>
                )}
                <div className='absolute inset-0 flex items-center justify-center transition-opacity duration-300 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100'>
                  <p className='text-white'>View Gallery</p>
                </div>
              </div>
              <div className='p-4'>
                <h3 className='text-lg font-semibold'>{gallery.title}</h3>
                {gallery.description && (
                  <p className='mt-1 text-sm text-gray-600 truncate'>{gallery.description}</p>
                )}
                <p className='mt-2 text-xs text-gray-500'>{gallery.media_item_count} items</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
