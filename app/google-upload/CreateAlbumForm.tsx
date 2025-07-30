'use client';

import React, { useState } from 'react';
import Button from '@/components/Button';

interface CreateAlbumResponse {
  success: boolean;
  message: string;
  data?: {
    albumId: string;
    title: string;
    productUrl: string;
    isWriteable: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export default function CreateAlbumForm() {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Please enter an album title' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/create-album', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title.trim() }),
      });

      const data: CreateAlbumResponse = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: 'success',
          text: `Album "${data.data?.title}" created successfully! Album ID: ${data.data?.albumId}`,
        });
        setTitle(''); // Clear form on success
      } else {
        setMessage({
          type: 'error',
          text: data.error?.message || data.message || 'Failed to create album',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    // Clear message when user starts typing
    if (message) {
      setMessage(null);
    }
  };

  return (
    <div className='flex flex-col gap-4 max-w-md mx-auto p-6 bg-white rounded-lg shadow-md'>
      <h2 className='text-2xl font-bold text-gray-800'>Create Album</h2>

      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <div className='flex flex-col gap-2'>
          <label htmlFor='title' className='text-sm font-medium text-gray-700'>
            Album Title *
          </label>
          <input
            type='text'
            id='title'
            name='title'
            value={title}
            onChange={handleTitleChange}
            placeholder='Enter album title...'
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            disabled={isLoading}
            required
          />
        </div>

        {message && (
          <div
            className={`p-3 rounded-md text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <Button type='submit' disabled={isLoading || !title.trim()} className='w-full'>
          {isLoading ? 'Creating Album...' : 'Create Album'}
        </Button>
      </form>
    </div>
  );
}
