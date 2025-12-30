/**
 * Media Metadata Extractor
 *
 * Extracts EXIF metadata from image and video files client-side.
 * Part of the Unified Media File System architecture.
 *
 * Features:
 * - EXIF data extraction (dimensions, GPS, camera info, date taken)
 * - Video dimension extraction via HTML5 video element
 * - Graceful fallback when metadata unavailable
 * - Privacy-focused: all extraction happens client-side
 *
 * @module lib/metadata-extractor
 */

import { parse } from 'exifr';

/**
 * Extracted metadata from image or video files
 */
export interface ExtractedMetadata {
  /** Image/video width in pixels */
  width?: number;
  /** Image/video height in pixels */
  height?: number;
  /** GPS latitude coordinate */
  lat?: number;
  /** GPS longitude coordinate */
  lon?: number;
  /** Camera manufacturer (e.g., "Apple", "Canon") */
  camera_make?: string;
  /** Camera model (e.g., "iPhone 14 Pro", "EOS 5D Mark IV") */
  camera_model?: string;
  /** Original capture date and time */
  date_taken?: Date;
  /** Complete EXIF data as JSON object */
  exif_data?: Record<string, unknown>;
}

/**
 * Configuration for EXIF parsing
 * Optimized for wedding photography metadata
 */
const EXIF_PARSE_OPTIONS = {
  // GPS coordinates for location tracking
  gps: true,
  // Core EXIF data (camera, exposure settings, etc.)
  exif: true,
  // IFD0: Basic image information (always enabled by default, cannot be disabled)
  // ifd0 is omitted as it only accepts FormatOptions object, not boolean
  // IFD1: Thumbnail information
  ifd1: true,
  // IPTC: Copyright and caption data
  iptc: true,
  // XMP: Extended metadata
  xmp: false, // Disable for performance unless needed
  // ICC: Color profile (not needed for metadata)
  icc: false,
};

/**
 * Extracts comprehensive metadata from an image file
 *
 * Uses the `exifr` library to parse EXIF, IPTC, and other metadata formats.
 * Handles various image formats including JPEG, PNG, HEIC, and WebP.
 *
 * @param file - The image file to extract metadata from
 * @returns Promise resolving to extracted metadata or empty object on failure
 *
 * @example
 * ```typescript
 * const file = event.target.files[0];
 * const metadata = await extractMetadata(file);
 *
 * if (metadata.lat && metadata.lon) {
 *   console.log(`Photo taken at: ${metadata.lat}, ${metadata.lon}`);
 * }
 *
 * if (metadata.camera_make) {
 *   console.log(`Camera: ${metadata.camera_make} ${metadata.camera_model}`);
 * }
 * ```
 */
export async function extractMetadata(file: File): Promise<ExtractedMetadata> {
  try {
    // Parse EXIF data from file
    const exifData = await parse(file, EXIF_PARSE_OPTIONS);

    // If no EXIF data found, return empty object
    if (!exifData) {
      console.info(`No EXIF data found in file: ${file.name}`);
      return {};
    }

    // Extract and normalize metadata
    const metadata: ExtractedMetadata = {
      // Dimensions: Try multiple EXIF fields as different cameras use different tags
      width: exifData.ImageWidth || exifData.PixelXDimension || exifData.ExifImageWidth,
      height: exifData.ImageHeight || exifData.PixelYDimension || exifData.ExifImageHeight,

      // GPS coordinates: exifr automatically converts to decimal degrees
      lat: exifData.latitude,
      lon: exifData.longitude,

      // Camera information
      camera_make: exifData.Make?.trim(),
      camera_model: exifData.Model?.trim(),

      // Date taken: Try multiple date fields
      date_taken:
        exifData.DateTimeOriginal || exifData.CreateDate || exifData.ModifyDate || undefined,

      // Store complete EXIF data for future use
      // Useful for advanced features like exposure settings, focal length, etc.
      exif_data: exifData as Record<string, unknown>,
    };

    // Log successful extraction (helpful for debugging)
    console.info(`Extracted metadata from ${file.name}:`, {
      dimensions:
        metadata.width && metadata.height ? `${metadata.width}x${metadata.height}` : 'N/A',
      gps: metadata.lat && metadata.lon ? `${metadata.lat}, ${metadata.lon}` : 'N/A',
      camera: metadata.camera_make || 'N/A',
      date: metadata.date_taken?.toISOString() || 'N/A',
    });

    return metadata;
  } catch (error) {
    // Graceful degradation: log error but don't throw
    // Upload should continue even if metadata extraction fails
    console.warn(`Failed to extract metadata from ${file.name}:`, error);

    // Return empty metadata object
    return {};
  }
}

