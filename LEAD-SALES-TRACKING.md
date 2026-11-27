# ZOVARO Lead & Sales Tracking

## Implemented foundation

Two serverless endpoints have been added under `/api`. Vercel serves files in this directory as API routes; no extra route declaration is needed for these endpoints.

### 1. Outbound click recorder

`GET /api/lead-track?partner=PARTNER_ID&ref=REFERRAL_ID&item=ITEM_ID&source=website&campaign=CAMPAIGN&to=ENCODED_HTTPS_URL`

- Accepts only HTTPS destinations whose exact hostname is listed in `ZOVARO_PARTNER_DOMAINS`.
- Writes the event to the private Cloudflare D1 click ledger before redirecting.
- The endpoint fails closed: if the first-party click record cannot be durably written, it returns an error and does not redirect to the affiliate network.
- Stores partner ID, referral ID, item ID, source, campaign, destination hostname and timestamp; it does not store visitor names, email addresses, phone numbers or IP addresses in the event.
- The referral ID is an attribution reference. For CJ links, the same value is now also passed as the `SID` query parameter so it can be returned as the publisher-only `shopperId` field in CJ Commission Detail records.

Example (replace values with real partner-approved data):
```
/api/lead-track?partner=dealer_one&ref=zv-ref-00001&item=vehicle-123&source=tiktok&campaign=video-001&to=https%3A%2F%2Fdealer.example%2Fvehicle
```

#### Frontend integration

The product modal preserves readable IDs for the current joined CJ advertisers and automatically generates a stable ID for any newly joined advertiser:

- Kaiya Baby (CJ advertiser ID `8022425`)
- Padel Iberico ES (CJ advertiser ID `7969352`)
- FragranceShop.com (CJ advertiser ID `7287203`)
- UNice (CJ advertiser ID `5824323`)
- Abelssoft Int (CJ advertiser ID `6260179`)
- Rexing (CJ advertiser ID `5357356`)
- eCosmetics.com (CJ advertiser ID `5384937`)

A product is routed through the recorder only when its original CJ URL is HTTPS and its hostname matches the server-side allowlist. For those hosts, the click event is durably stored before the redirect; if storage fails, the request is blocked rather than sent unrecorded. The verified CJ tracking hosts currently include `www.dpbolvw.net`, `www.tkqlhce.com`, `www.anrdoezrs.net`, `www.jdoqocy.com`, and `www.kqzyfj.com`; the last host was confirmed in 1,289 valid CJ product links and has been added to both the frontend and server allowlists. Other valid CJ URLs continue directly to CJ rather than being blocked. The recorder stores a unique click event, appends the same referral ID as CJ's `SID` parameter to the affiliate tracking URL, and redirects to CJ. CJ's official publisher tracking examples show the `SID` parameter, and the Commission Detail API exposes the publisher-only `shopperId` field. The commission sync stores that value as the referral ID when CJ returns it. Only clicks made after this change is deployed can carry the new SID; older clicks cannot be matched retroactively. Per-referral matching is reported only when the returned `shopperId` exactly matches a ZOVARO referral ID.

Products from other advertisers, networks, and direct partners continue to use their existing destination URLs and are not routed through the CJ mapping until their partner identity and tracking host are verified.

### 2. CJ commission reconciliation

`POST /api/cj-commission-sync` is called daily by the GitHub Actions workflow `.github/workflows/cj-commission-sync.yml`. The existing `CJ_API_TOKEN` GitHub Actions Secret is sent to the Vercel endpoint over HTTPS in the Authorization header; the endpoint does not store or log the token.

- Uses the CJ Publisher Commission Detail GraphQL API at `https://commissions.api.cj.com/query`.
- The first run imports the most recent 30 days; later runs continue incrementally using CJ's `maxCommissionId` / `sinceCommissionId` cursor.
- Stores each commission record privately in Cloudflare D1 under a unique CJ commission ID, so re-imports are idempotent and corrections remain separate delta records.
- Imports sale and lead action types, advertiser, order, posting/event dates, CJ action/validation statuses, USD sale and commission amounts, line-item summaries and the publisher-only `shopperId` field.
- The dashboard shows recent CJ sale orders, net commission amounts, pending amounts and how many CJ records contain a matching referral SID.

The sync reuses the existing GitHub Actions Secret `CJ_API_TOKEN` already used by the CJ product-feed workflow. No second copy of the CJ token is required in Vercel. The Vercel Function writes to the existing Cloudflare D1 database using the Production-only `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID` and `CLOUDFLARE_API_TOKEN` environment variables.

The initial import is limited to 30 days because CJ allows no more than 31 days per date-range query. CJ corrections are delta records: negative amounts must be combined with their original records. The dashboard is a recent sample viewer, not a final accounting or payout ledger.

### 3. Signed partner conversion intake

`POST /api/partner-postback`

Headers:
- `Content-Type: application/json`
- `X-ZOVARO-Signature: sha256=<64 lowercase hex characters>`

