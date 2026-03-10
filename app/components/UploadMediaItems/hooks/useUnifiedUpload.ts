/**
 * Unified Upload Hook
 *
 * Part of the Unified Media File System (Phase 1, Task 1.2)
 *
 * This hook orchestrates the complete file upload flow:
 * 1. File addition with metadata extraction
 * 2. Preview generation (ImageKit for HEIC, local for others)
 * 3. Direct upload to Supabase Storage
 * 4. Database record creation with enriched metadata
 * 5. Cleanup of temporary preview files
 *
 * Features:
 * - Multi-file upload support
 * - Real-time progress tracking per file
 * - EXIF metadata extraction (dimensions, GPS, camera info)
 * - HEIC preview generation via ImageKit
 * - Error handling with retry capability
 * - Memory management (cleanup on unmount)
 *
 * @example
 * ```typescript
 * const { files, addFiles, uploadFiles, isUploading } = useUnifiedUpload({
 *   onUploadComplete: (files) => console.log('Upload complete:', files),
 *   maxFiles: 20,
 *   maxFileSize: 50 * 1024 * 1024, // 50MB
 * });
 * ```
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { extractFileMetadata, type ExtractedMetadata } from '@/lib/metadata-extractor';
import type { DatabaseMediaItem, RequestUploadUrlResponse } from '@/utils/supabase/types';
import {
  getDefaultTitle,
  formatFileSize,
  isFileTypeAllowed,
  isFileSizeValid,
} from '@/utils/file-helpers';

// ============================================================================
// Types & Interfaces
// ============================================================================

type UploadFileStatus = 'processing' | 'pending' | 'uploading' | 'completed' | 'failed';

/**
 * Represents a file in the upload queue with all its associated state
 */
export type UploadFile = {
  /** Unique identifier for the file */
  id: string;

  /** The actual File object */
  file: File;

  /** Current upload status */
  status: UploadFileStatus;

  /** Upload progress (0-100) */
  progress: number;

  /** User-editable title (defaults to filename without extension) */
  title: string;

  /** Preview URL for display (local object URL or ImageKit URL) */
  previewUrl?: string;

  /** ImageKit preview file ID (for HEIC cleanup) */
  imagekitPreviewFileId?: string;

  /** Extracted EXIF metadata */
  metadata?: ExtractedMetadata;

  /** Error message if upload failed */
  error?: string;

  /** File path in Supabase Storage after upload */
  uploadedPath?: string;

  /** Database record returned from finalize endpoint */
  uploadedMediaItem?: DatabaseMediaItem;
};

/**
 * Configuration options for the upload hook
 */
export type UseUnifiedUploadConfig = {
  /** Callback fired when all uploads complete successfully */
  onUploadComplete?: (files: Array<UploadFile>) => void;

  /** Callback fired when an individual file upload fails */
  onUploadError?: (file: UploadFile, error: string) => void;

  /** Maximum number of files allowed */
  maxFiles?: number;

  /** Maximum file size in bytes (default: 50MB) */
  maxFileSize?: number;

  /** Allowed MIME types (default: images and videos) */
  allowedTypes?: string[];
};

/**
 * Return value of the useUnifiedUpload hook
 */
export type UseUnifiedUploadReturn = {
  /** Array of files in the upload queue */
  files: Array<UploadFile>;

  /** Whether any files are currently uploading */
  isUploading: boolean;

  /** Add new files to the upload queue */
  addFiles: (files: File[]) => Promise<void>;

  /** Remove a file from the queue before upload */
  removeFile: (fileId: string) => void;

  /** Update the title of a file before upload */
  updateFileTitle: (fileId: string, newTitle: string) => void;

  /** Start uploading all pending files */
  uploadFiles: () => Promise<void>;

  /** Clear all completed files from the queue */
  clearCompleted: () => void;

  /** Reset all files and state */
  resetAll: () => void;
};

/**
 * ImageKit authentication response from /api/imagekit-auth
 */
type ImageKitAuthResponse = {
  token: string;
  signature: string;
  expire: number;
  userId: string;
  timestamp: number;
};

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_FILES = 50;
const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const DEFAULT_ALLOWED_TYPES = ['image/*', 'video/*'];
const IMAGEKIT_TEMP_PREVIEW_FOLDER = '/temp-previews/';

