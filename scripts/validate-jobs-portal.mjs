import fs from "node:fs/promises";

const [guides, jobs, html, detailHtml, clientJs, detailJs, api] = await Promise.all([
  fs.readFile("data/career-guides.json","utf8").then(JSON.parse),
  fs.readFile("data/curated-jobs.json","utf8").then(JSON.parse),
  fs.readFile("index.html","utf8"),
  fs.readFile("job.html","utf8"),
  fs.readFile("marketplace.js","utf8"),
  fs.readFile("job-detail.js","utf8"),
  fs.readFile("api/marketplace.js","utf8")
]);

const categories=guides.categories||[];
const roles=categories.flatMap(category=>(category.roles||[]).map(role=>({...role,category:category.name})));
const categoryNames=new Set(categories.map(category=>category.name));
const jobIds=new Set();
const errors=[];

if(categories.length<20)errors.push("Expected at least 20 career categories.");
if(roles.length<70)errors.push("Expected at least 70 career profiles.");
for(const role of roles){
  if(!role.title||!role.summary||!Array.isArray(role.skills)||!role.skills.length)errors.push("Incomplete career guide: "+(role.title||"untitled"));
}
for(const job of jobs){
  if(jobIds.has(job.id))errors.push("Duplicate curated job ID: "+job.id);
  jobIds.add(job.id);
  if(!job.title||!job.company||!job.sourceTitle)errors.push("Missing job identity/source title: "+(job.id||"unknown"));
  if(!/^https:\/\//i.test(job.sourceUrl||""))errors.push("Missing HTTPS source URL: "+job.id);
  if(!/^https:\/\//i.test(job.applicationUrl||""))errors.push("Missing HTTPS application URL: "+job.id);
  if(!categoryNames.has(job.category))errors.push("Unknown job category: "+job.id+" / "+job.category);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(job.verifiedAt||""))errors.push("Invalid verification date: "+job.id);
  if(!Array.isArray(job.countries)||!job.countries.length)errors.push("Missing eligible country list: "+job.id);
}
for(const id of ["jobCountryFilter","jobRegionFilter","jobCityFilter","jobCategoryFilter","careerCategoryFilter","careerGuideSearch","careerGuidesGrid","careerGuidesMeta"]){
  if(!html.includes('id="'+id+'"'))errors.push("Missing jobs UI element: "+id);
}
if(!html.includes('showView("lookingJobView")'))errors.push("Missing direct JOBS view routing.");
if(!html.includes('id="jobListingForm"')||!html.includes('name="category"'))errors.push("Employer job form does not capture a category.");
if(!detailHtml.includes('src="/job-detail.js"'))errors.push("Standalone job detail page is missing its renderer.");
if(!clientJs.includes('/data/curated-jobs.json')||!clientJs.includes('/data/career-guides.json'))errors.push("Marketplace does not load curated jobs and career guides.");
if(!detailJs.includes('/api/marketplace?type=job&id='))errors.push("Standalone detail page cannot load employer-submitted jobs.");
if(!api.includes('jobCategories.includes(record.category)'))errors.push("API does not validate employer job categories.");

if(errors.length){console.error(errors.join("\n"));process.exit(1);}
console.log("ZOVARO JOBS portal validation passed.");
console.log("Career categories: "+categories.length+"; career profiles: "+roles.length+"; curated source listings: "+jobs.length+".");
