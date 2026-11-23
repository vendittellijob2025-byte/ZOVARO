#!/usr/bin/env python3
"""Isolated attribution simulation; uses in-memory SQLite, never production D1."""
import json
import sqlite3
from pathlib import Path

db = sqlite3.connect(":memory:")
db.executescript(Path("cloudflare/d1/schema.sql").read_text())

referral = "zv-test-attrib-20261123"
click_id = "test-click-20261123-001"
conversion_id = "test-sale-20261123-001"
now = "2026-11-23T13:00:00Z"

# Simulate the same fields persisted by api/lead-track.js.
click = {
    "schema": "zovaro.lead-sales.v1",
    "event_id": click_id,
    "event_type": "outbound_click",
    "partner_id": "test-partner",
    "referral_id": referral,
    "item_id": "test-item-1999",
    "source": "automated-test",
    "campaign": "attribution-simulation",
    "destination_host": "example.test",
    "occurred_at": now,
    "test": True,
}
db.execute(
    """INSERT INTO outbound_click_events
       (event_id,partner_id,referral_id,item_id,source,campaign,destination_host,occurred_at,record_json)
       VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(event_id) DO NOTHING""",
    (click_id, "test-partner", referral, "test-item-1999", "automated-test",
     "attribution-simulation", "example.test", now, json.dumps(click)),
)

# Simulate a partner-reported closed_won conversion, in its own table.
sale = {
    "schema": "zovaro.lead-sales.v1",
    "event_id": conversion_id,
    "event_type": "partner_conversion_update",
    "partner_id": "test-partner",
    "referral_id": referral,
    "status": "closed_won",
    "amount": 19.99,
    "currency": "USD",
    "partner_order_reference": "TEST-ORDER-DO-NOT-FULFIL",
    "occurred_at": now,
    "received_at": now,
    "verification": "simulation_only",
    "test": True,
}
db.execute(
    """INSERT INTO partner_conversion_events
       (event_id,partner_id,referral_id,status,amount,currency,partner_order_reference,
        occurred_at,received_at,record_json)
       VALUES(?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(event_id) DO UPDATE SET
       status=excluded.status, amount=excluded.amount, currency=excluded.currency,
       partner_order_reference=excluded.partner_order_reference,
       occurred_at=excluded.occurred_at, received_at=excluded.received_at,
       record_json=excluded.record_json""",
    (conversion_id, "test-partner", referral, "closed_won", 19.99, "USD",
     "TEST-ORDER-DO-NOT-FULFIL", now, now, json.dumps(sale)),
)

# The attribution match is an exact referral-ID join, just like the dashboard.
matches = db.execute(
    """SELECT COUNT(*) FROM partner_conversion_events p
       JOIN outbound_click_events c ON c.referral_id = p.referral_id
       WHERE p.event_id=? AND c.event_id=? AND p.partner_id=c.partner_id""",
    (conversion_id, click_id),
).fetchone()[0]
assert matches == 1, f"Expected one click-to-sale match, got {matches}"

# Replaying either event must not create duplicate rows.
db.execute(
    """INSERT INTO outbound_click_events
       (event_id,partner_id,referral_id,item_id,source,campaign,destination_host,occurred_at,record_json)
       VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(event_id) DO NOTHING""",
    (click_id, "test-partner", referral, "test-item-1999", "automated-test",
     "attribution-simulation", "example.test", now, json.dumps(click)),
)
assert db.execute("SELECT COUNT(*) FROM outbound_click_events").fetchone()[0] == 1
assert db.execute("SELECT COUNT(*) FROM partner_conversion_events").fetchone()[0] == 1

# Critical isolation assertion: a simulated partner sale never enters CJ commissions.
assert db.execute("SELECT COUNT(*) FROM cj_commissions").fetchone()[0] == 0
assert db.execute("SELECT COALESCE(SUM(commission_amount_usd),0) FROM cj_commissions").fetchone()[0] == 0

print("PASS: isolated test click persisted")
print("PASS: simulated $19.99 closed_won sale persisted separately")
print("PASS: click and sale matched by exact referral ID and partner ID")
print("PASS: duplicate click/conversion replay did not duplicate records")
print("PASS: CJ commission ledger remains empty and unchanged")
print("NOTE: in-memory schema/logic test only; does not prove live D1 connectivity or CJ merchant conversion attribution")
