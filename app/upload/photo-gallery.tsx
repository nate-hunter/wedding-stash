'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import DeletePhotoButton from './delete-photo-button';

interface PhotoGalleryProps {
  userId: string;
}

interface PhotoFile {
  name: string;
  id: string;
  updated_at: string;
}

export default function PhotoGallery({ userId }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Array<PhotoFile>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.storage.from('photos').list(userId, {
        limit: 100,
        offset: 0,
      });

      if (error) {
        console.error('Error fetching photos:', error);
        setError('Error loading photos. Please try again.');
      } else {
        setPhotos(data || []);
      }
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError('Error loading photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [userId]);

  const handlePhotoDelete = () => {
    // Refresh the photo list after deletion
    fetchPhotos();
  };

  if (loading) {
    return (
      <div className='text-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
        <p className='mt-2 text-sm text-gray-600'>Loading photos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-12'>
        <div className='text-red-600 mb-4'>{error}</div>
        <button
          onClick={fetchPhotos}
          className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='mx-auto h-12 w-12 text-gray-400'>
          <svg fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
        </div>
        <h3 className='mt-2 text-sm font-medium text-gray-900'>No photos yet</h3>
        <p className='mt-1 text-sm text-gray-500'>Get started by uploading your first photo.</p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
      {photos.map((photo) => (
        <div key={photo.name} className='relative'>
          <div className='relative w-full h-32 overflow-hidden rounded-lg'>
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${userId}/${photo.name}`}
              alt={photo.name}
              fill
              sizes='(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw'
              className='object-cover'
              priority={false}
            />
          </div>
          <div className='mt-2'>
            <DeletePhotoButton userId={userId} fileName={photo.name} onDelete={handlePhotoDelete} />
          </div>
        </div>
      ))}
    </div>
  );
}
