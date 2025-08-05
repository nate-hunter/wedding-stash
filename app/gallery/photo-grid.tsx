'use client';

import { useState } from 'react';
import Image from 'next/image';
import { type MediaItem } from './actions';
import PhotoModal from './photo-modal';
import DownloadButton from './download-button';

interface PhotoGridProps {
  photos: Array<MediaItem>;
}

export default function PhotoGrid({ photos }: PhotoGridProps) {
  // ~~~~~~~~~~~~~~~~~~~~~~~~ LOGS ~~~~~~~~~~~~~~~~~~~~~~~~`
  console.log('########## <PhotoGrid /> ##########');
  console.log('>>>> photos', photos);
  // ~~~~~~~~~~~~~~~~~~~~~~~~ LOGS ~~~~~~~~~~~~~~~~~~~~~~~~

  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Early return if no photos
  if (!photos || photos.length === 0) {
    return (
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
        <p className='mt-1 text-sm text-gray-500'>Photos will appear here once uploaded.</p>
      </div>
    );
  }

  const handleImageError = (photoId: string) => {
    console.error('Image failed to load for photo:', photoId);
    setImageErrors((prev) => new Set([...prev, photoId]));
  };

  const getImageUrl = (photo: MediaItem): string => {
    // Use our image proxy API route to get fresh Google Photos URLs
    // This ensures images don't expire and handles authentication
    return `/api/google/image-proxy/${photo.id}?w=400&h=400`;
  };

  const handlePhotoClick = (index: number) => {
    setCurrentPhotoIndex(index);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleModalNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    } else if (direction === 'next' && currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  return (
    <>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
        {photos
          .map((photo, index) => {
            // Skip photos without required data
            if (!photo.id || !photo.baseUrl) {
              console.warn('Skipping photo with missing data:', photo);
              return null;
            }

            const imageUrl = getImageUrl(photo);
            const hasError = imageErrors.has(photo.id);

            return (
              <div
                key={photo.id}
                className='relative group cursor-pointer'
                onClick={() => handlePhotoClick(index)}
              >
                <div className='aspect-square overflow-hidden rounded-lg bg-gray-100'>
                  {!hasError && imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={photo.filename || 'Photo'}
                      width={400}
                      height={400}
                      className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200'
                      sizes='(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw'
                      onError={() => handleImageError(photo.id)}
                      priority={false}
                      placeholder='blur'
                      blurDataURL='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center'>
                      <div className='text-center text-gray-500'>
                        <div className='text-sm mb-1'>Image unavailable</div>
                        <div className='text-xs'>{photo.mimeType}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Video indicator */}
                {photo.mediaType === 'video' && (
                  <div className='absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded'>
                    <svg className='w-3 h-3 inline mr-1' fill='currentColor' viewBox='0 0 20 20'>
                      <path d='M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 102.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z' />
                    </svg>
                    Video
                  </div>
                )}

                {/* Download button overlay */}
                <div
                  className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200'
                  onClick={(e) => e.stopPropagation()} // Prevent photo modal from opening
                >
                  <DownloadButton
                    mediaItem={photo}
                    variant='icon'
                    className='bg-black/75 text-white hover:bg-black/90 shadow-lg'
                  />
                </div>
              </div>
            );
          })
          .filter(Boolean)}{' '}
        {/* Remove null entries */}
      </div>

      {/* Photo Modal */}
      <PhotoModal
        photos={photos}
        currentIndex={currentPhotoIndex}
        isOpen={modalOpen}
        onClose={handleModalClose}
        onNavigate={handleModalNavigate}
      />
    </>
  );
}
