import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='text-center'>
          <h1 className='text-4xl font-bold text-gray-900 mb-8'>Wedding Photo Stash</h1>

          {user ? (
            // Authenticated user content
            <div className='space-y-8'>
              <div className='bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto'>
                <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                  Welcome back, {user.email}!
                </h2>
                <p className='text-gray-600 mb-6'>
                  You&apos;re all set to start uploading and managing your wedding photos.
                </p>

                <div className='space-y-4'>
                  <Link
                    href='/upload'
                    className='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
                  >
                    <svg
                      className='w-5 h-5 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                      />
                    </svg>
                    Upload Photos
                  </Link>

                  <Link
                    href='/account'
                    className='inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
                  >
                    <svg
                      className='w-5 h-5 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                      />
                    </svg>
                    Account Settings
                  </Link>
                </div>
              </div>

              <form action='/auth/signout' method='post'>
                <button type='submit' className='text-gray-500 hover:text-gray-700 text-sm'>
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            // Unauthenticated user content
            <div className='bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto'>
              <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                Secure Wedding Photo Storage
              </h2>
              <p className='text-gray-600 mb-6'>
                Upload, organize, and share your wedding photos securely. Only you and your invited
                guests can access your photos.
              </p>

              <Link
                href='/login'
                className='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
              >
                <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1'
                  />
                </svg>
                Sign In to Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
