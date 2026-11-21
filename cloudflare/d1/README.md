# ZOVARO commission ledger — Cloudflare D1

This is the private, idempotent commission ledger target for CJ reconciliation.

## One-time setup (Cloudflare Free plan only)
1. In the Cloudflare dashboard, create a D1 database named `zovaro-commission-ledger` in the account already connected to ZOVARO.
2. Open the database SQL console and apply `cloudflare/d1/schema.sql`.
3. Create a Cloudflare API token scoped only to this account and this D1 database, with D1 read/write permission. Do not paste it into chat or commit it to Git.
4. Add these Vercel Production (and Preview only if needed) environment variables:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_D1_DATABASE_ID`
   - `CLOUDFLARE_API_TOKEN`
5. The application no longer depends on Vercel Blob. Keep the old Blob store and its contents untouched; do not delete it until any historical data that becomes accessible can be exported and reconciled.

## Deploy sequence
- Merge the reviewed branch only after the schema and three environment variables exist.
- The importer is deployed at the existing route `/api/cj-commission-sync`. Keep the GitHub Actions reconciliation workflow pointed at this route; the route validates D1, provisions the click ledger idempotently and imports CJ records.
- The endpoint re-reads the previous 30 days, writes each CJ page before advancing its cursor, and uses the CJ commission ID as the unique key so retries do not duplicate commissions.
- Compare imported record counts and commission totals with CJ reports before enabling the scheduled workflow.

## Important accounting rules
- A CJ record is evidence of a tracked action, not automatically a payable commission.
- Keep action/validation status, locking date, corrections, reversals and cancellations.
- Only amounts that CJ marks approved/locked and that are actually payable under the advertiser's terms should be treated as receivable.
- CJ reports cannot establish conversions from non-CJ partners. Each other network needs its own verified API/report/postback and payout terms.
- Signed non-CJ partner callbacks are written to `partner_conversion_events`; partners must be explicitly configured with a signing secret and must send a stable event ID. A callback is partner-reported evidence, not independent proof of a completed sale.
- The production API uses D1 instead of Vercel Blob for commissions, click events, signed partner callbacks, marketplace records and TikTok JSON metadata. Historical records still trapped in the suspended Blob store are not automatically copied; leave the old store intact until it becomes accessible and can be safely exported.
- This D1 database is a ledger, not a payout processor. Payout remains controlled by CJ/network payout settings.
