'use client';

import { useState, useCallback } from 'react';

import { GalleryWithDetails } from '@/utils/supabase/types';

import { PlusIcon } from '../components/Icon';

import { CreateGalleryModal } from './create-gallery-modal';
import { GalleryList } from './gallery-list';

export default function GalleriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleGalleryCreated = useCallback((gallery: GalleryWithDetails) => {
    console.log('Gallery created successfully:', gallery.title);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <>
      <div className='container p-4 mx-auto'>
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-title-lg'>Galleries</h1>
          <button
            className='btn-cta w-max'
            onClick={() => setIsModalOpen(true)}
            aria-label='Create new gallery'
          >
            <PlusIcon size={18} />
            <span className='w-max'>Create New Gallery</span>
          </button>
        </div>
        <GalleryList key={refreshTrigger} />
      </div>
      <CreateGalleryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleGalleryCreated}
      />
    </>
  );
}
