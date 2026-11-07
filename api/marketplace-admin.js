import crypto from "node:crypto";
import { get, list, put } from "@vercel/blob";

function readCookie(header, name) {
  const entry = String(header || "").split(";").map(part => part.trim()).find(part => part.startsWith(name + "="));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : "";
}

function verifySession(token, secret) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return false;
  const expected = crypto.createHmac("sha256", secret).update(parts[0]).digest();
  const received = Buffer.from(parts[1], "base64url");
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return payload.role === "admin" && Number(payload.exp) > Date.now();
  } catch { return false; }
}

async function readRecord(pathname) {
  const blob = await get(pathname, { access: "private", useCache: false });
  if (!blob || blob.statusCode !== 200 || !blob.stream) return null;
  const bytes = await new Response(blob.stream).arrayBuffer();
  return JSON.parse(Buffer.from(bytes).toString("utf8"));
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  const secret = process.env.ZOVARO_ADMIN_SESSION_SECRET;
  const token = readCookie(req.headers.cookie, "zovaro_admin");
  if (!secret || secret.length < 32 || !verifySession(token, secret)) {
    return res.status(401).json({ error: "Admin session missing or expired." });
  }
  if (!process.env.BLOB_STORE_ID) return res.status(503).json({ error: "Private marketplace storage is not connected." });

  if (req.method === "GET") {
    try {
      const page = await list({ prefix: "marketplace/", limit: 1000 });
      const blobs = [...page.blobs]
        .sort((a, b) => Date.parse(b.uploadedAt || 0) - Date.parse(a.uploadedAt || 0))
        .slice(0, 150);
      const records = await Promise.all(blobs.map(blob => readRecord(blob.pathname).catch(() => null)));
      return res.status(200).json({ pending: records.filter(record => record && record.status === "pending") });
    } catch (error) {
      console.error("ZOVARO marketplace moderation read error:", error);
      return res.status(503).json({ error: "Unable to read pending marketplace listings." });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const type = String(body.type || "");
  const id = String(body.id || "");
  const decision = String(body.decision || "");
  if (!["job", "product"].includes(type) || !/^[0-9a-f-]{36}$/i.test(id) || !["approve", "reject"].includes(decision)) {
    return res.status(400).json({ error: "Invalid moderation request." });
  }

  const pathname = `marketplace/${type}/${id}.json`;
  try {
    const record = await readRecord(pathname);
    if (!record || record.id !== id || record.type !== type) return res.status(404).json({ error: "Listing not found." });
    if (record.status !== "pending") return res.status(409).json({ error: "Listing has already been reviewed." });
    record.status = decision === "approve" ? "approved" : "rejected";
    record.reviewedAt = new Date().toISOString();
    await put(pathname, JSON.stringify(record), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json"
    });
    return res.status(200).json({ id, status: record.status });
  } catch (error) {
    console.error("ZOVARO marketplace moderation error:", error);
    return res.status(503).json({ error: "Unable to update listing status." });
  }
}
