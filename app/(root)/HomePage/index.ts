/**
 * HomePage Component Exports
 *
 * All components and utilities for the Wedding Stash homepage.
 * Import from this file for cleaner code:
 *
 * @example
 * import HomePage, { VideoSection, GallerySection } from '@/app/(root)/HomePage-new';
 */

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export { default } from './HomePage';
export { default as HomePage } from './HomePage';

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

/**
 * VideoSection - Complete video section with tabs and player
 *
 * Features:
 * - Tab navigation (Highlights, Ceremony, Reception, Speeches)
 * - ReactPlayer integration
 * - 16:9 aspect ratio
 * - Video attribution
 * - Empty states
 *
 * @example
 * <VideoSection />
 */
export { VideoSection } from './components/VideoSection';

/**
 * GallerySection - Complete photo gallery with tabs and grid
 *
 * Features:
 * - Tab navigation (All Photos, Ceremony, Reception, Portraits, Details)
 * - Responsive grid (2-4+ columns)
 * - Category filtering
 * - Next.js Image optimization
 * - Click handlers for lightbox
 *
 * @example
 * <GallerySection />
 */
export { GallerySection } from './components/GallerySection';

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

/**
 * TabNavigation - Generic tab navigation component
 *
 * @template T - String literal type for category keys
 *
 * @example
 * <TabNavigation
 *   categories={[{ key: 'all', label: 'All' }]}
 *   activeCategory="all"
 *   onCategoryChange={(cat) => console.log(cat)}
 * />
 */
export { TabNavigation } from './components/TabNavigation';

/**
 * VideoPlayer - Video player wrapper with empty states
 *
 * @example
 * <VideoPlayer video={videoData} loading={false} />
 */
export { VideoPlayer } from './components/VideoPlayer';

/**
 * PhotoGallery - Responsive photo grid component
 *
 * @example
 * <PhotoGallery
 *   photos={photoArray}
 *   onPhotoClick={(photo) => openLightbox(photo)}
 * />
 */
export { PhotoGallery } from './components/PhotoGallery';

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Core data types
  Video,
  Photo,

  // Category types
  GalleryCategory,
  VideoCategory,
  GalleryCategoryOption,
  VideoCategoryOption,

  // Component props
  VideoSectionProps,
  GallerySectionProps,
  VideoPlayerProps,
  PhotoGalleryProps,
  TabNavigationProps,
} from './types';

// ============================================================================
// DATA & UTILITIES
// ============================================================================

/**
 * Mock data arrays for development/testing
 */
export {
  MOCK_VIDEOS, // Array<Video>
  MOCK_PHOTOS, // Array<Photo>
  VIDEO_CATEGORIES, // VideoCategoryOption[]
  GALLERY_CATEGORIES, // GalleryCategoryOption[]
} from './data/mock-data';

/**
 * Utility functions for filtering data by category
 */
export {
  getVideosByCategory, // (category: string) => Video[]
  getPhotosByCategory, // (category: string) => Photo[]
} from './data/mock-data';
