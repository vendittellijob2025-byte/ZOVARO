import fs from "node:fs";

const JOBICY_URL = "https://jobicy.com/api/jobs";
const JOBICY_STATUS_URL = "https://jobicy.com/api/jobs/status";
const REMOTE_OK_URL = "https://remoteok.com/api";
const OUTPUT = "data/remote-jobs.json";
const MAX_JOBICY_PAGES = 5;
const MAX_JOBICY_JOBS = 500;
const REFRESH_GUARD_MS = 55 * 60 * 1000;
const now = new Date();
const nowIso = now.toISOString();

const EUROPE = [
  "Albania","Andorra","Armenia","Austria","Azerbaijan","Belarus","Belgium","Bosnia and Herzegovina",
  "Bulgaria","Croatia","Cyprus","Czechia","Denmark","Estonia","Finland","France","Georgia","Germany",
  "Greece","Hungary","Iceland","Ireland","Italy","Kosovo","Latvia","Liechtenstein","Lithuania",
  "Luxembourg","Malta","Moldova","Monaco","Montenegro","Netherlands","North Macedonia","Norway",
  "Poland","Portugal","Romania","Russia","San Marino","Serbia","Slovakia","Slovenia","Spain","Sweden",
  "Switzerland","Turkey","Ukraine","United Kingdom","Vatican City"
];
const APAC = [
  "Australia","Bangladesh","Bhutan","Brunei","Cambodia","China","Fiji","Hong Kong","India","Indonesia",
  "Japan","Laos","Malaysia","Maldives","Mongolia","Myanmar","Nepal","New Zealand","Pakistan",
  "Papua New Guinea","Philippines","Singapore","South Korea","Sri Lanka","Taiwan","Thailand","Vietnam"
];
const NORTH_AMERICA = ["Canada","Mexico","United States"];
const LATIN_AMERICA = [
  "Argentina","Belize","Bolivia","Brazil","Chile","Colombia","Costa Rica","Cuba","Dominican Republic",
  "Ecuador","El Salvador","Guatemala","Guyana","Honduras","Jamaica","Mexico","Nicaragua","Panama",
  "Paraguay","Peru","Suriname","Trinidad and Tobago","Uruguay","Venezuela"
];
const AFRICA = [
  "Algeria","Angola","Benin","Botswana","Burkina Faso","Burundi","Cabo Verde","Cameroon",
  "Central African Republic","Chad","Comoros","Democratic Republic of the Congo","Djibouti","Egypt",
  "Equatorial Guinea","Eritrea","Eswatini","Ethiopia","Gabon","Gambia","Ghana","Guinea","Guinea-Bissau",
  "Ivory Coast","Kenya","Lesotho","Liberia","Libya","Madagascar","Malawi","Mali","Mauritania",
  "Mauritius","Morocco","Mozambique","Namibia","Niger","Nigeria","Republic of the Congo","Rwanda",
  "Sao Tome and Principe","Senegal","Seychelles","Sierra Leone","Somalia","South Africa","South Sudan",
  "Sudan","Tanzania","Togo","Tunisia","Uganda","Zambia","Zimbabwe"
];
const MIDDLE_EAST = [
  "Bahrain","Iran","Iraq","Israel","Jordan","Kuwait","Lebanon","Oman","Palestine","Qatar",
  "Saudi Arabia","Syria","United Arab Emirates","Yemen"
];
const GEO_GROUPS = {
  europe: EUROPE,
  emea: [...EUROPE,...MIDDLE_EAST,...AFRICA],
  apac: APAC,
  "asia pacific": APAC,
  "north america": NORTH_AMERICA,
  "latin america": LATIN_AMERICA,
  latam: LATIN_AMERICA,
  "lat am": LATIN_AMERICA,
  "south america": ["Argentina","Bolivia","Brazil","Chile","Colombia","Ecuador","Guyana","Paraguay","Peru","Suriname","Uruguay","Venezuela"],
  "united states": ["United States"],
  usa: ["United States"],
  us: ["United States"],
  canada: ["Canada"],
  uk: ["United Kingdom"],
  "united kingdom": ["United Kingdom"],
  australia: ["Australia"]
};

