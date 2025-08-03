'use client';

import { useState } from 'react';

import Button from '@/components/Button';
import { UploadIcon } from '../components/Icon/icons/UploadIcon';
import UploadModal from './upload-modal';

interface UploadButtonProps {
  onUploadComplete: () => void;
}

export default function UploadButton({ onUploadComplete }: UploadButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUploadComplete = () => {
    onUploadComplete();
    setIsModalOpen(false);
  };

  return (
    <>
      <Button variant='primary' width='fit' onClick={() => setIsModalOpen(true)}>
        <UploadIcon size={18} />
        Upload Photos
      </Button>

      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </>
  );
}
