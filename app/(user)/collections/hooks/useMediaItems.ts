import { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';

import { MediaItemWithUrl, TypedSupabaseClient } from '@/utils/supabase/types';
import { addSignedUrlsToMediaItems } from '@/utils/supabase/helpers';

import { UseMediaItemsResult } from '../types';

export function useMediaItems(
  supabase: TypedSupabaseClient,
  user: User | null,
): UseMediaItemsResult {
  const [mediaItems, setMediaItems] = useState<MediaItemWithUrl[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMediaItems = useCallback(async () => {
    if (!user) {
      setMediaItems([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('media_items')
        .select('*')
        .eq('uploader_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        // Generate signed URLs using our helper function
        const mediaItemsWithSignedUrls = await addSignedUrlsToMediaItems(
          supabase,
          data,
          3600, // 1 hour expiry
        );

        setMediaItems(mediaItemsWithSignedUrls);
      } else {
        setMediaItems([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch media items';
      console.error('Error fetching media items:', err);
      setError(errorMessage);
      setMediaItems([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  const refetch = useCallback(async () => {
    await fetchMediaItems();
  }, [fetchMediaItems]);

  return {
    mediaItems,
    loading,
    error,
    refetch,
  };
}
