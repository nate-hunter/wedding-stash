import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import PhotoUploadButton from './photo-upload-button';
import PhotoGallery from './photo-gallery';

export default async function UploadPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='bg-white rounded-lg shadow-md p-8'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>Photo Upload</h1>
            <p className='text-gray-600'>Welcome back, {user.email}! Upload your photos here.</p>
          </div>

          <div className='space-y-6'>
            <PhotoUploadButton user={user} />

            <div className='border-t pt-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>Your Uploaded Photos</h2>
              <PhotoGallery userId={user.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
