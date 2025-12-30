'use client';

import React from 'react';
import { TabNavigationProps } from '../types';

export function TabNavigation<TCat extends string>({
  categories,
  activeCategory,
  onCategoryChange,
}: TabNavigationProps<TCat>) {
  return (
    <nav role='tablist' className='tab-container'>
      {categories.map((category) => (
        <button
          key={category.key}
          type='button'
          role='tab'
          aria-selected={activeCategory === category.key}
          onClick={() => onCategoryChange(category.key)}
          className={activeCategory === category.key ? 'tab-btn--active' : 'tab-btn'}
        >
          {category.label}
        </button>
      ))}
    </nav>
  );
}
