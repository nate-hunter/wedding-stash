import { Video, Photo, GalleryCategoryOption, VideoCategoryOption, VideoCategory } from '../types';

// Mock videos from the existing video-list.tsx
export const MOCK_VIDEOS: Array<Video> = [
  {
    id: 1,
    category: 'vintage-film',
    title: 'Vintage Film',
    url: 'https://youtu.be/H7WUONmjghU',
    cite: 'Pono Grace',
    cite_url: 'https://www.ponograce.com/',
  },
  {
    id: 2,
    category: 'super-8',
    title: 'Super 8',
    url: 'https://youtu.be/_W77OgthovA',
    cite: 'Pono Grace',
    cite_url: 'https://www.ponograce.com/',
  },
  {
    id: 3,
    title: 'Teaser',
    category: 'teaser',
    url: 'https://youtu.be/I2JRM_pLzOY',
    cite: 'Pono Grace',
    cite_url: 'https://www.ponograce.com/',
  },
];

// Mock photos from public/images/mock-data
export const MOCK_PHOTOS: Array<Photo> = [
  {
    id: 1,
    src: '/images/mock-data/_DEV--lisa+nate-1.jpeg',
    alt: 'Lisa and Nate - Photo 1',
    gallery: 'ceremony',
  },
  {
    id: 2,
    src: '/images/mock-data/_DEV--lisa+nate-2.jpeg',
    alt: 'Lisa and Nate - Photo 2',
    gallery: 'reception',
  },
  {
    id: 3,
    src: '/images/mock-data/_DEV--lisa+nate-3.jpeg',
    alt: 'Lisa and Nate - Photo 3',
    gallery: 'portraits',
  },
  {
    id: 4,
    src: '/images/mock-data/_DEV--lisa+nate-4.jpeg',
    alt: 'Lisa and Nate - Photo 4',
    gallery: 'ceremony',
  },
  {
    id: 5,
    src: '/images/mock-data/_DEV--lisa+nate-5.jpeg',
    alt: 'Lisa and Nate - Photo 5',
    gallery: 'details',
  },
  {
    id: 6,
    src: '/images/mock-data/_DEV--nate-6.jpeg',
    alt: 'Nate - Photo 6',
    gallery: 'portraits',
  },
];

// Video category options
export const VIDEO_CATEGORIES: Array<VideoCategoryOption> = [
  { key: 'vintage-film', label: 'Vintage Film' },
  { key: 'super-8', label: 'Super 8' },
  { key: 'teaser', label: 'Teaser' },
];

// Gallery category options
export const GALLERY_CATEGORIES: Array<GalleryCategoryOption> = [
  { key: 'all', label: 'All Photos' },
  { key: 'ceremony', label: 'Ceremony' },
  { key: 'reception', label: 'Reception' },
  { key: 'portraits', label: 'Portraits' },
  { key: 'details', label: 'Details' },
];

// Helper function to get videos by category
export function getVideosByCategory(category: string): Array<Video> {
  // For now, map all videos to 'highlights' category
  // This can be expanded when videos have category metadata
  if (category === 'vintage-film') {
    return MOCK_VIDEOS;
  }
  return [];
}

export function getVideoByCategory(category: VideoCategory) {
  if (!category) {
    return null;
  }
  const video = MOCK_VIDEOS.find((video) => video.category === category);
  return video;
}

// Helper function to get photos by category
export function getPhotosByCategory(category: string): Array<Photo> {
  if (category === 'all') {
    return MOCK_PHOTOS;
  }
  return MOCK_PHOTOS.filter((photo) => photo.gallery === category);
}
