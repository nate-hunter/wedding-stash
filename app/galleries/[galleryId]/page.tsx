'use client';

import { useState, useEffect } from 'react';
import { MediaGrid } from './media-grid';
import { EditGalleryModal } from './edit-gallery-modal';
import { DeleteGalleryModal } from './delete-gallery-modal';
import { notFound } from 'next/navigation';
import toast from 'react-hot-toast';

type Gallery = {
  id: string;
  title: string;
  description: string | null;
  is_default: boolean;
};

type GalleryDetailPageProps = {
  params: Promise<{
    galleryId: string;
  }>;
};

export default function GalleryDetailPage({ params }: GalleryDetailPageProps) {
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMediaItems, setSelectedMediaItems] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [galleryId, setGalleryId] = useState<string | null>(null);

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params;
      setGalleryId(resolvedParams.galleryId);
    }
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!galleryId) return;

    async function getGalleryDetails() {
      const response = await fetch(`/api/galleries/${galleryId}`);
      if (response.status === 404) {
        notFound();
      }
      if (!response.ok) {
        // Handle other errors
        return;
      }
      const data = await response.json();
      if (data.success) {
        setGallery(data.gallery);
      }
      setIsLoading(false);
    }
    getGalleryDetails();
  }, [galleryId]);

  const handleDownload = async () => {
    setIsDownloading(true);
    const toastId = toast.loading('Preparing download...');
    try {
      const response = await fetch('/api/media/download/batch/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ media_item_ids: selectedMediaItems }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Download starting...', { id: toastId });
        window.location.href = `/api/media/download/batch/${data.collection.id}`;
      } else {
        toast.error('Failed to prepare download.', { id: toastId });
        // Handle error
        console.error('Failed to create download collection');
      }
    } catch (error) {
      toast.error('An error occurred during download preparation.', { id: toastId });
      console.error('An error occurred during download:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading || !galleryId) {
    return <div>Loading...</div>;
  }

  if (!gallery) {
    return <div>Gallery not found.</div>;
  }

  return (
    <>
      <main className='container p-4 mx-auto'>
        <div className='flex items-center justify-between mb-2'>
          <h1 className='text-3xl font-bold'>{gallery.title}</h1>
          <div className='flex gap-2'>
            {selectedMediaItems.length > 0 && (
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className='px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700'
              >
                {isDownloading ? 'Preparing...' : `Download ${selectedMediaItems.length} items`}
              </button>
            )}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className='px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700'
            >
              Edit
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className='px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700'
            >
              Delete
            </button>
          </div>
        </div>
        {gallery.description && <p className='mb-4 text-gray-600'>{gallery.description}</p>}
        <MediaGrid galleryId={galleryId!} onSelectionChange={setSelectedMediaItems} />
      </main>
      <EditGalleryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        gallery={gallery}
      />
      <DeleteGalleryModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        galleryId={gallery.id}
      />
    </>
  );
}
