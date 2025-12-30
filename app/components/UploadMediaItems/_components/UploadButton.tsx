'use client';

import React, { JSX } from 'react';
import Button from '@/components/Button';

type UploadButtonProps = {
  onUpload: () => Promise<void>;
  isUploading: boolean;
  pendingCount: number;
  hasFiles: boolean;
};

export default function UploadButton({
  onUpload,
  isUploading,
  pendingCount,
  hasFiles,
}: UploadButtonProps): JSX.Element {
  const isDisabled = isUploading || !hasFiles || pendingCount === 0;
  const fileLabel = pendingCount === 1 ? 'File' : 'Files';

  function handleClick(): void {
    if (!isDisabled) {
      void onUpload();
    }
  }

  return (
    <Button
      variant='cta'
      onClick={handleClick}
      isDisabled={isDisabled}
      aria-label={`Upload ${pendingCount} ${fileLabel}`}
    >
      {isUploading ? `Uploading...` : `Upload (${pendingCount} ${fileLabel})`}
    </Button>
  );
}