function normal(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
}
function unique(values) {
  return [...new Set(values.filter(Boolean).map(value=>String(value).trim()).filter(Boolean))];
}
function countryName(value) {
  const key = normal(value).replace(/\b(the )/g,"");
  const aliases = {
    us:"United States",usa:"United States","u s":"United States","united states of america":"United States",
    uk:"United Kingdom","great britain":"United Kingdom","britain":"United Kingdom",
    "south korea":"South Korea","korea republic of":"South Korea",
    "czech republic":"Czechia","uae":"United Arab Emirates"
  };
  return aliases[key] || String(value).trim();
}
function eligibleCountries(geo) {
  const original = String(geo ?? "").trim();
  const originalKey = normal(original);
  if (!originalKey) return [];
  if (/anywhere|worldwide|global|any country|all countries|remote globally/.test(originalKey)) return ["Worldwide"];
  const raw = original.replace(/\b(remote|hybrid)\b/gi," ").replace(/[()[\]]/g," ")
    .replace(/^[\s\-:]+|[\s\-:]+$/g," ").trim();
  const key = normal(raw);
  if (!key) return [];
  const parts = raw.split(/[,;|/]+|\s+or\s+/i).map(part=>part.trim()).filter(Boolean);
  if (parts.length > 1) {
    const expanded = [];
    for (const part of parts) {
      const partKey = normal(part);
      const group = Object.entries(GEO_GROUPS).find(([name]) => partKey === name || partKey.includes(name));
      if (group) expanded.push(...group[1]);
      else if (/\b(usa|u s|united states)\b/.test(partKey)) expanded.push("United States");
      else if (/\b(uk|united kingdom|great britain)\b/.test(partKey)) expanded.push("United Kingdom");
      else if (/\bcanada\b/.test(partKey)) expanded.push("Canada");
      else if (partKey && !/anywhere|worldwide|global/i.test(partKey)) expanded.push(countryName(part));
    }
    return unique(expanded);
  }
  for (const [group, countries] of Object.entries(GEO_GROUPS)) {
    if (key === group || key.includes(group)) return countries;
  }
  if (/\b(usa|u s|united states)\b/.test(key)) return ["United States"];
  if (/\b(uk|united kingdom|great britain)\b/.test(key)) return ["United Kingdom"];
  if (/\bcanada\b/.test(key)) return ["Canada"];
  return [countryName(raw)];
}
function stripHtml(value) {
  return String(value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi," ")
    .replace(/<style[\s\S]*?<\/style>/gi," ")
    .replace(/<[^>]+>/g," ")
    .replace(/&nbsp;|&#160;/gi," ")
    .replace(/&amp;/gi,"&").replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,"<").replace(/&gt;/gi,">")
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
    .replace(/\s+/g," ").trim().slice(0,3500);
}
function jobCategory(title, industryValues = [], tagValues = []) {
  const industries = Array.isArray(industryValues) ? industryValues : [industryValues];
  const tags = Array.isArray(tagValues) ? tagValues : [tagValues];
  const industry = normal(industries.join(" "));
  const text = normal([title,...industries,...tags].join(" "));
  const industryMap = [
    [/admin|virtual assistant|office administration/,"Office & Administration"],
    [/editorial|content/,"Marketing & Communications"],
    [/creative|design|graphic/,"Arts, Media & Creative"],
    [/customer success|customer support|technical support/,"Retail & Customer Service"],
    [/cybersecurity|data science|analytics|devops|software engineering|software development|qa|testing|programming|it support/,"IT, Software & Data"],
    [/education|e learning|teaching/,"Education & Training"],
    [/finance|accounting|bookkeeping/,"Finance & Accounting"],
    [/healthcare|medical|nursing/,"Healthcare & Medical"],
    [/hr|recruiting|human resources/,"Business & Management"],
    [/legal|compliance/,"Legal & Compliance"],
    [/marketing|seo|social media|communications/,"Marketing & Communications"],
    [/business development|product|operations|project management|program management|management/,"Business & Management"],
    [/sales/,"Retail & Customer Service"]
  ];
  for (const [pattern, category] of industryMap) if (pattern.test(industry)) return category;
  const rules = [
    [/aviation|aerospace|pilot|flight attendant|airline|aircraft/,"Aviation & Aerospace"],
    [/maritime|offshore|seafarer|shipping vessel|marine engineer|ship crew/,"Maritime & Offshore"],
    [/real estate|property manager|realtor|leasing|property development/,"Real Estate & Property"],
    [/scientist|researcher|research assistant|laboratory|lab technician|biotech|clinical research/,"Science & Research"],
    [/renewable energy|solar|wind power|utilities|power grid|energy storage/,"Energy & Utilities"],
    [/environment|sustainability|climate|conservation|environmental/,"Environment & Sustainability"],
    [/sports|fitness|athletic|coach|recreation|personal trainer/,"Sports & Recreation"],
    [/travel|tourism|hotel|hospitality|tour guide|reservation|travel agent/,"Travel & Tourism"],
    [/government|public sector|civil service|municipal|policy officer/,"Public Sector & Government"],
    [/construction|carpenter|plumber|electrician|welder|mason|site manager/,"Construction & Skilled Trades"],
    [/manufacturing|production|factory|assembly|quality control/,"Manufacturing & Production"],
    [/logistics|supply chain|warehouse|delivery|fleet|transport|dispatcher/,"Transport & Logistics"],
    [/cleaning|janitor|housekeeping|sanitation/,"Cleaning & Sanitation"],
    [/security|safety officer|police|event steward|guard/,"Security & Events"],
    [/health|medical|nurse|doctor|pharmacist|therapist|care worker/,"Healthcare & Medical"],
    [/teacher|education|trainer|tutor|instructor|curriculum/,"Education & Training"],
    [/finance|accountant|bookkeeper|payroll|auditor|tax/,"Finance & Accounting"],
    [/legal|lawyer|paralegal|compliance|attorney/,"Legal & Compliance"],
    [/beauty|cosmetic|hair stylist|esthetician|salon/,"Beauty & Personal Care"],
    [/agriculture|farming|farm|agronomist|livestock/,"Agriculture & Farming"],
    [/engineer|engineering|mechanical|electrical|civil engineering/,"Engineering & Technology"],
    [/software|developer|programmer|data engineer|it specialist|devops|cloud|cybersecurity|qa engineer/,"IT, Software & Data"],
    [/designer|artist|video editor|photographer|writer|media|creative|content creator/,"Arts, Media & Creative"],
    [/marketing|seo|communications|social media|brand manager|copywriter/,"Marketing & Communications"],
    [/chef|cook|restaurant|food service|barista|catering/,"Food & Hospitality"],
    [/retail|customer service|sales associate|store manager|account executive/,"Retail & Customer Service"],
    [/administrative|administrator|office manager|executive assistant|virtual assistant/,"Office & Administration"],
    [/business|manager|product manager|operations|project manager|consultant|analyst/,"Business & Management"]
  ];
  for (const [pattern, category] of rules) if (pattern.test(text)) return category;
  return "Business & Management";
}
function salaryText(min, max, currency, period) {
  const low = Number(min), high = Number(max);
  if (!Number.isFinite(low) && !Number.isFinite(high)) return "";
  const amount = Number.isFinite(low) && Number.isFinite(high)
    ? low === high ? String(low) : low + "–" + high
    : String(Number.isFinite(low) ? low : high);
  return [currency || "", amount, period || ""].filter(Boolean).join(" ");
}
function makeJob({id,sourceName,sourceId,title,company,geo,description,employmentType,level,publishedAt,salary,sourceUrl,logo,tags,category}) {
  const countries = eligibleCountries(geo);
  const locationLabel = String(geo || (countries.includes("Worldwide") ? "Worldwide" : countries.join(", ")) || "Remote eligibility not specified");
  return {
    id: String(id),
    sourceId: String(sourceId),
    sourceName,
    sourceType: "external-job-board",
    status: "open",
    title: String(title || "Remote opportunity").trim(),
    company: String(company || "Employer not specified").trim(),
    country: countries.includes("Worldwide") ? "Worldwide" : countries.length === 1 ? countries[0] : locationLabel,
    countries,
    city: "Remote",
    region: "Remote — " + locationLabel,
    location: "Remote — " + locationLabel,
    workplace: "Remote",
    category,
    description: stripHtml(description),
    employmentType: Array.isArray(employmentType) ? employmentType.join(", ") : String(employmentType || ""),
    experienceLevel: String(level || ""),
    salary: String(salary || ""),
    publishedAt: publishedAt || null,
    applicationUrl: sourceUrl,
    sourceUrl,
    companyLogo: logo || "",
    tags: unique(Array.isArray(tags) ? tags : [tags]),
    remoteEligible: countries.length > 0,
    lastVerifiedAt: nowIso
  };
}
function fromJobicy(job) {
  const geo = job.jobGeo || job.jobLocation || "";
  const industries = Array.isArray(job.jobIndustry) ? job.jobIndustry : [job.jobIndustry].filter(Boolean);
  const tags = [...industries,...(Array.isArray(job.jobType) ? job.jobType : [])];
  const sourceUrl = String(job.url || "");
  if (!job.id || !job.jobTitle || !sourceUrl.startsWith("https://")) return null;
  return makeJob({
    id: "jobicy-" + job.id,
    sourceId: job.id,
    sourceName: "Jobicy",
    title: job.jobTitle,
    company: job.companyName,
    geo,
    description: job.jobDescription || job.jobExcerpt,
    employmentType: job.jobType || [],
    level: job.jobLevel,
    publishedAt: job.pubDate,
    salary: salaryText(job.salaryMin,job.salaryMax,job.salaryCurrency,job.salaryPeriod),
    sourceUrl,
    logo: job.companyLogo,
    tags,
    category: jobCategory(job.jobTitle,industries,tags)
  });
}
function fromRemoteOk(job) {
  const sourceUrl = String(job.url || (job.slug ? "https://remoteok.com/remote-jobs/" + job.slug : ""));
  const title = job.position || job.title || "";
  if (!job.id || !title || !sourceUrl.startsWith("https://")) return null;
  const tags = Array.isArray(job.tags) ? job.tags : [];
  const geo = job.location || job.geo || "";
  return makeJob({
    id: "remoteok-" + job.id,
    sourceId: job.id,
    sourceName: "Remote OK",
    title,
    company: job.company,
    geo,
    description: job.description,
    employmentType: job.type || job.job_type || "",
    level: job.level || "",
    publishedAt: job.date || job.epoch ? job.date || new Date(Number(job.epoch) * 1000).toISOString() : null,
    salary: salaryText(job.salary_min,job.salary_max,job.salary_currency || "USD",job.salary_period || ""),
    sourceUrl,
    logo: job.company_logo,
    tags,
    category: jobCategory(title,tags,tags)
  });
}
async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "ZOVARO-JOB-aggregator/1.0 (+https://zovaro.vercel.app)"
    },
    signal: AbortSignal.timeout(25000)
  });
  if (!response.ok) throw new Error("HTTP " + response.status + " from " + new URL(url).hostname);
  return response.json();
}
function chunk(values,size) {
  const out=[];
  for(let i=0;i<values.length;i+=size)out.push(values.slice(i,i+size));
  return out;
}
function readPrevious() {
  try { return JSON.parse(fs.readFileSync(OUTPUT,"utf8")); }
  catch { return { jobs: [], sources: [] }; }
}

