import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  GalleryInsert,
  GetUserGalleriesWithDetailsResult,
  CreateGalleryFormData,
} from '@/utils/supabase/types';
import {
  createSuccessResponse,
  createErrorResponse,
  executeQuery,
  parseRequestJSON,
} from '@/utils/supabase/helpers';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await parseRequestJSON<CreateGalleryFormData>(request);

  if (!body) {
    return createErrorResponse('Invalid JSON in request body', 400);
  }

  const { title, description } = body;

  if (!title?.trim()) {
    return createErrorResponse('Title is required.', 400);
  }

  const galleryData: GalleryInsert = {
    creator_id: user.id,
    title: title.trim(),
    description: description?.trim() || null,
  };

  const { data: newGallery, error } = await executeQuery(
    supabase.from('galleries').insert(galleryData).select().single(),
  );

  if (error) {
    console.error('Error creating gallery:', error);
    return error;
  }

  return createSuccessResponse({ gallery: newGallery }, 'Gallery created successfully.');
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { data: galleries, error } = await executeQuery(
    supabase.rpc('get_user_galleries_with_details', {
      p_user_id: user.id,
    }),
  );

  if (error) {
    console.error('Error fetching galleries:', error);
    return error;
  }

  return createSuccessResponse(
    { galleries: galleries as GetUserGalleriesWithDetailsResult[] },
    'Galleries fetched successfully.',
  );
}
