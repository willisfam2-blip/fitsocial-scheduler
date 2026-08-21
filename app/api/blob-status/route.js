export async function GET() {
  return Response.json({
    hasBlob2ReadWriteToken: Boolean(process.env.Blob2_READ_WRITE_TOKEN),
    hasDefaultReadWriteToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    hasBlob2StoreId: Boolean(process.env.Blob2_STORE_ID),
    hasDefaultStoreId: Boolean(process.env.BLOB_STORE_ID),
    environment: process.env.VERCEL_ENV || 'unknown'
  });
}
