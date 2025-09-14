'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type Gallery = {
  id: string;
  title: string;
  description: string | null;
  is_default: boolean;
};

type EditGalleryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  gallery: Gallery;
};

export function EditGalleryModal({ isOpen, onClose, gallery }: EditGalleryModalProps) {
  const [title, setTitle] = useState(gallery.title);
  const [description, setDescription] = useState(gallery.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setTitle(gallery.title);
    setDescription(gallery.description || '');
  }, [gallery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/galleries/${gallery.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update gallery');
      }

      toast.success('Gallery updated successfully!');
      onClose();
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-10' onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black bg-opacity-25' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-full p-4 text-center'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <Dialog.Panel className='w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl'>
                <Dialog.Title as='h3' className='text-lg font-medium leading-6 text-gray-900'>
                  Edit Gallery
                </Dialog.Title>
                <form onSubmit={handleSubmit} className='mt-4'>
                  <div className='flex flex-col gap-4'>
                    <div>
                      <label htmlFor='title' className='block text-sm font-medium text-gray-700'>
                        Title
                      </label>
                      <input
                        type='text'
                        id='title'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={`w-full p-2 mt-1 border rounded-md ${
                          gallery.is_default
                            ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                            : 'border-gray-300'
                        }`}
                        disabled={gallery.is_default}
                        required
                      />
                      {gallery.is_default && (
                        <p className='mt-1 text-xs text-gray-500'>
                          The title of your default &quot;Uploads&quot; gallery cannot be changed.
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor='description'
                        className='block text-sm font-medium text-gray-700'
                      >
                        Description
                      </label>
                      <textarea
                        id='description'
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className='w-full p-2 mt-1 border border-gray-300 rounded-md'
                        rows={3}
                      />
                    </div>
                  </div>

                  {error && <p className='mt-2 text-sm text-red-500'>{error}</p>}

                  <div className='mt-6'>
                    <button
                      type='submit'
                      className='inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type='button'
                      className='inline-flex justify-center px-4 py-2 ml-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2'
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
