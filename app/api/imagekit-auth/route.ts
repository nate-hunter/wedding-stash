import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { imagekit, validateImageKitConfig } from '@/lib/imagekit';

/**
 * ImageKit Authentication Endpoint
 *
 * Provides secure authentication parameters for ImageKit uploads
 * Following existing Supabase authentication patterns from /api/media/upload
 */
export async function GET() {
  try {
    // Validate user authentication using existing Supabase patterns
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate ImageKit configuration
    validateImageKitConfig();

    // Generate authentication parameters using ImageKit SDK
    const authenticationParameters = imagekit.getAuthenticationParameters();

    // Return authentication parameters for client-side upload
    return NextResponse.json({
      ...authenticationParameters,
      // Add user context for security logging
      userId: user.id,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('ImageKit authentication error:', error);

    // Handle configuration errors
    if (
      error instanceof Error &&
      error.message.includes('Missing ImageKit environment variables')
    ) {
      return NextResponse.json({ error: 'ImageKit configuration error' }, { status: 500 });
    }

    // Generic error response
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

/**
 * OPTIONS handler for CORS support
 * Required for client-side ImageKit uploads
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
