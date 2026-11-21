import crypto from "node:crypto";
import { list, get } from "@vercel/blob";
import { d1Query } from "../lib/cj-d1.js";

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
  // CJ commissions are now stored as one batch per sync, not one Blob per
  // commission. Flatten batches while continuing to read legacy single records.
  return entries.filter(Boolean).flatMap(entry =>
    Array.isArray(entry.records) ? entry.records : [entry]
  );
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

  try {
    // Blob remains a best-effort legacy source during migration. A suspended
    // Blob store must not prevent the private D1 CJ ledger from being viewed.
    const blobReads = process.env.BLOB_STORE_ID
      ? await Promise.allSettled([
          collectLatest("lead-sales/events/clicks/", 100),
          collectLatest("lead-sales/events/partner-updates/", 100),
          collectLatest("cj-commissions/records/", 100),
          readJson("cj-commissions/state.json")
        ])
      : [];
    const blobValue = index => blobReads[index]?.status === "fulfilled" ? blobReads[index].value : [];
    let clicks = blobValue(0);
    let clickLedgerTotal = clicks.length;
    let updates = blobValue(1);
    let cjCommissions = blobValue(2);
    let cjState = blobReads[3]?.status === "fulfilled" ? blobReads[3].value : null;
    let cjLedgerSource = process.env.BLOB_STORE_ID ? "legacy_blob" : "unavailable";
    let cjLedgerTotals = null;
    if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_D1_DATABASE_ID && process.env.CLOUDFLARE_API_TOKEN) {
      const [d1Records, d1State, d1Totals, d1PartnerRecords, d1PartnerTotals, d1ClickRecords, d1ClickTotals] = await Promise.all([
        d1Query("SELECT record_json FROM cj_commissions ORDER BY COALESCE(posting_date,event_date) DESC LIMIT 100"),
        d1Query("SELECT state_key,state_value FROM cj_sync_state WHERE state_key IN (?,?)", ["last_synced_at", "max_commission_id"]),
        d1Query(`SELECT COUNT(*) AS total_records,
          SUM(CASE WHEN lower(action_type) LIKE '%_sale' THEN 1 ELSE 0 END) AS sale_records,
          SUM(CASE WHEN lower(action_type) LIKE '%_lead' THEN 1 ELSE 0 END) AS lead_records,
          COUNT(DISTINCT CASE WHEN lower(action_type) LIKE '%_sale' THEN COALESCE(order_id,commission_id) END) AS sale_orders,
          SUM(COALESCE(sale_amount_usd,0)) AS sale_amount_usd,
          SUM(COALESCE(commission_amount_usd,0)) AS commission_amount_usd,
          SUM(CASE WHEN upper(COALESCE(validation_status,''))='PENDING' OR lower(COALESCE(action_status,''))='new' THEN COALESCE(commission_amount_usd,0) ELSE 0 END) AS pending_commission_amount_usd,
          SUM(CASE WHEN referral_id IS NOT NULL AND referral_id<>'' THEN 1 ELSE 0 END) AS records_with_referral_id
          FROM cj_commissions`),
        d1Query("SELECT record_json FROM partner_conversion_events ORDER BY occurred_at DESC LIMIT 100"),
        d1Query("SELECT COUNT(*) AS total_records, SUM(CASE WHEN status='lead' THEN 1 ELSE 0 END) AS leads, SUM(CASE WHEN status='appointment' THEN 1 ELSE 0 END) AS appointments, SUM(CASE WHEN status='closed_won' THEN 1 ELSE 0 END) AS closed_won FROM partner_conversion_events"),
        d1Query("SELECT record_json FROM outbound_click_events ORDER BY occurred_at DESC LIMIT 100"),
        d1Query("SELECT COUNT(*) AS total_records FROM outbound_click_events")
      ]);
      const parsed = (d1Records.results || []).map(row => {
        try { return JSON.parse(row.record_json); } catch { return null; }
      }).filter(Boolean);
      cjCommissions = parsed;
      clicks = (d1ClickRecords.results || []).map(row => {
        try { return JSON.parse(row.record_json); } catch { return null; }
      }).filter(Boolean);
      clickLedgerTotal = Number(d1ClickTotals.results?.[0]?.total_records || 0);
      updates = (d1PartnerRecords.results || []).map(row => {
        try { return JSON.parse(row.record_json); } catch { return null; }
      }).filter(Boolean);
      const stateMap = Object.fromEntries((d1State.results || []).map(row => [row.state_key, row.state_value]));
      cjState = { last_synced_at: stateMap.last_synced_at || null, max_commission_id: stateMap.max_commission_id || null };
      cjLedgerSource = "cloudflare_d1";
      cjLedgerTotals = d1Totals.results?.[0] || null;
      const partnerTotals = d1PartnerTotals.results?.[0] || {};
      var partnerLedgerTotals = partnerTotals;
    }

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
    const clickReferralIds = new Set(clicks.map(event => String(event.referral_id || "").trim()).filter(Boolean));
    const cjRecordsMatchingClicks = cjCommissions.filter(record =>
      Boolean(record.referral_id) && clickReferralIds.has(String(record.referral_id).trim())
    ).length;

    return res.status(200).json({
      generated_at: new Date().toISOString(),
      sample_limit_per_type: 100,
      counts: {
        clicks: clickLedgerTotal,
        partner_updates: Number(partnerLedgerTotals?.total_records ?? updates.length),
        leads: Number(partnerLedgerTotals?.leads ?? updates.filter(event => event.status === "lead").length),
        appointments: Number(partnerLedgerTotals?.appointments ?? updates.filter(event => event.status === "appointment").length),
        closed_won: Number(partnerLedgerTotals?.closed_won ?? closed.length),
        cj_commission_records: Number(cjLedgerTotals?.total_records ?? cjCommissions.length),
        cj_sale_orders: Number(cjLedgerTotals?.sale_orders ?? cjSaleOrders.size),
        cj_lead_records: Number(cjLedgerTotals?.lead_records ?? cjCommissions.filter(record => record.event_type === "cj_lead").length),
        cj_records_matching_clicks: cjRecordsMatchingClicks
      },
      reported_revenue_by_currency: revenueByCurrency,
      cj_summary: {
        ledger_source: cjLedgerSource,
        last_synced_at: cjState?.last_synced_at || null,
        sale_amount_usd: cjLedgerTotals ? Number(cjLedgerTotals.sale_amount_usd || 0) : sumUsd(cjCommissions, "sale_amount_usd"),
        commission_amount_usd: cjLedgerTotals ? Number(cjLedgerTotals.commission_amount_usd || 0) : sumUsd(cjCommissions, "commission_amount_usd"),
        pending_commission_amount_usd: cjLedgerTotals ? Number(cjLedgerTotals.pending_commission_amount_usd || 0) : sumUsd(
          cjCommissions.filter(record =>
            String(record.validation_status || "").toUpperCase() === "PENDING" ||
            String(record.action_status || "").toLowerCase() === "new"
          ),
          "commission_amount_usd"
        ),
        records_with_referral_id: Number(cjLedgerTotals?.records_with_referral_id ?? cjCommissions.filter(record => Boolean(record.referral_id)).length),
        records_without_referral_id: cjLedgerTotals ? Math.max(0, Number(cjLedgerTotals.total_records || 0) - Number(cjLedgerTotals.records_with_referral_id || 0)) : cjCommissions.filter(record => !record.referral_id).length
      },
      events
    });
  } catch (error) {
    console.error("ZOVARO admin dashboard error:", error);
    return res.status(503).json({ error: "Impossibile leggere l'archivio privato tramite OIDC. Verifica il collegamento Blob del progetto e la versione SDK." });
  }
}
