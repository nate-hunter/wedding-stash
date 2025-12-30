'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

import { CheckIcon, DangerIcon, LoadingIcon, TrashIcon } from '@/app/components/Icon';
import { formatFileSize } from '@/utils/file-helpers';

import type { UploadFile } from '../hooks/useUnifiedUpload';

import '../upload-media-items.css';

type MediaFileItemProps = {
  file: UploadFile;
  onRemove: (fileId: string) => void;
  onUpdateTitle: (fileId: string, newTitle: string) => void;
};

export function MediaFileItem({ file, onRemove, onUpdateTitle }: MediaFileItemProps) {
  console.log({ file });
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editedTitle, setEditedTitle] = useState<string>(file.title);
  const canRemove = file.status === 'pending' || file.status === 'processing';

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  function handleInputInteraction(): void {
    // Enable editing when input is clicked or focused (via keyboard)
    if (!isEditingTitle && (file.status === 'pending' || file.status === 'processing')) {
      setIsEditingTitle(true);
    }
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setEditedTitle(e.target.value);
  }

  function handleTitleBlur(): void {
    setIsEditingTitle(false);
    if (editedTitle.trim() && editedTitle !== file.title) {
      onUpdateTitle(file.id, editedTitle.trim());
    } else {
      setEditedTitle(file.title);
    }
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setEditedTitle(file.title);
      setIsEditingTitle(false);
      inputRef.current?.blur();
    }
  }

  function handleRemoveClick(): void {
    onRemove(file.id);
  }

  return (
    <div className='upload-item'>
      {/* LEFT SIDE OF CARD */}
      <div className='upload-item-thumbnail'>
        {file.previewUrl ? (
          <Image
            src={file.previewUrl}
            alt={file.title}
            width={80}
            height={80}
            className='object-cover'
            unoptimized
          />
        ) : (
          <div className='bg-gray-100 border border-gray-200 flex items-center justify-center'>
            <span className='text-3xl text-gray-400'>📄</span>
          </div>
        )}
      </div>

      {/* RIGHT SIDE OF CARD */}
      <div className='upload-item-details'>
        <input
          ref={inputRef}
          type='text'
          value={editedTitle}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          onClick={handleInputInteraction}
          onFocus={handleInputInteraction}
          onKeyDown={handleTitleKeyDown}
          readOnly={!isEditingTitle}
          disabled={file.status !== 'pending' && file.status !== 'processing'}
          aria-label={isEditingTitle ? 'Editing file title' : 'Click to edit file title'}
          className='form-input upload-item-title-input'
          placeholder='Click to add Title...'
        />

        <div className='upload-item-subdetails'>
          <div className='upload-item-info'>
            <div className='upload-item-metadata text-caption'>
              <span>{formatFileSize(file.file.size)}</span>
              <span>•</span>
              <span>{file.file.type || 'Unknown'}</span>
            </div>

            <div className='upload-item-status'>
              <UploadStatus status={file.status} />
            </div>
          </div>

          <button
            className='btn-icon--xs btn-danger-transparent file-item-action-btn'
            onClick={handleRemoveClick}
            disabled={!canRemove}
            aria-label='Remove file'
          >
            <TrashIcon size={20} />
          </button>
        </div>

        {/* Error Message (Above Status Bar) */}
        {file.error && (
          <div className='file-item-error text-caption' role='alert' aria-live='assertive'>
            <DangerIcon size={14} />
            {file.error}
          </div>
        )}
      </div>
    </div>
  );
}

const UPLOAD_STATUS_CONFIG = {
  processing: {
    label: 'Processing',
    variant: 'processing',
    icon: LoadingIcon,
  },
  pending: {
    label: 'Ready',
    variant: 'pending',
    icon: CheckIcon,
  },
  uploading: {
    label: 'Uploading',
    variant: 'uploading',
    icon: LoadingIcon,
  },
  completed: {
    label: 'Uploaded',
    variant: 'completed',
    icon: CheckIcon,
  },
  failed: {
    label: 'Failed',
    variant: 'failed',
    icon: DangerIcon,
  },
};

type UploadStatusProps = {
  status: UploadFile['status'];
};

function UploadStatus({ status: _fileStatus }: UploadStatusProps) {
  const status = UPLOAD_STATUS_CONFIG[_fileStatus];
  const StatusIcon = status['icon'];
  return (
    <div className={`upload-item-status upload-item-status--${status['variant']} text-caption`}>
      <StatusIcon size={14} />
      <span>{status['label']}</span>
      {/* TODO: Decide if to add `UploadProgressBar` here */}
    </div>
  );
}
