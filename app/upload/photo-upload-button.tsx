'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface PhotoUploadButtonProps {
  user: User;
}

export default function PhotoUploadButton({ user }: PhotoUploadButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    setSelectedFiles(imageFiles);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('idle');

    try {
      const uploadPromises = selectedFiles.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error } = await supabase.storage.from('photos').upload(filePath, file);

        if (error) throw error;

        // Update progress
        setUploadProgress(((index + 1) / selectedFiles.length) * 100);
      });

      await Promise.all(uploadPromises);
      setUploadStatus('success');

      // Reset form after successful upload
      setTimeout(() => {
        setSelectedFiles([]);
        setUploadProgress(0);
        setUploadStatus('idle');
        setIsModalOpen(false);
        // Refresh the page to show new photos
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
      >
        <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 6v6m0 0v6m0-6h6m-6 0H6'
          />
        </svg>
        Upload Photos
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
          <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
            <div className='mt-3'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-medium text-gray-900'>Upload Photos</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>

              {/* File Input */}
              <div className='mb-4'>
                <input
                  ref={fileInputRef}
                  type='file'
                  multiple
                  accept='image/*'
                  onChange={handleFileSelect}
                  className='hidden'
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className='w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 transition-colors'
                >
                  <div className='text-center'>
                    <svg
                      className='mx-auto h-12 w-12 text-gray-400'
                      stroke='currentColor'
                      fill='none'
                      viewBox='0 0 48 48'
                    >
                      <path
                        d='M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02'
                        strokeWidth={2}
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                    <p className='mt-1 text-sm'>Click to select photos</p>
                  </div>
                </button>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className='mb-4'>
                  <h4 className='text-sm font-medium text-gray-700 mb-2'>
                    Selected Files ({selectedFiles.length})
                  </h4>
                  <div className='space-y-2 max-h-32 overflow-y-auto'>
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between p-2 bg-gray-50 rounded'
                      >
                        <span className='text-sm text-gray-600 truncate'>{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className='text-red-500 hover:text-red-700'
                        >
                          <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M6 18L18 6M6 6l12 12'
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className='mb-4'>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className='text-sm text-gray-600 mt-1'>
                    Uploading... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}

              {/* Status Messages */}
              {uploadStatus === 'success' && (
                <div className='mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded'>
                  Photos uploaded successfully!
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
                  Error uploading photos. Please try again.
                </div>
              )}

              {/* Action Buttons */}
              <div className='flex justify-end space-x-3'>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors'
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0 || isUploading}
                  className='px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
