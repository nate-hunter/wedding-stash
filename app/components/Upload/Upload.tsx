'use client';

import { useState, ChangeEvent, DragEvent } from 'react';
import toast from 'react-hot-toast';

import { CheckIcon, XCircleOutlineIcon, XIcon } from '@/app/components/Icon';

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

interface MediaFileUpload {
  file: File;
  status: UploadStatus;
  progress: number; // 0-100
  error?: string;
}

export function Upload() {
  const [uploads, setUploads] = useState<Array<MediaFileUpload>>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFiles = (newFiles: FileList | null) => {
    // DEBUGGING
    console.log('????? newFiles ?????', newFiles, '// typeof newFiles: ', typeof newFiles);
    const firstFile = newFiles ? newFiles[0] : null;
    console.log('????? firstFile ?????', firstFile, '// typeof firstFile: ', typeof firstFile);
    // END DEBUGGING
    if (newFiles) {
      // TODO: Rename `acceptedFiles` to `mediaFiles`
      const acceptedFiles = Array.from(newFiles)
        .filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'))
        .map((file) => ({ file, status: 'pending' as UploadStatus, progress: 0 }));
      setUploads((prevUploads) => [...prevUploads, ...acceptedFiles]);
    }
  };

  const handleDrag = (e: DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFiles(e.target.files);
  };

  const removeFile = (fileToRemove: File) => {
    setUploads((prevUploads) => prevUploads.filter(({ file }) => file !== fileToRemove));
  };

  const handleUpload = async () => {
    setUploads((prevUploads) =>
      prevUploads.map((upload) => ({ ...upload, status: 'uploading' as UploadStatus })),
    );

    const uploadPromises = uploads.map((upload) => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        // formData.append('files', upload.file);
        formData.append('file', upload.file);

        // console.log('????? upload ?????', upload);
        // console.log('????? upload.file ?????', upload.file);
        console.log('????? formData ?????', formData);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/media/upload');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploads((prevUploads) =>
              prevUploads.map((u) => (u.file === upload.file ? { ...u, progress } : u)),
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploads((prevUploads) =>
              prevUploads.map((u) =>
                u.file === upload.file
                  ? { ...u, status: 'success' as UploadStatus, progress: 100 }
                  : u,
              ),
            );
            resolve(xhr.response);
          } else {
            setUploads((prevUploads) =>
              prevUploads.map((u) =>
                u.file === upload.file
                  ? { ...u, status: 'error' as UploadStatus, error: xhr.statusText }
                  : u,
              ),
            );
            reject(new Error(xhr.statusText));
          }
        };

        xhr.onerror = () => {
          setUploads((prevUploads) =>
            prevUploads.map((u) =>
              u.file === upload.file
                ? { ...u, status: 'error' as UploadStatus, error: 'Upload failed' }
                : u,
            ),
          );
          reject(new Error('Upload failed'));
        };

        xhr.send(formData);
      });
    });

    try {
      await Promise.all(uploadPromises);
      toast.success('All files uploaded successfully!');
      console.log('All files uploaded successfully');
    } catch (error) {
      toast.error('Some files failed to upload.');
      console.error('An error occurred during upload:', error);
    }
  };

  // ~~~~~~~~~~~~~~~~ LOGS: ~~~~~~~~~~~~~~~~
  console.log('????? uploads ?????', uploads);
  // ~~~~~~~~~~~~~~~~ LOGS: ~~~~~~~~~~~~~~~~

  return (
    <div className='flex flex-col gap-4'>
      <form
        className={`flex flex-col items-center justify-center w-full p-8 border-1 border-dashed rounded-lg cursor-pointer
        ${isDragActive ? 'border-tertiary-500 bg-tertiary-50' : 'border-tertiary bg-primary-50'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type='file'
          id='file-upload'
          multiple
          className='hidden'
          onChange={handleChange}
          accept='image/*,video/*'
        />
        <label
          htmlFor='file-upload'
          className='flex flex-col items-center justify-center w-full h-full cursor-pointer'
        >
          {isDragActive ? (
            <p className='text-tertiary-600'>Drop the files here ...</p>
          ) : (
            <p className='text-primary-600'>
              Drag &apos;n&apos; drop files here, or click to select files
            </p>
          )}
        </label>
      </form>

      {uploads.length > 0 && (
        <div>
          <h3>Files to Upload:</h3>
          <ul className='mt-2 space-y-2'>
            {uploads.map(({ file, status, progress, error }, index) => (
              <li key={index} className='p-2 bg-overlay border border-border rounded-md'>
                <div className='flex items-center justify-between'>
                  <span>
                    {file.name} - {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  {status === 'pending' && (
                    <button
                      onClick={() => removeFile(file)}
                      // className='btn-danger-inverted border-danger-400 w-fit'
                      className='btn-danger-inverted btn-sm border-danger-400 hover:border-danger-100 w-fit'
                      // className='text-red-600 bg-red-100 border border-red-400 rounded-md hover:bg-red-200 w-fit'
                    >
                      <XIcon size={18} />
                      {/* Remove */}
                    </button>
                  )}
                  {status === 'success' && <CheckIcon className='w-6 h-6 text-green-500' />}
                  {status === 'error' && <XCircleOutlineIcon className='w-6 h-6 text-red-500' />}
                </div>
                {status === 'uploading' && (
                  <div className='w-full h-2 mt-1 bg-gray-200 rounded-full'>
                    <div
                      className='h-full bg-tertiary rounded-full'
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
                {status === 'error' && <p className='text-sm text-red-500'>{error}</p>}
              </li>
            ))}
          </ul>
          <div className='mt-4'>
            <button
              className='btn-primary w-full'
              // className='w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700'
              onClick={handleUpload}
            >
              {uploads.some((u) => u.status === 'uploading')
                ? 'Uploading...'
                : `Upload ${uploads.length} file(s)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
