'use client';

import React, { Suspense, useState, useEffect } from 'react';
import UploadForm from './UploadForm';

// Error Boundary Component (must remain class component due to React requirements)
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Upload page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => window.location.reload()} />;
    }

    return this.props.children;
  }
}

// Function component for error fallback
function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md mx-auto p-6 bg-white rounded-lg shadow-md'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-red-600 mb-4'>Something went wrong</h2>
          <p className='text-gray-600 mb-4'>
            We encountered an error while loading the upload page. Please try refreshing the page.
          </p>
          <button
            onClick={onRetry}
            className='px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}

// Function component for loading state
function UploadPageLoading() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md mx-auto p-6 bg-white rounded-lg shadow-md'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4'></div>
          <h2 className='text-xl font-semibold text-gray-800 mb-2'>Loading Upload Page</h2>
          <p className='text-gray-600'>Please wait while we prepare the upload form...</p>
        </div>
      </div>
    </div>
  );
}

// Function component for upload guidelines
function UploadGuidelines() {
  return (
    <div className='mt-8 text-center'>
      <div className='max-w-2xl mx-auto p-4 bg-blue-50 rounded-lg'>
        <h3 className='text-lg font-semibold text-blue-800 mb-2'>Upload Guidelines</h3>
        <ul className='text-sm text-blue-700 space-y-1 text-left'>
          <li>• Photos: Maximum 10MB (JPEG, PNG, GIF, WebP)</li>
          <li>• Videos: Maximum 100MB (MP4, MOV, AVI, WMV, FLV, WebM)</li>
          <li>• All files are automatically organized in our wedding album</li>
          <li>• You can add descriptions to help identify your uploads</li>
        </ul>
      </div>
    </div>
  );
}

// Function component for page header
function PageHeader() {
  return (
    <div className='text-center mb-8'>
      <h1 className='text-3xl font-bold text-gray-900 mb-2'>Wedding Photo Upload</h1>
      <p className='text-gray-600 max-w-2xl mx-auto'>
        Share your special moments by uploading photos and videos to our shared Google Photos album.
        All uploads will be organized in our wedding collection.
      </p>
    </div>
  );
}

// Main page content as function component
function GoogleUploadPageContent() {
  const [isClient, setIsClient] = useState(false);

  // Ensure component is mounted on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <UploadPageLoading />;
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='container mx-auto px-4'>
        <PageHeader />
        {/* <div className='w-fit mx-auto'>
          <CreateAlbumForm />
        </div> */}
        <UploadForm />
        <UploadGuidelines />
      </div>
    </div>
  );
}

// Main export using function component
export default function GoogleUploadPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<UploadPageLoading />}>
        <GoogleUploadPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}
