import fs from "node:fs/promises";
const token=process.env.GITHUB_TOKEN, bufferToken=process.env.BUFFER_API_TOKEN;
const [owner,name]=(process.env.GITHUB_REPOSITORY||"").split("/");
if(!token||!bufferToken||!owner||!name) throw new Error("Missing GitHub or Buffer publishing credentials.");
function bogotaDate(offsetDays=0){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Bogota",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
  const d=new Date(Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day)+offsetDays));
  return d.toISOString().slice(0,10);
}
const day=bogotaDate().replaceAll("-","");
const targetDate=bogotaDate(1);
const slots=["08:00","12:00","17:00","21:00"];
const dueAtFor=(time)=>new Date(targetDate+"T"+time+":00-05:00").toISOString();
const tag="zovaro-social-"+day+"-"+(process.env.GITHUB_RUN_ID||"manual")+"-"+(process.env.GITHUB_RUN_ATTEMPT||"1");
const videos=[
["SHOP · Daily discoveries","data/tiktok-video.mp4","Discover today's products and offers on ZOVARO Worldwide. https://zovaro.vercel.app/ #ZOVARO #Shopping"],
["JOBS · Daily opportunities","zovaro-social-videos/ZOVARO-JOBS-DAILY.mp4","Explore employer-published job openings on ZOVARO JOBS. https://zovaro.vercel.app/?view=jobs #ZOVARO #Jobs"],
["LUXURY · Daily discoveries","zovaro-social-videos/ZOVARO-LUXURY-DAILY.mp4","Discover luxury cars, yachts, private aviation, estates and watches. https://zovaro.vercel.app/ #ZOVARO #Luxury"],
["ADVERTISERS · Promote your business","zovaro-social-videos/ZOVARO-ADVERTISERS-DAILY.mp4","Promote your business worldwide on ZOVARO: US$9.99/month or US$99/year. Details: https://zovaro.vercel.app/ #ZOVARO #Advertise"]
];
async function gh(path,options={}){const r=await fetch("https://api.github.com"+path,{...options,headers:{Accept:"application/vnd.github+json",Authorization:"Bearer "+token,"X-GitHub-Api-Version":"2022-11-28",...(options.headers||{})},signal:AbortSignal.timeout(180000)});const d=r.status===204?null:await r.json().catch(()=>null);if(!r.ok)throw new Error("GitHub "+r.status+" "+path+": "+JSON.stringify(d));return d;}
async function gql(query,label){const r=await fetch("https://api.buffer.com",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+bufferToken},body:JSON.stringify({query}),signal:AbortSignal.timeout(60000)});const d=await r.json().catch(()=>({}));if(!r.ok||d.errors?.length)throw new Error(label+": "+JSON.stringify(d.errors||d));return d.data;}
for(const [,file,,url] of videos){if(url)continue;const st=await fs.stat(file).catch(()=>null);if(!st?.size)throw new Error("Required video missing: "+file);}
const orgData=await gql("query { account { organizations { id } } }","organizations");
const orgs=orgData?.account?.organizations||[];if(!orgs.length)throw new Error("No Buffer organization found.");
const channels=[];for(const org of orgs){const d=await gql('query { channels(input:{organizationId:"'+org.id+'"}) { id name displayName service isQueuePaused } }',"channels");channels.push(...(d.channels||[]));}
const tt=channels.find(c=>c.service?.toLowerCase()==="tiktok"&&c.name==="zovaro_");
const ig=channels.find(c=>c.service?.toLowerCase()==="instagram"&&c.name==="zovaroworldwide");
if(!tt||!ig)throw new Error("Expected ZOVARO TikTok and Instagram channels not found.");
if(tt.isQueuePaused||ig.isQueuePaused)throw new Error("A ZOVARO Buffer queue is paused.");
const channelIds=[tt.id,ig.id];
const existingData=await gql('query { posts(first:100,input:{organizationId:"'+orgs[0].id+'",filter:{channelIds:'+JSON.stringify(channelIds)+'}}) { edges { node { id text dueAt channelId } } pageInfo { hasNextPage endCursor } } }',"existing scheduled posts");
const existing=existingData?.posts?.edges?.map(e=>e.node)||[];
let release=await gh("/repos/"+owner+"/"+name+"/releases/tags/"+tag).catch(()=>null);
if(!release)release=await gh("/repos/"+owner+"/"+name+"/releases",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tag_name:tag,name:"ZOVARO daily social videos "+day,body:"Daily generated ZOVARO social media videos. Public media links for Buffer."})});
const media=[];
for(let i=0;i<videos.length;i++){const [label,file,,existingUrl]=videos[i];if(existingUrl){media.push({label,url:existingUrl});continue;}const filename="daily-"+String(i+1).padStart(2,"0")+"-"+file.split("/").pop();const bytes=await fs.readFile(file);const r=await fetch("https://uploads.github.com/repos/"+owner+"/"+name+"/releases/"+release.id+"/assets?name="+encodeURIComponent(filename),{method:"POST",headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json","Content-Type":"video/mp4"},body:bytes,signal:AbortSignal.timeout(240000)});const asset=await r.json().catch(()=>({}));if(!r.ok)throw new Error("Release upload failed: "+JSON.stringify(asset));media.push({label,url:asset.browser_download_url});}
const results=[];let failures=0;
for(const channel of [tt,ig]){
  for(let i=0;i<videos.length;i++){
    const [label,,caption]=videos[i];
    const text=channel.service.toLowerCase()==="tiktok"?caption.slice(0,150):caption;
    const dueAt=dueAtFor(slots[i]);
    const already=existing.find(p=>p.channelId===channel.id&&p.text===text&&p.dueAt===dueAt);
    if(already){console.log("ALREADY SCHEDULED",channel.name,label,already.id,dueAt);results.push({channel:channel.name,label,status:"already_scheduled",id:already.id,dueAt});continue;}
    const instagramMetadata=channel.service.toLowerCase()==="instagram"?",metadata:{instagram:{type:reel,shouldShareToFeed:true}}":"";
    const query="mutation { createPost(input:{text:"+JSON.stringify(text)+",channelId:"+JSON.stringify(channel.id)+",schedulingType:automatic,mode:customScheduled,dueAt:"+JSON.stringify(dueAt)+instagramMetadata+",assets:[{video:{url:"+JSON.stringify(media[i].url)+",metadata:{thumbnailOffset:2000}}}]}) { ... on PostActionSuccess { post { id dueAt } } ... on MutationError { message } } }";
    try{
      const d=await gql(query,"schedule "+label+" "+channel.name);
      const result=d?.createPost;
      if(!result?.post?.id)throw new Error(result?.message||JSON.stringify(result));
      console.log("SCHEDULED",channel.name,label,result.post.id,result.post.dueAt);
      results.push({channel:channel.name,label,status:"scheduled",id:result.post.id,dueAt:result.post.dueAt});
    }catch(error){
      failures++;
      console.error("NOT SCHEDULED",channel.name,label,error.message);
      results.push({channel:channel.name,label,status:"not_scheduled",error:error.message});
    }
  }
}
console.log(JSON.stringify({localDate:day,targetDate,timezone:"America/Bogota",slots,release:release.html_url,results},null,2));
if(failures)process.exitCode=1;
const scheduled=results.filter(x=>x.status==="scheduled"||x.status==="already_scheduled").length;
console.log(JSON.stringify({targetDate,timezone:"America/Bogota",channels:[tt.name,ig.name],scheduled,failed:failures,generatedNewVideos:4,reusedAdvertiserVideo:0},null,2));
