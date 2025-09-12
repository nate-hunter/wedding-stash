'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import { UploadIcon } from '../components/Icon/icons/UploadIcon';
import { CloseIcon } from '../components/Icon/icons/CloseIcon';
import UploadForm from '../google-upload/UploadForm';

interface UploadButtonProps {
  onUploadComplete: () => void;
}

export default function UploadButton({ onUploadComplete }: UploadButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUploadSuccess = () => {
    // Refresh the gallery after successful upload
    onUploadComplete();
  };

  const handleUploadEnd = () => {
    // Close modal after upload completes (success or error)
    setTimeout(() => {
      setIsModalOpen(false);
    }, 2500); // Give time to show success/error message
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button variant='primary' width='fit' onClick={() => setIsModalOpen(true)}>
        <UploadIcon size={18} />
        Upload Photos
      </Button>

      {/* Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            {/* Header */}
            <div className='flex justify-between items-center p-6 border-b'>
              <h2 className='text-xl font-semibold'>Upload to Google Photos</h2>
              <button
                onClick={handleClose}
                className='p-2 hover:bg-gray-100 rounded-full transition-colors'
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Content - UploadForm */}
            <div className='p-2'>
              <UploadForm
                isModal={true}
                onUploadSuccess={handleUploadSuccess}
                onUploadEnd={handleUploadEnd}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
