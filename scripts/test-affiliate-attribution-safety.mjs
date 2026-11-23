import assert from "node:assert/strict";
import fs from "node:fs/promises";

const read = (path) => fs.readFile(path, "utf8");
const [app, track, d1, cj, postback, admin] = await Promise.all([
  read("app.js"),
  read("api/lead-track.js"),
  read("lib/cj-d1.js"),
  read("api/cj-commission-sync.js"),
  read("api/partner-postback.js"),
  read("api/lead-admin-events.js")
]);

function section(source, start, end, label) {
  const a = source.indexOf(start);
  assert.notEqual(a, -1, label + ": start marker missing");
  const b = source.indexOf(end, a + start.length);
  assert.notEqual(b, -1, label + ": end marker missing");
  return source.slice(a, b);
}

// Frontend: every catalog CTA must be wrapped by the first-party click ledger;
// CJ must receive the exact same referral identifier in its SID parameter.
const clickBuilder = section(app, "function getProductClickUrl(product)", "// Keep category labels", "frontend click builder");
assert.match(clickBuilder, /destination\.searchParams\.set\("SID",\s*referralId\)/);
assert.match(clickBuilder, /trackingUrl\.searchParams\.set\("ref",\s*referralId\)/);
assert.match(clickBuilder, /trackingUrl\.searchParams\.set\("to",\s*destination\.toString\(\)\)/);
assert.match(clickBuilder, /return trackingUrl\.toString\(\)/);
assert.doesNotMatch(clickBuilder, /return originalUrl\s*;/);

// The client and server CJ tracking host allowlists must remain identical.
function hosts(source, pattern, label) {
  const match = source.match(pattern);
  assert.ok(match, label + " allowlist missing");
  return [...match[1].matchAll(/"([a-z0-9.-]+)"/gi)].map(x => x[1].toLowerCase()).sort();
}
const clientHosts = hosts(app, /const CJ_TRACKING_HOSTS = new Set\(\[([\s\S]*?)\]\);/, "client");
const serverHosts = hosts(track, /const trustedCjHosts = \[([\s\S]*?)\];/, "server");
assert.ok(clientHosts.length > 0, "CJ host allowlist cannot be empty");
assert.deepEqual(clientHosts, serverHosts, "client/server CJ host allowlists differ");

// Server: reject non-HTTPS and untrusted hosts; persist before redirect; fail closed.
assert.match(track, /destination\.protocol !== "https:"/);
assert.match(track, /if \(!allowedHosts\.has\(destination\.hostname\.toLowerCase\(\)\)\)/);
const insertAt = track.indexOf('INSERT INTO outbound_click_events');
const redirectAt = track.indexOf('res.setHeader("Location", destination.toString())');
const redirectStatusAt = track.indexOf('return res.status(302).end()');
assert.ok(insertAt >= 0 && redirectAt > insertAt && redirectStatusAt > redirectAt,
  "outbound click must be durably written before a 302 is issued");
assert.match(track, /return res\.status\(503\)\.send\(/);
assert.match(track, /never send a shopper to an affiliate unless[\s\S]*?durably recorded/i);

// D1: clicks are indexed for referral lookups; CJ commissions are idempotent
// and corrections update existing commission IDs instead of duplicating them.
assert.match(d1, /CREATE TABLE IF NOT EXISTS outbound_click_events/);
assert.match(d1, /idx_outbound_clicks_referral/);
assert.match(d1, /ON CONFLICT\(commission_id\) DO UPDATE/);

// CJ reconciliation: require authenticated POST, check D1 before the network call,
// persist each batch before advancing its cursor, and record successful sync time.
assert.match(cj, /if \(req\.method !== "POST"\)/);
assert.match(cj, /authorization === "Bearer " \+ cronSecret/);
assert.match(cj, /await d1Query\("SELECT 1 AS ready"\)/);
assert.ok(cj.indexOf("await d1Batch(part)") < cj.indexOf("await writeSyncCursor(latestCursor)"),
  "CJ cursor must never advance before the current page is stored");
assert.match(cj, /last_synced_at/);
assert.match(cj, /BACKFILL_DAYS = 30/);

// Direct partner conversion: HMAC verification must precede all database writes.
assert.match(postback, /crypto\.timingSafeEqual/);
const signatureAt = postback.indexOf("if (!validSignature(received, expected))");
const partnerInsertAt = postback.indexOf("INSERT INTO partner_conversion_events");
assert.ok(signatureAt >= 0 && partnerInsertAt > signatureAt,
  "partner conversion must be authenticated before storage");

// Admin dashboard must require a signed, unexpired admin session and read the D1 ledgers.
assert.match(admin, /verifySession\(token, secret\)/);
assert.match(admin, /payload\.role === "admin" && Number\(payload\.exp\) > Date\.now\(\)/);
assert.match(admin, /FROM outbound_click_events/);
assert.match(admin, /FROM cj_commissions/);
assert.match(admin, /FROM partner_conversion_events/);

console.log("Affiliate attribution safety checks passed: frontend SID/referral, matching allowlists, fail-closed click persistence, idempotent CJ ledger, cursor ordering, signed partner events, and protected dashboard.");
