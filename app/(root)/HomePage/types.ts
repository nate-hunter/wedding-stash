// Video types
export type Video = {
  id: number;
  category?: VideoCategory; // Temporary?
  title: string;
  url: string;
  cite?: string;
  cite_url?: string;
  thumbnail?: string;
};

// Photo types
export type Photo = {
  id: number;
  src: string;
  alt: string;
  gallery: string;
};

// Gallery category types
export type GalleryCategory = 'all' | 'ceremony' | 'reception' | 'portraits' | 'details';

export type GalleryCategoryOption = {
  key: GalleryCategory;
  label: string;
};

// Video category types
export type VideoCategory = 'vintage-film' | 'super-8' | 'teaser';

export type VideoCategoryOption = {
  key: VideoCategory;
  label: string;
};

// Component prop types
export type VideoSectionProps = {
  videos: Array<Video>;
};

export type GallerySectionProps = {
  photos: Array<Photo>;
};

export type VideoPlayerProps = {
  video: Video | null;
  loading?: boolean;
};

export type PhotoGalleryProps = {
  photos: Array<Photo>;
  loading?: boolean;
  onPhotoClick?: (photo: Photo) => void;
};

export type TabNavigationProps<TCat extends string> = {
  categories: Array<{ key: TCat; label: string }>;
  activeCategory: TCat;
  onCategoryChange: (category: TCat) => void;
};
