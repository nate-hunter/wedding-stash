'use client';

import React from 'react';

import Button from '@/components/Button';

import Dropzone from './_components/Dropzone';
import { FileList } from './_components/FileList';
import UploadButton from './_components/UploadButton';
import { useUnifiedUpload } from './hooks/useUnifiedUpload';

import './upload-media-items.css';

export default function UploadMediaItems(): React.JSX.Element {
  const {
    files,
    isUploading,
    addFiles,
    removeFile,
    updateFileTitle,
    uploadFiles,
    clearCompleted,
    resetAll,
  } = useUnifiedUpload({
    maxFiles: 50,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    onUploadComplete: (completedFiles) => {
      console.log(`Successfully uploaded ${completedFiles.length} files!`);
      // TODO: Add toast notification
      // TODO: Refresh media items list or redirect
    },
    onUploadError: (file, error) => {
      console.error(`Upload failed for ${file.title}:`, error);
      // TODO: Add toast notification
    },
  });

  // ----- Calculations -----

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const hasFiles = files.length > 0;
  const hasCompletedFiles = files.some((f) => f.status === 'completed');

  // ----- Render -----

  return (
    <div className='upload-media-items'>
      {/* Dropzone for file selection */}
      <div className='mb-6'>
        <Dropzone
          onFilesAdded={addFiles}
          isDisabled={isUploading}
          accept='image/*,video/*'
          multiple={true}
        />
      </div>

      {/* List of selected files */}
      {hasFiles && (
        <div className='mb-6'>
          <FileList files={files} onRemove={removeFile} onUpdateTitle={updateFileTitle} />
        </div>
      )}

      {/* Action buttons */}
      <div className='flex flex-col gap-3'>
        <UploadButton
          onUpload={uploadFiles}
          isUploading={isUploading}
          pendingCount={pendingCount}
          hasFiles={hasFiles}
        />

        {hasFiles && !isUploading && (
          <button className='btn-danger btn-transparent btn-outlined' onClick={resetAll}>
            Clear All
          </button>
        )}

        {hasCompletedFiles && (
          <Button variant='default' onClick={clearCompleted}>
            Clear Completed
          </Button>
        )}
      </div>
    </div>
  );
}
