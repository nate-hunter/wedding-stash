'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

import { createClient } from '@/utils/supabase/client';

import Button from '@/components/Button';

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return (
    <nav className='nav-bar'>
      <div className='nav-container'>
        <div className='inline-flex items-center gap-sp2'>
          <Link href='/' className='nav-brand'>
            Wedding Stash
          </Link>
          <Link href='/gallery' className='nav-link'>
            Gallery
          </Link>
          {/* <Link href='/albums' className='nav-link'>
            Albums
          </Link> */}
          {/* <Link href='/gallery/all' className='nav-link'>
            All Media
          </Link> */}
        </div>

        <div className='nav-links'>
          {user ? (
            <>
              {/* <Button href='/google-upload' asLink variant='sunset' width='fit'>
                <UploadIcon size={15} />
                Google Photos
              </Button> */}
              {/* AUTHENTICATION */}
              <form action='/auth/signout' method='post' className='nav-form'>
                <Button type='submit' bg='inverted' width='fit'>
                  Sign Out
                </Button>
              </form>
            </>
          ) : (
            <Link href='/login' className='nav-link'>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
