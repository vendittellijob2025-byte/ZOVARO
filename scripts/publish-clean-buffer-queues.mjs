const token=process.env.BUFFER_API_TOKEN;
if(!token) throw new Error("Missing BUFFER_API_TOKEN.");
async function gql(query,label){
  const r=await fetch("https://api.buffer.com",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({query}),signal:AbortSignal.timeout(60000)});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||d.errors?.length) throw new Error(label+": "+JSON.stringify(d.errors||d));
  return d.data;
}
const orgData=await gql("query { account { organizations { id } } }","organizations");
const orgs=orgData?.account?.organizations||[];
if(!orgs.length) throw new Error("No Buffer organization found.");
const channels=[];
for(const org of orgs){
  const d=await gql('query { channels(input:{organizationId:"'+org.id+'"}) { id name service isQueuePaused } }',"channels");
  channels.push(...(d.channels||[]));
}
const tt=channels.find(c=>c.service?.toLowerCase()==="tiktok"&&c.name==="zovaro_");
const ig=channels.find(c=>c.service?.toLowerCase()==="instagram"&&c.name==="zovaroworldwide");
if(!tt||!ig) throw new Error("ZOVARO TikTok and Instagram channels not found.");
if(tt.isQueuePaused||ig.isQueuePaused) throw new Error("A Buffer queue is paused.");
const base="https://github.com/vendittellijob2025-byte/ZOVARO/releases/download/zovaro-social-20261116/";
const posts=[
 {label:"SHOP",url:base+"daily-01-tiktok-video.mp4",text:"Discover today's products and offers on ZOVARO Worldwide. https://zovaro.vercel.app/ #ZOVARO #Shopping"},
 {label:"JOBS",url:base+"daily-02-ZOVARO-JOBS-DAILY.mp4",text:"Explore employer-published job openings on ZOVARO JOBS. https://zovaro.vercel.app/?view=jobs #ZOVARO #Jobs"},
 {label:"LUXURY",url:base+"daily-03-ZOVARO-LUXURY-DAILY.mp4",text:"Discover luxury cars, yachts, private aviation, estates and watches. https://zovaro.vercel.app/ #ZOVARO #Luxury"},
 {label:"ADVERTISERS",url:base+"08-ZOVARO-ADVERTISERS-DAILY.mp4",text:"Promote your business worldwide on ZOVARO: US$9.99/month or US$99/year. Details: https://zovaro.vercel.app/ #ZOVARO #Advertise"}
];
const results=[];
for(const channel of [tt,ig]){
 for(const p of posts){
  const caption=channel.service.toLowerCase()==="tiktok"?p.text.slice(0,150):p.text;
  const meta=channel.service.toLowerCase()==="instagram"?",metadata:{instagram:{type:reel}}":"";
  const query="mutation { createPost(input:{text:"+JSON.stringify(caption)+",channelId:"+JSON.stringify(channel.id)+",schedulingType:automatic,mode:addToQueue"+meta+",assets:[{video:{url:"+JSON.stringify(p.url)+",metadata:{thumbnailOffset:2000}}}]}) { ... on PostActionSuccess { post { id } } ... on MutationError { message } } }";
  const data=await gql(query,"create "+p.label+" on "+channel.name);
  const post=data?.createPost;
  if(!post?.post?.id) throw new Error("Buffer did not confirm "+p.label+" on "+channel.name+": "+JSON.stringify(post));
  results.push({channel:channel.name,label:p.label,status:"queued",postId:post.post.id});
  console.log("QUEUED",channel.name,p.label,post.post.id);
 }
}
console.log(JSON.stringify({result:"success",queued:results.length,results},null,2));
