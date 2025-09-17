'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

import { createClient } from '@/utils/supabase/client';
import { TypedSupabaseClient } from '@/utils/supabase/types';

interface AvatarProps {
  uid: string | null;
  url: string | null;
  size: number;
  onUpload: (url: string) => void;
}

export default function Avatar({ uid, url, size, onUpload }: AvatarProps) {
  const supabase: TypedSupabaseClient = createClient();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function downloadImage(path: string) {
      try {
        const { data, error } = await supabase.storage.from('avatars').download(path);
        if (error) {
          console.error('Error downloading avatar image:', error);
          return;
        }

        const imageUrl = URL.createObjectURL(data);
        setAvatarUrl(imageUrl);
      } catch (error) {
        console.error('Unexpected error downloading image:', error);
      }
    }

    if (url) {
      downloadImage(url);
    }
  }, [url, supabase]);

  const uploadAvatar: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      if (!uid) {
        throw new Error('User ID is required for avatar upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${uid}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      onUpload(filePath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Avatar upload error:', errorMessage);
      alert(`Error uploading avatar: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {avatarUrl ? (
        <Image
          width={size}
          height={size}
          src={avatarUrl}
          alt='Avatar'
          className='avatar image'
          style={{ height: size, width: size }}
        />
      ) : (
        <div className='avatar no-image' style={{ height: size, width: size }} />
      )}
      <div style={{ width: size }}>
        <label className='button primary block' htmlFor='single'>
          {uploading ? 'Uploading ...' : 'Upload'}
        </label>
        <input
          style={{
            visibility: 'hidden',
            position: 'absolute',
          }}
          type='file'
          id='single'
          accept='image/*'
          onChange={uploadAvatar}
          disabled={uploading}
        />
      </div>
    </div>
  );
}
