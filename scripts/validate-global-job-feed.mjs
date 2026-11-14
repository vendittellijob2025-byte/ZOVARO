import fs from "node:fs";

const feed = JSON.parse(fs.readFileSync("data/remote-jobs.json","utf8"));
const career = JSON.parse(fs.readFileSync("data/career-guides.json","utf8"));
const allowedCategories = new Set((career.categories || []).map(item=>item.name));
const allowedSources = new Set(["Jobicy","Remote OK"]);
const failures=[];
if (!Array.isArray(feed.jobs)) failures.push("jobs must be an array");
if (!Array.isArray(feed.sources)) failures.push("sources must be an array");
const ids=new Set();
for (const job of feed.jobs || []) {
  if (!job.id || ids.has(String(job.id))) failures.push("missing or duplicate job id: "+job.id);
  ids.add(String(job.id));
  if (!allowedSources.has(job.sourceName)) failures.push("unapproved source for "+job.id+": "+job.sourceName);
  if (!job.title || !job.company) failures.push("missing title/company for "+job.id);
  if (!allowedCategories.has(job.category)) failures.push("unknown career category for "+job.id+": "+job.category);
  if (job.status !== "open") failures.push("non-open job in active feed: "+job.id);
  if (job.workplace !== "Remote") failures.push("non-remote listing in remote feed: "+job.id);
  if (!Array.isArray(job.countries) || !job.countries.length) failures.push("missing verified country eligibility for "+job.id);
  if (!/^https:\/\//i.test(job.sourceUrl || "")) failures.push("missing HTTPS source URL for "+job.id);
  if (!/^https:\/\//i.test(job.applicationUrl || "")) failures.push("missing HTTPS application/source URL for "+job.id);
  if (job.sourceUrl !== job.applicationUrl) failures.push("application must preserve canonical source listing for "+job.id);
  if (/<\/?(script|iframe|style)\b/i.test(job.description || "")) failures.push("unsafe markup in description for "+job.id);
}
for (const name of allowedSources) {
  if (!(feed.sources || []).some(source=>source.name===name && source.status==="ok")) {
    failures.push("source sync not successful: "+name);
  }
}
console.log(JSON.stringify({
  syncedAt:feed.syncedAt,
  totalJobs:(feed.jobs||[]).length,
  sourceCounts:Object.fromEntries((feed.sources||[]).map(source=>[source.name,source.jobCount])),
  categories:[...new Set((feed.jobs||[]).map(job=>job.category))].sort(),
  failures
},null,2));
if (failures.length) throw new Error("Global remote job feed validation failed: "+failures.length);
