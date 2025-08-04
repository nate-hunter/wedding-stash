'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { type MediaItem } from './actions';
import { getPhotoModalUrl } from '@/utils/google-photos';

interface PhotoModalProps {
  photos: MediaItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export default function PhotoModal({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: PhotoModalProps) {
  const [imageError, setImageError] = useState(false);

  const currentPhoto = photos[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) onNavigate('prev');
          break;
        case 'ArrowRight':
          if (currentIndex < photos.length - 1) onNavigate('next');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, currentIndex, photos.length, onClose, onNavigate]);

  // Reset image error when photo changes
  useEffect(() => {
    setImageError(false);
  }, [currentPhoto?.id]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !currentPhoto) return null;

  const getImageUrl = (photo: MediaItem): string => {
    try {
      // Use larger size for modal view
      return getPhotoModalUrl(photo.baseUrl, 1200, 800);
    } catch (error) {
      console.error('Error generating modal image URL:', error);
      return photo.baseUrl;
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4'
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className='absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10'
        aria-label='Close modal'
      >
        <svg className='w-8 h-8' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M6 18L18 6M6 6l12 12'
          />
        </svg>
      </button>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate('prev')}
          className='absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black/50 rounded-full p-2'
          aria-label='Previous photo'
        >
          <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 19l-7-7 7-7'
            />
          </svg>
        </button>
      )}

      {currentIndex < photos.length - 1 && (
        <button
          onClick={() => onNavigate('next')}
          className='absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black/50 rounded-full p-2'
          aria-label='Next photo'
        >
          <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
          </svg>
        </button>
      )}

      {/* Main content */}
      <div className='relative max-w-7xl max-h-full w-full h-full flex flex-col'>
        {/* Image container */}
        <div className='flex-1 flex items-center justify-center relative'>
          {currentPhoto.mediaType === 'video' ? (
            <div className='text-center text-white'>
              <div className='text-xl mb-4'>Video playback not yet implemented</div>
              <div className='text-sm opacity-75'>
                <a
                  href={currentPhoto.productUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='underline hover:no-underline'
                >
                  View in Google Photos
                </a>
              </div>
            </div>
          ) : !imageError ? (
            <Image
              src={getImageUrl(currentPhoto)}
              alt={currentPhoto.filename || 'Photo'}
              fill
              className='max-w-full max-h-full object-contain'
              onError={() => setImageError(true)}
              priority
            />
          ) : (
            <div className='text-center text-white'>
              <div className='text-xl mb-4'>Failed to load image</div>
              <div className='text-sm opacity-75'>
                <a
                  href={currentPhoto.productUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='underline hover:no-underline'
                >
                  View in Google Photos
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Photo info */}
        <div className='bg-black/75 text-white p-4 mt-4 rounded'>
          <div className='flex justify-between items-start'>
            <div className='flex-1'>
              <h3 className='text-lg font-semibold mb-2'>{currentPhoto.filename || 'Untitled'}</h3>
              <div className='text-sm space-y-1 opacity-90'>
                {currentPhoto.width && currentPhoto.height && (
                  <div>
                    {currentPhoto.width} × {currentPhoto.height} pixels
                  </div>
                )}
                {formatDate(currentPhoto.creationTime) && (
                  <div>{formatDate(currentPhoto.creationTime)}</div>
                )}
                {currentPhoto.cameraMake && currentPhoto.cameraModel && (
                  <div>
                    {currentPhoto.cameraMake} {currentPhoto.cameraModel}
                  </div>
                )}
              </div>
            </div>
            <div className='text-sm opacity-75 ml-4'>
              {currentIndex + 1} of {photos.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
