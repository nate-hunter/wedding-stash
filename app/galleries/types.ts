import { GalleryWithDetails, ApiSuccessResponse } from '@/utils/supabase/types';

// Gallery-specific types
export type GalleryViewMode = 'grid' | 'list';

// API Response types
export interface GalleriesResponseData {
  galleries: GalleryWithDetails[];
}

export type GalleriesApiResponse = ApiSuccessResponse<GalleriesResponseData>;

export interface CreateGalleryRequest {
  title: string;
  description?: string;
}

export interface CreateGalleryResponseData {
  gallery: GalleryWithDetails;
}

export type CreateGalleryApiResponse = ApiSuccessResponse<CreateGalleryResponseData>;

// Component Props interfaces
export interface GalleryListProps {
  onGalleryCreated?: () => void;
}

export interface CreateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (gallery: GalleryWithDetails) => void;
}

export interface GalleryCardProps {
  gallery: GalleryWithDetails;
  coverImageUrl: string | null;
}

// Hook return types
export interface UseGalleriesResult {
  galleries: GalleryWithDetails[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createGallery: (data: CreateGalleryRequest) => Promise<GalleryWithDetails>;
}

export interface UseCreateGalleryResult {
  createGallery: (data: CreateGalleryRequest) => Promise<GalleryWithDetails>;
  loading: boolean;
  error: string | null;
}

// Form data types
export interface GalleryFormData {
  title: string;
  description: string;
}

// Gallery operations
export interface GalleryAction {
  type: 'create' | 'edit' | 'delete' | 'view';
  gallery?: GalleryWithDetails;
}

// State management
export interface GalleriesState {
  galleries: GalleryWithDetails[];
  loading: boolean;
  error: string | null;
  viewMode: GalleryViewMode;
}
