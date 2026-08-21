import { list, put } from '@vercel/blob';

const API='https://graph.instagram.com';
const PREFIX='fitsocial-scheduled/';

async function ig(path,options={}){
  const res=await fetch(`${API}${path}`,options);const data=await res.json();
  if(!res.ok||data.error){const e=data.error||{};throw new Error([e.message,e.error_user_msg,e.code&&`code ${e.code}`,e.error_subcode&&`subcode ${e.error_subcode}`].filter(Boolean).join(' — ')||'Instagram API request failed');}
  return data;
}
async function waitReady(id,token){for(let i=0;i<30;i++){const s=await ig(`/${id}?fields=status_code,status&access_token=${encodeURIComponent(token)}`);if(s.status_code==='FINISHED')return;if(s.status_code==='ERROR'||s.status_code==='EXPIRED')throw new Error(s.status||`Instagram processing ${s.status_code}`);await new Promise(r=>setTimeout(r,3000));}throw new Error('Instagram is still processing the media.');}
async function publish(job,token){const me=await ig(`/me?fields=id,username&access_token=${encodeURIComponent(token)}`);const p=new URLSearchParams({access_token:token,caption:job.caption||''});const video=(job.mediaType||'').startsWith('video/');if(video){p.set('media_type','REELS');p.set('video_url',job.mediaUrl)}else p.set('image_url',job.mediaUrl);const c=await ig(`/${me.id}/media`,{method:'POST',body:p});await waitReady(c.id,token);const q=new URLSearchParams({access_token:token,creation_id:c.id});const done=await ig(`/${me.id}/media_publish`,{method:'POST',body:q});return {id:done.id,username:me.username};}
async function save(job){await put(`${PREFIX}${job.id}.json`,JSON.stringify(job),{access:'public',contentType:'application/json',cacheControlMaxAge:60,addRandomSuffix:false});}

export async function GET(request){
  const auth=request.headers.get('authorization');
  if(process.env.CRON_SECRET&&auth!==`Bearer ${process.env.CRON_SECRET}`) return new Response('Unauthorized',{status:401});
  const token=process.env.INSTAGRAM_ACCESS_TOKEN;if(!token)return Response.json({error:'Instagram is not configured.'},{status:500});
  const {blobs}=await list({prefix:PREFIX,limit:500});const due=[];
  for(const blob of blobs){try{const r=await fetch(blob.url,{cache:'no-store'});const j=await r.json();if(j.status==='scheduled'&&new Date(j.scheduledAt)<=new Date())due.push(j)}catch{}}
  const results=[];
  for(const job of due.slice(0,5)){
    job.attempts=(job.attempts||0)+1;job.lastAttemptAt=new Date().toISOString();
    try{const out=await publish(job,token);job.status='published';job.publishedAt=new Date().toISOString();job.instagramMediaId=out.id;job.instagramUsername=out.username;delete job.error;results.push({id:job.id,status:'published'});}
    catch(error){job.error=error.message||'Publishing failed';job.status=job.attempts>=3?'failed':'scheduled';results.push({id:job.id,status:job.status,error:job.error});}
    await save(job);
  }
  return Response.json({ok:true,processed:results.length,results});
}