/**
 * Extracts dimensions from a video file using HTML5 video element
 *
 * Creates a temporary hidden video element, appends it to the DOM,
 * loads the file to extract dimensions, then removes the element and
 * cleans up resources. Appending to the DOM is required for reliable
 * metadata loading across all browsers, especially Safari and Chrome.
 *
 * @param file - The video file to extract dimensions from
 * @returns Promise resolving to dimensions or null on failure (with 10s timeout)
 *
 * @example
 * ```typescript
 * const videoFile = event.target.files[0];
 * const dimensions = await extractVideoDimensions(videoFile);
 *
 * if (dimensions) {
 *   console.log(`Video resolution: ${dimensions.width}x${dimensions.height}`);
 * }
 * ```
 */
export async function extractVideoDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    try {
      // Create video element for dimension extraction
      const video = document.createElement('video');

      // Preload metadata only (not the entire video)
      video.preload = 'metadata';

      // Mute to avoid audio playback
      video.muted = true;

      // Hide the video element (required for reliable metadata loading)
      video.style.position = 'absolute';
      video.style.top = '-9999px';
      video.style.left = '-9999px';
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.opacity = '0';
      video.style.pointerEvents = 'none';

      // Cleanup function to remove video element and revoke object URL
      const cleanup = () => {
        URL.revokeObjectURL(video.src);
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
      };

      // Handle successful metadata load
      video.onloadedmetadata = () => {
        // Extract dimensions from video element
        const dimensions = {
          width: video.videoWidth,
          height: video.videoHeight,
        };

        // Clean up resources
        cleanup();

        // Validate dimensions
        if (dimensions.width > 0 && dimensions.height > 0) {
          console.info(`Extracted video dimensions from ${file.name}:`, dimensions);
          resolve(dimensions);
        } else {
          console.warn(`Invalid video dimensions for ${file.name}`);
          resolve(null);
        }
      };

      // Handle errors during video loading
      video.onerror = (error) => {
        console.warn(`Failed to load video metadata for ${file.name}:`, error);

        // Clean up resources
        cleanup();

        // Return null on error
        resolve(null);
      };

      // Add timeout to prevent hanging indefinitely (10 second timeout)
      const timeoutId = setTimeout(() => {
        console.warn(`Video metadata loading timed out for ${file.name}`);
        cleanup();
        resolve(null);
      }, 10000);

      // Clear timeout if metadata loads successfully
      const originalOnLoadedMetadata = video.onloadedmetadata;
      video.onloadedmetadata = (event) => {
        clearTimeout(timeoutId);
        originalOnLoadedMetadata?.call(video, event);
      };

      // Append video to DOM (required for reliable metadata loading in Safari/Chrome)
      document.body.appendChild(video);

      // Create object URL and trigger metadata load
      video.src = URL.createObjectURL(file);
    } catch (error) {
      // Handle any synchronous errors
      console.warn(`Failed to extract video dimensions from ${file.name}:`, error);
      resolve(null);
    }
  });
}

/**
 * Extracts metadata from any supported file (image or video)
 *
 * Automatically detects file type and uses appropriate extraction method.
 * For images: uses EXIF extraction. For videos: uses dimension extraction.
 *
 * @param file - The file to extract metadata from
 * @returns Promise resolving to extracted metadata
 *
 * @example
 * ```typescript
 * const file = event.target.files[0];
 * const metadata = await extractFileMetadata(file);
 *
 * console.log('File metadata:', metadata);
 * ```
 */
