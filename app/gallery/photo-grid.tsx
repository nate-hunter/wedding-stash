'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { type MediaItem } from './actions';

interface PhotoGridProps {
  photos: Array<MediaItem>;
}

export default function PhotoGrid({ photos }: PhotoGridProps) {
  // ~~~~~~~~~~~~~~~~~~~~~~~~ LOGS ~~~~~~~~~~~~~~~~~~~~~~~~`
  console.log('########## <PhotoGrid /> ##########');
  // ~~~~~~~~~~~~~~~~~~~~~~~~ LOGS ~~~~~~~~~~~~~~~~~~~~~~~~
  // `
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhotoUrls = async () => {
      const urls: Record<string, string> = {};

      for (const photo of photos) {
        try {
          const response = await fetch(`/api/photos/url?fileName=${encodeURIComponent(photo.name)}`);
          if (response.ok) {
            const data = await response.json();
            console.log('>>>> data', data);
            urls[photo.name] = data.url;
          }
        } catch (error) {
          console.error('Error fetching photo URL:', error);
        }
      }

      setPhotoUrls(urls);
      setLoading(false);
    };

    if (photos.length > 0) {
      fetchPhotoUrls();
    } else {
      setLoading(false);
    }
  }, [photos]);

  if (loading) {
    return (
      <div className='text-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
        <p className='mt-2 text-sm text-gray-600'>Loading photos...</p>
      </div>
    );
  }
  // ~~~~~~~~~~~~~~~~~~~~~~~~ LOGS ~~~~~~~~~~~~~~~~~~~~~~~~`
  console.log('>>>> photoUrls', photoUrls);
  // ~~~~~~~~~~~~~~~~~~~~~~~~ LOGS ~~~~~~~~~~~~~~~~~~~~~~~~`

  return (
    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
      {photos.map((photo) => {
        const imageUrl = photoUrls[photo.name];
        console.log('>>>> imageUrl', imageUrl);
        return (
          <div key={photo.name} className='relative group'>
            <div className='aspect-square overflow-hidden rounded-lg bg-gray-100'>
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={photo.name}
                  width={200}
                  height={200}
                  className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200'
                  sizes='(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw'
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center'>
                  <span className='text-gray-500 text-sm'>Image unavailable</span>
                </div>
              )}
            </div>

            <div>
              <div>{photo.name}</div>
            </div>

            <div className='absolute inset-0  group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center'>
              {/* <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center'> */}
              <div className='opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                <button className='px-3 py-1 bg-white text-gray-800 text-sm rounded hover:bg-gray-100 transition-colors'>
                  View
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
