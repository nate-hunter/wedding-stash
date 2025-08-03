'use client';

import { useState } from 'react';
import { CloseIcon } from '../components/Icon/icons/CloseIcon';
import UploadForm from '@/app/google-upload/UploadForm';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

export default function UploadModal({ isOpen, onClose, onUploadComplete }: UploadModalProps) {
  const [isUploading, setIsUploading] = useState(false);

  // Handle successful upload from the UploadForm
  const handleUploadSuccess = () => {
    onUploadComplete();
    // Close modal after a brief delay to show success message
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleClose = () => {
    if (!isUploading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex justify-between items-center p-6 border-b'>
          <h2 className='text-xl font-semibold'>Upload to Google Photos</h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className='p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50'
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Content - UploadForm Component */}
        <div className='p-2'>
          <UploadForm
            onUploadStart={() => setIsUploading(true)}
            onUploadEnd={() => setIsUploading(false)}
            onUploadSuccess={handleUploadSuccess}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
}
