'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

import { getUserSupabaseMediaItems, type MediaItem } from './actions';

import PhotoGrid from './photo-grid';
import UploadButton from './upload-button';

export default function GalleryPage() {
  // ~~~~~~~~~~~~~~~~~~~~~~~~ LOGS ~~~~~~~~~~~~~~~~~~~~~~~~
  console.log('########## <GalleryPage /> ##########');
  // ~~~~~~~~~~~~~~~~~~~~~~~~ LOGS ~~~~~~~~~~~~~~~~~~~~~~~~

  const [user, setUser] = useState<User | null>(null);
  const [photos, setPhotos] = useState<Array<MediaItem>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserAndPhotos = async () => {
      try {
        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          window.location.href = '/login';
          return;
        }

        setUser(user);

        // Fetch photos
        const photosData = await getUserSupabaseMediaItems();
        console.log('>>>> photosData', photosData);
        setPhotos(photosData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load photos');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndPhotos();
  }, []);

  // ~~~~~~~~~~~~~~~~~~~~~~~~ LOGS ~~~~~~~~~~~~~~~~~~~~~~~~`
  console.log('>>>> photos', photos);
  // ~~~~~~~~~~~~~~~~~~~~~~~~ LOGS ~~~~~~~~~~~~~~~~~~~~~~~~`

  const handleUploadComplete = async () => {
    try {
      const photosData = await getUserSupabaseMediaItems();
      setPhotos(photosData);
    } catch (err) {
      console.error('Error refreshing photos:', err);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen surface-bg flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-2 text-sm text-gray-600'>Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className='min-h-screen surface-bg'>
      <div className='max-w-7xl mx-auto px-sp3 py-sp3'>
        <div className='flex justify-between items-center mb-sp1'>
          <h2 className='text-2xl font-bold'>My Gallery</h2>
          <UploadButton user={user} onUploadComplete={handleUploadComplete} />
        </div>

        <div className='mb-6'>
          <h4 className='text-md font-semibold mb-2'>Sort / Filter Options</h4>
          {/* TODO: Add sorting and filtering controls */}
        </div>

        <div className='border-2 border-lilikoi-300 rounded-md p-sp0 mx-auto'>
          <h4 className='text-lg font-semibold mb-4'>Photo Grid</h4>

          {error ? (
            <div className='text-center py-12'>
              <div className='text-red-600 mb-4'>{error}</div>
              <p className='text-gray-600'>Please try refreshing the page.</p>
            </div>
          ) : photos.length === 0 ? (
            <div className='text-center py-12'>
              <div className='mx-auto h-12 w-12 text-gray-400 mb-4'>
                <svg fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
              </div>
              <h3 className='text-sm font-medium text-gray-900'>No photos yet</h3>
              <p className='mt-1 text-sm text-gray-500'>Get started by uploading your first photo.</p>
            </div>
          ) : (
            <PhotoGrid photos={photos} />
          )}
        </div>
      </div>
    </div>
  );
}
