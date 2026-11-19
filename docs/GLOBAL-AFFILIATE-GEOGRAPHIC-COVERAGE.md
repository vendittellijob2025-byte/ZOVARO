# Global catalogue and country-specific affiliate coverage

## Policy

ZOVARO is a global discovery platform. A merchant's affiliate programme being restricted to one country or sales territory is **not, by itself, a reason to exclude that merchant or its products from ZOVARO's global catalogue**.

A product may be discovered and displayed to users worldwide when the merchant permits the relevant promotional activity. The actual purchase/referral option must be selected according to the visitor's country and the merchant's verified sales and delivery coverage.

In short: **global discovery, country-appropriate checkout**.

## Required operating rules

1. **Keep geographically limited opportunities in scope.** Register merchants and affiliate programmes even when they only accept publishers, customers, or orders in selected countries. Record the exact eligible publisher countries, customer/order countries, shipping destinations and any other territorial restrictions separately.
2. **Do not confuse publisher eligibility with customer availability.** A programme may accept publishers from one country while selling to customers in several countries, or vice versa. Verify both independently from the network/merchant terms.
3. **Route by visitor destination.** When a visitor selects or is reliably identified as being in a country, prefer an active offer from a merchant that accepts orders and delivers there. Preserve the merchant's tracking URL and required sub-ID parameters.
4. **Use alternative regional affiliates.** The same product, model or equivalent SKU may have multiple merchant offers. Maintain one product identity with country-specific merchant offers rather than treating each regional offer as an unrelated product.
5. **Do not promise unavailable delivery.** Never show a regional affiliate checkout as suitable for a country unless the merchant's delivery/order eligibility is verified. If no suitable merchant exists, the product can remain discoverable but must be marked as unavailable for direct purchase in that visitor's market, with no misleading buy CTA.
6. **Respect programme terms.** Global visibility is allowed only where the programme's promotional, audience, trademark, paid-search, content and territorial rules permit it. A product must not be promoted into prohibited countries or through prohibited methods.
7. **Display accurate commercial details.** Show the merchant, destination market, currency, price freshness, shipping/returns caveats and material import/customs/tax limitations when known. Do not convert a local price into a promise that the merchant will sell or ship internationally.
8. **Keep attribution verifiable.** Each country-specific offer needs a verified tracking/deep link or documented referral method, active partner status, commission terms and a testable attribution path before it is marked promotable.
9. **Separate product presence from offer eligibility.** Catalogue ingestion/classification may retain a product globally; storefront purchase actions must be filtered by verified country-specific offer eligibility.
10. **Prefer coverage over exclusivity.** Where permitted, seek agreements with multiple regional merchants for the same brand/product family. A country-limited programme can still be commercially valuable to ZOVARO because its audience is international.

## Minimum offer data

Each merchant offer should record, where available:

- canonical product identifier (GTIN/EAN/UPC/MPN or a carefully matched model/SKU);
- merchant and affiliate network;
- partner/application/approval/tracking/feed verification status;
- publisher-eligible countries;
- customer/order-eligible countries;
- verified shipping destinations and exclusions;
- local price, currency, stock/availability timestamp and product URL;
- tracking URL/deep link and required attribution parameters;
- commission, cookie/attribution window, validation and payout terms;
- programme restrictions and evidence/source URL, plus last-checked date.

Unknown country coverage must remain **unknown**, not be assumed global.

## Storefront decision logic

- If one or more verified offers serve the visitor's country, show the best eligible offer(s), with transparent merchant and price details.
- If the product is globally discoverable but no verified offer serves that country, retain its product page/discovery presence where permitted, but suppress or disable the purchase CTA and explain that no local purchase partner is currently available.
- If the merchant permits international shipping, use that offer only for the destinations explicitly confirmed by the merchant.
- If country detection is uncertain, ask the visitor to choose a delivery country rather than silently sending them to a potentially unsuitable checkout.
- Never redirect a visitor to a regional affiliate link that is known to be ineligible for their destination.

## Partner acquisition implication

ZOVARO should actively approach merchants and affiliate programmes in individual countries and regions, not only global programmes. Outreach should explain that ZOVARO has an international audience and can route interested visitors to the merchant's own country-specific storefront. Ask each merchant to confirm publisher eligibility, customer territories, shipping coverage, feed/API access, tracking, commission, cookie, exclusions and payout terms.

A regional programme is a **qualified opportunity**, not an automatic approval. Do not mark it active or publish its offers until the normal approval, terms, tracking, feed/content-rights and availability checks pass.

## Implementation boundary

This document establishes the catalogue and partner-acquisition policy. It does not claim that country-aware routing, geo-detection, or a complete regional offer database is already implemented. Those require explicit product/offer data fields, storefront selection logic and tests before being described as live.
