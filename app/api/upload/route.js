import { handleUpload } from '@vercel/blob/client';

export async function POST(request) {
  try {
    const body = await request.json();
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'video/mp4',
          'video/quicktime'
        ],
        maximumSizeInBytes: 500 * 1024 * 1024,
        addRandomSuffix: true
      }),
      onUploadCompleted: async () => {}
    });
    return Response.json(jsonResponse);
  } catch (error) {
    console.error('Blob upload token error:', error);
    return Response.json({ error: error.message || 'Upload failed' }, { status: 400 });
  }
}
