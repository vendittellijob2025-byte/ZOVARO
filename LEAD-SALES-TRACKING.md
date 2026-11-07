# ZOVARO Lead & Sales Tracking

## Implemented foundation

Two serverless endpoints have been added under `/api`. Vercel serves files in this directory as API routes; no extra route declaration is needed for these endpoints.

### 1. Outbound click recorder

`GET /api/lead-track?partner=PARTNER_ID&ref=REFERRAL_ID&item=ITEM_ID&source=website&campaign=CAMPAIGN&to=ENCODED_HTTPS_URL`

- Accepts only HTTPS destinations whose exact hostname is listed in `ZOVARO_PARTNER_DOMAINS`.
- Writes a private event record before redirecting.
- Cancels the redirect if event storage fails.
- Stores partner ID, referral ID, item ID, source, campaign, destination hostname and timestamp; it does not store visitor names, email addresses, phone numbers or IP addresses in the event.
- The referral ID is an attribution reference. It only connects a later sale if the partner preserves and returns it in a postback or report.

Example (replace values with real partner-approved data):
```
/api/lead-track?partner=dealer_one&ref=zv-ref-00001&item=vehicle-123&source=tiktok&campaign=video-001&to=https%3A%2F%2Fdealer.example%2Fvehicle
```

#### Frontend integration

The product modal now routes verified CJ products from the following joined advertisers through the ZOVARO click recorder:

- Kaiya Baby (CJ advertiser ID `8022425`)
- Padel Iberico ES (CJ advertiser ID `7969352`)

The recorder stores a unique click event and then redirects to the original CJ tracking URL unchanged. This preserves CJ's normal affiliate redirect and cookie-based click attribution. The ZOVARO referral reference is currently internal to the ZOVARO event log; it is not appended as a CJ sub-ID because a supported advertiser/network sub-ID parameter has not yet been confirmed. Therefore, do not claim per-referral CJ sale matching yet.

Products from other advertisers, networks, and direct partners continue to use their existing destination URLs and are not routed through this allowlist until their partner identity and tracking host are verified.

### 2. Signed partner conversion intake

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

A valid signature authenticates the partner source; it does not independently prove the underlying sale. The endpoint currently appends each accepted event as a private Blob object. It does not yet enforce event-ID uniqueness or prevent duplicate business events.

## Protected admin dashboard

A password-protected page is available at `/lead-sales-dashboard.html` on the Vercel deployment. It uses an HttpOnly, Secure, SameSite=Lax cookie with an eight-hour expiry. The dashboard reads only private event files and shows the latest 100 click records and latest 100 partner updates. Counts therefore describe the displayed recent sample, not lifetime totals. Declared amounts are grouped by currency and are not a payable commission ledger.

Set these additional Vercel project environment variables before using it (Production):

- `ZOVARO_ADMIN_PASSWORD`: a unique password of at least 16 characters.
- `ZOVARO_ADMIN_SESSION_SECRET`: a unique random secret of at least 32 characters.

The login endpoint has a best-effort per-instance attempt limit; serverless memory limits mean this is not a substitute for an edge/WAF rate limit. Do not reuse this password elsewhere.

## Vercel Blob authentication

The existing `zovaro-tiktok` private Blob Store is connected to the `zovaro` project, and the Vercel Store page confirms that all connected projects use OIDC. The project already has `BLOB_STORE_ID` in Preview and Production.

- On Vercel Functions, the current `@vercel/blob` SDK can authenticate using the request-scoped Vercel OIDC token together with `BLOB_STORE_ID`.
- A long-lived `BLOB_READ_WRITE_TOKEN` is not required for this OIDC-connected Vercel deployment.
- Keep the SDK at a version that supports OIDC (OIDC support was introduced in `@vercel/blob` 2.4.0; this repository declares `^2.6.1`).
- Do not revoke or rotate Blob credentials as part of this setup. The Vercel Store UI may recommend revoking an old read-write token, but leave it untouched while existing TikTok integrations are being preserved and verified.
- Local development outside Vercel may need a separately managed development credential or a configured local OIDC flow; do not copy production secrets into chat.

The admin events endpoint uses the connected store's OIDC authentication and checks for `BLOB_STORE_ID`, not for a static `BLOB_READ_WRITE_TOKEN`.

## Other Vercel configuration required before partner tracking is enabled

- `ZOVARO_PARTNER_DOMAINS`: comma-separated exact hostnames for the actual outbound tracking destinations. Include the affiliate-network tracking hostname if the stored click URL uses one, not merely the final merchant hostname.
- `ZOVARO_PARTNER_SECRETS`: JSON object mapping each partner ID to a unique random secret of at least 32 characters. Never put real values in Git.

Do not configure a partner until its identity, destination hostname, attribution method and written participation are confirmed.

## Not yet complete / production blockers

- The product modal now routes only the two explicitly mapped CJ advertisers (Kaiya Baby and Padel Iberico ES) through `/api/lead-track`; all other products retain their original links. Their original CJ click URLs are passed through unchanged. ZOVARO records its own referral reference, but CJ sub-ID attribution has not been enabled pending confirmation of a supported parameter. Redirecting blindly could break affiliate attribution or send visitors to an unapproved domain.
- No dealer is yet configured to send signed conversion postbacks.
- No transactional database, idempotency/reconciliation layer, payable commission ledger, export/reporting interface, retention/deletion controls or privacy notice has been implemented. The current dashboard is a recent-event viewer, not an accounting system.
- Blob event files are an intake log, not a transactional accounting database. The dashboard reads at most the latest 100 records of each type; do not treat these sample counts as lifetime totals. Use a database with unique constraints and audit history before calculating amounts payable.
- Do not collect personal lead details until an appropriate privacy notice, lawful basis/consent, access controls, retention/deletion process and data-processing terms are in place.
- Offline sales can only be attributed if the partner preserves the referral ID and reports the conversion or provides an agreed reconciliation feed. A signed partner report authenticates its sender but is not independent evidence of the sale.
