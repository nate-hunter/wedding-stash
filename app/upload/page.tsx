import { Upload } from '@/app/components/Upload/Upload';

// TODO: Replace `main` with `div`

export default function UploadPage() {
  return (
    <main className='container p-4 mx-auto'>
      <h1 className='mb-4 text-2xl font-bold'>Upload Media</h1>
      <Upload />
    </main>
  );
}
