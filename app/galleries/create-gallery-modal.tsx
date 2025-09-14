'use client';

import { useState, Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// TODO: Replace Dialog with custom modal component
// TODO: Replace Toast with custom toast component

type CreateGalleryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function CreateGalleryModal({ isOpen, onClose, onSuccess }: CreateGalleryModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/galleries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create gallery');
      }

      toast.success('Gallery created successfully!');
      onSuccess();
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
        <TransitionChild
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-surface-dark opacity-90' />
        </TransitionChild>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-full p-4 text-center'>
            <TransitionChild
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              {/* <Dialog.Panel className='box w-full max-w-md  rounded-md'> */}
              <DialogPanel className='flex flex-col gap-7 w-full max-w-md p-7 overflow-hidden text-left align-middle transition-all transform bg-background shadow-xl rounded-md'>
                <DialogTitle as='h3' className='leading-6'>
                  Create New Gallery
                </DialogTitle>
                <form onSubmit={handleSubmit} className='form-container'>
                  {/* <div className='form-field-column'> */}
                  <div className='form-field'>
                    <label htmlFor='title' className='form-label'>
                      {/* <label htmlFor='title' className='block text-sm font-medium text-gray-700'> */}
                      Title
                      <span className='text-danger px-1'>*</span>
                    </label>
                    <input
                      type='text'
                      id='title'
                      value={title}
                      placeholder='Title...'
                      onChange={(e) => setTitle(e.target.value)}
                      className='form-input'
                      // className='w-full p-2 mt-1 border border-border rounded-md'
                      required
                    />
                  </div>
                  <div className='form-field'>
                    <label htmlFor='description' className='form-label'>
                      Description
                    </label>
                    <textarea
                      id='description'
                      value={description}
                      placeholder='Description (Optional)...'
                      onChange={(e) => setDescription(e.target.value)}
                      className='form-input'
                      // className='w-full p-2 mt-1 border border-border rounded-md'
                      rows={2}
                    />
                  </div>
                  {/* </div> */}

                  {error && <p className='mt-2 text-sm text-danger'>{error}</p>}

                  <div className='form-btns--col mt-6'>
                    <button
                      type='submit'
                      className='btn-cta'
                      // className='inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
                      disabled={!title.trim() || isSubmitting}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Gallery'}
                    </button>
                    <button
                      type='button'
                      className='btn-inverted'
                      // className='inline-flex justify-center px-4 py-2 ml-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2'
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
