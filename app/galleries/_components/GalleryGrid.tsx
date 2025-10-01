import React, { useMemo } from 'react';

import { createClient } from '@/utils/supabase/client';
import { GalleryWithDetails, TypedSupabaseClient } from '@/utils/supabase/types';

import { GalleryCard } from './GalleryCard';

interface GalleryGridProps {
  galleries: GalleryWithDetails[];
  loading: boolean;
  error: string | null;
}

export function GalleryGrid({ galleries, loading, error }: GalleryGridProps) {
  const supabase = useMemo<TypedSupabaseClient>(() => createClient(), []);

  if (loading) {
    return (
      <div className='flex justify-center items-center py-12'>
        <div className='text-lg text-gray-600'>Loading galleries...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col justify-center items-center py-12 text-center'>
        <div className='text-danger-500 text-lg mb-2'>Error loading galleries</div>
        <div className='text-sm text-gray-600'>{error}</div>
        <button className='btn-inverted mt-4' onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (galleries.length === 0) {
    return (
      <div className='flex flex-col justify-center items-center py-16 text-center'>
        <div className='text-6xl mb-4'>📸</div>
        <div className='text-xl text-gray-700 mb-2'>No galleries yet</div>
        <div className='text-sm text-gray-600 mb-6 max-w-md'>
          Create your first gallery to organize and share your photos and videos with others.
        </div>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {galleries.map((gallery) => {
        const coverImageUrl = gallery.cover_image_path
          ? supabase.storage.from('media-items').getPublicUrl(gallery.cover_image_path).data
              .publicUrl
          : null;

        return <GalleryCard key={gallery.id} gallery={gallery} coverImageUrl={coverImageUrl} />;
      })}
    </div>
  );
}
