import { list } from '@vercel/blob';

const STORE_ID=process.env.Blob2_STORE_ID;
const mediaRe=/\.(jpe?g|png|webp|mp4|mov)$/i;

export async function GET(){
  try{
    if(!STORE_ID) return Response.json({error:'Public Blob2 store is not configured.'},{status:500});
    const {blobs}=await list({limit:500,storeId:STORE_ID});
    const items=blobs
      .filter(b=>mediaRe.test(b.pathname||''))
      .map(b=>({
        url:b.url,
        pathname:b.pathname,
        name:(b.pathname||'media').split('/').pop(),
        uploadedAt:b.uploadedAt||null,
        size:b.size||null,
        type:/\.(mp4|mov)$/i.test(b.pathname||'')?'video/mp4':'image/jpeg'
      }))
      .sort((a,b)=>new Date(b.uploadedAt||0)-new Date(a.uploadedAt||0));
    return Response.json({items});
  }catch(error){return Response.json({error:error.message||'Could not load media library'},{status:500});}
}
