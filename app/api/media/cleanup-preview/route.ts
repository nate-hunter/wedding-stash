import { NextRequest, NextResponse } from 'next/server';
import { imagekit } from '@/lib/imagekit';

export async function DELETE(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { previewFileId } = body;

    if (!previewFileId) {
      return NextResponse.json({ error: 'Preview file ID is required' }, { status: 400 });
    }

    // Delete the preview file from ImageKit
    await imagekit.deleteFile(previewFileId);

    return NextResponse.json({
      success: true,
      message: 'Preview file cleaned up successfully',
      previewFileId,
    });
  } catch (error) {
    console.error('Error cleaning up preview file:', error);

    return NextResponse.json(
      {
        error: 'Failed to cleanup preview file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
