import { DownloadIcon } from '@/app/components/Icon/icons/DownloadIcon';
import { TrashIcon } from '@/app/components/Icon/icons/TrashIcon';

export default function GridItemPlaceholder() {
  return (
    <div className='flex flex-col gap-4'>
      <div className='gallery-grid-placeholder'>Grid Item Placeholder...</div>
      <div className='flex flex-row gap-4 justify-between'>
        <div className='flex flex-row gap-4 items-center'>
          <button className='btn-icon'>
            <DownloadIcon size={16} />
          </button>
          <span className='text-sm'>Add to Downloads</span>
        </div>

        <button className='btn-icon btn-danger-inverted'>
          <TrashIcon size={16} />
        </button>
      </div>
    </div>
  );
}
