import { NextRequest, NextResponse } from 'next/server';
import { getPhotoUrl } from '@/app/gallery/actions';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('fileName');

  if (!fileName) {
    return NextResponse.json({ error: 'fileName parameter is required' }, { status: 400 });
  }

  try {
    const url = await getPhotoUrl(fileName);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error getting photo URL:', error);
    return NextResponse.json({ error: 'Failed to get photo URL' }, { status: 500 });
  }
}
