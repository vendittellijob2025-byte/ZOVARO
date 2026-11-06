import crypto from "node:crypto";
import { list, get } from "@vercel/blob";

function readCookie(header, name) {
  const entry = String(header || "").split(";").map(part => part.trim()).find(part => part.startsWith(name + "="));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : "";
}

function verifySession(token, secret) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return false;
  const expected = crypto.createHmac("sha256", secret).update(parts[0]).digest();
  let received;
  try { received = Buffer.from(parts[1], "base64url"); } catch { return false; }
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return payload.role === "admin" && Number(payload.exp) > Date.now();
  } catch { return false; }
}

async function readJson(pathname) {
  const blob = await get(pathname, { access: "private", useCache: false });
  if (!blob || blob.statusCode !== 200 || !blob.stream) return null;
  const buffer = await new Response(blob.stream).arrayBuffer();
  return JSON.parse(Buffer.from(buffer).toString("utf8"));
}

async function collectLatest(prefix, limit) {
  const page = await list({ prefix, limit: 1000 });
  const latest = [...page.blobs]
    .sort((a, b) => Date.parse(b.uploadedAt || 0) - Date.parse(a.uploadedAt || 0))
    .slice(0, limit);
  const entries = await Promise.all(latest.map(async blob => {
    try { return await readJson(blob.pathname); }
    catch (error) {
      console.error("ZOVARO admin event read error:", error);
      return null;
    }
  }));
  return entries.filter(Boolean);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.ZOVARO_ADMIN_SESSION_SECRET;
  const token = readCookie(req.headers.cookie, "zovaro_admin");
  if (!secret || secret.length < 32 || !verifySession(token, secret)) {
    return res.status(401).json({ error: "Sessione amministratore assente o scaduta." });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: "Archivio eventi non configurato: manca BLOB_READ_WRITE_TOKEN." });
  }

  try {
    const [clicks, updates] = await Promise.all([
      collectLatest("lead-sales/events/clicks/", 100),
      collectLatest("lead-sales/events/partner-updates/", 100)
    ]);
    const events = [...clicks, ...updates]
      .sort((a, b) => Date.parse(b.received_at || b.occurred_at || 0) - Date.parse(a.received_at || a.occurred_at || 0))
      .slice(0, 200);

    const closed = updates.filter(event => event.status === "closed_won" && Number(event.amount) >= 0 && event.amount !== null);
    const revenueByCurrency = {};
    for (const event of closed) {
      const currency = String(event.currency || "UNSPECIFIED").toUpperCase();
      revenueByCurrency[currency] = Number(((revenueByCurrency[currency] || 0) + Number(event.amount || 0)).toFixed(2));
    }

    return res.status(200).json({
      generated_at: new Date().toISOString(),
      sample_limit_per_type: 100,
      counts: {
        clicks: clicks.length,
        partner_updates: updates.length,
        leads: updates.filter(event => event.status === "lead").length,
        appointments: updates.filter(event => event.status === "appointment").length,
        closed_won: closed.length
      },
      reported_revenue_by_currency: revenueByCurrency,
      events
    });
  } catch (error) {
    console.error("ZOVARO admin dashboard error:", error);
    return res.status(503).json({ error: "Impossibile leggere l'archivio privato. Verifica che il Blob store collegato sia privato e attivo." });
  }
}
