'use client';

import React from 'react';
import ReactPlayer from 'react-player';

import { VideoPlayerProps } from '../types';

export function VideoPlayer({ video, loading = false }: VideoPlayerProps) {
  if (loading) {
    return (
      <div
        className='flex items-center justify-center bg-secondary-900 rounded-md'
        style={{ aspectRatio: '16/9', width: '100%' }}
      >
        <div className='text-white'>Loading video...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div
        className='flex flex-col items-center justify-center bg-surface-100 rounded-md border border-border'
        style={{ aspectRatio: '16/9', width: '100%' }}
      >
        <div className='text-surface-800 text-center px-6'>
          <p className='text-h4 mb-2'>No video selected</p>
          <p className='text-caption'>Select a category above to watch videos</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-sp4'>
      <div
        className='overflow-hidden rounded-md'
        style={{
          width: '100%',
          aspectRatio: '16/9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        <ReactPlayer
          src={video.url}
          // url={video.url}
          controls
          width='100%'
          height='100%'
        />
      </div>

      {video.cite && video.cite_url && (
        <div className='flex items-center gap-2 text-caption'>
          <span>Video by:</span>
          <a
            href={video.cite_url}
            target='_blank'
            rel='noopener noreferrer'
            className='text-tertiary-500 hover:text-tertiary-700 transition-colors'
          >
            {video.cite}
          </a>
        </div>
      )}
    </div>
  );
}
