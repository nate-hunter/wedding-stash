import CreateAlbumForm from '../CreateAlbumForm';

export default function CreateAlbumPage() {
  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Create Google Photos Album</h1>
          <p className='text-gray-600'>Create a new album in your Google Photos library</p>
        </div>

        <CreateAlbumForm />
      </div>
    </div>
  );
}
