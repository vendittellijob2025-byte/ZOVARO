import fs from "node:fs/promises";

const PATH = "data/curated-jobs.json";
const TODAY = new Date().toISOString().slice(0, 10);
const cache = new Map();

function normalize(value) {
  return String(value || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/&#8211;|&ndash;|&mdash;/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

async function getSource(url) {
  if (cache.has(url)) return cache.get(url);
  const result = (async () => {
    const response = await fetch(url, {
      headers: { "user-agent": "ZOVARO-JOBS-Source-Check/1.0 (+https://zovaro.vercel.app)" },
      signal: AbortSignal.timeout(25000),
      redirect: "follow"
    });
    const html = await response.text();
    return { ok: response.ok, status: response.status, html };
  })();
  cache.set(url, result);
  return result;
}

const jobs = JSON.parse(await fs.readFile(PATH, "utf8"));
let open = 0, review = 0, unavailable = 0;

for (const job of jobs) {
  try {
    if (!job.sourceUrl || !/^https:\/\//i.test(job.sourceUrl) || !job.sourceTitle) {
      job.status = "needs_review";
      job.statusReason = "Missing official source URL or source title.";
      review++;
      continue;
    }
    const source = await getSource(job.sourceUrl);
    if (!source.ok) {
      job.status = "temporarily_unverified";
      job.statusReason = "Official source returned HTTP " + source.status + "; listing withheld until a successful check.";
      unavailable++;
      continue;
    }
    const pageText = normalize(source.html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "));
    if (pageText.includes(normalize(job.sourceTitle))) {
      job.status = "open";
      job.verifiedAt = TODAY;
      job.statusReason = "";
      job.verificationNote = "Official employer source checked on " + TODAY + "; the role title is still present on the source page.";
      open++;
    } else {
      job.status = "needs_review";
      job.statusReason = "Role title was not found on the official source page; withheld pending manual confirmation.";
      review++;
    }
  } catch (error) {
    job.status = "temporarily_unverified";
    job.statusReason = "Source check failed: " + String(error?.message || "network error").slice(0, 180) + ". Listing withheld until a successful check.";
    unavailable++;
  }
}

await fs.writeFile(PATH, JSON.stringify(jobs, null, 2) + "\n", "utf8");
console.log("ZOVARO JOBS source check completed: " + TODAY);
console.log("Open and source-visible: " + open);
console.log("Needs manual review: " + review);
console.log("Temporarily unverified: " + unavailable);
