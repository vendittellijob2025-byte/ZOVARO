import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const OUTPUT = process.argv[2] || "zovaro-social-videos";
const WIDTH = 1080, HEIGHT = 1920, DURATION = 40, FPS = 30;
const FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
const MUSIC_DEFAULT = "assets/ZOVARO_AFFILIATE.MP3";
const MUSIC_JOB = "assets/solo audio promo zovaro job.mp3";
const MUSIC_LUXURY = "assets/ZOVARO_LUXURY_PROMO_SOLOAUDIO.mp3";
const LOGO = "assets/zovaro-logo.png";

const jobs = JSON.parse(await fs.readFile("data/curated-jobs.json","utf8"));
const guides = JSON.parse(await fs.readFile("data/career-guides.json","utf8"));
await fs.mkdir(OUTPUT,{recursive:true});
const temp = path.join(OUTPUT,".temp");
await fs.mkdir(temp,{recursive:true});

const day = Math.floor(Date.now()/86400000);
const openJobs = jobs.filter(job => {
  const verifiedTime = new Date(job.lastVerifiedAt || job.verifiedAt).getTime();
  return job.status === "open" &&
    job.verifiedAt &&
    /^https:\/\//i.test(job.applicationUrl || "") &&
    Number.isFinite(verifiedTime) &&
    Date.now() - verifiedTime <= 7 * 86400000;
});
const rotate = (items,count,offset=0) => Array.from({length:Math.min(count,items.length)},(_,i)=>items[(offset+i)%items.length]);
const remote = guides.categories.find(x=>x.name==="Remote & Work From Home")?.roles || [];
const remoteRoles = rotate(remote,3,day%Math.max(1,remote.length));
const trades = guides.categories.find(x=>x.name==="Construction & Skilled Trades")?.roles || [];
const manufacturing = guides.categories.find(x=>x.name==="Manufacturing & Production")?.roles || [];
const transport = guides.categories.find(x=>x.name==="Transport & Logistics")?.roles || [];
const industryPool = [...trades,...manufacturing,...transport];
const industryRoles = rotate(industryPool,4,day%Math.max(1,industryPool.length));
const guidePool = [...remoteRoles,...rotate(industryPool,Math.max(0,3-remoteRoles.length),day%Math.max(1,industryPool.length))];
const guideJobs = guidePool.map(role=>({
  title:role.title,
  company:"ZOVARO CAREER GUIDE",
  location:"Worldwide · check country and employer requirements",
  jobType:"Career guide · not a confirmed vacancy",
  requirements:role.skills||[],
  applicationUrl:"https://zovaro.vercel.app/?view=jobs",
  isGuideFallback:true
}));
const verifiedSelection = rotate(openJobs,Math.min(3,openJobs.length),openJobs.length ? day%openJobs.length : 0);
const selectedJobs = [...verifiedSelection,...guideJobs.slice(0,Math.max(0,3-verifiedSelection.length))];
if (selectedJobs.length < 3) {
  throw new Error("Not enough career-guide material to create a truthful JOBS video.");
}

