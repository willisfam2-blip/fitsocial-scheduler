import { list, put } from '@vercel/blob';

const PREFIX='fitsocial-scheduled/';

async function readJobs(){
  const {blobs}=await list({prefix:PREFIX,limit:500});
  const jobs=[];
  for(const blob of blobs){
    try{
      const res=await fetch(blob.url,{cache:'no-store'});
      if(res.ok) jobs.push(await res.json());
    }catch{}
  }
  return jobs.sort((a,b)=>new Date(a.scheduledAt)-new Date(b.scheduledAt));
}

export async function GET(){
  try{return Response.json({jobs:await readJobs()});}
  catch(error){return Response.json({error:error.message||'Could not load scheduled posts'},{status:500});}
}

export async function POST(request){
  try{
    const {mediaUrl,mediaType,caption='',scheduledAt,name='media'}=await request.json();
    if(!mediaUrl||!scheduledAt) return Response.json({error:'Media and scheduled time are required.'},{status:400});
    const when=new Date(scheduledAt);
    if(Number.isNaN(when.getTime())) return Response.json({error:'Invalid scheduled time.'},{status:400});
    if(when.getTime()<=Date.now()+30000) return Response.json({error:'Choose a time at least 1 minute in the future.'},{status:400});
    const id=`${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
    const job={id,name,mediaUrl,mediaType,caption,scheduledAt:when.toISOString(),timezone:'America/Edmonton',status:'scheduled',createdAt:new Date().toISOString(),attempts:0};
    await put(`${PREFIX}${id}.json`,JSON.stringify(job),{access:'public',contentType:'application/json',cacheControlMaxAge:60});
    return Response.json({ok:true,job});
  }catch(error){return Response.json({error:error.message||'Could not schedule post'},{status:500});}
}
