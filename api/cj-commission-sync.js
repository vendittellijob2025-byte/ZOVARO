import { get, put } from "@vercel/blob";

const CJ_COMMISSION_API = "https://commissions.api.cj.com/query";
const PUBLISHER_ID = "101881140";
const STATE_PATH = "cj-commissions/state.json";
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

function partnerIdFor(advertiserId, advertiserName) {
  const id = String(advertiserId || "").trim();
  if (!id) return "cj-unknown";
  if (KNOWN_CJ_PARTNERS[id]) return KNOWN_CJ_PARTNERS[id];

  const slug = String(advertiserName || "advertiser")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "advertiser";
  const safeId = id.replace(/[^a-z0-9_-]/gi, "").slice(0, 16);
  return ("cj-" + slug + "-" + safeId).slice(0, 60);
}

function numericOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

async function readJsonBlob(path) {
  const blob = await get(path, { access: "private", useCache: false });
  if (!blob || blob.statusCode !== 200 || !blob.stream) return null;
  const buffer = await new Response(blob.stream).arrayBuffer();
  return JSON.parse(Buffer.from(buffer).toString("utf8"));
}

async function writeJsonBlob(path, value) {
  await put(path, JSON.stringify(value), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json"
  });
}

async function fetchWithRetry(query, token) {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let response;
    try {
      response = await fetch(CJ_COMMISSION_API, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(45000)
      });
    } catch (error) {
      lastError = error;
      if (attempt === 4) break;
      const delay = Math.min(1500 * (2 ** attempt), 20000);
      console.warn("CJ Commission Detail network retry " + (attempt + 1) + " in " + delay + " ms.");
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }

    const body = await response.text();
    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === 4) {
        throw new Error("CJ Commission Detail failed with HTTP " + response.status + ".");
      }
      const retryAfter = Number(response.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 60000)
        : Math.min(2000 * (2 ** attempt), 30000);
      console.warn("CJ Commission Detail rate/temporary limit; retrying in " + delay + " ms.");
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      throw new Error("CJ Commission Detail returned invalid JSON.");
    }
    if (payload.errors?.length) {
      throw new Error(
        "CJ Commission Detail GraphQL error: " +
        payload.errors.map(item => item.message || "unknown error").join("; ")
      );
    }
    const result = payload.data?.publisherCommissions;
    if (!result || !Array.isArray(result.records)) {
      throw new Error("CJ Commission Detail response is incomplete.");
    }
    return result;
  }
  throw lastError || new Error("CJ Commission Detail request failed.");
}

function buildQuery({ sincePostingDate, beforePostingDate, sinceCommissionId }) {
  const args = [
    "forPublishers: " + JSON.stringify([PUBLISHER_ID]),
    "sincePostingDate: " + JSON.stringify(sincePostingDate),
    "beforePostingDate: " + JSON.stringify(beforePostingDate),
    'actionTypes: ["sim_sale", "item_sale", "sim_lead", "item_lead"]'
  ];
  if (sinceCommissionId) {
    args.push("sinceCommissionId: " + JSON.stringify(String(sinceCommissionId)));
  }

  return `
    query {
      publisherCommissions(${args.join(", ")}) {
        count
        maxCommissionId
        payloadComplete
        records {
          actionStatus
          actionTrackerId
          actionTrackerName
          actionType
          advertiserId
          advertiserName
          commissionId
          correctionReason
          eventDate
          lockingDate
          orderId
          original
          originalActionId
          postingDate
          pubCommissionAmountUsd
          pubCommissionAmountPubCurrency
          saleAmountUsd
          saleAmountPubCurrency
          shopperId
          validationStatus
          websiteId
          websiteName
          items {
            quantity
            sku
            perItemSaleAmountPubCurrency
            totalCommissionPubCurrency
          }
        }
      }
    }
  `;
}

