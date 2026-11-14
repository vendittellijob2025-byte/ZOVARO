const API_URL = "https://links.api.jobtechdev.se/joblinks";
const ALLOWED_ORIGIN = "https://zovaro.vercel.app";

function text(value, max = 500) {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function first(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function categoryFor(item) {
  const occupation = [
    item.occupation?.label, item.occupation_group?.label, item.occupation_field?.label,
    item.category, item.headline, item.title, item.description
  ].filter(Boolean).join(" ").toLowerCase();
  const rules = [
    ["Healthcare & Medical", /nurs|doctor|physician|health|medical|care worker|sjuk|läk|vård|tand|apotek|undersköterska/],
    ["Education & Training", /teacher|teach|educat|school|university|tutor|lärare|pedagog|utbild|skol/],
    ["IT, Software & Data", /software|developer|programmer|data|it[- ]?support|system|network|cyber|utvecklare|programmerare|systemutveckl|it[- ]teknik/],
    ["Finance & Accounting", /account|finance|bank|payroll|econom|bookkeep|redovis|revisor|ekonom|lönespecialist/],
    ["Legal & Compliance", /lawyer|legal|compliance|jurist|advokat|juridik/],
    ["Construction & Skilled Trades", /construction|electrician|plumb|carpenter|welder|builder|bygg|elektrik|snick|svets|rörmok/],
    ["Transport & Logistics", /driver|truck|logistic|warehouse|transport|courier|lager|chaufför|lastbil|distribut/],
    ["Food & Hospitality", /chef|cook|restaurant|hotel|waiter|bartend|kitchen|kock|servit|restaurang|hotell|köks/],
    ["Retail & Customer Service", /retail|shop|store|cashier|customer service|kundtjänst|butik|kassa|försäljare/],
    ["Marketing & Communications", /marketing|communicat|social media|pr[- ]|marknadsför|kommunikat|journalist/],
    ["Engineering & Technology", /engineer|engineering|technician|technical|ingenjör|tekniker|automation|mekanik/],
    ["Manufacturing & Production", /manufactur|production|factory|operator|production worker|industri|produktion|montör|operatör/],
    ["Agriculture & Farming", /farm|agricultur|forestry|agronom|lantbruk|jordbruk|skog|trädgård/],
    ["Beauty & Personal Care", /hairdress|beauty|barber|spa|frisör|hudterapeut|nagel/],
    ["Arts, Media & Creative", /design|creative|artist|media|photograph|film|video|grafisk|formgiv|kultur/],
    ["Security & Events", /security|guard|police|event|väktare|säkerhet|ordningsvakt/],
    ["Cleaning & Sanitation", /clean|cleaner|sanitation|städ|renhåll/],
    ["Business & Management", /manager|management|business|director|chef|ledning|verksamhetsutveckl|projektled/],
    ["Office & Administration", /administrat|assistant|secretary|office|reception|handläggare|sekreterare|kontor/],
    ["Aviation & Aerospace", /pilot|aviation|aircraft|flight|flyg|flygteknik/],
    ["Maritime & Offshore", /marine|maritime|offshore|ship|vessel|sjöfart|fartyg|sjöman/],
    ["Real Estate & Property", /real estate|property|estate agent|fastighet|mäklare|fastighetsförvalt/],
    ["Science & Research", /research|scientist|laboratory|lab technician|forsk|laborator|biolog|kemist/],
    ["Energy & Utilities", /energy|electric grid|power plant|utilities|energi|elnät|kraftverk/],
    ["Environment & Sustainability", /environment|sustainab|environmental|miljö|hållbarhet/],
    ["Sports & Recreation", /sport|coach|fitness|trainer|athletic|idrott|tränare|fritid/],
    ["Travel & Tourism", /travel|tourism|guide|resort|turism|reseledare|guide/],
    ["Public Sector & Government", /government|public sector|municipal|municipality|myndighet|kommun|region|statlig|offentlig/]
  ];
  return rules.find(([, pattern]) => pattern.test(occupation))?.[0] || "";
}

function normalize(item) {
  const address = item.workplace_address || item.address || {};
  const employer = item.employer || {};
  const sources = Array.isArray(item.source_links) ? item.source_links : [];
  const applicationUrl = first(
    item.url, item.webpage_url, item.source_url, item.sourceUrl, item.link,
    sources[0]?.url, sources[0]?.link
  );
  if (!/^https:\/\//i.test(applicationUrl)) return null;
  const title = first(item.headline, item.title, item.name);
  if (!title) return null;
  const description = first(
    typeof item.description === "string" ? item.description : item.description?.text,
    item.summary, item.snippet
  );
  const city = first(address.municipality, address.city, item.municipality, item.city);
  const region = first(address.region, item.region);
  const workplaceText = [title, description, item.workplace, item.workplace_type].join(" ").toLowerCase();
  const workplace = /\bhybrid\b|hybridarbete|hybrid work/.test(workplaceText)
    ? "Hybrid"
    : /\bremote\b|work from home|distansarbete|distansjobb|på distans/.test(workplaceText)
      ? "Remote"
      : city ? "On-site" : "Unknown";
  const employment = first(item.employment_type?.label, item.job_type, item.employmentType);
  const salary = first(item.salary_description, item.salary, item.salaryText);
  const published = first(item.publication_date, item.published_at, item.publishedAt);
  const sourceName = first(sources[0]?.name, sources[0]?.label, item.source_name, "JobAd Links / Arbetsförmedlingen");
  const category = categoryFor({...item, description});
  if (!category) return null;
  return {
    id: "jobtech-" + text(item.id || item.ad_id || item.external_id || applicationUrl, 120).replace(/[^a-zA-Z0-9_-]/g, "-"),
    title: text(title, 180),
    company: text(employer.name || item.employer_name || item.company, 140),
    category,
    country: "Sweden",
    region: text(region, 100),
    city: text(city, 100),
    location: [city, region, "Sweden"].filter(Boolean).join(", "),
    jobType: text(employment, 80) || "See original listing",
    workplace,
    salaryText: text(salary, 120) || null,
    description: text(description, 1200) || "Open the original job advertisement for the complete role description and application instructions.",
    applicationUrl,
    sourceName: text(sourceName, 120),
    sourceUrl: applicationUrl,
    sourceType: "external-job-board",
    approvedAt: published || null,
    independentlyVerified: false,
    externalSource: "JobAd Links"
  };
}

export default async function handler(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const url = new URL(req.url || "/", ALLOWED_ORIGIN);
  const country = text(url.searchParams.get("country"), 40);
  if (country.toLowerCase() !== "sweden") {
    return res.status(400).json({ error: "This external source currently covers Sweden only." });
  }
  const query = text(url.searchParams.get("q"), 100);
  if (query.length < 2) return res.status(400).json({ error: "Enter a city or job search term." });
  const offset = Math.max(0, Math.min(2000, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0));
  const api = new URL(API_URL);
  api.searchParams.set("q", query);
  api.searchParams.set("limit", "100");
  api.searchParams.set("offset", String(offset));
  api.searchParams.set("sort", "pubdate-desc");
  try {
    const response = await fetch(api, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(9000)
    });
    if (!response.ok) {
      console.error("JobAd Links upstream status:", response.status);
      return res.status(502).json({ error: "The Swedish public job source is temporarily unavailable." });
    }
    const payload = await response.json();
    const raw = Array.isArray(payload) ? payload :
      Array.isArray(payload.hits) ? payload.hits :
      Array.isArray(payload.joblinks) ? payload.joblinks :
      Array.isArray(payload.results) ? payload.results : [];
    const jobs = raw.map(normalize).filter(Boolean);
    return res.status(200).json({
      source: "JobAd Links / Arbetsförmedlingen",
      country: "Sweden",
      fetched: raw.length,
      count: jobs.length,
      jobs
    });
  } catch (error) {
    console.error("JobAd Links request failed:", error?.message || error);
    return res.status(502).json({ error: "Unable to retrieve Swedish job opportunities right now." });
  }
}
