'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

import { createClient } from '@/utils/supabase/client';

import './navigation.css';
import { UploadIcon } from '../Icon/icons/UploadIcon';
import { usePathname } from 'next/navigation';

type NavLink = {
  key: string;
  label: string;
  path: string;
};

const NAV_LINKS: Array<NavLink> = [
  {
    key: 'nav-home',
    label: 'Home',
    path: '/',
  },

  {
    key: 'nav-galleries',
    label: 'Galleries',
    path: '/galleries',
  },
  {
    key: 'nav-user-media-items',
    label: 'My Collections',
    path: '/collections',
  },
];

export default function Navigation() {
  const supabase = createClient();

  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);

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
    <nav className='nav-bar px-5 py-4 md:py-7 md:px-6 md:h-9'>
      <div className='flex flex-col gap-4 align-items-center md:flex-row md:gap-7'>
        {/* APP NAME / BRAND / LOGO*/}
        <span className='nav-brand'>
          Lisa & Nate
          {/* Stash */}
        </span>

        {/* NAV LINKS */}
        {NAV_LINKS.map(({ key, label, path }) => {
          const isActive = pathname === path || (pathname.startsWith(path) && path !== '/');
          return (
            <Link key={key} href={path} className={`nav-link ${isActive ? 'nav-link-active' : ''}`}>
              {label}
            </Link>
          );
        })}
      </div>

      {user ? (
        <div className='flex flex-col-reverse gap-4 align-items-center md:flex-row md:gap-7'>
          {/* Replace Link with a button to open a modal for uploading media items? */}
          <Link href='/upload' className='btn btn-cta-outlined btn-sm'>
            <UploadIcon size={16} />
            Upload
          </Link>

          {/* AUTHENTICATION */}
          <div className='flex align-items-center gap-6'>
            <span className='nav-user text-xs md:text-base'>{user.email}</span>
            <form action='/auth/signout' method='post' className='nav-form'>
              <button type='submit' className='btn btn-inverted-outlined btn-sm w-max'>
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        <Link href='/login' className='nav-link'>
          Sign In
        </Link>
      )}
    </nav>
  );
}
