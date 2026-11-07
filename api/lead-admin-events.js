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

  // The connected private Blob store uses Vercel OIDC.
  // @vercel/blob resolves the request-scoped OIDC token together with BLOB_STORE_ID.
  // Do not require a long-lived BLOB_READ_WRITE_TOKEN on this Vercel deployment.
  if (!process.env.BLOB_STORE_ID) {
    return res.status(503).json({ error: "Archivio eventi non configurato: il Blob Store non risulta collegato a questo ambiente." });
  }

  try {
    const [clicks, updates, cjCommissions, cjState] = await Promise.all([
      collectLatest("lead-sales/events/clicks/", 100),
      collectLatest("lead-sales/events/partner-updates/", 100),
      collectLatest("cj-commissions/records/", 100),
      readJson("cj-commissions/state.json").catch(() => null)
    ]);

    const cjEvents = cjCommissions.map(record => ({
      schema: record.schema,
      event_id: record.event_id,
      event_type: record.event_type,
      partner_id: record.partner_id,
      partner_name: record.partner_name,
      referral_id: record.referral_id,
      item_id: record.order_id || record.commission_id,
      amount: record.sale_amount_usd,
      commission_amount_usd: record.commission_amount_usd,
      currency: "USD",
      status: record.action_status,
      validation_status: record.validation_status,
      occurred_at: record.posting_date || record.event_date,
      verification: record.verification
    }));

    const events = [...clicks, ...updates, ...cjEvents]
      .sort((a, b) => Date.parse(b.received_at || b.occurred_at || 0) - Date.parse(a.received_at || a.occurred_at || 0))
      .slice(0, 300);

    const closed = updates.filter(event => event.status === "closed_won" && Number(event.amount) >= 0 && event.amount !== null);
    const revenueByCurrency = {};
    for (const event of closed) {
      const currency = String(event.currency || "UNSPECIFIED").toUpperCase();
      revenueByCurrency[currency] = Number(((revenueByCurrency[currency] || 0) + Number(event.amount || 0)).toFixed(2));
    }

    const sumUsd = (records, field) => Number(records.reduce(
      (sum, record) => sum + (Number.isFinite(Number(record[field])) ? Number(record[field]) : 0),
      0
    ).toFixed(2));
    const cjSales = cjCommissions.filter(record => record.event_type === "cj_sale");
    const cjSaleOrders = new Set(cjSales.map(record => record.order_id || record.commission_id));

    return res.status(200).json({
      generated_at: new Date().toISOString(),
      sample_limit_per_type: 100,
      counts: {
        clicks: clicks.length,
        partner_updates: updates.length,
        leads: updates.filter(event => event.status === "lead").length,
        appointments: updates.filter(event => event.status === "appointment").length,
        closed_won: closed.length,
        cj_commission_records: cjCommissions.length,
        cj_sale_orders: cjSaleOrders.size,
        cj_lead_records: cjCommissions.filter(record => record.event_type === "cj_lead").length
      },
      reported_revenue_by_currency: revenueByCurrency,
      cj_summary: {
        last_synced_at: cjState?.last_synced_at || null,
        sale_amount_usd: sumUsd(cjCommissions, "sale_amount_usd"),
        commission_amount_usd: sumUsd(cjCommissions, "commission_amount_usd"),
        pending_commission_amount_usd: sumUsd(
          cjCommissions.filter(record =>
            String(record.validation_status || "").toUpperCase() === "PENDING" ||
            String(record.action_status || "").toLowerCase() === "new"
          ),
          "commission_amount_usd"
        ),
        records_with_referral_id: cjCommissions.filter(record => Boolean(record.referral_id)).length,
        records_without_referral_id: cjCommissions.filter(record => !record.referral_id).length
      },
      events
    });
  } catch (error) {
    console.error("ZOVARO admin dashboard error:", error);
    return res.status(503).json({ error: "Impossibile leggere l'archivio privato tramite OIDC. Verifica il collegamento Blob del progetto e la versione SDK." });
  }
}
