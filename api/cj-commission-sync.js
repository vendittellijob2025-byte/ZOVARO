import { d1Batch, d1Query, readSyncCursor, writeSyncCursor } from "../lib/cj-d1.js";

const CJ_COMMISSION_API = "https://commissions.api.cj.com/query";
const PUBLISHER_CID = "8068799";
const BACKFILL_DAYS = 30;
const MAX_PAGES = 100;
const KNOWN_CJ_PARTNERS = Object.freeze({
  "8022425": "cj-kaiya-baby",
  "7969352": "cj-padel-iberico",
  "7287203": "cj-fragrance-shop",
  "5824323": "cj-unice",
  "6260179": "cj-abelssoft",
  "5357356": "cj-rexing",
  "5384937": "cj-ecosmetics"
});

function partnerIdFor(id, name) {
  const key = String(id || "").trim();
  if (KNOWN_CJ_PARTNERS[key]) return KNOWN_CJ_PARTNERS[key];
  const slug = String(name || "advertiser").normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) || "advertiser";
  return ("cj-" + slug + "-" + key.replace(/[^a-z0-9_-]/gi, "").slice(0, 16)).slice(0, 60);
}

function numericOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeRecord(record) {
  const commissionId = String(record.commissionId || "").trim();
  if (!/^[a-z0-9_-]{1,80}$/i.test(commissionId)) {
    throw new Error("CJ returned a commission record without a safe commissionId.");
  }
  const shopperId = String(record.shopperId || "").trim();
  const referralId = /^[a-z0-9_-]{4,100}$/i.test(shopperId) ? shopperId : null;
  const actionType = String(record.actionType || "").toLowerCase();
  return {
    schema: "zovaro.cj-commission.v1",
    event_id: "cj-" + commissionId,
    event_type: actionType.endsWith("_sale") ? "cj_sale" : actionType.endsWith("_lead") ? "cj_lead" : "cj_commission",
    partner_id: partnerIdFor(record.advertiserId, record.advertiserName),
    partner_name: record.advertiserName || "CJ advertiser",
    advertiser_id: record.advertiserId == null ? null : String(record.advertiserId),
    commission_id: commissionId,
    order_id: record.orderId == null ? null : String(record.orderId).slice(0, 120),
    original_action_id: record.originalActionId == null ? null : String(record.originalActionId),
    referral_id: referralId,
    action_type: actionType,
    action_tracker_id: record.actionTrackerId == null ? null : String(record.actionTrackerId),
    action_tracker_name: record.actionTrackerName || null,
    action_status: record.actionStatus || null,
    validation_status: record.validationStatus || null,
    correction_reason: record.correctionReason || null,
    original: record.original !== false,
    event_date: record.eventDate || null,
    posting_date: record.postingDate || null,
    locking_date: record.lockingDate || null,
    sale_amount_usd: numericOrNull(record.saleAmountUsd),
    commission_amount_usd: numericOrNull(record.pubCommissionAmountUsd),
    sale_amount_publisher_currency: numericOrNull(record.saleAmountPubCurrency),
    commission_amount_publisher_currency: numericOrNull(record.pubCommissionAmountPubCurrency),
    currency_usd: "USD",
    website_id: record.websiteId == null ? null : String(record.websiteId),
    website_name: record.websiteName || null,
    items: Array.isArray(record.items) ? record.items.map(item => ({
      quantity: numericOrNull(item.quantity),
      sku: item.sku == null ? null : String(item.sku).slice(0, 120),
      sale_amount_publisher_currency: numericOrNull(item.perItemSaleAmountPubCurrency),
      commission_publisher_currency: numericOrNull(item.totalCommissionPubCurrency)
    })) : [],
    imported_at: new Date().toISOString(),
    verification: "cj_commission_detail_api"
  };
}

