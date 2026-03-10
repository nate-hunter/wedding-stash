'use client';

import React from 'react';
import type { UploadFile } from '../hooks/useUnifiedUpload';
import { MediaFileItem } from './MediaFileItem';
import { formatFileSize } from '@/utils/file-helpers';
import '../upload-media-items.css';

type FileListProps = {
  files: Array<UploadFile>;
  onRemove: (fileId: string) => void;
  onUpdateTitle: (fileId: string, newTitle: string) => void;
};

export function FileList({ files, onRemove, onUpdateTitle }: FileListProps): React.JSX.Element {
  // ----- Summary Calculations -----

  const totalFiles = files.length;
  const pendingFiles = files.filter((f) => f.status === 'pending').length;
  const processingFiles = files.filter((f) => f.status === 'processing').length;
  const uploadingFiles = files.filter((f) => f.status === 'uploading').length;
  const completedFiles = files.filter((f) => f.status === 'completed').length;
  const failedFiles = files.filter((f) => f.status === 'failed').length;

  const totalSize = files.reduce((sum, file) => sum + file.file.size, 0);

  // ----- Empty State -----

  if (files.length === 0) {
    return (
      <div
        className='flex flex-col items-center justify-center py-12 px-4 text-center'
        role='status'
        aria-live='polite'
      >
        <div className='w-16 h-16 mb-4 text-gray-300' aria-hidden='true'>
          <svg
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='1.5'
              d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
            ></path>
          </svg>
        </div>
        <p className='hd-5 text-gray-600 mb-1'>No files selected</p>
        <p className='text-caption text-gray-500'>
          Drag and drop files above or click to select files to upload
        </p>
      </div>
    );
  }

  // ----- Summary Bar -----

  function getSummaryBar(): React.JSX.Element {
    return (
      <div className='file-list-summary'>
        <div className='file-list-summary-stats'>
          {/* Total Files */}
          <div className='flex items-center gap-3'>
            <span className='hd-4'>Files</span>
            <span className='hd-4'>({totalFiles})</span>
            <span className='hd-5 text-secondary-500'>•</span>
            <span className='hd-5 text-secondary-500'>{formatFileSize(totalSize)}</span>
          </div>

          {/* Status Breakdown */}
          <div className='flex items-center gap-3 ml-auto'>
            {processingFiles > 0 && (
              <span className='hd-6 text-yellow-800'>⏳ {processingFiles} processing</span>
            )}
            {pendingFiles > 0 && <span className='hd-6 text-info-600'>Ready ({pendingFiles})</span>}
            {uploadingFiles > 0 && (
              <span className='hd-6 text-tertiary'> Uploading ({uploadingFiles})</span>
            )}
            {completedFiles > 0 && (
              <span className='hd-6 text-success-600'>Uploaded ({completedFiles})</span>
            )}
            {failedFiles > 0 && (
              <span className='hd-6 text-danger-600'>Failed ({failedFiles})</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----- Render -----

  return (
    <div className='file-list-container'>
      {/* Summary Bar */}
      <div role='status' aria-live='polite'>
        {getSummaryBar()}
      </div>

      {/* File List */}
      <div className='file-list-items' role='list' aria-label='Upload files'>
        {files.map((file) => (
          <div key={file.id} role='listitem'>
            <MediaFileItem file={file} onRemove={onRemove} onUpdateTitle={onUpdateTitle} />
          </div>
        ))}
      </div>

      {/* File List */}
      {/* <div className='file-list-items' role='list' aria-label='Upload files'>
        {files.map((file) => (
          <div key={file.id} role='listitem'>
            <FileItem file={file} onRemove={onRemove} onUpdateTitle={onUpdateTitle} />
          </div>
        ))}
      </div> */}
    </div>
  );
}
