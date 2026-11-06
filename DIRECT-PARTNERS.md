# ZOVARO DIRECT PARTNERS

This module manages direct commercial partnerships separately from CJ Affiliate while feeding only verified products into the shared ZOVARO catalog.

## Registry

- `data/direct-partners.json`: prospects, approved partners and approved products.
- Prospects are research leads, not partners and not approved advertisers.
- A prospect becomes an active partner only after written approval and an agreed commercial arrangement.
- A product is publishable only when the partner is active, written approval is recorded, image permission is explicit, and a partner-issued HTTPS tracking URL plus a documented conversion method are verified.

## Prospect workflow

1. `prospect`: researched, not contacted.
2. `contacted`: an enquiry was actually sent or submitted.
3. `responded`: a human response was received.
4. `negotiating`: terms and integration are being discussed.
5. `approved`: written agreement/approval received; integration still pending.
6. `active`: tracking, permissions and terms have been checked.
7. `declined` / `on_hold`: closed or paused.

Never mark a prospect as contacted merely because a draft email exists. Keep evidence URL/date and contact channel with each status change.

## Product publication gates

- Partner status = `active`
- Partner `writtenApproval` = `true`
- Product `publicationStatus` = `published`
- Product `tracking.status` = `verified`
- Product `tracking.clickUrl` is HTTPS and issued by the partner/network
- Product `tracking.conversionMethod` documents how a booking, lead or sale is attributed
- Product `assets.imagePermission` = `true`
- Product has title, image URL, positive price and currency

A click is not proof of a completed transaction. Commission reporting, reversals, payout threshold, currency, invoicing and payment schedule must be documented separately.

## Initial prospect research (6 November 2026)

- Edel & Stark: luxury rental affiliate programme; published up to 15%; Europe/UAE.
- Carbirds: vehicle sales / dealer referral programme; market-specific reward, no universal amount.
- Cornette Automotive: fixed commission per car sold; application page offers Ambassador tier for everyone.
- ASR Luxury: luxury fleet referrals; global affiliates are invited, rate to be agreed; monthly payouts are stated.
- ALANELI: worldwide luxury rentals; published 5% for luxury car rentals, subject to programme terms.
- Vortexa: published 10% on rentals; regional US coverage, therefore low priority for international scale.
- Driverra: exotic-car sales referral application; applicant-country eligibility and commission not confirmed.

These are prospects only. None is represented as an approved ZOVARO partner. Verify current terms directly before publishing offers.
