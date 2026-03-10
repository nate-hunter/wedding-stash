'use client';

import React, { useState, useEffect } from 'react';
import { TabNavigation } from './TabNavigation';
import { PhotoGallery } from './PhotoGallery';
import { GalleryCategory, Photo } from '../types';
import { GALLERY_CATEGORIES, getPhotosByCategory } from '../data/mock-data';

export function GallerySection() {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('all');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);

  // Load photos when category changes
  useEffect(() => {
    setLoading(true);
    const filteredPhotos = getPhotosByCategory(activeCategory);
    setPhotos(filteredPhotos);
    setLoading(false);
  }, [activeCategory]);

  const handlePhotoClick = (photo: Photo) => {
    // TODO: Open photo in modal/lightbox
    console.log('Photo clicked:', photo);
  };

  return (
    <section className='flex flex-col gap-sp6 md:gap-sp7'>
      {/* Section Header */}
      <h2 className='hd-2'>Photo Gallery</h2>

      {/* Tab Navigation */}
      <TabNavigation
        categories={GALLERY_CATEGORIES}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Photo Gallery */}
      <PhotoGallery photos={photos} loading={loading} onPhotoClick={handlePhotoClick} />
    </section>
  );
}
