# ZOVARO Lead & Sales Tracking

Initial implementation notes and operational requirements.

## Outbound click tracking
The API endpoint `/api/lead-track` records a privacy-minimized outbound click event in private Vercel Blob storage before redirecting the visitor to an allowlisted HTTPS partner domain. If storage is unavailable, the redirect is cancelled so attribution is not silently lost.

## Partner conversion events
The API endpoint `/api/partner-postback` accepts partner-reported status updates signed with an HMAC-SHA256 signature. Accepted statuses: lead, contacted, appointment, visited, offer, closed_won, closed_lost, cancelled.

A valid signature proves possession of the partner secret; it does not independently prove a sale. Reported conversions must not be represented as independently verified sales.

## Required Vercel environment variables
- `BLOB_READ_WRITE_TOKEN`: private Blob storage access.
- `ZOVARO_PARTNER_DOMAINS`: comma-separated exact HTTPS destination hostnames.
- `ZOVARO_PARTNER_SECRETS`: JSON object mapping partner IDs to unique random secrets of at least 32 characters.

Never store secrets in Git. Redeploy after configuring environment variables.

## Production requirements
This initial module is not yet a complete commission ledger. It needs transactional idempotency, reconciliation, a protected admin dashboard, retention/deletion controls, and privacy notices before collecting personal lead data. A transactional database is recommended for concurrent updates and auditable commission accounting. Partner participation and written attribution terms are required to record offline sales.