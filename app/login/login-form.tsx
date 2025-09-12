'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { signInWithMagicLink } from './actions';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  const error = searchParams.get('error');
  const success = searchParams.get('success');

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    await signInWithMagicLink(formData);
    setIsLoading(false);
  };

  const getErrorMessage = (errorType: string) => {
    switch (errorType) {
      case 'invalid-email':
        return 'Please enter a valid email address.';
      case 'rate-limited':
        return 'Too many attempts. Please wait a moment before trying again.';
      case 'unknown':
        return 'An error occurred. Please try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  return (
    <div className='max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md'>
      <h1 className='text-2xl font-bold mb-6 text-center'>Sign In</h1>

      {error && (
        <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
          {getErrorMessage(error)}
        </div>
      )}

      {success && (
        <div className='mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded'>
          Magic link sent! Check your email and click the link to sign in.
        </div>
      )}

      <form action={handleSubmit}>
        <div className='mb-4'>
          <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
            Email Address
          </label>
          <input
            id='email'
            name='email'
            type='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Enter your email'
            disabled={isLoading}
          />
        </div>

        <button
          type='submit'
          disabled={isLoading || !email}
          className='w-full rounded-md bg-blue-600 text-white py-2 px-4 font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        >
          {isLoading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>

      <p className='mt-4 text-sm text-gray-600 text-center'>
        We&apos;ll send you a secure link to sign in without a password.
      </p>
    </div>
  );
}
