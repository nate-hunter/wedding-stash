'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { TypedSupabaseClient, MediaItemWithUrl } from '@/utils/supabase/types';
import { TabOption, LayoutViewOption } from './types';
import { useAuth } from './hooks/useAuth';
import { useMediaItems } from './hooks/useMediaItems';
import { TabNavigation } from './_components/TabNavigation';
import { PageActions } from './_components/PageActions';
import { MediaGrid } from './_components/MediaGrid';

export default function UserCollectionsPage() {
  const supabase = useMemo<TypedSupabaseClient>(() => createClient(), []);

  // State management
  const [currentTab, setCurrentTab] = useState<TabOption>('my-uploads');
  const [layoutView, setLayoutView] = useState<LayoutViewOption>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<MediaItemWithUrl[]>([]);

  // Custom hooks for data management
  const { user, loading: authLoading, error: authError } = useAuth(supabase);
  const {
    mediaItems,
    loading: mediaLoading,
    error: mediaError,
    refetch,
  } = useMediaItems(supabase, user);

  // Filter media items based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(mediaItems);
      return;
    }

    const filtered = mediaItems.filter(
      (item) =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.filename?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredItems(filtered);
  }, [mediaItems, searchQuery]);

  // Fetch media items when user becomes available
  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user, refetch]);

  // Event handlers
  const handleTabChange = (tab: TabOption) => {
    setCurrentTab(tab);
    setSearchQuery(''); // Clear search when switching tabs
  };

  const handleLayoutChange = (layout: LayoutViewOption) => {
    setLayoutView(layout);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleUpload = () => {
    // TODO: Implement upload functionality
    console.log('Upload clicked');
  };

  const handleCreateGallery = () => {
    // TODO: Implement gallery creation
    console.log('Create gallery clicked');
  };

  const handleDownload = (item: MediaItemWithUrl) => {
    // TODO: Implement download functionality
    console.log('Download item:', item.id);
  };

  const handleDelete = async (item: MediaItemWithUrl) => {
    try {
      const { error } = await supabase
        .from('media_items')
        .delete()
        .eq('id', item.id)
        .eq('uploader_id', user!.id);

      if (error) {
        throw error;
      }

      // Refresh the media items list
      await refetch();
    } catch (error) {
      console.error('Error deleting media item:', error);
      alert('Failed to delete media item. Please try again.');
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className='container flex flex-col gap-6 p-4 mx-auto'>
        <span className='text-title-lg'>Memory Collection</span>
        <div className='flex justify-center items-center py-8'>
          <div className='text-lg'>Loading...</div>
        </div>
      </div>
    );
  }

  // Auth error state
  if (authError) {
    return (
      <div className='container flex flex-col gap-6 p-4 mx-auto'>
        <span className='text-title-lg'>Memory Collection</span>
        <div className='flex flex-col justify-center items-center py-8 text-center'>
          <div className='text-danger-500 text-lg mb-2'>Authentication Error</div>
          <div className='text-sm text-gray-600'>{authError}</div>
        </div>
      </div>
    );
  }

  // No user state
  if (!user) {
    return (
      <div className='container flex flex-col gap-6 p-4 mx-auto'>
        <span className='text-title-lg'>Memory Collection</span>
        <div className='flex flex-col justify-center items-center py-8 text-center'>
          <div className='text-lg mb-2'>Please sign in</div>
          <div className='text-sm text-gray-600'>
            You need to be signed in to view your collections
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container flex flex-col gap-6 p-4 mx-auto'>
      <span className='text-title-lg'>Memory Collection</span>

      <TabNavigation currentTab={currentTab} onTabChange={handleTabChange} />

      <PageActions
        currentTab={currentTab}
        layoutView={layoutView}
        onLayoutChange={handleLayoutChange}
        onSearch={handleSearch}
        onUpload={handleUpload}
        onCreateGallery={handleCreateGallery}
      />

      <MediaGrid
        mediaItems={filteredItems}
        loading={mediaLoading}
        error={mediaError}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />
    </div>
  );
}