function wrap(value,max=30){
  const text=String(value||"").replace(/\s+/g," ").trim();
  return text.length>max ? text.slice(0,max-1).trim()+"…" : text;
}
function filterPath(value){return value.replace(/\\/g,"\\\\").replace(/:/g,"\\:").replace(/'/g,"\\'");}
async function textFile(name,value){const file=path.join(temp,name);await fs.writeFile(file,value,"utf8");return filterPath(file);}
function draw(file,start,end,size,y){
  return "drawtext=fontfile="+FONT+":textfile='"+file+"':fontcolor=0x00D9FF:fontsize="+size+":line_spacing=16:borderw=1:bordercolor=black@0.8:shadowcolor=black@0.9:shadowx=2:shadowy=2:x=(w-text_w)/2:y="+y+":enable='between(t,"+start+","+end+")'";
}
async function makeVideo({name,background,music,scenes,caption,hashtags,footer}){
  const audio=await fs.access(music).then(()=>music).catch(()=>{throw new Error("Approved audio file is missing: "+music);});
  const textInputs=[];
  for(let i=0;i<scenes.length;i++){
    const scene=scenes[i];
    textInputs.push({
      title:await textFile(name+"-"+i+"-title.txt",wrap(scene.title,40)),
      subtitle:await textFile(name+"-"+i+"-subtitle.txt",wrap(scene.subtitle,55))
    });
  }
  const filters=[
    "scale="+WIDTH+":"+HEIGHT+":force_original_aspect_ratio=increase,crop="+WIDTH+":"+HEIGHT+",eq=brightness=-0.08:saturation=0.92",
    "drawbox=x=55:y=300:w=970:h=1260:color=black@0.82:t=fill",
    "drawbox=x=55:y=300:w=970:h=1260:color=0x00D9FF:t=6"
  ];
  scenes.forEach((scene,i)=>{
    const start=i*12, end=i===scenes.length-1?38:(i+1)*12;
    filters.push(draw(textInputs[i].title,start,end,scene.titleSize||50,scene.titleY||540));
    filters.push(draw(textInputs[i].subtitle,start,end,scene.subtitleSize||30,scene.subtitleY||900));
  });
  filters.push(draw(await textFile(name+"-footer.txt",footer||"ZOVARO WORLDWIDE · DISCOVER BETTER. SHOP SMARTER."),0,40,18,1400));
  const filterComplex="[0:v]"+filters.join(",")+"[base];[2:v]scale=360:-1[logo];[base][logo]overlay=(W-w)/2:85:format=auto,fade=t=in:st=0:d=1,fade=t=out:st=38:d=2,format=yuv420p[v]";
  const output=path.join(OUTPUT,name+".mp4");
  await execFileAsync("ffmpeg",[
    "-y","-hide_banner","-loglevel","error",
    "-loop","1","-framerate",String(FPS),"-t",String(DURATION),"-i",background,
    "-stream_loop","-1","-i",audio,
    "-i",LOGO,
    "-filter_complex",filterComplex,
    "-map","[v]","-map","1:a",
    "-t",String(DURATION),"-r",String(FPS),
    "-c:v","libx264","-preset","veryfast","-crf","26","-pix_fmt","yuv420p",
    "-c:a","aac","-b:a","160k","-shortest","-movflags","+faststart",output
  ],{maxBuffer:1024*1024*8});
  const probe=await execFileAsync("ffprobe",["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",output]);
  const duration=Number(probe.stdout.trim());
  if(!Number.isFinite(duration)||duration<38||duration>42)throw new Error(name+" video duration is invalid: "+duration);
  return {file:output,duration,music:audio,caption,hashtags};
}

function jobLocation(job) {
  return job.location || job.region || job.country || "Location in employer details";
}
function jobScenesFor(job) {
  const companyLine = [job.company, job.jobType].filter(Boolean).join(" · ");
  const requirements = (job.requirements || []).slice(0,2).map(value=>wrap(value,22)).join(" · ");
  return [
    {title:"REAL EMPLOYER OPENING",subtitle:wrap(companyLine,55),titleSize:44,subtitleSize:28},
    {title:wrap(job.title,40),subtitle:wrap(jobLocation(job),55),titleSize:42,subtitleSize:28},
    {title:"KEY REQUIREMENTS",subtitle:wrap(requirements,55),titleSize:42,subtitleSize:27}
  ];
}
function jobCaption(job) {
  const requirements = (job.requirements || []).slice(0,4).map(item=>"- "+item).join(" ");
  if (job.isGuideFallback) {
    return [
      "Career guide: "+job.title+".",
      jobLocation(job)+".",
      "This is an occupation overview, not a confirmed vacancy or job offer.",
      requirements,
      "Explore current employer-verified openings on ZOVARO JOBS: "+job.applicationUrl
    ].filter(Boolean).join(" ");
  }
  return [
    job.title+" at "+job.company+".",
    jobLocation(job)+".",
    job.jobType || "See employer terms.",
    requirements,
    "Apply through the employer's official page: "+job.applicationUrl,
    "Availability and eligibility can change; verify directly with the employer."
  ].filter(Boolean).join(" ");
}
const luxuryThemes=[
  {title:"LUXURY CARS · YACHTS",subtitle:"PRIVATE JETS · HELICOPTERS · EXCLUSIVE MOBILITY"},
  {title:"VILLAS · CASTLES · ISLANDS",subtitle:"PRIVATE ESTATES · LUXURY REAL ESTATE"},
  {title:"LUXURY WATCHES · ART",subtitle:"COLLECTIBLES · RARE AND ICONIC OBJECTS"}
];
const luxuryFirst=luxuryThemes[day%luxuryThemes.length];
const luxurySecond=luxuryThemes[(day+1)%luxuryThemes.length];
const luxuryThird=luxuryThemes[(day+2)%luxuryThemes.length];
const luxuryScenes=[
  {title:"DISCOVER THE EXTRAORDINARY",subtitle:"Explore the world of luxury on ZOVARO."},
  {title:luxuryFirst.title,subtitle:luxuryFirst.subtitle},
  {title:luxurySecond.title,subtitle:luxuryThird.title+" · CURATED DISCOVERIES"}
];

const results=[];
const jobVideoNames=["ZOVARO-JOBS-DAILY","ZOVARO-REMOTE-CAREERS","ZOVARO-INDUSTRY-CAREERS"];
for (let index=0; index<jobVideoNames.length; index++) {
  const job=selectedJobs[index];
  results.push(await makeVideo({
    name:jobVideoNames[index],
    background:"assets/job-visual.png",
    music:MUSIC_JOB,
    scenes:jobScenesFor(job),
    caption:jobCaption(job),
    hashtags:["#ZOVARO","#Jobs","#RemoteJobs","#CareerOpportunities"],
    footer:"APPLY VIA OFFICIAL EMPLOYER LINK IN CAPTION"
  }));
}
if (await fs.access(MUSIC_LUXURY).then(()=>true).catch(()=>false)) {
  results.push(await makeVideo({
    name:"ZOVARO-LUXURY-DAILY",
    background:"assets/Offerte Esclusive di Lusso Dorato.png",
    music:MUSIC_LUXURY,
    scenes:luxuryScenes,
    caption:"Discover the Luxury & Prestige collection on ZOVARO Worldwide. Explore verified product listings and confirm availability, territory and terms with each seller before purchase. https://zovaro.vercel.app/",
    hashtags:["#ZOVARO","#LuxuryLifestyle","#LuxuryAndPrestige","#ExclusiveDiscoveries"],
    footer:"EXPLORE LUXURY & PRESTIGE ON ZOVARO"
  }));
} else {
  console.log("LUXURY video skipped: approved audio file is not yet present at "+MUSIC_LUXURY);
}

results.push(await makeVideo({
  name:"ZOVARO-ADVERTISERS-DAILY",
  background:"assets/job-visual.png",
  music:MUSIC_DEFAULT,
  scenes:[
    {title:"ADVERTISE ON ZOVARO",subtitle:"Promote your business worldwide."},
    {title:"US$9.99 / MONTH",subtitle:"Monthly advertising plan."},
    {title:"US$99 / YEAR",subtitle:"One payment for 12 months."}
  ],
  caption:"Promote your business, products or services worldwide on ZOVARO. US$9.99 per month or US$99 for 12 months paid once. Contact ZOVARO for details: https://zovaro.vercel.app/",
  hashtags:["#ZOVARO","#Advertise","#BusinessPromotion","#GlobalVisibility"],
  footer:"US$9.99 / MONTH  ·  US$99 / YEAR"
}));

await fs.rm(temp,{recursive:true,force:true});
await fs.writeFile(path.join(OUTPUT,"captions.json"),JSON.stringify({
  createdAt:new Date().toISOString(),
  videos:results.map(item=>({file:path.basename(item.file),duration:item.duration,musicSource:item.music,caption:item.caption,hashtags:item.hashtags}))
},null,2)+"\n","utf8");
console.log("ZOVARO daily category videos generated.");
for(const item of results)console.log(path.basename(item.file)+": "+item.duration.toFixed(1)+"s; audio="+item.music);
if(results.some(item=>item.music===MUSIC_DEFAULT&&item.file.includes("LUXURY")))console.log("Luxury audio fallback in use: upload the approved Suno track as assets/ZOVARO_LUXURY.MP3 to use it automatically.");
