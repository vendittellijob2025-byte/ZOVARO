const token=process.env.BUFFER_API_TOKEN;
if(!token) throw new Error("Missing BUFFER_API_TOKEN.");
const targetDate=(()=>{const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Bogota",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));const d=new Date(Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day)+1));return d.toISOString().slice(0,10);})();
const slots=["08:00","12:00","17:00","21:00"];
const ids=[
 ["TikTok","SHOP","6afadb3a37f9e5273bdd140a",0],
 ["TikTok","JOBS","6afadb3a91ba8aa74bc810b0",1],
 ["TikTok","LUXURY","6afadb3bd2a6b9d4fcab8591",2],
 ["TikTok","INSERZIONISTI","6afadb3bd2a6b9d4fcab85d4",3],
 ["Instagram","SHOP","6afadb7091ba8aa74bc82972",0],
 ["Instagram","JOBS","6afadb700c2af02527d40da9",1],
 ["Instagram","LUXURY","6afadb710c2af02527d40df4",2],
 ["Instagram","INSERZIONISTI","6afadb710b49b20d0d078a69",3]
];
async function gql(query,label){const r=await fetch("https://api.buffer.com",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({query}),signal:AbortSignal.timeout(60000)});const d=await r.json().catch(()=>({}));if(!r.ok||d.errors?.length)throw new Error(label+": "+JSON.stringify(d.errors||d));return d.data;}
const results=[];
for(const [channel,label,id,index] of ids){
 const dueAt=new Date(targetDate+"T"+slots[index]+":00-05:00").toISOString();
 const query="mutation { editPost(input:{id:"+JSON.stringify(id)+",mode:customScheduled,dueAt:"+JSON.stringify(dueAt)+"}) { ... on PostActionSuccess { post { id dueAt } } ... on MutationError { message } } }";
 const d=await gql(query,"reschedule "+channel+" "+label);
 const result=d?.editPost;
 if(!result?.post?.id) throw new Error("Buffer did not confirm "+channel+" "+label+": "+JSON.stringify(result));
 console.log("RESCHEDULED",channel,label,result.post.id,result.post.dueAt);
 results.push({channel,label,id:result.post.id,dueAt:result.post.dueAt});
}
console.log(JSON.stringify({result:"success",targetDate,timezone:"America/Bogota",results},null,2));
