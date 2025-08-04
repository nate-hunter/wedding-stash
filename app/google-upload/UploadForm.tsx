'use client';

import React, { useState, ChangeEvent, FormEvent, useRef } from 'react';
import { API_ROUTES } from '@/utils/constants';

// Type definitions for API responses
interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    mediaItemId?: string;
    filename: string;
    fileSize: number;
    uploadTime: string;
    mimeType: string;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// File validation constants (matching API route)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for photos
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB for videos
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/mov',
  'video/avi',
  'video/wmv',
  'video/flv',
  'video/webm',
];
const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.mp4',
  '.mov',
  '.avi',
  '.wmv',
  '.flv',
  '.webm',
];

interface FormData {
  filename: string;
}

interface UploadFormProps {
  isModal?: boolean;
  onUploadStart?: () => void;
  onUploadSuccess?: () => void;
  onUploadEnd?: () => void;
}

function UploadForm({
  isModal = false,
  onUploadStart,
  onUploadSuccess,
  onUploadEnd,
}: UploadFormProps) {
  // State management
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filename, setFilename] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Refs for accessibility
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Load form data from localStorage on component mount
  React.useEffect(() => {
    const savedFormData = localStorage.getItem('uploadFormData');
    if (savedFormData) {
      try {
        const parsed: FormData = JSON.parse(savedFormData);
        setFilename(parsed.filename || '');
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }
  }, []);

  // Save form data to localStorage when it changes
  const saveFormData = () => {
    const formData: FormData = { filename };
    localStorage.setItem('uploadFormData', JSON.stringify(formData));
  };

  // Input sanitization
  const sanitizeInput = (input: string): string => {
    return input.replace(/[<>]/g, '').trim();
  };

  // Client-side file validation
  const validateFile = (file: File): string[] => {
    const errors: string[] = [];

    // Check file size
    const maxSize = ALLOWED_VIDEO_TYPES.includes(file.type) ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
    if (file.size > maxSize) {
      errors.push(`File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`);
    }

    // Check MIME type
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
    if (!allowedTypes.includes(file.type)) {
      errors.push(
        `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    // Check file extension
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      errors.push(
        `File extension ${fileExtension} is not allowed. Allowed extensions: ${ALLOWED_EXTENSIONS.join(
          ', ',
        )}`,
      );
    }

    return errors;
  };

  // Generate file previews for images
  const generateFilePreviews = (files: File[]) => {
    const previews: string[] = [];

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          previews.push(e.target?.result as string);
          setFilePreviews([...previews]);
        };
        reader.readAsDataURL(file);
      } else {
        previews.push(''); // No preview for non-images
      }
    });

    setFilePreviews(previews);
  };

  // Handle multiple files (from input or drag-drop)
  const handleFiles = (files: File[]) => {
    if (files.length === 0) return;

    setSelectedFiles(files);
    setValidationErrors([]);
    setFilePreviews([]);

    // Show message about large uploads
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const totalSizeMB = totalSize / (1024 * 1024);

    if (totalSizeMB > 100) {
      setMessage(
        `Selected ${files.length} files (${totalSizeMB.toFixed(
          1,
        )}MB total). Large files will be uploaded directly to Google Photos for optimal performance.`,
      );
    } else if (files.length > 10) {
      setMessage(
        `Selected ${files.length} files. Each will be uploaded directly to Google Photos without size limits.`,
      );
    }

    // Validate files
    const errors = files.map((file) => validateFile(file)).flat();
    setValidationErrors(errors);

    if (errors.length === 0) {
      // Generate previews for all selected files
      generateFilePreviews(files);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    handleFiles(files);
  };

  // Drag and drop handlers
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(event.dataTransfer.files);
    // Filter to only allow media files
    const mediaFiles = files.filter(
      (file) => file.type.startsWith('image/') || file.type.startsWith('video/'),
    );

    if (mediaFiles.length > 0) {
      handleFiles(mediaFiles);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    const sanitizedValue = sanitizeInput(value);

    switch (field) {
      case 'filename':
        setFilename(sanitizedValue);
        break;
    }

    // Save to localStorage
    saveFormData();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (selectedFiles.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');
    setUploadProgress(0);

    if (onUploadStart) {
      onUploadStart();
    }

    try {
      // Upload files one by one to Google Photos
      const uploadResults: string[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setMessage(`Uploading ${file.name} (${i + 1} of ${selectedFiles.length})...`);

        const formData = new FormData();
        formData.append('media', file);
        formData.append('filename', filename || file.name);

        const response = await fetch(API_ROUTES.google.uploadMedia, {
          method: 'POST',
          body: formData,
        });

        const data: UploadResponse = await response.json();

        if (response.ok && data.success) {
          uploadResults.push(`${file.name}: ${data.message}`);
        } else {
          uploadResults.push(`${file.name}: ${data.error?.message || 'Upload failed'}`);
        }

        // Update progress
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }

      // Success
      setMessage(
        `Successfully uploaded ${uploadResults.length} file${
          uploadResults.length > 1 ? 's' : ''
        } to Google Photos!`,
      );

      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Reset form after successful upload
      setTimeout(() => {
        setSelectedFiles([]);
        setFilePreviews([]);
        setFilename('');
        setUploadProgress(0);
        localStorage.removeItem('uploadFormData');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (onUploadEnd) {
          onUploadEnd();
        }
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);

      setIsLoading(false);
      setUploadProgress(0);

      if (onUploadEnd) {
        onUploadEnd();
      }
    }
  };

  const clearForm = () => {
    setSelectedFiles([]);
    setFilePreviews([]);
    setFilename('');
    setMessage('');
    setError('');
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    localStorage.removeItem('uploadFormData');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      className={`${
        isModal ? 'p-4' : 'max-w-md mx-auto p-4 bg-white rounded-lg shadow-md mt-10'
      } font-inter`}
    >
      {!isModal && (
        <h2 className='text-2xl font-bold mb-4 text-center text-gray-800'>Upload Wedding Media</h2>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className='space-y-4' noValidate>
        {/* File Input with Drag and Drop */}
        <div>
          <label htmlFor='mediaFile' className='block text-sm font-medium text-gray-700 mb-2'>
            Select Photos/Videos:
          </label>

          {/* Drag and Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
              isDragOver
                ? 'border-indigo-400 bg-indigo-50'
                : validationErrors.length > 0
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className='text-center'>
              <svg
                className={`mx-auto h-12 w-12 ${isDragOver ? 'text-indigo-400' : 'text-gray-400'}`}
                stroke='currentColor'
                fill='none'
                viewBox='0 0 48 48'
                aria-hidden='true'
              >
                <path
                  d='M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02'
                  strokeWidth={2}
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
              <div className='mt-4'>
                <p className={`text-sm ${isDragOver ? 'text-indigo-600' : 'text-gray-600'}`}>
                  {isDragOver ? 'Drop files here' : 'Drag and drop files here, or'}
                </p>
                <button
                  type='button'
                  className='mt-1 text-sm text-indigo-600 hover:text-indigo-500 font-medium'
                  onClick={() => fileInputRef.current?.click()}
                >
                  click to select files
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type='file'
              id='mediaFile'
              onChange={handleFileChange}
              className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
              accept='image/*, video/*'
              aria-describedby='file-help file-errors'
              aria-invalid={validationErrors.length > 0}
              multiple
            />
          </div>

          <div id='file-help' className='mt-2 text-sm text-gray-500'>
            Maximum file size: {formatFileSize(MAX_FILE_SIZE)} for photos,{' '}
            {formatFileSize(MAX_VIDEO_SIZE)} for videos
          </div>
          {selectedFiles.length > 0 && (
            <div className='mt-2'>
              <div className='text-sm text-gray-600 mb-2'>
                Selected: {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
              </div>
              <div className='space-y-1'>
                {selectedFiles.map((file, index) => (
                  <div key={index} className='text-xs text-gray-500 bg-gray-50 p-2 rounded'>
                    {file.name} ({formatFileSize(file.size)})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* File Preview */}
        {filePreviews.length > 0 && filePreviews.some((preview) => preview) && (
          <div className='mt-2'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Image Preview:</label>
            <div className='grid grid-cols-3 gap-2'>
              {filePreviews.map((preview, index) =>
                preview ? (
                  <img
                    key={index}
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className='w-full h-20 object-cover rounded border'
                  />
                ) : null,
              )}
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className='mt-2 p-3 bg-red-50 border border-red-200 rounded-md'>
            <h4 className='text-sm font-medium text-red-800'>Validation Errors:</h4>
            <ul className='mt-1 text-sm text-red-700 list-disc list-inside'>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Filename Input */}
        <div>
          <label htmlFor='filename' className='block text-sm font-medium text-gray-700'>
            Filename (in Google Photos):
          </label>
          <input
            type='text'
            id='filename'
            value={filename}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInputChange('filename', e.target.value)
            }
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2'
            placeholder='my-wedding-photo.jpg'
            maxLength={255}
            pattern='^[a-zA-Z0-9._-]+$'
            title='Only letters, numbers, dots, underscores, and hyphens allowed'
          />
          <div className='mt-1 text-sm text-gray-500'>
            Optional. Only letters, numbers, dots, underscores, and hyphens allowed.
          </div>
        </div>

        {/* Upload Progress */}
        {isLoading && uploadProgress > 0 && (
          <div className='mt-4'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Upload Progress:</label>
            <div className='w-full bg-gray-200 rounded-full h-2.5'>
              <div
                className='bg-indigo-600 h-2.5 rounded-full transition-all duration-300'
                style={{ width: `${uploadProgress}%` }}
                role='progressbar'
                aria-valuenow={uploadProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <div className='mt-1 text-sm text-gray-600'>{uploadProgress}% complete</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex space-x-3'>
          <button
            type='submit'
            className={`flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isLoading
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
            disabled={isLoading || validationErrors.length > 0 || selectedFiles.length === 0}
            aria-describedby='submit-help'
          >
            {isLoading ? (
              <>
                <svg
                  className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  aria-hidden='true'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  />
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  />
                </svg>
                Uploading {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}...
              </>
            ) : (
              `Upload ${selectedFiles.length || 0} file${
                selectedFiles.length !== 1 ? 's' : ''
              } to Google Photos`
            )}
          </button>

          <button
            type='button'
            onClick={clearForm}
            className='px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            disabled={isLoading}
          >
            Clear
          </button>
        </div>

        <div id='submit-help' className='text-sm text-gray-500'>
          {validationErrors.length > 0
            ? 'Please fix validation errors before uploading.'
            : 'Click to upload your files to Google Photos.'}
        </div>
      </form>

      {/* Status Messages */}
      {message && (
        <div className='mt-4 p-3 bg-green-50 border border-green-200 rounded-md' role='alert'>
          <p className='text-green-800 text-center'>{message}</p>
        </div>
      )}

      {error && (
        <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-md' role='alert'>
          <p className='text-red-800 text-center'>{error}</p>
        </div>
      )}
    </div>
  );
}

export default UploadForm;
