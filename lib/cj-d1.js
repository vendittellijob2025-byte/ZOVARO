const API_BASE = "https://api.cloudflare.com/client/v4";

function config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !databaseId || !apiToken) {
    throw new Error("Cloudflare D1 is not configured.");
  }
  return { accountId, databaseId, apiToken };
}

export async function d1Query(sql, params = []) {
  const { accountId, databaseId, apiToken } = config();
  const response = await fetch(
    `${API_BASE}/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sql, params }),
      signal: AbortSignal.timeout(30000)
    }
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success !== true) {
    const messages = Array.isArray(payload?.errors)
      ? payload.errors.map(item => item.message).filter(Boolean).join("; ")
      : "";
    throw new Error(`Cloudflare D1 query failed (HTTP ${response.status})${messages ? ": " + messages : "."}`);
  }
  return payload.result?.[0] || { results: [] };
}

export async function d1Batch(records) {
  if (!Array.isArray(records) || records.length === 0) return;
  const columns = [
    "commission_id", "event_id", "advertiser_id", "advertiser_name", "partner_id",
    "order_id", "action_type", "action_status", "validation_status", "event_date",
    "posting_date", "locking_date", "sale_amount_usd", "commission_amount_usd",
    "sale_amount_publisher_currency", "commission_amount_publisher_currency",
    "currency_usd", "referral_id", "original_action_id", "record_json", "imported_at", "updated_at"
  ];
  const rowSql = "(" + columns.map(() => "?").join(",") + ")";
  const values = [];
  const tuples = records.map(record => {
    values.push(
      record.commission_id, record.event_id, record.advertiser_id, record.partner_name,
      record.partner_id, record.order_id, record.action_type, record.action_status,
      record.validation_status, record.event_date, record.posting_date, record.locking_date,
      record.sale_amount_usd, record.commission_amount_usd,
      record.sale_amount_publisher_currency, record.commission_amount_publisher_currency,
      "USD", record.referral_id, record.original_action_id, JSON.stringify(record),
      record.imported_at, new Date().toISOString()
    );
    return rowSql;
  });
  const updates = columns.slice(2).map(column => `${column}=excluded.${column}`).join(",");
  const sql = `INSERT INTO cj_commissions (${columns.join(",")}) VALUES ${tuples.join(",")} ON CONFLICT(commission_id) DO UPDATE SET ${updates}`;
  await d1Query(sql, values);
}

export async function readSyncCursor() {
  const result = await d1Query(
    "SELECT state_value FROM cj_sync_state WHERE state_key = ? LIMIT 1",
    ["max_commission_id"]
  );
  return result.results?.[0]?.state_value || null;
}

export async function writeSyncCursor(cursor) {
  await d1Query(
    "INSERT INTO cj_sync_state(state_key,state_value,updated_at) VALUES(?,?,?) ON CONFLICT(state_key) DO UPDATE SET state_value=excluded.state_value, updated_at=excluded.updated_at",
    ["max_commission_id", String(cursor || ""), new Date().toISOString()]
  );
}
