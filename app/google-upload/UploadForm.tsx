'use client';

import React, { useState, ChangeEvent, FormEvent, useRef } from 'react';

// Direct upload implementation - no local type definitions needed

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

// Remove unused FormData interface since we no longer have persistent form fields

interface UploadFormProps {
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  onUploadSuccess?: () => void;
  isModal?: boolean;
}

function UploadForm({
  onUploadStart,
  onUploadEnd,
  onUploadSuccess,
  isModal = false,
}: UploadFormProps) {
  // State management - Updated to handle multiple files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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

  // Removed localStorage logic since we no longer have persistent form fields

  // Client-side file validation - Updated to validate individual files
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

  // Generate file previews for multiple files
  const generateFilePreviews = (files: File[]) => {
    const previews: string[] = [];
    let loadedCount = 0;

    files.forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          previews[index] = reader.result as string;
          loadedCount++;

          // Update state when all previews are loaded
          if (loadedCount === files.length) {
            setFilePreviews([...previews]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        previews[index] = '';
        loadedCount++;

        // Update state when all previews are processed
        if (loadedCount === files.length) {
          setFilePreviews([...previews]);
        }
      }
    });
  };

  // Handle file selection from both input and drag-and-drop
  const handleFiles = (files: File[]): void => {
    setSelectedFiles(files);
    setValidationErrors([]);
    setFilePreviews([]);
    setError('');
    setMessage('');

    if (files.length > 0) {
      // Check Google Photos API limits (50 files max)
      if (files.length > 50) {
        setError(
          'Maximum 50 files allowed per upload (Google Photos API limit). Please select fewer files.',
        );
        return;
      }

      // Provide helpful guidance about direct upload
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

  // Removed handleInputChange since we no longer have form inputs to handle

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
      // Step 1: Get upload tokens from Vercel (small JSON payload)
      setMessage('Preparing upload...');
      const tokenResponse = await fetch('/api/google/get-upload-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: selectedFiles.map((file) => ({
            filename: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
          })),
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error?.message || 'Failed to get upload tokens');
      }

      const tokenData = await tokenResponse.json();
      const { uploadUrl, accessToken, albumId } = tokenData.data;

      // Step 2: Upload files directly to Google Photos (bypasses Vercel payload limits)
      const uploadedTokens: Array<{ filename: string; uploadToken: string }> = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        setMessage(`Uploading ${file.name} (${i + 1} of ${selectedFiles.length})...`);

        try {
          // Direct upload to Google Photos
          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/octet-stream',
              'X-Goog-Upload-Content-Type': file.type || 'application/octet-stream',
              'X-Goog-Upload-Protocol': 'raw',
            },
            body: file,
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error(`Direct upload failed for ${file.name}:`, errorText);
            throw new Error(`Upload failed for ${file.name}: ${uploadResponse.status}`);
          }

          // Google Photos returns the upload token as the response body
          const uploadToken = await uploadResponse.text();
          uploadedTokens.push({
            filename: file.name,
            uploadToken: uploadToken.trim(),
          });

          const progress = Math.round(((i + 1) / selectedFiles.length) * 80); // Reserve 20% for completion
          setUploadProgress(progress);
        } catch (uploadError) {
          console.error(`Failed to upload ${file.name}:`, uploadError);
          // Continue with other files rather than failing completely
          setMessage(`Warning: ${file.name} failed to upload. Continuing with remaining files...`);
        }
      }

      if (uploadedTokens.length === 0) {
        throw new Error('All files failed to upload');
      }

      // Step 3: Complete upload by creating media items (small JSON payload to Vercel)
      setMessage('Finalizing upload...');
      const completeResponse = await fetch('/api/google/complete-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadTokens: uploadedTokens,
          albumId,
        }),
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error?.message || 'Failed to complete upload');
      }

      await completeResponse.json();

      // Success
      setMessage(
        uploadedTokens.length === selectedFiles.length
          ? `Successfully uploaded ${uploadedTokens.length} file${
              uploadedTokens.length > 1 ? 's' : ''
            } to Google Photos!`
          : `Uploaded ${uploadedTokens.length} of ${selectedFiles.length} files to Google Photos.`,
      );
      setUploadProgress(100);

      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Reset form after successful upload
      setTimeout(() => {
        setSelectedFiles([]);
        setFilePreviews([]);
        setIsLoading(false);
        setUploadProgress(0);
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
    setMessage('');
    setError('');
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
