# ZOVARO Worldwide — Direct Advertiser Promotion Kit

Status: commercial proposal draft; not a signed contract and not yet connected to an automated payment or publishing workflow.

## Offer

**12-month promotional agreement**

- Monthly instalments: **US$9.99 per month for 12 months** (US$119.88 total).
- Annual prepayment: **US$99 for 12 months** (US$20.88 less than monthly instalments).
- Term: 12 consecutive months.
- Delivery: **365 scheduled daily promotional placements**, one per calendar day during the term.
- The annual package is a discounted prepayment; the monthly option is a 12-month commitment, not a month-to-month cancellation plan.
- Taxes, currency conversion and bank transfer charges: state separately on the final invoice/contract where applicable.

The service is promotional exposure, not a guarantee of views, reach, leads, enquiries, sales, rentals or revenue. No paid media spend is included.

## What the client supplies

Before production, obtain:
1. Business / brand name and a concise description of the activity, products, services, sale or rental offer.
2. Logo in high-resolution PNG or SVG.
3. Images and/or video clips the client is authorised to use.
4. Official website, social profiles and preferred call-to-action.
5. Target countries/languages and any mandatory disclaimers or restrictions.
6. Written confirmation that the client owns or has permission to use all supplied assets, trademarks, music and claims.

Do not publish personal data, misleading claims, prohibited products/services or content that violates a platform's advertising rules. Review regulated categories and country-specific restrictions before acceptance.

## Production and publication

- Produce a vertical 9:16 promotional creative in the ZOVARO visual style (dark navy/black, electric blue, white, clean premium typography and the approved ZOVARO logo).
- Use the client's supplied logo, images, description and CTA.
- Use the ZOVARO SHOP instrumental only after confirming that its current licence permits commercial use in third-party client advertisements and on every intended platform. If that permission is not confirmed, use an approved alternative track or proceed without music.
- Standard delivery target: within 48 hours **after both** the first payment has cleared and all required, usable client materials have been received and approved. The 48-hour target does not begin from payment alone if assets or information are missing.
- Schedule one promotional placement per day for 365 days. The creative may be repeated or refreshed using agreed client-supplied assets; the package does not mean 365 separately filmed or fully original productions.
- Place the advertiser's approved profile/listing on ZOVARO Worldwide only where a suitable section exists and the client has authorised the display.
- Distribute only to ZOVARO channels that are actually connected, active, permitted for commercial promotion and included in the written order. Never promise every social network or worldwide delivery until channel access, territories and publishing rights are verified.
- Record each scheduled/published placement, channel, date and content identifier. If a channel is unavailable, document the interruption and apply the agreed remedy; do not silently claim publication.

## Client-facing email — initial enquiry

Subject: ZOVARO Worldwide — 12-month promotional opportunity

Hello [Client name],

Thank you for contacting ZOVARO Worldwide.

We can offer a 12-month promotional package to present your business, products, services or rental opportunities through a daily promotional placement alongside ZOVARO's own campaigns.

**Package options**
- US$9.99 per month for 12 months (US$119.88 total).
- US$99 for the full 12 months when paid in one instalment.

The package includes 365 scheduled daily promotional placements (one per day), a ZOVARO-style vertical promotional video using the materials you provide, and an advertiser presentation on ZOVARO Worldwide where the relevant section is available. The video is prepared after we receive your logo, business description and approved images/video materials.

The standard production target is within 48 hours after the first payment has cleared and all required materials have been received and approved. We will confirm the exact social channels and placement scope in the written agreement.

To prepare your free, no-obligation proposal, please reply with:
- Business / brand name and description;
- Logo and approved images or video;
- Official website and social links;
- Products/services or properties you wish to promote;
- Countries and languages you want to target.

If you wish to proceed, we will send the service agreement and bank-transfer instructions. The campaign starts only after the agreement is signed and the relevant payment has been verified.

Please note that promotional exposure does not guarantee a specific number of views, customers, leads or sales.

Kind regards,
ZOVARO Worldwide — Marketing Team
vendittellijob2025@gmail.com

## Operational states

Use explicit states; never infer one from another:

1. enquiry_received
2. qualification_pending
3. proposal_sent
4. materials_pending
5. creative_in_production
6. creative_awaiting_client_approval
7. agreement_sent
8. agreement_signed
9. payment_pending
10. payment_verified
11. scheduled
12. active
13. completed
14. paused_or_blocked
15. expired

Do not activate a campaign based only on an email promise, screenshot of a transfer, or an unsigned contract. Payment must be confirmed through an authorised bank/accounting source. The current Gmail connector does not itself verify bank credits.

## Automation boundaries

Gmail can be used to find enquiries, draft personalised replies and send a pre-approved initial proposal when authorised. The current Metricool toolset exposes scheduled-post creation/review and analytics, but does not expose social comment/inbox reading or replies. The current GitHub/Vercel project does not yet have a verified advertiser order, contract-signature, bank-payment verification, customer asset intake, video-rendering and 365-day scheduling pipeline.

Until those integrations are built and tested:
- Do not claim that all incoming enquiries are monitored automatically.
- Do not auto-accept contracts or legal terms.
- Do not mark a bank transfer as paid without verified evidence from the bank/accounting source.
- Do not auto-publish a client's content before asset-rights checks, content approval, signed agreement, payment verification and platform-policy checks.
- Do not store customer email addresses, contracts, bank details or supplied private media in public repository files.

## Required checks before launch

- Approve a jurisdiction-appropriate service agreement and cancellation/refund terms.
- Confirm invoicing/tax treatment and the bank-transfer collection process.
- Confirm commercial music rights for the ZOVARO SHOP instrumental, including third-party advertising, edits, territories and all target social platforms.
- Confirm each social account's commercial-content rules, connected publishing permissions, daily capacity and actual audience/territory.
- Build private storage and consent-controlled client asset intake.
- Implement payment reconciliation and signed-contract records.
- Implement 365-day schedule generation, retry handling, publication evidence and client reporting.
- Define what happens when a platform rejects, removes or cannot publish a scheduled placement.

This document is an internal implementation and sales draft. It is not legal advice and must not be presented as a final binding contract.
