'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  if (loading) {
    return (
      <nav className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <Link href='/' className='text-xl font-bold text-gray-900'>
                Wedding Stash
              </Link>
            </div>
            <div className='flex items-center'>
              <div className='animate-pulse bg-gray-200 h-8 w-20 rounded'></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className='bg-white shadow-sm border-b'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          <div className='flex items-center'>
            <Link href='/' className='text-xl font-bold text-gray-900'>
              Wedding Stash
            </Link>
          </div>

          <div className='flex items-center space-x-4'>
            {user ? (
              <>
                <Link
                  href='/upload'
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/upload'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Upload Photos
                </Link>
                <Link
                  href='/account'
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/account'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Account
                </Link>
                <form action='/auth/signout' method='post' className='inline'>
                  <button
                    type='submit'
                    className='px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors'
                  >
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <Link
                href='/login'
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/login'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
