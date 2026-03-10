import { ImageKitProvider, Image, Video, buildSrc, upload } from '@imagekit/next';

import ImageKit from 'imagekit';

// Server-side ImageKit instance (for authentication and server operations)
export const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

// Client-side configuration for components
export const imagekitConfig = {
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
  authenticationEndpoint: '/api/imagekit-auth',
};

// Validation helper
export const validateImageKitConfig = () => {
  const required = [
    'NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY',
    'IMAGEKIT_PRIVATE_KEY',
    'NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT',
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing ImageKit environment variables: ${missing.join(', ')}`);
  }
};

// Re-export ImageKit components for easy importing
export { ImageKitProvider, Image, Video, buildSrc, upload };
