import Link from 'next/link';

export default function ErrorPage() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center'>
        <div className='mb-6'>
          <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100'>
            <svg
              className='h-6 w-6 text-red-600'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
          </div>
        </div>

        <h1 className='text-2xl font-bold text-gray-900 mb-4'>Authentication Error</h1>

        <p className='text-gray-600 mb-6'>
          There was a problem with your authentication. This could be due to an expired or invalid
          link.
        </p>

        <div className='space-y-3'>
          <Link
            href='/login'
            className='w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
          >
            Try Again
          </Link>

          <p className='text-sm text-gray-500'>
            If you continue having issues, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
