# ZOVARO Worldwide — Advertiser operations and monthly payment control

This document extends the direct advertiser offer with an internal operating ledger. It is not a signed client contract or legal/tax advice.

## Customer journey and service levels

1. Reply to every enquiry in the language used by the sender. The first reply explains both plans, the 12-month term, bank-transfer method, content requirements and next steps.
2. Qualify the advertiser and review the proposed products/services, destination countries, claims, platform policies and rights to supplied materials.
3. Send the final written order and jurisdiction-reviewed service agreement. Do not accept the client until the agreement is signed.
4. Issue bank-transfer instructions only from the verified business banking details and the approved invoice/order. Never place bank coordinates in public pages, source code, email templates or this repository.
5. Confirm the credit by checking the actual bank account/statement or an authorised accounting integration. A transfer receipt or screenshot alone is not confirmation.
6. Collect the complete logo, description, approved images/video, official links, CTA, languages, territories and written asset-rights confirmation.
7. Produce a 9:16 ZOVARO-style video. Send a preview to the client and record approval before scheduling.
8. Start the 48-hour production target only when the initial payment has cleared AND the required materials are complete and approved. The target is for the first usable creative, not a guarantee that every social platform will publish within 48 hours.
9. Schedule daily placements only on connected, active, permitted channels included in the signed order. Record each channel, planned date, post ID and publication result.
10. If a platform rejects a post or an account becomes unavailable, record the failure and apply the remedy stated in the agreement. Do not mark a failed post as published.

## Commercial terms to show

- Monthly plan: US$9.99 × 12 monthly instalments = US$119.88 total over a 12-month commitment.
- Annual prepayment: US$99 for 12 months paid in one bank transfer.
- Both plans include 365 scheduled placements, one per day across the 12-month term, subject to the final signed channel scope.
- The creative may be repeated/refreshed as agreed; this is not 365 independently produced videos.
- No guarantee of impressions, reach, leads, enquiries, sales or revenue.
- State applicable taxes, invoice treatment, transfer fees, cancellation/refund terms and any interruption remedy in the final approved agreement.

## Internal client register

The private administrator page is `/advertiser-management.html`. It reuses the existing ZOVARO administrator session and stores records in the private Vercel Blob store, not in GitHub.

For every advertiser record, keep:
- Client ID, business name and contact email.
- Plan, 12-month term, contract-signed flag and start date.
- Initial payment status and next monthly due date.
- Each payment: amount, currency, paid date, covered period, transfer method, admin verification flag and optional last four characters of a transfer reference.
- Campaign state: payment pending, active, paused, cancelled or completed.
- Video approval and scheduled/published placement evidence (to be added to the operational workflow before public launch).

### Monthly plan reconciliation

- The monthly instalment is US$9.99. The contract remains a 12-month commitment.
- At each monthly due date, inspect the actual bank statement and reconcile the client/payment reference.
- Only an administrator who has verified the cleared bank credit may select “Registra bonifico”.
- Record one payment against the correct covered period. The next due date advances by one calendar month, clamping to the last day when necessary.
- The register flags payment pending, due today/soon and overdue states. A scheduled Vercel audit runs on the first day of each month at 09:00 America/Bogota and stores a private report of monthly clients with instalments due or approaching within 31 days. The administrator dashboard displays the latest report.\n- The scheduled audit checks the internal ledger only; it cannot inspect the bank account or prove a transfer arrived. The administrator must compare the due list with the actual bank statement, record the cleared credit, and review unpaid/overdue clients. A client with an overdue instalment must be reviewed and the campaign paused according to the signed contract; do not automatically cancel or impose penalties without contract terms.
- Annual prepayment is recorded once at US$99 and does not create monthly instalments.
- Keep the original bank statement/invoice/contract in an authorised private accounting archive. Do not upload bank statements, IBANs, full transfer references or identity documents to GitHub.
- Retain an auditable payment history; never overwrite a previous payment to make a missed instalment appear paid.

## Technical boundaries and launch requirements

- The administrator API requires the existing signed `zovaro_admin` cookie and the existing private Blob store.
- The current implementation supports private client records, plan, signed-contract flag, initial/monthly payment ledger, manual bank-credit verification and computed due/overdue status.
- It does NOT connect to the bank, automatically detect incoming transfers, issue invoices, sign contracts, email late-payment notices, create videos, or publish social posts. The monthly cron produces a private due-date audit only; it is not an automatic bank reconciliation.
- Monthly due-state visibility is not a substitute for an actual bank reconciliation. Before claiming automated monthly checks, configure a secure accounting/bank integration or an authorised monthly reconciliation process and notification.
- Before production activation, verify Vercel environment variables `ZOVARO_ADMIN_PASSWORD`, `ZOVARO_ADMIN_SESSION_SECRET`, and `BLOB_STORE_ID`; confirm private Blob access in the deployed environment; run authenticated and unauthenticated API tests; and confirm the page is not linked publicly.
- Review data-protection requirements, retention/deletion, client consent, cross-border transfers and contract jurisdiction.
- Do not merge or deploy this work until the tests, access controls, private storage and service terms are approved.
