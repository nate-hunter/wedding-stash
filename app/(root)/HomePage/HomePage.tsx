'use client';

import React from 'react';
import { VideoSection } from './components/VideoSection';
import { GallerySection } from './components/GallerySection';

export default function HomePage() {
  return (
    <div className='min-h-screen' style={{ backgroundColor: 'var(--color-surface-source)' }}>
      {/* Main Content Container */}
      <main className='max-w-7xl mx-auto px-sp6 py-sp8 md:px-sp8 md:py-sp9'>
        {/* Page Header */}
        <header className='text-center mb-sp7 md:mb-sp7'>
          <h1 className='text-display mb-sp4'>Wedding Memories</h1>
          <p className='text-body text-center max-w-2xl mx-auto'>
            Welcome to our wedding memories. Explore our special day through videos and photos.
          </p>
        </header>

        {/* Content Sections */}
        <div className='flex flex-col gap-sp9 md:gap-sp10'>
          <VideoSection />

          {/* Gallery Section */}
          <GallerySection />
        </div>
      </main>
    </div>
  );
}