function buildQuery({ sincePostingDate, beforePostingDate, sinceCommissionId }) {
  const args = [
    "forPublishers: " + JSON.stringify([PUBLISHER_CID]),
    "sincePostingDate: " + JSON.stringify(sincePostingDate),
    "beforePostingDate: " + JSON.stringify(beforePostingDate),
    'actionTypes: ["sim_sale", "item_sale", "sim_lead", "item_lead"]'
  ];
  if (sinceCommissionId) args.push("sinceCommissionId: " + JSON.stringify(String(sinceCommissionId)));
  return `query {
    publisherCommissions(${args.join(", ")}) {
      count maxCommissionId payloadComplete
      records {
        actionStatus actionTrackerId actionTrackerName actionType advertiserId advertiserName
        commissionId correctionReason eventDate lockingDate orderId original originalActionId
        postingDate pubCommissionAmountUsd pubCommissionAmountPubCurrency saleAmountUsd
        saleAmountPubCurrency shopperId validationStatus websiteId websiteName
        items { quantity sku perItemSaleAmountPubCurrency totalCommissionPubCurrency }
      }
    }
  }`;
}

async function fetchPage(query, token) {
  const response = await fetch(CJ_COMMISSION_API, {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(45000)
  });
  const body = await response.text();
  if (!response.ok) throw new Error("CJ Commission Detail failed with HTTP " + response.status + ".");
  let payload;
  try { payload = JSON.parse(body); } catch { throw new Error("CJ Commission Detail returned invalid JSON."); }
  if (payload.errors?.length) throw new Error("CJ GraphQL error: " + payload.errors.map(x => x.message || "unknown").join("; "));
  const result = payload.data?.publisherCommissions;
  if (!result || !Array.isArray(result.records)) throw new Error("CJ response is incomplete.");
  return result;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const authorization = String(req.headers.authorization || "");
  const cronSecret = process.env.CRON_SECRET;
  const isCron = Boolean(cronSecret && authorization === "Bearer " + cronSecret);
  const token = isCron ? process.env.CJ_API_TOKEN : authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token || token.length < 20) return res.status(401).json({ error: "CJ authorization missing or invalid." });

  try {
    // Validate D1 configuration before spending CJ API calls.
    await d1Query("SELECT 1 AS ready");
    const now = new Date();
    const sincePostingDate = new Date(now.getTime() - BACKFILL_DAYS * 86400000).toISOString();
    const beforePostingDate = now.toISOString();
    let cursor = await readSyncCursor();
    let latestCursor = cursor;
    let pages = 0, received = 0, saved = 0, sales = 0, leads = 0;
    let complete = false;

    while (!complete) {
      if (++pages > MAX_PAGES) throw new Error("CJ pagination exceeded the safety limit.");
      const result = await fetchPage(buildQuery({ sincePostingDate, beforePostingDate, sinceCommissionId: cursor }), token);
      const records = result.records.map(normalizeRecord);
      received += records.length;
      if (records.length) {
        // 22 parameters per row; keep batches below conservative D1 query-size limits.
        for (let i = 0; i < records.length; i += 20) {
          const part = records.slice(i, i + 20);
          await d1Batch(part);
          saved += part.length;
          sales += part.filter(x => x.event_type === "cj_sale").length;
          leads += part.filter(x => x.event_type === "cj_lead").length;
        }
      }
      const nextCursor = result.maxCommissionId ? String(result.maxCommissionId) : cursor;
      if (!result.payloadComplete) {
        if (!nextCursor || nextCursor === cursor) throw new Error("CJ pagination returned no advancing cursor.");
        cursor = nextCursor;
        latestCursor = nextCursor;
        await writeSyncCursor(latestCursor);
      } else {
        if (nextCursor) latestCursor = nextCursor;
        complete = true;
      }
    }
    if (latestCursor) await writeSyncCursor(latestCursor);
    await d1Query(
      "INSERT INTO cj_sync_state(state_key,state_value,updated_at) VALUES(?,?,?) ON CONFLICT(state_key) DO UPDATE SET state_value=excluded.state_value, updated_at=excluded.updated_at",
      ["last_synced_at", new Date().toISOString(), new Date().toISOString()]
    );
    return res.status(200).json({
      success: true, publisher_cid: PUBLISHER_CID, pages_read: pages,
      records_received: received, records_upserted: saved,
      sale_records: sales, lead_records: leads, max_commission_id: latestCursor,
      backfill_window_days: BACKFILL_DAYS, completed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("ZOVARO CJ D1 commission sync error:", error);
    return res.status(503).json({ error: "CJ commission ledger sync unavailable.", detail: String(error.message || error).slice(0, 240) });
  }
}
