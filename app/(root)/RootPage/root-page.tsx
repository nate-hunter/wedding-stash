'use client';

import React from 'react';
import { User } from '@supabase/supabase-js';

import VideoList from './_components/video-list';
import { UploadIcon } from '@/app/components/Icon/icons/UploadIcon';

type RootPageProps = {
  user: User | null;
};

export default function RootPage({ user }: RootPageProps) {
  return (
    <>
      <div className='flex flex-col gap-6 pt-2'>
        <div className='flex justify-end w-full'>
          {user && (
            <button>
              <UploadIcon size={18} />
              Upload
            </button>
          )}
        </div>

        <h2 className='text-heading'>Heading 2</h2>

        <div className='flex flex-col gap-6 box'>
          {/* <div className='flex flex-col gap-6 mt-sp3 p-sp8 border-2 border-border rounded-md bg-overlay'> */}
          <p className='text-body'>Some font to test the family that is being rendered...</p>
          <p className='text-caption'>Some font to test the family that is being rendered...</p>

          <form className='form-container'>
            <div className='form-field-row'>
              <div className='form-field'>
                <label className='form-label'>Text Input</label>
                <input type='text' className='form-input' />
              </div>
              <div className='form-field'>
                <label className='form-label'>Number Input</label>
                <input type='number' className='form-input' />
              </div>
            </div>

            <div className='form-field-column'>
              <div className='form-field'>
                <label className='form-label'>Text Input</label>
                <input type='text' className='form-input' />
              </div>
              <div className='form-field'>
                <label className='form-label'>Number Input</label>
                <input type='number' className='form-input' />
              </div>
            </div>

            <div className='form-btns'>
              <button type='submit' className='btn btn-cta w-[120px]'>
                Submit
              </button>
              <button className='btn btn-inverted w-[120px]'>Clear</button>
            </div>
          </form>
        </div>

        <div>
          <button>Classless Button</button>
          {/* <button className='btn rounded-2xl'>Classless Button</button> */}
          <button className='btn'>Default Button</button>
          <button className='btn-primary'>Primary Button</button>
          <button className='btn-primary-inverted'>Primary Inverted Button</button>

          <div className='flex gap-7'>
            <button className='btn btn-primary w-fit flex-shrink-0'>Primary Button 2</button>
            <button className='btn btn-cta'>CTA Button</button>
            <button className='btn btn-cta-inverted'>CTA Inverted Button</button>
          </div>
        </div>

        {/* TODO: Add navigation tabs */}
        {/* <h2>[ Navigation Tabs: Videos / Gallery 1 / Gallery 2 / All Media ]</h2> */}

        <VideoList />
      </div>
    </>
  );
}