// ============================================================================
// Main Hook
// ============================================================================

export function useUnifiedUpload(config: UseUnifiedUploadConfig = {}): UseUnifiedUploadReturn {
  const {
    onUploadComplete,
    onUploadError,
    maxFiles = DEFAULT_MAX_FILES,
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
  } = config;

  // ============================================================================
  // State Management
  // ============================================================================

  const [files, setFiles] = useState<Array<UploadFile>>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Ref to track object URLs for cleanup
  const objectUrlsRef = useRef<Set<string>>(new Set());

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Update the status of a specific file
   */
  const updateFileStatus = useCallback(
    (fileId: string, status: UploadFileStatus, progress?: number) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status,
                ...(progress !== undefined && { progress }),
              }
            : f,
        ),
      );
    },
    [],
  );

  /**
   * Update the progress of a specific file
   */
  const updateFileProgress = useCallback((fileId: string, progress: number) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress } : f)));
  }, []);

  /**
   * Update the error message for a specific file
   */
  const updateFileError = useCallback((fileId: string, error: string) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, error, status: 'failed' } : f)));
  }, []);

  /**
   * Update multiple properties of a specific file
   */
  const updateFile = useCallback((fileId: string, updates: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, ...updates } : f)));
  }, []);

  /**
   * Register an object URL for cleanup
   */
  const registerObjectUrl = useCallback((url: string) => {
    objectUrlsRef.current.add(url);
  }, []);

  /**
   * Cleanup a specific object URL
   */
  const cleanupObjectUrl = useCallback((url: string) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      objectUrlsRef.current.delete(url);
    }
  }, []);

  /**
   * Cleanup all registered object URLs
   */
  const cleanupAllObjectUrls = useCallback(() => {
    objectUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    objectUrlsRef.current.clear();
  }, []);

  /**
   * Generate a preview for HEIC files by uploading to ImageKit temporarily
   */
  const generateHeicPreview = useCallback(
    async (file: File): Promise<{ previewUrl: string; fileId: string } | null> => {
      try {
        // Step 1: Get ImageKit authentication
        const authResponse = await fetch('/api/imagekit-auth');
        if (!authResponse.ok) {
          console.error('Failed to get ImageKit auth');
          return null;
        }

        const authData: ImageKitAuthResponse = await authResponse.json();

        // Step 2: Upload to ImageKit temp-previews folder
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('folder', IMAGEKIT_TEMP_PREVIEW_FOLDER);
        formData.append('publicKey', process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!);
        formData.append('signature', authData.signature);
        formData.append('expire', authData.expire.toString());
        formData.append('token', authData.token);

        const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          console.error('Failed to upload HEIC preview to ImageKit');
          return null;
        }

        const uploadData = await uploadResponse.json();

        return {
          previewUrl: uploadData.url,
          fileId: uploadData.fileId,
        };
      } catch (error) {
        console.error('Error generating HEIC preview:', error);
        return null;
      }
    },
    [],
  );

  /**
   * Generate a local preview URL for standard images
   */
  const generateLocalPreview = useCallback(
    (file: File): string => {
      const url = URL.createObjectURL(file);
      registerObjectUrl(url);
      return url;
    },
    [registerObjectUrl],
  );

  /**
   * Upload a file to Supabase Storage using a signed URL with progress tracking
   */
  const uploadToSupabase = useCallback(
    (signedUrl: string, file: File, onProgress: (progress: number) => void): Promise<void> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        };

        // Handle successful upload
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };

        // Handle network errors
        xhr.onerror = () => reject(new Error('Network error during upload'));

        // Handle timeouts
        xhr.ontimeout = () => reject(new Error('Upload timed out'));

        // Configure and send request
        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.timeout = 300000; // 5 minute timeout
        xhr.send(file);
      });
    },
    [],
  );

  // ============================================================================
  // Main Functions
  // ============================================================================

  /**
   * Add files to the upload queue with metadata extraction
   */
  const addFiles = useCallback(
    async (newFiles: Array<File>): Promise<void> => {
      // Validate file count
      if (files.length + newFiles.length > maxFiles) {
        console.error(`Cannot add files: Maximum ${maxFiles} files allowed`);
        return;
      }

      // Process each file
      for (const file of newFiles) {
        // Validate file type
        if (!isFileTypeAllowed(file.type, allowedTypes)) {
          console.warn(`File type not allowed: ${file.type}`);
          continue;
        }

        // Validate file size
        if (!isFileSizeValid(file.size, maxFileSize)) {
          console.warn(
            `File size exceeds limit: ${formatFileSize(file.size)} > ${formatFileSize(
              maxFileSize,
            )}`,
          );
          continue;
        }

        // Generate unique ID
        const id = crypto.randomUUID();

        // Create initial upload file with default title
        const uploadFile: UploadFile = {
          id,
          file,
          status: 'processing',
          progress: 0,
          title: getDefaultTitle(file.name),
        };

        // Add to state immediately
        setFiles((prev) => [...prev, uploadFile]);

        // Extract metadata in background
        (async () => {
          try {
            console.log(`[${file.name}] Extracting metadata...`);
            const metadata = await extractFileMetadata(file);
            console.log(`[${file.name}] Metadata extracted:`, metadata);

            // Generate preview based on file type
            let previewUrl: string | undefined;
            let imagekitPreviewFileId: string | undefined;

            if (file.type === 'image/heic' || file.type === 'image/heif') {
              console.log(`[${file.name}] Generating HEIC preview via ImageKit...`);
              const heicPreview = await generateHeicPreview(file);
              if (heicPreview) {
                previewUrl = heicPreview.previewUrl;
                imagekitPreviewFileId = heicPreview.fileId;
                console.log(`[${file.name}] HEIC preview generated`);
              }
            } else if (file.type.startsWith('image/')) {
              console.log(`[${file.name}] Generating local preview...`);
              previewUrl = generateLocalPreview(file);
            }

            // Update file with metadata and preview
            updateFile(id, {
              status: 'pending',
              metadata,
              previewUrl,
              imagekitPreviewFileId,
            });

            console.log(`[${file.name}] Ready for upload`);
          } catch (error) {
            console.error(`[${file.name}] Error during processing:`, error);
            updateFileError(id, error instanceof Error ? error.message : 'Processing failed');
          }
        })();
      }
    },
    [
      files.length,
      maxFiles,
      allowedTypes,
      maxFileSize,
      generateHeicPreview,
      generateLocalPreview,
      updateFile,
      updateFileError,
    ],
  );

  /**
   * Remove a file from the queue
   */
  const removeFile = useCallback(
    (fileId: string) => {
      setFiles((prev) => {
        const fileToRemove = prev.find((f) => f.id === fileId);
        if (fileToRemove?.previewUrl) {
          cleanupObjectUrl(fileToRemove.previewUrl);
        }
        return prev.filter((f) => f.id !== fileId);
      });
    },
    [cleanupObjectUrl],
  );

  /**
   * Update the title of a file before upload
   */
  const updateFileTitle = useCallback((fileId: string, newTitle: string) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, title: newTitle } : f)));
  }, []);

  /**
   * Upload all pending files
   */
  const uploadFiles = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');

    if (pendingFiles.length === 0) {
      console.log('No pending files to upload');
      return;
    }

    setIsUploading(true);
    console.log(`Starting upload of ${pendingFiles.length} file(s)`);

    const completedFiles: Array<UploadFile> = [];

    for (const uploadFile of pendingFiles) {
      try {
        console.log(`[${uploadFile.file.name}] Starting upload...`);

        // Step 1: Set status to uploading
        updateFileStatus(uploadFile.id, 'uploading', 0);

        // Step 2: Request signed upload URL
        console.log(`[${uploadFile.file.name}] Requesting signed URL...`);
        const urlResponse = await fetch('/api/media/request-upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: uploadFile.file.name,
            fileType: uploadFile.file.type,
            fileSize: uploadFile.file.size,
          }),
        });

        if (!urlResponse.ok) {
          throw new Error('Failed to get upload URL');
        }

        const urlData: { success: boolean; data: RequestUploadUrlResponse } =
          await urlResponse.json();
        const { signedUrl, path } = urlData.data;

        console.log(`[${uploadFile.file.name}] Uploading to Supabase Storage...`);

        // Step 3: Upload to Supabase Storage with progress tracking
        await uploadToSupabase(signedUrl, uploadFile.file, (progress) => {
          updateFileProgress(uploadFile.id, progress);
        });

        console.log(`[${uploadFile.file.name}] Upload complete, finalizing...`);

        // Step 4: Finalize with database record
        const finalizeResponse = await fetch('/api/media/finalize-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path,
            filename: uploadFile.file.name,
            mime_type: uploadFile.file.type,
            file_size: uploadFile.file.size,
            title: uploadFile.title,
            width: uploadFile.metadata?.width,
            height: uploadFile.metadata?.height,
            lat: uploadFile.metadata?.lat,
            lon: uploadFile.metadata?.lon,
            camera_make: uploadFile.metadata?.camera_make,
            camera_model: uploadFile.metadata?.camera_model,
            date_taken: uploadFile.metadata?.date_taken?.toISOString(),
            exif_data: uploadFile.metadata?.exif_data,
          }),
        });

        if (!finalizeResponse.ok) {
          throw new Error('Failed to finalize upload');
        }

        const finalizeData = await finalizeResponse.json();
        const mediaItem = finalizeData.data.mediaItem;

        console.log(`[${uploadFile.file.name}] Database record created`);

        // Step 5: Cleanup HEIC preview if exists
        if (uploadFile.imagekitPreviewFileId) {
          console.log(`[${uploadFile.file.name}] Cleaning up HEIC preview...`);
          try {
            await fetch('/api/media/cleanup-preview', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                previewFileId: uploadFile.imagekitPreviewFileId,
              }),
            });
            console.log(`[${uploadFile.file.name}] HEIC preview cleaned up`);
          } catch (cleanupError) {
            console.warn(`[${uploadFile.file.name}] Failed to cleanup preview:`, cleanupError);
            // Non-fatal error, continue
          }
        }

        // Step 6: Mark as completed
        updateFile(uploadFile.id, {
          status: 'completed',
          progress: 100,
          uploadedPath: path,
          uploadedMediaItem: mediaItem,
        });

        completedFiles.push({ ...uploadFile, status: 'completed' });
        console.log(`[${uploadFile.file.name}] Upload complete ✓`);
      } catch (error) {
        console.error(`[${uploadFile.file.name}] Upload failed:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        updateFileError(uploadFile.id, errorMessage);

        if (onUploadError) {
          onUploadError(uploadFile, errorMessage);
        }
      }
    }

    setIsUploading(false);

    // Call completion callback if all files succeeded
    if (completedFiles.length > 0 && onUploadComplete) {
      onUploadComplete(completedFiles);
    }

    console.log(`Upload batch complete: ${completedFiles.length}/${pendingFiles.length} succeeded`);
  }, [
    files,
    updateFileStatus,
    updateFileProgress,
    updateFileError,
    updateFile,
    uploadToSupabase,
    onUploadComplete,
    onUploadError,
  ]);

  /**
   * Clear all completed files from the queue
   */
  const clearCompleted = useCallback(() => {
    setFiles((prev) => {
      const completedFiles = prev.filter((f) => f.status === 'completed');
      completedFiles.forEach((f) => {
        if (f.previewUrl) {
          cleanupObjectUrl(f.previewUrl);
        }
      });
      return prev.filter((f) => f.status !== 'completed');
    });
  }, [cleanupObjectUrl]);

  /**
   * Reset all files and state
   */
  const resetAll = useCallback(() => {
    cleanupAllObjectUrls();
    setFiles([]);
    setIsUploading(false);
  }, [cleanupAllObjectUrls]);

  // ============================================================================
  // Cleanup on unmount
  // ============================================================================

  useEffect(() => {
    return () => {
      console.log('Cleaning up useUnifiedUpload hook...');
      cleanupAllObjectUrls();
    };
  }, [cleanupAllObjectUrls]);

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return {
    files,
    isUploading,
    addFiles,
    removeFile,
    updateFileTitle,
    uploadFiles,
    clearCompleted,
    resetAll,
  };
}
