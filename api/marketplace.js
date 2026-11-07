import crypto from "node:crypto";
import { get, list, put } from "@vercel/blob";

const submissions = new Map();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value, max) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  return null;
}

function getClientKey(req) {
  return String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim().slice(0, 80);
}

function checkRateLimit(req) {
  const key = getClientKey(req);
  const now = Date.now();
  const current = submissions.get(key);
  if (!current || current.resetAt <= now) {
    submissions.set(key, { count: 1, resetAt: now + 30 * 60 * 1000 });
    return true;
  }
  if (current.count >= 5) return false;
  current.count += 1;
  return true;
}

async function readRecord(pathname) {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const bytes = await new Response(result.stream).arrayBuffer();
  return JSON.parse(Buffer.from(bytes).toString("utf8"));
}

async function latestRecords(type, limit = 100) {
  const page = await list({ prefix: `marketplace/${type}/`, limit: 1000 });
  const blobs = [...page.blobs]
    .sort((a, b) => Date.parse(b.uploadedAt || 0) - Date.parse(a.uploadedAt || 0))
    .slice(0, limit);
  const records = await Promise.all(blobs.map(blob => readRecord(blob.pathname).catch(() => null)));
  return records.filter(Boolean);
}

function publicRecord(record) {
  return {
    id: record.id,
    type: record.type,
    title: record.title,
    category: record.category || null,
    company: record.company || null,
    jobType: record.jobType || null,
    workplace: record.workplace || null,
    condition: record.condition || null,
    price: record.price ?? null,
    currency: record.currency || null,
    location: record.location,
    description: record.description,
    contactEmail: record.publicContact === true ? record.contactEmail : null,
    approvedAt: record.reviewedAt || null
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (!process.env.BLOB_STORE_ID) {
    return res.status(503).json({ error: "Marketplace storage is not connected in this environment." });
  }

  if (req.method === "GET") {
    const url = new URL(req.url || "/", "https://zovaro.vercel.app");
    const requestedType = url.searchParams.get("type");
    if (requestedType && !["job", "product"].includes(requestedType)) {
      return res.status(400).json({ error: "Invalid listing type." });
    }
    try {
      const types = requestedType ? [requestedType] : ["job", "product"];
      const groups = await Promise.all(types.map(async type => {
        const records = await latestRecords(type, 100);
        return records
          .filter(record => record.status === "approved")
          .sort((a, b) => Date.parse(b.reviewedAt || b.createdAt) - Date.parse(a.reviewedAt || a.createdAt))
          .map(publicRecord);
      }));
      const output = requestedType ? groups[0] : { jobs: groups[0], products: groups[1] };
      return res.status(200).json(output);
    } catch (error) {
      console.error("ZOVARO marketplace read error:", error);
      return res.status(503).json({ error: "Marketplace listings are temporarily unavailable." });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!checkRateLimit(req)) {
    return res.status(429).json({ error: "Too many submissions. Please try again later." });
  }

  const body = readBody(req);
  if (!body || typeof body !== "object") return res.status(400).json({ error: "Invalid submission." });
  if (clean(body.website, 200)) return res.status(200).json({ received: true });

  const type = clean(body.type, 20).toLowerCase();
  if (!["job", "product"].includes(type)) return res.status(400).json({ error: "Invalid listing type." });

  const title = clean(body.title, 100);
  const description = clean(body.description, type === "job" ? 3000 : 2000);
  const location = clean(body.location, 100);
  const contactEmail = clean(body.contactEmail, 254).toLowerCase();
  if (title.length < 4 || description.length < 20 || !location || !EMAIL_RE.test(contactEmail)) {
    return res.status(400).json({ error: "Please complete all required fields with valid information." });
  }
  if (body.publicContact !== true) {
    return res.status(400).json({ error: "Explicit consent to display the contact email is required." });
  }

  const record = {
    schema: "zovaro.marketplace.v1",
    id: crypto.randomUUID(),
    type,
    title,
    description,
    location,
    contactEmail,
    publicContact: true,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  if (type === "job") {
    record.company = clean(body.company, 100);
    record.jobType = clean(body.jobType, 30);
    record.workplace = clean(body.workplace, 20);
    const validTypes = ["Full-time", "Part-time", "Contract", "Freelance", "Temporary", "Internship"];
    const validWorkplaces = ["On-site", "Hybrid", "Remote"];
    if (record.company.length < 2 || !validTypes.includes(record.jobType) || !validWorkplaces.includes(record.workplace)) {
      return res.status(400).json({ error: "Please provide valid employer, employment type and workplace details." });
    }
  } else {
    record.category = clean(body.category, 40);
    record.condition = clean(body.condition, 20);
    record.currency = clean(body.currency, 3).toUpperCase();
    record.price = Number(body.price);
    const categories = ["Electronics", "Home & Living", "Fashion", "Sports", "Baby & Kids", "Vehicles", "Other"];
    const conditions = ["New", "Like new", "Very good", "Good", "Fair"];
    if (!categories.includes(record.category) || !conditions.includes(record.condition) ||
        !["USD", "EUR", "COP", "GBP"].includes(record.currency) ||
        !Number.isFinite(record.price) || record.price <= 0 || record.price > 100000000) {
      return res.status(400).json({ error: "Please provide valid category, condition, price and currency." });
    }
  }

  try {
    await put(`marketplace/${type}/${record.id}.json`, JSON.stringify(record), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/json"
    });
    return res.status(201).json({
      received: true,
      status: "pending_review",
      message: "Thank you. Your listing has been received and will appear only after ZOVARO moderation."
    });
  } catch (error) {
    console.error("ZOVARO marketplace submission storage error:", error);
    return res.status(503).json({ error: "We could not save your listing. Please try again later." });
  }
}
