'use client';

import { useState } from 'react';
import { GalleryList } from './gallery-list';
import { CreateGalleryModal } from './create-gallery-modal';
import { PlusIcon } from '../components/Icon';

export default function GalleriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className='container p-4 mx-auto'>
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-title-lg'>Galleries</h1>
          <button className='btn-cta w-max' onClick={() => setIsModalOpen(true)}>
            <PlusIcon size={18} />
            <span className='w-max'>Create New Gallery</span>
          </button>
        </div>
        <GalleryList />
      </div>
      <CreateGalleryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => console.log('Gallery created successfully!')}
      />
    </>
  );
}