The signature is HMAC-SHA256 of the canonical JSON request body. Canonicalization recursively sorts object keys and uses compact JSON serialization. Partner and ZOVARO must implement the same algorithm and UTF-8 encoding.

Example body:
```json
{
  "partner_id": "dealer_one",
  "event_id": "dealer-event-000001",
  "referral_id": "zv-ref-00001",
  "status": "appointment",
  "amount": null,
  "currency": null,
  "order_reference": "dealer-case-123",
  "occurred_at": "2026-11-06T12:00:00Z"
}
```

Accepted statuses: `lead`, `contacted`, `appointment`, `visited`, `offer`, `closed_won`, `closed_lost`, `cancelled`.

A valid signature authenticates the partner source; it does not independently prove the underlying sale. Accepted partner conversion updates are stored in the private Cloudflare D1 table `partner_conversion_events`; if storage is unavailable, the endpoint returns an error rather than falsely acknowledging durable storage. Outbound affiliate clicks are stored individually in the private D1 table `outbound_click_events`. CJ/partner reporting remains the source of conversion truth.

## Protected admin dashboard

A password-protected page is available at `/lead-sales-dashboard.html` on the Vercel deployment. It uses an HttpOnly, Secure, SameSite=Lax cookie with an eight-hour expiry. The dashboard reads only private event files and shows up to the latest 100 click records, 100 partner updates and 100 CJ commission records. Counts and sums therefore describe recent samples, not lifetime totals. CJ sale amounts and commissions are shown separately; pending commissions are not payable balances.

Set these additional Vercel project environment variables before using it (Production):

- `ZOVARO_ADMIN_PASSWORD`: a unique password of at least 16 characters.
- `ZOVARO_ADMIN_SESSION_SECRET`: a unique random secret of at least 32 characters.

The login endpoint has a best-effort per-instance attempt limit; serverless memory limits mean this is not a substitute for an edge/WAF rate limit. Do not reuse this password elsewhere.

## Private application storage (Cloudflare D1)

The production API no longer imports or calls `@vercel/blob`. The suspended Vercel Blob store is not required for live API operations.

- Commission details are stored in `cj_commissions`, with a unique CJ commission ID.
- Outbound clicks are stored in `outbound_click_events`, with a unique event ID and referral ID.
- Signed direct-partner conversion updates are stored in `partner_conversion_events`.
- Marketplace listings, moderation queues, reports, appeals and TikTok OAuth/session metadata use the private JSON record store `app_records`, accessed through `lib/zovaro-store.js`.
- The D1 adapter creates its application-record table and indexes idempotently when first used. The click ledger schema is also provisioned idempotently by the click and CJ sync routes.
- Static catalog and video assets remain served from the existing GitHub Pages site; D1 is used for structured records and small JSON metadata, not media files.

The previous Blob store and its contents have not been deleted. Data trapped in the suspended store has not been automatically copied into D1. TikTok OAuth credentials stored only in that old store may need to be reauthorized if they cannot be recovered when Blob access returns.

## Other Vercel configuration required before partner tracking is enabled

- `ZOVARO_PARTNER_DOMAINS`: comma-separated exact hostnames for the actual outbound tracking destinations. Include the affiliate-network tracking hostname if the stored click URL uses one, not merely the final merchant hostname.
- `ZOVARO_PARTNER_SECRETS`: JSON object mapping each direct-partner ID to a unique random secret of at least 32 characters. Never put real values in Git.
- `CJ_API_TOKEN`: the CJ Personal Access Token as a GitHub Actions Secret, shared by the product-feed and commission-reconciliation workflows.

Do not configure a partner until its identity, destination hostname, attribution method and written participation are confirmed.

## Not yet complete / production blockers

- CJ click recording covers the current seven joined advertisers and generates stable tracking IDs for future CJ advertisers automatically. A product is routed through ZOVARO only when its HTTPS CJ tracking hostname is allowlisted; other valid CJ links continue directly to CJ. The same unique referral ID is added as `SID` for CJ reconciliation.
- No dealer is yet configured to send signed conversion postbacks.
- Cloudflare D1 now provides transactional tables and unique constraints for CJ commissions, click events and signed partner conversions. The dashboard still shows a limited recent-event sample; payout reconciliation across non-CJ networks, retention/deletion controls and the complete privacy notice remain separate work.
- The D1 commission table is the persistent commission ledger. The dashboard's event feed is a recent sample, not a lifetime event export. Amounts must still be reconciled against each network's official report, correction status and payout statement before being treated as payable.
- Do not collect personal lead details until an appropriate privacy notice, lawful basis/consent, access controls, retention/deletion process and data-processing terms are in place.
- Offline sales can only be attributed if the partner preserves the referral ID and reports the conversion or provides an agreed reconciliation feed. A signed partner report authenticates its sender but is not independent evidence of the sale.
