import React, { useState } from 'react';

import {
  FilterIcon,
  GridIcon,
  MaximizeIcon,
  PlusIcon,
  TableIcon,
  UploadIcon,
} from '@/app/components/Icon';

import { PageActionsProps, LayoutViewOption } from '../types';

const LAYOUT_OPTIONS: Array<{
  key: LayoutViewOption;
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
}> = [
  { key: 'grid', icon: GridIcon, label: 'Grid layout view' },
  { key: 'column', icon: MaximizeIcon, label: 'Column layout view' },
  { key: 'table', icon: TableIcon, label: 'Table layout view' },
];

export function PageActions({
  currentTab,
  layoutView,
  onLayoutChange,
  onSearch,
  onUpload,
  onCreateGallery,
}: PageActionsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <section className='flex flex-row justify-between gap-4'>
      <div>
        {currentTab === 'my-uploads' && (
          <button className='btn-cta' onClick={onUpload}>
            <UploadIcon size={20} />
            Upload Photo or Video
          </button>
        )}
        {currentTab === 'galleries' && (
          <button className='btn-cta' onClick={onCreateGallery}>
            <PlusIcon size={20} />
            Add Gallery
          </button>
        )}
      </div>

      <div className='flex flex-row gap-6 items-center'>
        {/* Search */}
        <div className='flex flex-row gap-3'>
          <input
            type='search'
            placeholder='Search...'
            className='form-input'
            aria-label='Search media items'
            title='Search media items'
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        {/* Layout Toggle */}
        <div className='flex flex-row gap-4 border-1 border-border rounded-sm p-3'>
          {LAYOUT_OPTIONS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type='button'
              className={`btn-icon--sm ${layoutView === key ? 'btn-icon-active' : ''}`}
              onClick={() => onLayoutChange(key)}
              aria-label={label}
              title={label}
              disabled={key !== 'grid'} // Only grid is implemented for now
            >
              <Icon
                size={key === 'table' ? 20 : 18}
                className={layoutView !== key ? 'stroke-border' : undefined}
              />
            </button>
          ))}
        </div>

        <button className='btn-icon size-[34px] bg-overlay'>
          <FilterIcon size={24} className='stroke-surface-300' />
        </button>
      </div>
    </section>
  );
}