const previous = readPrevious();
const lastSync = Date.parse(previous.syncedAt || "");
if (Number.isFinite(lastSync) && Date.now() - lastSync < REFRESH_GUARD_MS && process.env.FORCE_SYNC !== "1") {
  console.log("Skipping: public job feeds were synchronized less than 55 minutes ago.");
  process.exit(0);
}

async function fetchJobicy() {
  const jobs=[];
  let cursor=null;
  let pages=0;
  do {
    const params=new URLSearchParams({count:"100"});
    if(cursor)params.set("cursor",cursor);
    const data=await fetchJson(JOBICY_URL+"?"+params.toString());
    if(data.success===false)throw new Error(data.error || "Jobicy API reported failure");
    if(!Array.isArray(data.jobs))throw new Error("Unexpected Jobicy response: jobs array missing");
    jobs.push(...data.jobs);
    cursor=data.nextCursor || null;
    pages++;
  } while(cursor && pages<MAX_JOBICY_PAGES && jobs.length<MAX_JOBICY_JOBS);
  return {jobs:jobs.slice(0,MAX_JOBICY_JOBS),pages};
}
async function preserveActiveOlderJobicy(freshJobs) {
  const freshIds=new Set(freshJobs.map(job=>String(job.id)));
  const previousJobicy=(previous.jobs||[]).filter(job=>job.sourceName==="Jobicy" && job.sourceId && !freshIds.has(String(job.sourceId)));
  const active=[];
  for(const batch of chunk(previousJobicy,100)){
    try{
      const params=new URLSearchParams({ids:batch.map(job=>String(job.sourceId)).join(",")});
      const status=await fetchJson(JOBICY_STATUS_URL+"?"+params.toString());
      const statuses=new Map((status.jobs||[]).map(item=>[String(item.id),String(item.status||"").toLowerCase()]));
      for(const old of batch){
        if(statuses.get(String(old.sourceId))==="active")active.push({...old,lastVerifiedAt:nowIso,status:"open"});
      }
    }catch(error){
      console.warn("Jobicy status refresh skipped for a batch:",error.message);
    }
  }
  return active;
}
async function fetchRemoteOk() {
  const data=await fetchJson(REMOTE_OK_URL);
  if(!Array.isArray(data))throw new Error("Unexpected Remote OK response: expected JSON array");
  return data.filter(item=>item && item.id && (item.position || item.title) && item.url);
}

