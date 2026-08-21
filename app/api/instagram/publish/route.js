const API='https://graph.instagram.com';

async function ig(path, options={}) {
  const res=await fetch(`${API}${path}`,options);
  const data=await res.json();
  if(!res.ok || data.error){
    const err=data.error||{};
    const details=[err.message,err.error_user_msg,err.code&&`code ${err.code}`,err.error_subcode&&`subcode ${err.error_subcode}`].filter(Boolean).join(' — ');
    throw new Error(details || 'Instagram API request failed');
  }
  return data;
}

async function waitUntilReady(containerId, token){
  for(let i=0;i<30;i++){
    const status=await ig(`/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(token)}`);
    if(status.status_code==='FINISHED') return status;
    if(status.status_code==='ERROR'||status.status_code==='EXPIRED'){
      throw new Error(status.status || `Instagram media processing ended with ${status.status_code}.`);
    }
    await new Promise(r=>setTimeout(r,3000));
  }
  throw new Error('Instagram is still processing the media. Please try again in a moment.');
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
    if(isVideo){
      params.set('media_type','REELS');
      params.set('video_url',mediaUrl);
    }else{
      params.set('image_url',mediaUrl);
    }

    const container=await ig(`/${me.id}/media`,{method:'POST',body:params});
    if(!container.id) throw new Error('Instagram did not return a media container ID.');

    // Instagram processes both images and videos asynchronously. Publishing too
    // quickly can return error 9007 / subcode 2207027 (Media ID is not available).
    await waitUntilReady(container.id, token);

    const pub=new URLSearchParams({access_token:token,creation_id:container.id});
    let published;
    for(let attempt=0;attempt<3;attempt++){
      try{
        published=await ig(`/${me.id}/media_publish`,{method:'POST',body:pub});
        break;
      }catch(error){
        const retryable=/Media ID is not available|not ready|2207027|9007/i.test(error.message);
        if(!retryable || attempt===2) throw error;
        await new Promise(r=>setTimeout(r,5000));
      }
    }

    if(!published?.id) throw new Error('Instagram did not return the published media ID.');
    return Response.json({ok:true,id:published.id,username:me.username});
  }catch(error){
    return Response.json({error:error.message||'Publishing failed'},{status:500});
  }
}
