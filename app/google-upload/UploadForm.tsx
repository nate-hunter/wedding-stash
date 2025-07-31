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
  title: string;
  description: string;
  filename: string;
}

function UploadForm() {
  // State management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [filePreview, setFilePreview] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Refs for accessibility
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Load form data from localStorage on component mount
  React.useEffect(() => {
    const savedFormData = localStorage.getItem('uploadFormData');
    if (savedFormData) {
      try {
        const parsed: FormData = JSON.parse(savedFormData);
        setTitle(parsed.title || '');
        setDescription(parsed.description || '');
        setFilename(parsed.filename || '');
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }
  }, []);

  // Save form data to localStorage when it changes
  const saveFormData = () => {
    const formData: FormData = { title, description, filename };
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

  // Generate file preview
  const generateFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview('');
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files ? event.target.files[0] : null;
    setSelectedFile(file);
    setValidationErrors([]);
    setFilePreview('');

    if (file) {
      // Validate file
      const errors = validateFile(file);
      setValidationErrors(errors);

      if (errors.length === 0) {
        // Pre-fill filename with original file name
        setFilename(file.name);
        generateFilePreview(file);
      }
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    const sanitizedValue = sanitizeInput(value);

    switch (field) {
      case 'title':
        setTitle(sanitizedValue);
        break;
      case 'description':
        setDescription(sanitizedValue);
        break;
      case 'filename':
        setFilename(sanitizedValue);
        break;
    }

    // Save to localStorage
    saveFormData();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setMessage('');
    setError('');
    setValidationErrors([]);
    setIsLoading(true);
    setUploadProgress(0);

    if (!selectedFile) {
      setError('Please select a file to upload.');
      setIsLoading(false);
      return;
    }

    // Re-validate file before upload
    const errors = validateFile(selectedFile);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setError('File validation failed. Please check the file requirements.');
      setIsLoading(false);
      return;
    }

    // Validate inputs (title is now optional)
    // No validation needed for title since it's optional

    const formData = new FormData();
    formData.append('media', selectedFile);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('filename', filename || selectedFile.name);

    try {
      const response = await fetch(API_ROUTES.google.uploadMedia, {
        method: 'POST',
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message || 'Upload successful!');
        // Clear form after successful upload
        setSelectedFile(null);
        setTitle('');
        setDescription('');
        setFilename('');
        setFilePreview('');
        setUploadProgress(0);
        // Clear saved form data
        localStorage.removeItem('uploadFormData');
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        // Handle API error responses
        const errorMessage = data.error?.message || data.message || 'An unknown error occurred.';
        setError(errorMessage);

        // Handle specific error codes
        if (data.error?.code === 'VALIDATION_ERROR') {
          setValidationErrors([data.error.message]);
        } else if (data.error?.code === 'AUTH_ERROR') {
          setError('Authentication failed. Please log in again.');
        }

        console.error('Upload error:', data.error || data);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to the server.';
      setError(errorMessage);
      console.error('Network error:', err);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const clearForm = () => {
    setSelectedFile(null);
    setTitle('');
    setDescription('');
    setFilename('');
    setFilePreview('');
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
    <div className='max-w-md mx-auto p-4 bg-white rounded-lg shadow-md mt-10 font-inter'>
      <h2 className='text-2xl font-bold mb-4 text-center text-gray-800'>Upload Wedding Media</h2>

      <form ref={formRef} onSubmit={handleSubmit} className='space-y-4' noValidate>
        {/* File Input */}
        <div>
          <label htmlFor='mediaFile' className='block text-sm font-medium text-gray-700'>
            Select Photo/Video:
          </label>
          <input
            ref={fileInputRef}
            type='file'
            id='mediaFile'
            onChange={handleFileChange}
            className='mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer'
            accept='image/*, video/*'
            aria-describedby='file-help file-errors'
            aria-invalid={validationErrors.length > 0}
          />
          <div id='file-help' className='mt-1 text-sm text-gray-500'>
            Maximum file size: {formatFileSize(MAX_FILE_SIZE)} for photos,{' '}
            {formatFileSize(MAX_VIDEO_SIZE)} for videos
          </div>
          {selectedFile && (
            <div className='mt-2 text-sm text-gray-600'>
              Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </div>
          )}
        </div>

        {/* File Preview */}
        {filePreview && (
          <div className='mt-2'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Preview:</label>
            <img
              src={filePreview}
              alt='File preview'
              className='max-w-full h-32 object-cover rounded border'
            />
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

        {/* Title Input */}
        <div>
          <label htmlFor='title' className='block text-sm font-medium text-gray-700'>
            Title:
          </label>
          <input
            type='text'
            id='title'
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInputChange('title', e.target.value)
            }
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2'
            placeholder='A lovely moment...'
            maxLength={100}
            aria-describedby='title-help'
          />
          <div id='title-help' className='mt-1 text-sm text-gray-500'>
            Optional. Maximum 100 characters.
          </div>
        </div>

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

        {/* Description Input */}
        <div>
          <label htmlFor='description' className='block text-sm font-medium text-gray-700'>
            Description:
          </label>
          <textarea
            id='description'
            value={description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              handleInputChange('description', e.target.value)
            }
            rows={3}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2'
            placeholder='Details about this photo/video...'
            maxLength={500}
            aria-describedby='description-help'
          />
          <div id='description-help' className='mt-1 text-sm text-gray-500'>
            Optional. Maximum 500 characters. {description.length}/500
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
            disabled={isLoading || validationErrors.length > 0}
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
                Uploading...
              </>
            ) : (
              'Upload to Google Photos'
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
            : 'Click to upload your file to Google Photos.'}
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
