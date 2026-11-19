# ZOVARO — Global Discovery Platform

ZOVARO is a global discovery platform for products, offers, jobs and commercial opportunities. The current live commerce integration uses CJ Affiliate; direct luxury partners are managed separately and are never presented as approved until their terms, tracking and media permissions are verified.

## Current operating architecture

### CJ Affiliate product catalogue

- The CJ API integration discovers active, joined advertisers dynamically; it is not limited to a hard-coded list of two merchants.
- Product feeds are retrieved with pagination, including CJ feeds exceeding 10,000 products.
- A product is eligible for the public storefront only when it has a joined advertiser relationship, a valid HTTPS CJ click URL, an approved HTTPS image URL and a positive price.
- Products without a valid CJ tracking URL or image are excluded rather than sent to customers with broken or untracked links.
- The full validated inventory is retained in the generated catalogue; the public storefront uses a compact, balanced selection capped at 1,200 products per category and distributed across advertisers.
- CJ synchronization is scheduled every six hours and can also be started manually from GitHub Actions.
- The catalogue is generated in `data/catalog.json`. Do not edit this generated file manually.

### English translations

Translation runs separately from CJ ingestion so a translation-service rate limit cannot block a valid product import.

- Up to 300 new text strings are translated per run.
- Successful translations and the translation cache are saved before the batch pauses.
- Later scheduled runs resume from the saved catalogue and cache.
- Brand names, advertiser names, prices, currencies and IDs are not translated.

### Click tracking and sales attribution

- CJ affiliate click URLs are preserved when a customer leaves ZOVARO for the merchant.
- ZOVARO's Lead & Sales Control records outbound referrals independently from the merchant's own conversion reporting.
- For CJ links, ZOVARO passes the same unique referral ID as the CJ `SID` parameter; the Commission Detail API can return it as `shopperId` for matching when CJ supplies it.
- A private Vercel Cron imports CJ sale/lead commission records daily, initially backfilling 30 days and then using CJ's incremental commission cursor.
- A recorded click proves that a referral was sent; it does not prove a sale or commission. CJ commission records can be corrected, reversed or remain pending validation.

### Direct commercial partners

The registry at `data/direct-partners.json` separates prospects, contacted companies, replies, approved partners and publishable products.

A direct partner product must not be published until all of the following are verified:

1. Written partner approval and an agreed commercial arrangement.
2. Partner status is `active`.
3. The partner-issued HTTPS tracking URL and conversion/attribution method are verified.
4. Explicit permission exists for the product images and brand material.
5. Product title, image, price and currency are complete.

A draft email is not evidence of contact; a sent email or submitted form must be recorded. A reply is not approval. The validation workflow checks the registry and publication gates.

### Global discovery and market-specific affiliate availability

- A merchant's country-limited sales territory is not, by itself, a reason to exclude its products from ZOVARO's global discovery catalogue.
- Discovery visibility and purchase eligibility are separate: listings may be discoverable worldwide, while the purchase action is enabled only for countries where that merchant has verified availability and delivery/service coverage.
- Publisher eligibility, customer delivery territory, product availability and legal/compliance restrictions must be tracked separately. Never infer one from another.
- If several approved partners offer the same product in different markets, route the visitor to the verified partner serving that visitor's country, using that partner's own tracking URL and market-specific price/currency/terms.
- If no verified partner serves the visitor's country, the product may remain discoverable where accurate, but the purchase action must be disabled or replaced by a clear regional-unavailability notice. Never bypass geo-blocks or promise unavailable delivery.
- Each offer must record supported customer countries, shipping/service regions, currency, availability, tracking URL, image permissions and last verification date.
- The canonical policy is `data/territory-visibility-policy.json`.

### Social promotion and TikTok

- GitHub Actions can generate the daily promotion package and vertical video.
- TikTok Direct Post is currently restricted to `SELF_ONLY` private testing and requires explicit consent for each test submission.
- Public TikTok publishing is not enabled until the TikTok application and required permissions are approved. The code must not be changed to bypass this restriction.
- A generated video or successful GitHub Pages deployment does not mean a public TikTok post has been published.

## Network status

| Network / channel | Status |
|---|---|
| CJ Affiliate | Active; dynamic joined-advertiser feeds |
| Awin | Planned; not activated |
| Direct luxury partners | Prospects and negotiations tracked separately |
| TikTok public publishing | Disabled pending platform approval |

## Key files

- `data/catalog.json` — generated public product catalogue
- `data/translation-cache.json` — translation cache
- `data/direct-partners.json` — direct-partner registry and evidence
- `docs/GLOBAL-AFFILIATE-GEOGRAPHIC-COVERAGE.md` — global product discovery with country-specific affiliate offer eligibility and routing policy
- `scripts/sync-cj-advertisers.mjs` — CJ advertiser discovery, feed import and catalogue merge
- `scripts/translate-to-english.mjs` — safe translation batches
- `app-cj-loader.js` — public storefront loader
- `api/tiktok-direct-post.js` — private TikTok Direct Post endpoint
- `api/cj-commission-sync.js` — private CJ Commission Detail import
- `api/lead-admin-events.js` — protected dashboard data API
- `lead-sales-dashboard.html` — protected Lead & Sales dashboard
- `LEAD-SALES-TRACKING.md` — click and commission reconciliation details
- `.github/workflows/cj-products.yml` — six-hour CJ product synchronization
- `.github/workflows/translate-catalog.yml` — scheduled translation batches
- `.github/workflows/cj-commission-sync.yml` — daily CJ sales and commission import
- `.github/workflows/validate-cj-sync.yml` — catalogue validation
- `.github/workflows/direct-partners.yml` — direct-partner validation
- `.github/workflows/daily-promotion.yml` — daily promotion-video generation

## Security

- API tokens and secrets belong in GitHub Actions Secrets or the relevant hosting provider's encrypted environment variables.
- Never commit API tokens, access tokens, passwords, session secrets or private customer data.
- Never publish an unapproved partner listing or a product with an unverified affiliate link.
