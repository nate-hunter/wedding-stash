'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import Button from '@/components/Button';
import { UploadIcon } from '../components/Icon/icons/UploadIcon';
import { CloseIcon } from '../components/Icon/icons/CloseIcon';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUploadComplete: () => void;
}

interface FileWithMetadata {
  file: File;
  title: string;
  description: string;
  filename: string;
}

export default function UploadModal({ isOpen, onClose, user, onUploadComplete }: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const mediaFiles = files.filter(
      (file) => file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/'),
    );

    const filesWithMetadata: FileWithMetadata[] = mediaFiles.map((file) => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for default title
      description: '',
      filename: file.name,
    }));

    setSelectedFiles((prev) => [...prev, ...filesWithMetadata]);
  };

  const updateFileMetadata = (index: number, field: keyof Omit<FileWithMetadata, 'file'>, value: string) => {
    setSelectedFiles((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('idle');

    try {
      const uploadPromises = selectedFiles.map(async (fileData, index) => {
        const file = fileData.file;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload file to Supabase storage
        const { error: uploadError } = await supabase.storage.from('photos').upload(filePath, file, {
          metadata: {
            title: fileData.title,
            description: fileData.description,
            originalName: fileData.filename,
            uploadedBy: user.id,
            uploadedAt: new Date().toISOString(),
          },
        });

        if (uploadError) throw uploadError;

        // Update progress
        setUploadProgress(((index + 1) / selectedFiles.length) * 100);
      });

      await Promise.all(uploadPromises);
      setUploadStatus('success');

      // Reset form and close modal after successful upload
      setTimeout(() => {
        setSelectedFiles([]);
        setUploadProgress(0);
        setUploadStatus('idle');
        onUploadComplete();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFiles([]);
      setUploadProgress(0);
      setUploadStatus('idle');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex justify-between items-center p-6 border-b'>
          <h2 className='text-xl font-semibold'>Upload Media Files</h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className='p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50'
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Content */}
        <div className='p-6'>
          {/* File Selection */}
          <div className='mb-6'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Select Files</label>
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
              <input
                ref={fileInputRef}
                type='file'
                multiple
                accept='image/*,video/*,audio/*'
                onChange={handleFileSelect}
                className='hidden'
                disabled={isUploading}
              />
              <Button variant='secondary' onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                <UploadIcon size={18} />
                Choose Files
              </Button>
              <p className='mt-2 text-sm text-gray-500'>Supports images, videos, and audio files</p>
            </div>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className='mb-6'>
              <h3 className='text-lg font-medium mb-4'>Selected Files ({selectedFiles.length})</h3>
              <div className='space-y-4'>
                {selectedFiles.map((fileData, index) => (
                  <div key={index} className='border rounded-lg p-4'>
                    <div className='flex justify-between items-start mb-3'>
                      <div className='flex-1'>
                        <p className='font-medium text-sm'>{fileData.filename}</p>
                        <p className='text-xs text-gray-500'>{(fileData.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                        className='text-red-600 hover:text-red-800 text-sm disabled:opacity-50'
                      >
                        Remove
                      </button>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Title</label>
                        <input
                          type='text'
                          value={fileData.title}
                          onChange={(e) => updateFileMetadata(index, 'title', e.target.value)}
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                          placeholder='Enter title'
                          disabled={isUploading}
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Filename</label>
                        <input
                          type='text'
                          value={fileData.filename}
                          onChange={(e) => updateFileMetadata(index, 'filename', e.target.value)}
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                          placeholder='Enter filename'
                          disabled={isUploading}
                        />
                      </div>
                    </div>
                    <div className='mt-4'>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Description</label>
                      <textarea
                        value={fileData.description}
                        onChange={(e) => updateFileMetadata(index, 'description', e.target.value)}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        rows={2}
                        placeholder='Enter description (optional)'
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className='mb-6'>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-sm font-medium'>Uploading...</span>
                <span className='text-sm text-gray-500'>{Math.round(uploadProgress)}%</span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Status Messages */}
          {uploadStatus === 'success' && (
            <div className='mb-6 p-4 bg-green-50 border border-green-200 rounded-md'>
              <p className='text-green-800'>Upload completed successfully!</p>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-md'>
              <p className='text-red-800'>Upload failed. Please try again.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex justify-end gap-3 p-6 border-t'>
          <Button variant='secondary' onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button variant='primary' onClick={handleUpload} disabled={selectedFiles.length === 0 || isUploading}>
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </div>
      </div>
    </div>
  );
}