const [jobicyResult,remoteOkResult]=await Promise.all([fetchJobicy(),fetchRemoteOk()]);
const jobicyFresh=jobicyResult.jobs.map(fromJobicy).filter(Boolean);
const jobicyOlder=await preserveActiveOlderJobicy(jobicyResult.jobs);
const remoteOkJobs=remoteOkResult.map(fromRemoteOk).filter(Boolean);
const dedupe=new Map();
for(const job of [...jobicyOlder,...jobicyFresh,...remoteOkJobs]){
  if(!job.remoteEligible)continue;
  const key=job.sourceName+":"+job.sourceId;
  if(!dedupe.has(key))dedupe.set(key,job);
}
const jobs=[...dedupe.values()].sort((a,b)=>Date.parse(b.publishedAt||0)-Date.parse(a.publishedAt||0));
const sources=[
  {name:"Jobicy",status:"ok",jobCount:jobicyFresh.length+jobicyOlder.length,pages:jobicyResult.pages,lastSuccessfulAt:nowIso,refreshIntervalHours:1,attribution:"Credit Jobicy and link each listing to its Jobicy source page."},
  {name:"Remote OK",status:"ok",jobCount:remoteOkJobs.length,lastSuccessfulAt:nowIso,refreshIntervalHours:1,attribution:"Credit Remote OK and link each listing to its original Remote OK job page."}
];
const result={
  syncedAt:nowIso,
  totalJobs:jobs.length,
  jobs,
  sources,
  notes:[
    "These feeds contain remote roles only. Country eligibility is taken from each source's location field; unspecified eligibility is not treated as worldwide.",
    "Jobicy's public API is free, keyless, commercial-use permitted, and limited to jobs published in the last seven days; active older jobs are retained only when its status endpoint confirms them.",
    "Remote OK listings link to their original Remote OK pages and display source attribution."
  ]
};
fs.writeFileSync(OUTPUT,JSON.stringify(result,null,2)+"\n","utf8");
console.log(JSON.stringify({syncedAt:nowIso,jobicyPages:jobicyResult.pages,jobicy:jobicyFresh.length,jobicyOlder:jobicyOlder.length,remoteOK:remoteOkJobs.length,total:jobs.length}));