export async function extractFileMetadata(file: File): Promise<ExtractedMetadata> {
  // Check if file is a video
  if (file.type.startsWith('video/')) {
    // Extract video dimensions
    const dimensions = await extractVideoDimensions(file);

    // Return dimensions if available
    if (dimensions) {
      return {
        width: dimensions.width,
        height: dimensions.height,
      };
    }

    // Return empty object if extraction failed
    return {};
  }

  // For images, extract full EXIF metadata
  if (file.type.startsWith('image/')) {
    return await extractMetadata(file);
  }

  // Unsupported file type
  console.warn(`Unsupported file type for metadata extraction: ${file.type}`);
  return {};
}

/**
 * Batch extracts metadata from multiple files
 *
 * Processes files in parallel for better performance.
 * Useful when handling multiple file uploads simultaneously.
 *
 * @param files - Array of files to extract metadata from
 * @returns Promise resolving to array of extracted metadata
 *
 * @example
 * ```typescript
 * const files = Array.from(event.target.files);
 * const metadataArray = await extractMetadataBatch(files);
 *
 * files.forEach((file, index) => {
 *   console.log(`${file.name}:`, metadataArray[index]);
 * });
 * ```
 */
export async function extractMetadataBatch(files: File[]): Promise<ExtractedMetadata[]> {
  try {
    // Process all files in parallel
    const results = await Promise.all(files.map((file) => extractFileMetadata(file)));

    return results;
  } catch (error) {
    console.error('Batch metadata extraction failed:', error);

    // Return empty metadata for all files on batch error
    return files.map(() => ({}));
  }
}

/**
 * Type guard to check if metadata contains GPS coordinates
 *
 * @param metadata - Metadata object to check
 * @returns True if metadata contains valid GPS coordinates
 *
 * @example
 * ```typescript
 * const metadata = await extractMetadata(file);
 *
 * if (hasGPSData(metadata)) {
 *   // Safe to use metadata.lat and metadata.lon
 *   console.log(`Location: ${metadata.lat}, ${metadata.lon}`);
 * }
 * ```
 */
export function hasGPSData(
  metadata: ExtractedMetadata,
): metadata is Required<Pick<ExtractedMetadata, 'lat' | 'lon'>> & ExtractedMetadata {
  return (
    typeof metadata.lat === 'number' &&
    typeof metadata.lon === 'number' &&
    metadata.lat >= -90 &&
    metadata.lat <= 90 &&
    metadata.lon >= -180 &&
    metadata.lon <= 180
  );
}

/**
 * Type guard to check if metadata contains dimensions
 *
 * @param metadata - Metadata object to check
 * @returns True if metadata contains valid dimensions
 *
 * @example
 * ```typescript
 * const metadata = await extractMetadata(file);
 *
 * if (hasDimensions(metadata)) {
 *   // Safe to use metadata.width and metadata.height
 *   const aspectRatio = metadata.width / metadata.height;
 *   console.log(`Aspect ratio: ${aspectRatio}`);
 * }
 * ```
 */
export function hasDimensions(
  metadata: ExtractedMetadata,
): metadata is Required<Pick<ExtractedMetadata, 'width' | 'height'>> & ExtractedMetadata {
  return (
    typeof metadata.width === 'number' &&
    typeof metadata.height === 'number' &&
    metadata.width > 0 &&
    metadata.height > 0
  );
}

/**
 * Type guard to check if metadata contains camera information
 *
 * @param metadata - Metadata object to check
 * @returns True if metadata contains camera make or model
 *
 * @example
 * ```typescript
 * const metadata = await extractMetadata(file);
 *
 * if (hasCameraInfo(metadata)) {
 *   console.log(`Camera: ${metadata.camera_make} ${metadata.camera_model}`);
 * }
 * ```
 */
export function hasCameraInfo(metadata: ExtractedMetadata): boolean {
  return Boolean(metadata.camera_make || metadata.camera_model);
}
