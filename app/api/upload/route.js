import { handleUpload } from '@vercel/blob/client';

export async function POST(request) {
  try {
    const body = await request.json();
    const token = process.env.Blob2_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return Response.json(
        { error: 'Public Blob write token is not available to this deployment.' },
        { status: 500 }
      );
    }
    const jsonResponse = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'video/mp4',
          'video/quicktime'
        ],
        maximumSizeInBytes: 500 * 1024 * 1024
      }),
      onUploadCompleted: async () => {}
    });
    return Response.json(jsonResponse);
  } catch (error) {
    console.error('Blob upload token error:', error);
    return Response.json({ error: error.message || 'Upload failed' }, { status: 400 });
  }
}
