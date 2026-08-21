export async function GET() {
  const blobEnvNames = Object.keys(process.env)
    .filter((key) => /blob/i.test(key))
    .sort();

  return Response.json({
    hasBlob2ReadWriteToken: Boolean(process.env.Blob2_READ_WRITE_TOKEN),
    hasBlob2ReadWriteTokenUpper: Boolean(process.env.BLOB2_READ_WRITE_TOKEN),
    hasDefaultReadWriteToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    hasBlob2StoreId: Boolean(process.env.Blob2_STORE_ID),
    hasDefaultStoreId: Boolean(process.env.BLOB_STORE_ID),
    blobEnvironmentVariableNames: blobEnvNames,
    environment: process.env.VERCEL_ENV || 'unknown'
  });
}