function normalizeRecord(record) {
  const commissionId = String(record.commissionId || "").trim();
  if (!/^[a-z0-9_-]{1,80}$/i.test(commissionId)) {
    throw new Error("CJ returned a commission record without a safe commissionId.");
  }

  const shopperId = String(record.shopperId || "").trim();
  const referralId = /^[a-z0-9_-]{4,100}$/i.test(shopperId) ? shopperId : null;
  const actionType = String(record.actionType || "").toLowerCase();
  const eventType = actionType.endsWith("_sale")
    ? "cj_sale"
    : actionType.endsWith("_lead")
      ? "cj_lead"
      : "cj_commission";

  return {
    schema: "zovaro.cj-commission.v1",
    event_id: "cj-" + commissionId,
    event_type: eventType,
    partner_id: partnerIdFor(record.advertiserId, record.advertiserName),
    partner_name: record.advertiserName || "CJ advertiser",
    advertiser_id: String(record.advertiserId || ""),
    commission_id: commissionId,
    order_id: record.orderId == null ? null : String(record.orderId).slice(0, 120),
    original_action_id: record.originalActionId == null ? null : String(record.originalActionId),
    referral_id: referralId,
    shopper_id_present: Boolean(referralId),
    action_tracker_id: record.actionTrackerId == null ? null : String(record.actionTrackerId),
    action_tracker_name: record.actionTrackerName || null,
    action_type: actionType,
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
    items: Array.isArray(record.items)
      ? record.items.map(item => ({
          quantity: numericOrNull(item.quantity),
          sku: item.sku == null ? null : String(item.sku).slice(0, 120),
          sale_amount_publisher_currency: numericOrNull(item.perItemSaleAmountPubCurrency),
          commission_publisher_currency: numericOrNull(item.totalCommissionPubCurrency)
        }))
      : [],
    imported_at: new Date().toISOString(),
    verification: "cj_commission_detail_api"
  };
}

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = req.headers.authorization;

  if (!cronSecret || authorization !== "Bearer " + cronSecret) {
    return res.status(401).json({ error: "Non autorizzato" });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  const token = process.env.CJ_API_TOKEN;
  if (!token) {
    return res.status(503).json({
      error: "CJ_API_TOKEN non configurato nell'ambiente Vercel Production."
    });
  }
  if (!process.env.BLOB_STORE_ID) {
    return res.status(503).json({
      error: "Archivio privato ZOVARO non configurato."
    });
  }

  try {
    const previousState = await readJsonBlob(STATE_PATH).catch(() => null);
    const now = new Date();
    const beforePostingDate = now.toISOString();
    const sincePostingDate = new Date(
      now.getTime() - BACKFILL_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    let cursor = previousState?.max_commission_id
      ? String(previousState.max_commission_id)
      : null;
    let latestCursor = cursor;
    let pageCount = 0;
    let recordCount = 0;
    let savedCount = 0;
    let saleCount = 0;
    let leadCount = 0;
    let complete = false;

    while (!complete) {
      pageCount += 1;
      if (pageCount > MAX_PAGES) {
        throw new Error("CJ commission pagination exceeded the safety limit.");
      }

      const result = await fetchWithRetry(
        buildQuery({
          sincePostingDate,
          beforePostingDate,
          sinceCommissionId: cursor
        }),
        token
      );

      const records = result.records;
      recordCount += records.length;

      for (const sourceRecord of records) {
        const record = normalizeRecord(sourceRecord);
        await writeJsonBlob(
          "cj-commissions/records/" + record.commission_id + ".json",
          record
        );
        savedCount += 1;
        if (record.event_type === "cj_sale") saleCount += 1;
        if (record.event_type === "cj_lead") leadCount += 1;
      }

      const nextCursor = result.maxCommissionId
        ? String(result.maxCommissionId)
        : cursor;

      if (!result.payloadComplete) {
        if (!nextCursor || nextCursor === cursor) {
          throw new Error("CJ commission pagination returned no advancing cursor.");
        }
        cursor = nextCursor;
        latestCursor = nextCursor;
      } else {
        if (nextCursor) latestCursor = nextCursor;
        complete = true;
      }
    }

    const state = {
      schema: "zovaro.cj-commission-state.v1",
      publisher_id: PUBLISHER_ID,
      max_commission_id: latestCursor,
      last_synced_at: new Date().toISOString(),
      backfill_window_days: BACKFILL_DAYS,
      pages_read: pageCount,
      records_received: recordCount,
      records_saved: savedCount,
      sale_records: saleCount,
      lead_records: leadCount
    };

    await writeJsonBlob(STATE_PATH, state);

    return res.status(200).json({
      success: true,
      pages_read: pageCount,
      records_received: recordCount,
      records_saved: savedCount,
      sale_records: saleCount,
      lead_records: leadCount,
      max_commission_id: latestCursor,
      last_synced_at: state.last_synced_at
    });
  } catch (error) {
    console.error("ZOVARO CJ commission sync error:", error);
    return res.status(500).json({
      error: "Sincronizzazione commissioni CJ non riuscita."
    });
  }
}
