-- ZOVARO private commission ledger (Cloudflare D1)
-- Apply once to the dedicated D1 database. Never place commission data in the public Git repo.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cj_commissions (
  commission_id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  advertiser_id TEXT,
  advertiser_name TEXT,
  partner_id TEXT NOT NULL,
  order_id TEXT,
  action_type TEXT,
  action_status TEXT,
  validation_status TEXT,
  event_date TEXT,
  posting_date TEXT,
  locking_date TEXT,
  sale_amount_usd REAL,
  commission_amount_usd REAL,
  sale_amount_publisher_currency REAL,
  commission_amount_publisher_currency REAL,
  currency_usd TEXT NOT NULL DEFAULT 'USD',
  referral_id TEXT,
  original_action_id TEXT,
  record_json TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cj_commissions_posting_date ON cj_commissions(posting_date);
CREATE INDEX IF NOT EXISTS idx_cj_commissions_partner_status ON cj_commissions(partner_id, action_status, validation_status);
CREATE INDEX IF NOT EXISTS idx_cj_commissions_order_id ON cj_commissions(order_id);
CREATE TABLE IF NOT EXISTS cj_sync_state (
  state_key TEXT PRIMARY KEY,
  state_value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Signed conversion callbacks from non-CJ affiliate, lead and rental partners.
CREATE TABLE IF NOT EXISTS partner_conversion_events (
  event_id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL,
  referral_id TEXT NOT NULL,
  status TEXT NOT NULL,
  amount REAL,
  currency TEXT,
  partner_order_reference TEXT,
  occurred_at TEXT NOT NULL,
  received_at TEXT NOT NULL,
  record_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_partner_events_partner_status ON partner_conversion_events(partner_id,status);
CREATE INDEX IF NOT EXISTS idx_partner_events_referral ON partner_conversion_events(referral_id);
CREATE INDEX IF NOT EXISTS idx_partner_events_occurred_at ON partner_conversion_events(occurred_at);

-- First-party outbound affiliate click ledger; one row per validated redirect.
CREATE TABLE IF NOT EXISTS outbound_click_events (
  event_id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL,
  referral_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  source TEXT NOT NULL,
  campaign TEXT,
  destination_host TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  record_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_outbound_clicks_occurred_at ON outbound_click_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_outbound_clicks_referral ON outbound_click_events(referral_id);
CREATE INDEX IF NOT EXISTS idx_outbound_clicks_partner ON outbound_click_events(partner_id, occurred_at);
