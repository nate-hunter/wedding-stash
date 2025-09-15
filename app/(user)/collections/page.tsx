'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  DownloadIcon,
  FilterIcon,
  GridIcon,
  MaximizeIcon,
  PlusIcon,
  TableIcon,
  TrashIcon,
  UploadIcon,
} from '@/app/components/Icon';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { MediaItemWithUrl, TypedSupabaseClient } from '@/utils/supabase/types';
import { addSignedUrlsToMediaItems } from '@/utils/supabase/helpers';

type TabOption = 'my-uploads' | 'galleries' | 'likes' | 'downloads';
type LayoutViewOption = 'grid' | 'column' | 'table';

// Using the properly typed MediaItemWithUrl from our types

export default function UserCollectionsPage() {
  const supabase = useMemo<TypedSupabaseClient>(() => createClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItemWithUrl[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserAndMedia = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        try {
          // Fetch user's media items with proper error handling
          const { data, error } = await supabase
            .from('media_items')
            .select('*')
            .eq('uploader_id', user.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching media items:', error);
            setMediaItems([]);
          } else if (data) {
            console.log('Fetched media items:', data.length, 'items');

            // Generate signed URLs using our helper function
            const mediaItemsWithSignedUrls = await addSignedUrlsToMediaItems(
              supabase,
              data,
              3600, // 1 hour expiry
            );

            setMediaItems(mediaItemsWithSignedUrls);
          }
        } catch (err) {
          console.error('Unexpected error fetching media items:', err);
          setMediaItems([]);
        }
      }
      setLoading(false);
    };

    getUserAndMedia();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase, supabase.auth]);

  console.log('User authenticated:', !!user, user?.id || 'No user ID');

  const [currentTab, setCurrentTab] = useState<TabOption>('my-uploads');
  const [layoutView, setLayoutView] = useState<LayoutViewOption>('grid');

  console.log(`Current view: ${layoutView}, Media items: ${mediaItems.length}`);

  if (loading) {
    return (
      <div className='container flex flex-col gap-6 p-4 mx-auto'>
        <span className='text-title-lg'>Memory Collection</span>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className='container flex flex-col gap-6 p-4 mx-auto'>
      <span className='text-title-lg'>Memory Collection</span>

      {/*
      •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
      ••• SECTION 1 / NAV TABS ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
      •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
      */}
      <section role='tablist' className='tab-container sm:overflow-x-auto'>
        <button
          type='button'
          role='tab'
          aria-selected={currentTab === 'my-uploads'}
          onClick={() => setCurrentTab('my-uploads')}
          className={currentTab === 'my-uploads' ? 'tab-btn--active' : 'tab-btn'}
        >
          My Uploads
        </button>
        <span className='font-mono text-lg font-bold'>•</span>
        {/* <span className='h-[34px] w-1 bg-border' /> */}
        {/* <span className='font-mono text-lg font-bold text-border'>•</span> */}
        {/* <span className='font-[family-name:--font-thicccboi] text-lg font-bold'>•</span> */}
        <button
          type='button'
          role='tab'
          aria-selected={currentTab === 'galleries'}
          onClick={() => setCurrentTab('galleries')}
          className={currentTab === 'galleries' ? 'tab-btn--active' : 'tab-btn'}
        >
          Galleries
        </button>
        <span className='font-mono text-lg font-bold'>•</span>
        {/* <span className='h-[34px] w-1 bg-border' /> */}
        {/* <span className='font-mono text-lg font-bold text-border'>•</span> */}
        {/* <span className='font-[family-name:--font-thicccboi] text-lg font-bold'>•</span> */}
        <button
          type='button'
          role='tab'
          aria-selected={currentTab === 'likes'}
          onClick={() => setCurrentTab('likes')}
          className={currentTab === 'likes' ? 'tab-btn--active' : 'tab-btn'}
        >
          Likes
        </button>
        <span className='font-mono text-lg font-bold'>•</span>
        {/* <span className='h-[34px] w-1 bg-border' /> */}
        {/* <span className='font-mono text-lg font-bold text-border'>•</span> */}
        {/* <span className='font-[family-name:--font-thicccboi] text-lg font-bold'>•</span> */}
        <button
          type='button'
          role='tab'
          aria-selected={currentTab === 'downloads'}
          onClick={() => setCurrentTab('downloads')}
          className={currentTab === 'downloads' ? 'tab-btn--active' : 'tab-btn'}
        >
          Downloads
        </button>
      </section>

      {/*
      •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
      ••• SECTION 2 / PAGE ACTIONS ••••••••••••••••••••••••••••••••••••••••••••••••••••••••
      •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
      */}
      <section className='flex flex-row justify-between gap-4'>
        <div>
          {/* <span>Showing (#) results</span> */}
          {currentTab === 'my-uploads' && (
            <button className='btn-cta'>
              <UploadIcon size={20} />
              Upload Photo or Video
            </button>
          )}
          {currentTab === 'galleries' && (
            <button className='btn-cta'>
              <PlusIcon size={20} />
              Add Gallery
            </button>
          )}
        </div>
        {/* <div /> */}

        {/* PAGE ACTIONS: EG., SEARCH / FILTER / VIEW */}
        <div className='flex flex-row gap-6 items-center'>
          {/* SEARCH & FILTER */}
          <div className='flex flex-row gap-3'>
            <input
              type='search'
              placeholder='Search...'
              className='form-input'
              aria-label='Search'
              title='Search'
            />
            {/* <button className='btn-icon size-[34px] bg-overlay'>
              <FilterIcon size={24} />
            </button> */}
          </div>

          {/* TOGGLE LAYOUT VIEW */}
          {/* TODO: Add implementation to toggle view */}
          <div className='flex flex-row gap-4 border-1 border-border rounded-sm p-3'>
            <button
              disabled
              type='button'
              className='btn-icon--sm btn-icon-active'
              onClick={() => setLayoutView('grid')}
              aria-label='Grid layout view'
              title='Grid layout view'
            >
              <GridIcon size={18} />
            </button>
            <button
              disabled
              type='button'
              className='btn-icon'
              onClick={() => setLayoutView('column')}
              aria-label='Column layout view'
              title='Column layout view'
            >
              <MaximizeIcon size={18} className='stroke-border' />
            </button>
            <button
              disabled
              type='button'
              className='btn-icon--sm'
              onClick={() => setLayoutView('table')}
              aria-label='Table layout view'
              title='Table layout view'
            >
              <TableIcon size={20} className='stroke-border' />
            </button>
          </div>

          <button className='btn-icon size-[34px] bg-overlay'>
            <FilterIcon size={24} className='stroke-surface-300' />
          </button>
        </div>
      </section>

      {/*
      •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
      ••• SECTION 3 / SELECTED TAB CONTENT ••••••••••••••••••••••••••••••••••••••••••••••••
      •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
      */}
      <section className='gallery-grid'>
        {mediaItems.map((item: MediaItemWithUrl) => (
          <div className='gallery-grid-item' key={item.id}>
            <Image
              src={item.signedUrl || item.url || '/placeholder-image.jpg'}
              alt={item.title || 'Uploaded media'}
              width={item.width || 300} // provide default for nullable width
              height={item.height || 300} // provide default for nullable height
              className='object-cover w-full h-full'
            />

            {/* GRID ITEM - ACTIONS */}
            <div className='flex flex-row gap-4 justify-between'>
              <div className='flex flex-row gap-4 items-center'>
                <button className='btn-icon'>
                  <DownloadIcon size={16} />
                </button>
                {/* <span className='text-sm'>Add to Downloads</span> */}
              </div>

              <button className='btn-icon btn-danger-inverted'>
                <TrashIcon size={16} />
              </button>
            </div>
          </div>
        ))}
      </section>

      {/*
      •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
      ••• SECTION 4 / PAGINATION ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
      •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
      */}
      {/* TODO: Implement pagination */}
      {/* <section className='flex flex-row justify-end gap-6'>
        <div>Prev</div>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
        <div>Next</div>
      </section> */}
    </div>
  );
}
