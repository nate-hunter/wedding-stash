'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { type User } from '@supabase/supabase-js';

import { TypedSupabaseClient } from '@/utils/supabase/types';

import Avatar from './avatar';

interface AccountFormProps {
  user: User;
}

export default function AccountForm({ user }: AccountFormProps) {
  const supabase: TypedSupabaseClient = createClient();
  const [loading, setLoading] = useState(true);
  const [fullname, setFullname] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [website, setWebsite] = useState<string | null>(null);
  const [avatar_url, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error, status } = await supabase
        .from('profiles')
        .select('full_name, username, website, avatar_url')
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setFullname(data.full_name);
        setUsername(data.username);
        setWebsite(data.website);
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
      console.error('Error loading profile:', error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    getProfile();
  }, [user, getProfile]);

  const updateProfile = async ({
    fullname,
    username,
    website,
    avatar_url,
  }: {
    fullname: string | null;
    username: string | null;
    website: string | null;
    avatar_url: string | null;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullname,
        username,
        website,
        avatar_url,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      alert('Profile updated successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      console.error('Error updating profile:', error);
      setError(errorMessage);
      alert(`Error updating profile: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='form-widget'>
      {error && <div className='error-message text-danger-500 mb-4'>{error}</div>}

      <Avatar
        uid={user.id}
        url={avatar_url}
        size={150}
        onUpload={(url) => {
          setAvatarUrl(url);
          updateProfile({ fullname, username, website, avatar_url: url });
        }}
      />

      <div>
        <label htmlFor='email'>Email</label>
        <input id='email' type='text' value={user.email || ''} disabled />
      </div>
      <div>
        <label htmlFor='fullName'>Full Name</label>
        <input
          id='fullName'
          type='text'
          value={fullname || ''}
          onChange={(e) => setFullname(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor='username'>Username</label>
        <input
          id='username'
          type='text'
          value={username || ''}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor='website'>Website</label>
        <input
          id='website'
          type='url'
          value={website || ''}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div>
        <button
          className='btn-primary block'
          onClick={() => updateProfile({ fullname, username, website, avatar_url })}
          disabled={loading}
        >
          {loading ? 'Loading ...' : 'Update'}
        </button>
      </div>

      <div>
        <form action='/auth/signout' method='post'>
          <button className='btn-inverted block' type='submit'>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
