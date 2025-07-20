'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface DeletePhotoButtonProps {
  userId: string;
  fileName: string;
  onDelete: () => void;
}

export default function DeletePhotoButton({ userId, fileName, onDelete }: DeletePhotoButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const filePath = `${userId}/${fileName}`;
      const { error } = await supabase.storage.from('photos').remove([filePath]);

      if (error) {
        console.error('Error deleting photo:', error);
        alert('Error deleting photo. Please try again.');
      } else {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Error deleting photo. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className='w-full px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
    >
      {isDeleting ? 'Deleting...' : 'Delete Photo'}
    </button>
  );
}
