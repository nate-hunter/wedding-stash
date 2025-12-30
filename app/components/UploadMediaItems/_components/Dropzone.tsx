'use client';

import React, { useRef, useState } from 'react';

import { ImagePlusIcon } from '@/components/Icon';
import '../upload-media-items.css';

type DropzoneProps = {
  onFilesAdded: (files: Array<File>) => Promise<void>;
  isDisabled?: boolean;
  accept?: string;
  multiple?: boolean;
};

export default function Dropzone({
  onFilesAdded,
  isDisabled = false,
  accept = 'image/*,video/*',
  multiple = true,
}: DropzoneProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);

  // ----- Event Handlers -----

  function handleDragEnter(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    e.stopPropagation();
    if (!isDisabled) {
      setIsDragActive(true);
    }
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    e.stopPropagation();
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>): Promise<void> {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (isDisabled) {
      return;
    }

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      await onFilesAdded(droppedFiles);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      await onFilesAdded(selectedFiles);

      // Reset input value so the same file can be selected again if needed
      e.target.value = '';
    }
  }

  function handleClick(): void {
    if (!isDisabled) {
      fileInputRef.current?.click();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }

  return (
    <div
      className={`dropzone-container ${isDragActive ? 'dropzone-container--active' : ''} ${
        isDisabled ? 'dropzone-container--disabled' : ''
      } ${isDragActive ? 'bg-tertiary-50/50' : 'bg-primary-50/50'}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role='button'
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled}
      aria-live='polite'
      aria-label='Drag and drop files or click to select'
    >
      <input
        type='file'
        ref={fileInputRef}
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className='hidden'
        aria-label='File input'
      />
      <div
        className={`dropzone-icon-circle ${isDragActive ? 'border-tertiary' : 'border-primary'}`}
      >
        <ImagePlusIcon size={24} />
      </div>

      <div className='text-center'>
        <p className='text-body font-medium'>
          {isDragActive ? 'Drop files here' : 'Drag and drop files here, or click to select'}
        </p>
        <p className='text-caption text-secondary-500'>
          Max file size: 10MB (photos) / 100MB (videos)
        </p>
      </div>
    </div>
  );
}
