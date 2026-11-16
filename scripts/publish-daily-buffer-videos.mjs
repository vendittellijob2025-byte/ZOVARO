import fs from "node:fs/promises";
const token=process.env.GITHUB_TOKEN, bufferToken=process.env.BUFFER_API_TOKEN;
const [owner,name]=(process.env.GITHUB_REPOSITORY||"").split("/");
if(!token||!bufferToken||!owner||!name) throw new Error("Missing GitHub or Buffer publishing credentials.");
const day=new Date().toISOString().slice(0,10).replaceAll("-","");
const tag="zovaro-social-"+day;
const videos=[
["SHOP · Daily discoveries","data/tiktok-video.mp4","Discover today's products and offers on ZOVARO Worldwide. https://zovaro.vercel.app/ #ZOVARO #Shopping"],
["JOBS · Daily opportunities","zovaro-social-videos/ZOVARO-JOBS-DAILY.mp4","Explore employer-published job openings on ZOVARO JOBS. https://zovaro.vercel.app/?view=jobs #ZOVARO #Jobs"],
["LUXURY · Daily discoveries","zovaro-social-videos/ZOVARO-LUXURY-DAILY.mp4","Discover luxury cars, yachts, private aviation, estates and watches. https://zovaro.vercel.app/ #ZOVARO #Luxury"],
["ADVERTISERS · Promote your business",null,"Promote your business worldwide on ZOVARO: US$9.99/month or US$99/year. Details: https://zovaro.vercel.app/ #ZOVARO #Advertise","https://github.com/vendittellijob2025-byte/ZOVARO/releases/download/zovaro-social-20261116/08-ZOVARO-ADVERTISERS-DAILY.mp4"]
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
let release=await gh("/repos/"+owner+"/"+name+"/releases/tags/"+tag).catch(()=>null);
if(!release)release=await gh("/repos/"+owner+"/"+name+"/releases",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tag_name:tag,name:"ZOVARO daily social videos "+day,body:"Daily generated ZOVARO social media videos. Public media links for Buffer."})});
const media=[];
for(let i=0;i<videos.length;i++){const [label,file,,existingUrl]=videos[i];if(existingUrl){media.push({label,url:existingUrl});continue;}const filename="daily-"+String(i+1).padStart(2,"0")+"-"+file.split("/").pop();const bytes=await fs.readFile(file);const r=await fetch("https://uploads.github.com/repos/"+owner+"/"+name+"/releases/"+release.id+"/assets?name="+encodeURIComponent(filename),{method:"POST",headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json","Content-Type":"video/mp4"},body:bytes,signal:AbortSignal.timeout(240000)});const asset=await r.json().catch(()=>({}));if(!r.ok)throw new Error("Release upload failed: "+JSON.stringify(asset));media.push({label,url:asset.browser_download_url});}
for(const channel of [tt,ig]){for(let i=0;i<videos.length;i++){const [label,,caption]=videos[i];const text=channel.service.toLowerCase()==="tiktok"?caption.slice(0,150):caption;const input={text,channelId:channel.id,schedulingType:"automatic",mode:"addToQueue",assets:[{video:{url:media[i].url,metadata:{thumbnailOffset:2000}}}]};const query="mutation { createPost(input:{text:"+JSON.stringify(text)+",channelId:"+JSON.stringify(channel.id)+",schedulingType:automatic,mode:addToQueue,assets:[{video:{url:"+JSON.stringify(media[i].url)+",metadata:{thumbnailOffset:2000}}}]}) { ... on PostActionSuccess { post { id } } ... on MutationError { message } } }";const d=await gql(query,"create post "+label+" "+channel.name);const p=d?.createPost;if(!p?.post?.id)throw new Error("Buffer rejected "+label+" on "+channel.name+": "+(p?.message||JSON.stringify(p)));console.log("QUEUED",channel.name,label,p.post.id);}}
console.log(JSON.stringify({date:day,release:release.html_url,channels:[tt.name,ig.name],postsCreated:media.length*2},null,2));
