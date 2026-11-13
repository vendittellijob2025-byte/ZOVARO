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
const MUSIC_LUXURY = "assets/ZOVARO_LUXURY.MP3";
const LOGO = "assets/zovaro-logo.png";

const jobs = JSON.parse(await fs.readFile("data/curated-jobs.json","utf8"));
const guides = JSON.parse(await fs.readFile("data/career-guides.json","utf8"));
await fs.mkdir(OUTPUT,{recursive:true});
const temp = path.join(OUTPUT,".temp");
await fs.mkdir(temp,{recursive:true});

const day = Math.floor(Date.now()/86400000);
const openJobs = jobs.filter(job => job.status === "open" && job.verifiedAt);
const rotate = (items,count,offset=0) => Array.from({length:Math.min(count,items.length)},(_,i)=>items[(offset+i)%items.length]);
const selectedJobs = rotate(openJobs,3,openJobs.length ? day%openJobs.length : 0);
const remote = guides.categories.find(x=>x.name==="Remote & Work From Home")?.roles || [];
const trades = guides.categories.find(x=>x.name==="Construction & Skilled Trades")?.roles || [];
const food = guides.categories.find(x=>x.name==="Food & Hospitality")?.roles || [];
const remoteRoles = rotate(remote,3,day%Math.max(1,remote.length));
const industryPool = [...food,...trades];
const industryRoles = rotate(industryPool,4,day%Math.max(1,industryPool.length));

function wrap(value,max=30){
  const text=String(value||"").replace(/\s+/g," ").trim();
  return text.length>max ? text.slice(0,max-1).trim()+"…" : text;
}
function filterPath(value){return value.replace(/\\/g,"\\\\").replace(/:/g,"\\:").replace(/'/g,"\\'");}
async function textFile(name,value){const file=path.join(temp,name);await fs.writeFile(file,value,"utf8");return filterPath(file);}
function draw(file,start,end,size,y){
  return "drawtext=fontfile="+FONT+":textfile='"+file+"':fontcolor=0x00D9FF:fontsize="+size+":line_spacing=16:borderw=1:bordercolor=black@0.8:shadowcolor=black@0.9:shadowx=2:shadowy=2:x=(w-text_w)/2:y="+y+":enable='between(t,"+start+","+end+")'";
}
async function makeVideo({name,background,music,scenes,caption,hashtags}){
  const audio=await fs.access(music).then(()=>music).catch(()=>MUSIC_DEFAULT);
  const textInputs=[];
  for(let i=0;i<scenes.length;i++){
    const scene=scenes[i];
    textInputs.push({
      title:await textFile(name+"-"+i+"-title.txt",wrap(scene.title,34)),
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
  filters.push(draw(await textFile(name+"-footer.txt","ZOVARO WORLDWIDE · DISCOVER BETTER. SHOP SMARTER."),0,40,29,1400));
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

const jobScenes=selectedJobs.length>=1?[
  {title:"FIND YOUR NEXT OPPORTUNITY",subtitle:"Browse real job openings on ZOVARO."},
  {title:""+selectedJobs[0].title,subtitle:[selectedJobs[0].company,selectedJobs[0].location].filter(Boolean).join(" · ")},
  {title:selectedJobs[1]?.title||"REMOTE & WORK FROM HOME",subtitle:selectedJobs[2]?[selectedJobs[2].title,selectedJobs[2].company].join(" · "):"Explore more verified roles and career categories."}
]:[
  {title:"FIND YOUR NEXT OPPORTUNITY",subtitle:"Explore 20 career categories and professional role guides."},
  {title:"REMOTE & WORK FROM HOME",subtitle:"Software · Design · Customer Support · Administration"},
  {title:"EXPLORE CAREER PATHS",subtitle:"Discover professions, typical duties and skills on ZOVARO."}
];
const remoteScenes=[
  {title:"REMOTE & WORK FROM HOME",subtitle:"Explore flexible remote career paths on ZOVARO."},
  {title:remoteRoles[0]?.title||"REMOTE SOFTWARE DEVELOPER",subtitle:remoteRoles[1]?.title||"REMOTE GRAPHIC DESIGNER"},
  {title:remoteRoles[2]?.title||"REMOTE CUSTOMER SUPPORT",subtitle:"Career guides and current openings on ZOVARO JOBS."}
];
const industryScenes=[
  {title:"CAREERS ACROSS INDUSTRIES",subtitle:"Explore work in hospitality, construction, trades and logistics."},
  {title:industryRoles[0]?.title||"BAKER · CHEF · HOTEL STAFF",subtitle:industryRoles[1]?.title||"FOOD & HOSPITALITY CAREER PATHS"},
  {title:industryRoles[2]?.title||"ELECTRICIAN · CARPENTER",subtitle:industryRoles[3]?.title||"CONSTRUCTION & SKILLED TRADES"}
];
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
results.push(await makeVideo({
  name:"ZOVARO-JOBS-DAILY",
  background:"assets/job-visual.png",
  music:MUSIC_DEFAULT,
  scenes:jobScenes,
  caption:"Explore current employer-published openings and career paths on ZOVARO JOBS Worldwide. Browse without registration and apply through the employer's official channel. https://zovaro.vercel.app/?view=jobs",
  hashtags:["#ZOVARO","#Jobs","#CareerOpportunities","#RemoteJobs"]
}));
results.push(await makeVideo({
  name:"ZOVARO-REMOTE-CAREERS",
  background:"assets/job-visual.png",
  music:MUSIC_DEFAULT,
  scenes:remoteScenes,
  caption:"Discover Remote & Work From Home career paths on ZOVARO JOBS Worldwide. Career guides are informational; live vacancies are listed separately and linked to their employers. https://zovaro.vercel.app/?view=jobs",
  hashtags:["#ZOVARO","#RemoteWork","#WorkFromHome","#DigitalCareers"]
}));
results.push(await makeVideo({
  name:"ZOVARO-LUXURY-DAILY",
  background:"assets/Offerte Esclusive di Lusso Dorato.png",
  music:MUSIC_LUXURY,
  scenes:luxuryScenes,
  caption:"Discover the world of luxury on ZOVARO — luxury cars, yachts, private aviation, villas, estates and watches. Explore the categories and curated opportunities. https://zovaro.vercel.app/",
  hashtags:["#ZOVARO","#LuxuryLifestyle","#Yachts","#PrivateJets","#LuxuryCars"]
}));
await fs.rm(temp,{recursive:true,force:true});
await fs.writeFile(path.join(OUTPUT,"captions.json"),JSON.stringify({
  createdAt:new Date().toISOString(),
  videos:results.map(item=>({file:path.basename(item.file),duration:item.duration,musicSource:item.music,caption:item.caption,hashtags:item.hashtags}))
},null,2)+"\n","utf8");
console.log("ZOVARO daily category videos generated.");
for(const item of results)console.log(path.basename(item.file)+": "+item.duration.toFixed(1)+"s; audio="+item.music);
if(results.some(item=>item.music===MUSIC_DEFAULT&&item.file.includes("LUXURY")))console.log("Luxury audio fallback in use: upload the approved Suno track as assets/ZOVARO_LUXURY.MP3 to use it automatically.");
