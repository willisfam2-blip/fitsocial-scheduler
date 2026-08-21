const API='https://graph.instagram.com';

async function ig(path, options={}) {
  const res=await fetch(`${API}${path}`,options);
  const data=await res.json();
  if(!res.ok || data.error) throw new Error(data.error?.message || 'Instagram API request failed');
  return data;
}

export async function POST(request){
  try{
    const token=process.env.INSTAGRAM_ACCESS_TOKEN;
    if(!token) return Response.json({error:'Instagram is not configured.'},{status:500});
    const {mediaUrl,mediaType,caption=''}=await request.json();
    if(!mediaUrl) return Response.json({error:'A media URL is required.'},{status:400});
    const me=await ig(`/me?fields=id,username&access_token=${encodeURIComponent(token)}`);
    const params=new URLSearchParams({access_token:token,caption});
    const isVideo=(mediaType||'').startsWith('video/');
    if(isVideo){params.set('media_type','REELS');params.set('video_url',mediaUrl)}
    else params.set('image_url',mediaUrl);
    const container=await ig(`/${me.id}/media`,{method:'POST',body:params});
    if(isVideo){
      for(let i=0;i<24;i++){
        await new Promise(r=>setTimeout(r,5000));
        const status=await ig(`/${container.id}?fields=status_code&access_token=${encodeURIComponent(token)}`);
        if(status.status_code==='FINISHED') break;
        if(status.status_code==='ERROR'||status.status_code==='EXPIRED') throw new Error('Instagram could not process this video.');
        if(i===23) throw new Error('Video is still processing. Try again shortly.');
      }
    }
    const pub=new URLSearchParams({access_token:token,creation_id:container.id});
    const published=await ig(`/${me.id}/media_publish`,{method:'POST',body:pub});
    return Response.json({ok:true,id:published.id,username:me.username});
  }catch(error){return Response.json({error:error.message||'Publishing failed'},{status:500})}
}
