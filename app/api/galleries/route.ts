import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { title, description } = await request.json();

  if (!title) {
    return NextResponse.json({ success: false, message: 'Title is required.' }, { status: 400 });
  }

  const { data: newGallery, error } = await supabase
    .from('galleries')
    .insert({
      creator_id: user.id,
      title,
      description,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating gallery:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create gallery.', error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Gallery created successfully.',
    gallery: newGallery,
  });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { data: galleries, error } = await supabase.rpc('get_user_galleries_with_details', {
    p_user_id: user.id,
  });

  if (error) {
    console.error('Error fetching galleries:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch galleries.', error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, galleries });
}
