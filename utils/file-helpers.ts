/**
 * File Utility Helper Functions
 *
 * Provides common utilities for file operations used across the application
 */

/**
 * Extracts the filename without the file extension
 *
 * This is used to generate a user-friendly default title for uploaded media items.
 * The title can then be edited by the user before or after upload.
 *
 * @param filename - The full filename including extension (e.g., "wedding-photo.jpg")
 * @returns The filename without extension (e.g., "wedding-photo")
 *
 * @example
 * ```typescript
 * getDefaultTitle("my-photo.jpg")     // Returns: "my-photo"
 * getDefaultTitle("vacation.HEIC")    // Returns: "vacation"
 * getDefaultTitle("no-extension")     // Returns: "no-extension"
 * getDefaultTitle(".hidden")          // Returns: ".hidden" (preserves dot files)
 * getDefaultTitle("my.file.name.png") // Returns: "my.file.name"
 * ```
 */
export function getDefaultTitle(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');

  // If no dot found, or dot is at the start (hidden file), return full filename
  if (lastDotIndex <= 0) {
    return filename;
  }

  return filename.substring(0, lastDotIndex);
}

/**
 * Formats file size in bytes to a human-readable string
 *
 * @param bytes - The file size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string (e.g., "1.5 MB")
 *
 * @example
 * ```typescript
 * formatFileSize(1024)           // Returns: "1.00 KB"
 * formatFileSize(1536000)        // Returns: "1.46 MB"
 * formatFileSize(1536000, 1)     // Returns: "1.5 MB"
 * formatFileSize(5000000000)     // Returns: "4.66 GB"
 * ```
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Validates if a file type is allowed based on MIME type
 *
 * @param mimeType - The MIME type of the file
 * @param allowedTypes - Array of allowed MIME type patterns
 * @returns True if file type is allowed
 *
 * @example
 * ```typescript
 * isFileTypeAllowed("image/jpeg", ["image/*"])     // Returns: true
 * isFileTypeAllowed("video/mp4", ["image/*"])      // Returns: false
 * isFileTypeAllowed("image/heic", ["image/*", "video/*"]) // Returns: true
 * ```
 */
export function isFileTypeAllowed(mimeType: string, allowedTypes: Array<string>): boolean {
  return allowedTypes.some((type) => {
    if (type.endsWith('/*')) {
      // Pattern matching (e.g., "image/*")
      const baseType = type.slice(0, -2);
      return mimeType.startsWith(baseType);
    }
    // Exact match
    return mimeType === type;
  });
}

/**
 * Validates if a file size is within the maximum allowed size
 *
 * @param fileSize - The file size in bytes
 * @param maxSize - The maximum allowed size in bytes
 * @returns True if file size is within limit
 *
 * @example
 * ```typescript
 * const MAX_SIZE = 50 * 1024 * 1024; // 50MB
 * isFileSizeValid(1000000, MAX_SIZE)      // Returns: true
 * isFileSizeValid(60000000, MAX_SIZE)     // Returns: false
 * ```
 */
export function isFileSizeValid(fileSize: number, maxSize: number): boolean {
  return fileSize > 0 && fileSize <= maxSize;
}
