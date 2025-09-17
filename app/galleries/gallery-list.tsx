'use client';

import { useEffect } from 'react';

import { useGalleries } from './hooks/useGalleries';
import { GalleryGrid } from './_components/GalleryGrid';
import { GalleryListProps } from './types';

export function GalleryList({ onGalleryCreated }: GalleryListProps = {}) {
  const { galleries, loading, error, refetch } = useGalleries();

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Refetch when a gallery is created
  useEffect(() => {
    if (onGalleryCreated) {
      refetch();
    }
  }, [onGalleryCreated, refetch]);

  return <GalleryGrid galleries={galleries} loading={loading} error={error} />;
}
