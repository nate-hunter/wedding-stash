import { MediaItemWithUrl } from '@/utils/supabase/types';

// Tab and layout types
export type TabOption = 'my-uploads' | 'galleries' | 'likes' | 'downloads';
export type LayoutViewOption = 'grid' | 'column' | 'table';

// Component state interfaces
export interface CollectionsState {
  user: import('@supabase/supabase-js').User | null;
  mediaItems: MediaItemWithUrl[];
  loading: boolean;
  error: string | null;
  currentTab: TabOption;
  layoutView: LayoutViewOption;
}

// Component props interfaces
export interface TabNavigationProps {
  currentTab: TabOption;
  onTabChange: (tab: TabOption) => void;
}

export interface PageActionsProps {
  currentTab: TabOption;
  layoutView: LayoutViewOption;
  onLayoutChange: (layout: LayoutViewOption) => void;
  onSearch: (query: string) => void;
  onUpload: () => void;
  onCreateGallery: () => void;
}

export interface MediaGridProps {
  mediaItems: MediaItemWithUrl[];
  loading: boolean;
  error: string | null;
  onDownload: (item: MediaItemWithUrl) => void;
  onDelete: (item: MediaItemWithUrl) => void;
}

export interface MediaItemCardProps {
  item: MediaItemWithUrl;
  onDownload: (item: MediaItemWithUrl) => void;
  onDelete: (item: MediaItemWithUrl) => void;
}

// Hook return types
export interface UseMediaItemsResult {
  mediaItems: MediaItemWithUrl[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseAuthResult {
  user: import('@supabase/supabase-js').User | null;
  loading: boolean;
  error: string | null;
}

// Action types for operations
export interface MediaItemAction {
  type: 'download' | 'delete';
  item: MediaItemWithUrl;
}
