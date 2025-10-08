import React from 'react';

import { TabNavigationProps, TabOption } from '../types';

const TAB_CONFIG: Array<{ key: TabOption; label: string }> = [
  { key: 'my-uploads', label: 'Uploaded' },
  // { key: 'galleries', label: 'Galleries' },
  // { key: 'likes', label: 'Likes' },
  // { key: 'downloads', label: 'Downloads' },
];

export function TabNavigation({ currentTab, onTabChange }: TabNavigationProps) {
  return (
    <section role='tablist' className='tab-container sm:overflow-x-auto'>
      {TAB_CONFIG.map((tab, index) => (
        <React.Fragment key={tab.key}>
          <button
            type='button'
            role='tab'
            aria-selected={currentTab === tab.key}
            onClick={() => onTabChange(tab.key)}
            className={currentTab === tab.key ? 'tab-btn--active' : 'tab-btn'}
          >
            {tab.label}
          </button>
          {index < TAB_CONFIG.length - 1 && <span className='font-mono text-lg font-bold'>•</span>}
        </React.Fragment>
      ))}
    </section>
  );
}
