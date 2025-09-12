'use client';

import React from 'react';
import { User } from '@supabase/supabase-js';

import VideoList from './_components/video-list';
import Button from '@/app/components/Button';
import { UploadIcon } from '@/app/components/Icon/icons/UploadIcon';

type RootPageProps = {
  user: User | null;
};

export default function RootPage({ user }: RootPageProps) {
  return (
    <div className='flex flex-col gap-sp0 pt-sp1'>
      <div className='flex justify-end w-full'>
        {user && (
          <Button variant='primary' width='fit'>
            <UploadIcon size={15} />
            Upload
          </Button>
        )}
      </div>

      <div className='text-center'>
        <h2 className='text-xl font-semibold text-ocean-midnight  text-heading'>
          Welcome back, {user?.email}!
        </h2>
      </div>

      {/* TODO: Add navigation tabs */}
      {/* <h2>[ Navigation Tabs: Videos / Gallery 1 / Gallery 2 / All Media ]</h2> */}

      <VideoList />
    </div>
  );
}
