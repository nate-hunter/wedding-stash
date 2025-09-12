// Utility functions for Google Photos URL manipulation
// These are client-side utilities and don't need 'use server'

// Helper function to get photo URL with proper sizing
export function getPhotoDisplayUrl(baseUrl: string, width?: number, height?: number): string {
  if (!width && !height) {
    // Default size for thumbnails
    return `${baseUrl}=w400-h400`;
  }

  if (width && height) {
    return `${baseUrl}=w${width}-h${height}`;
  }

  if (width) {
    return `${baseUrl}=w${width}`;
  }

  if (height) {
    return `${baseUrl}=h${height}`;
  }

  return baseUrl;
}

// Helper function to get full-size photo URL
export function getPhotoFullSizeUrl(baseUrl: string): string {
  return `${baseUrl}=d`; // =d parameter gives the original download quality
}

// Helper function to get photo URL for modal view (larger size)
export function getPhotoModalUrl(
  baseUrl: string,
  maxWidth: number = 1200,
  maxHeight: number = 800,
): string {
  return `${baseUrl}=w${maxWidth}-h${maxHeight}`;
}
