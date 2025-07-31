'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export interface MediaItem {
  name: string;
  id: string;
  updated_at: string;
  metadata?: {
    size?: number;
    mimetype?: string;
    cacheControl?: string;
    lastModified?: string;
    contentLength?: number;
    httpStatusCode?: number;
  };
}

export async function getUserSupabaseMediaItems(): Promise<Array<MediaItem>> {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  try {
    // List photos from the user's folder in the photos bucket
    const { data, error } = await supabase.storage.from('photos').list(user.id, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'updated_at', order: 'desc' },
    });

    if (error) {
      console.error('Error fetching photos:', error);
      throw new Error('Failed to fetch photos');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserPhotos:', error);
    throw new Error('Failed to fetch photos');
  }
}

export async function getPhotoUrl(fileName: string): Promise<string> {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  try {
    // Get the public URL for the photo
    const { data } = supabase.storage.from('photos').getPublicUrl(`${user.id}/${fileName}`);
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting photo URL:', error);
    throw new Error('Failed to get photo URL');
  }
}

export async function deletePhoto(fileName: string): Promise<void> {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  try {
    const filePath = `${user.id}/${fileName}`;
    const { error } = await supabase.storage.from('photos').remove([filePath]);

    if (error) {
      console.error('Error deleting photo:', error);
      throw new Error('Failed to delete photo');
    }
  } catch (error) {
    console.error('Error in deletePhoto:', error);
    throw new Error('Failed to delete photo');
  }
}
