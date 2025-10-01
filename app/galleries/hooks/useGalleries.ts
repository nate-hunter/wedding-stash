import { useState, useCallback } from 'react';

import { GalleryWithDetails } from '@/utils/supabase/types';

import {
  UseGalleriesResult,
  CreateGalleryRequest,
  GalleriesApiResponse,
  CreateGalleryApiResponse,
} from '../types';

export function useGalleries(): UseGalleriesResult {
  const [galleries, setGalleries] = useState<GalleryWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGalleries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/galleries');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GalleriesApiResponse = await response.json();

      if (data.success && data.data?.galleries) {
        setGalleries(data.data.galleries);
      } else {
        throw new Error(data.message || 'Failed to fetch galleries');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error fetching galleries:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGallery = useCallback(
    async (galleryData: CreateGalleryRequest): Promise<GalleryWithDetails> => {
      try {
        setError(null);

        const response = await fetch('/api/galleries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(galleryData),
        });

        const data: CreateGalleryApiResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to create gallery');
        }

        const newGallery = data.data.gallery;

        // Update local state with new gallery
        setGalleries((prev) => [newGallery, ...prev]);

        return newGallery;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create gallery';
        setError(errorMessage);
        throw err;
      }
    },
    [],
  );

  const refetch = useCallback(async () => {
    await fetchGalleries();
  }, [fetchGalleries]);

  return {
    galleries,
    loading,
    error,
    refetch,
    createGallery,
  };
}
