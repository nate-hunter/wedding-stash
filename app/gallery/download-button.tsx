'use client';

import { useState } from 'react';
import { type MediaItem } from './actions';

interface DownloadButtonProps {
  mediaItem: MediaItem;
  variant?: 'default' | 'icon' | 'minimal';
  className?: string;
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
  onDownloadError?: (error: string) => void;
}

interface DownloadApiResponse {
  success: boolean;
  message: string;
  data?: {
    downloadUrl: string;
    filename: string;
    mimeType: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export default function DownloadButton({
  mediaItem,
  variant = 'default',
  className = '',
  onDownloadStart,
  onDownloadComplete,
  onDownloadError,
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadMediaItem = async () => {
    try {
      setIsDownloading(true);
      setError(null);
      onDownloadStart?.();

      // Call the download API
      console.log('Starting download for media item:', mediaItem.id);
      const response = await fetch(`/api/google/download-media/${mediaItem.id}`, {
        method: 'GET',
        credentials: 'same-origin', // Ensure cookies are sent for authentication
      });
      console.log('Download API response status:', response.status);

      if (!response.ok) {
        let errorData: DownloadApiResponse;
        try {
          errorData = await response.json();
        } catch {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        throw new Error(errorData.error?.message || 'Failed to generate download URL');
      }

      const data: DownloadApiResponse = await response.json();
      console.log('Download API response data:', data);

      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Invalid response from download API');
      }

      // Trigger browser download
      const { downloadUrl, filename } = data.data;
      console.log('Triggering download:', { downloadUrl, filename });

      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';

      // Add to document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('Download initiated successfully');
      onDownloadComplete?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      console.error('Download error details:', err);
      setError(errorMessage);
      onDownloadError?.(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  const getButtonContent = () => {
    if (isDownloading) {
      return (
        <>
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current'></div>
          {variant !== 'icon' && <span className='ml-2'>Downloading...</span>}
        </>
      );
    }

    switch (variant) {
      case 'icon':
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            aria-label='Download'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            />
          </svg>
        );
      case 'minimal':
        return 'Download';
      default:
        return (
          <>
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
            <span className='ml-2'>Download</span>
          </>
        );
    }
  };

  const getButtonClasses = () => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      default: 'px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      icon: 'p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 rounded-full',
      minimal:
        'px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 focus:ring-blue-500',
    };

    const errorClasses = error ? 'border-red-300 text-red-700' : '';

    return `${baseClasses} ${variantClasses[variant]} ${errorClasses} ${className}`;
  };

  return (
    <div className='relative'>
      <button
        onClick={downloadMediaItem}
        disabled={isDownloading}
        className={getButtonClasses()}
        title={`Download ${mediaItem.filename || 'media item'}`}
        aria-label={`Download ${mediaItem.filename || 'media item'}`}
      >
        {getButtonContent()}
      </button>

      {/* Error tooltip */}
      {error && variant !== 'minimal' && (
        <div className='absolute top-full left-0 mt-1 px-2 py-1 bg-red-600 text-white text-xs rounded shadow-lg z-10 whitespace-nowrap'>
          {error}
        </div>
      )}

      {/* Minimal variant error display */}
      {error && variant === 'minimal' && <div className='text-xs text-red-600 mt-1'>{error}</div>}
    </div>
  );
}
