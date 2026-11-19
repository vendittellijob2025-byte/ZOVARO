import fs from "node:fs";

const registry = JSON.parse(fs.readFileSync("data/partner-opportunities.json", "utf8"));
const opportunities = Array.isArray(registry.opportunities) ? registry.opportunities : [];
const checkedAt = new Date().toISOString();
const queue = opportunities.filter(item => /^https:\/\//i.test(String(item.url || "")));
const results = [];
const concurrency = 4;

async function check(item) {
  const url = new URL(item.url);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "ZOVARO-Partner-Page-Monitor/1.0 (+https://zovaro.vercel.app)" },
      signal: AbortSignal.timeout(12000)
    });
    const finalUrl = new URL(response.url);
    const record = {
      partner: String(item.partner || "Unknown"),
      registryStatus: String(item.status || "not_recorded"),
      sourceUrl: item.url,
      httpStatus: response.status,
      result: response.status >= 200 && response.status < 400 ? "reachable" :
        response.status === 404 || response.status === 410 ? "not_found" :
        response.status === 401 || response.status === 403 || response.status === 429 ? "restricted_or_rate_limited" : "http_error",
      finalHost: finalUrl.host,
      checkedAt
    };
    await response.body?.cancel().catch(() => {});
    return record;
  } catch (error) {
    return {
      partner: String(item.partner || "Unknown"),
      registryStatus: String(item.status || "not_recorded"),
      sourceUrl: item.url,
      result: "request_failed",
      error: String(error?.name || "NetworkError"),
      checkedAt
    };
  }
}

for (let i = 0; i < queue.length; i += concurrency) {
  const batch = await Promise.all(queue.slice(i, i + concurrency).map(check));
  results.push(...batch);
}

const report = {
  generatedAt: checkedAt,
  mode: "public_partner_page_availability_check",
  checked: results.length,
  summary: {
    reachable: results.filter(item => item.result === "reachable").length,
    restrictedOrRateLimited: results.filter(item => item.result === "restricted_or_rate_limited").length,
    notFound: results.filter(item => item.result === "not_found").length,
    httpErrors: results.filter(item => item.result === "http_error").length,
    requestFailed: results.filter(item => item.result === "request_failed").length
  },
  results,
  limitations: [
    "An HTTP response only indicates that a public page responded; it does not confirm an affiliate programme is active, that ZOVARO is eligible, or that commissions/tracking work.",
    "403, 429, timeouts and other network failures are inconclusive and must not be interpreted as programme closure.",
    "This monitor does not submit forms, log in, apply, contact partners, or change approval status."
  ]
};

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/zovaro-affiliate-page-monitor.json", JSON.stringify(report, null, 2) + "\n", "utf8");

const summary = [
  "# ZOVARO — weekly affiliate page monitor",
  "",
  `Checked: ${report.generatedAt}`,
  `- Pages checked: **${report.checked}**`,
  `- Reachable: **${report.summary.reachable}**`,
  `- Restricted / rate limited: **${report.summary.restrictedOrRateLimited}**`,
  `- Not found (404/410): **${report.summary.notFound}**`,
  `- Other HTTP errors: **${report.summary.httpErrors}**`,
  `- Request failures: **${report.summary.requestFailed}**`,
  "",
  "A reachable page is not proof of programme approval, active commission terms or valid attribution. No applications or emails were sent."
].join("\n");
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + "\n");
console.log(summary);
console.log(JSON.stringify(results, null, 2));
