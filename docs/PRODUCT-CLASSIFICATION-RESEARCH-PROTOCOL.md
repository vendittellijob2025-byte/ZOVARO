# ZOVARO product classification research protocol

## Purpose

Classify the product or service by what it actually is and what it is used for, not by isolated words, brand names, model numbers, advertiser labels, or a guessed keyword match. The objective is reliable, repeatable category and subcategory placement across the global catalogue.

## When external research is mandatory

Research before assigning a final category whenever:
- the title, description, image, merchant category, and structured product attributes disagree;
- two or more ZOVARO categories are plausible;
- a brand or model name appears to dominate the text but may describe only compatibility (for example, a Samsung phone armband is a running accessory, not a Samsung phone);
- the item is a bundle, kit, replacement part, accessory, service, rental, or specialist product whose primary purpose is unclear;
- the classifier would otherwise return `Other`, or a broad category rule would make a weak inference.

## Evidence sequence

1. **Identify the exact item.** Extract product type, intended use, material/form, compatibility, model, and whether it is a product, accessory, replacement part, service, rental, or bundle.
2. **Check Amazon listings.** Search Amazon in a relevant marketplace for the exact title/model and, if unavailable, for equivalent products. Inspect the visible product breadcrumb/category placement and the product detail page where accessible. Record the marketplace and the observed category path. Amazon is a reference signal, not an unquestionable authority: marketplace taxonomies vary and listings can themselves be misclassified.
3. **Cross-check independent search results.** Search the exact product name/model and a generic product-type query. Prefer manufacturer product pages, manuals/specification pages, established specialist retailers, and relevant category pages. Distinguish primary product identity from compatibility keywords and promotional language.
4. **Inspect the image.** Compare the product image with the title and specifications. Use visual/object recognition as corroboration, not as the sole source where an image is ambiguous, decorative, or generic.
5. **Resolve conflicts.** If sources disagree, compare the actual function and intended use. Do not settle the conflict by counting keyword matches. If reliable evidence remains insufficient, keep the item in a review/uncertain state rather than forcing a specific subcategory.
6. **Map to ZOVARO taxonomy.** Choose the closest valid ZOVARO category and deepest justified subcategory in `data/category-tree.json`. Amazon's breadcrumb is guidance; do not copy Amazon proprietary identifiers or assume ZOVARO uses official Amazon Browse Node IDs.
7. **Make the decision reproducible.** Add a regression test with the product identity and expected ZOVARO category/subcategory, and add or refine a narrow classifier rule only when the evidence supports it. Include the confusing keyword or collision that previously caused the error.

## Evidence and confidence

For researched exceptions, preserve (where the data model permits):
- exact product title and model;
- product type and primary use;
- Amazon marketplace and observed breadcrumb, or a note that no useful Amazon match was available;
- independent corroborating source(s);
- image agreement/disagreement;
- selected ZOVARO category and subcategory;
- concise reason for the decision and date checked.

Use these decision levels:
- **High confidence:** exact product/model match or multiple independent sources agree, and the image/specifications are consistent.
- **Medium confidence:** exact match unavailable, but product type and intended use are supported by reliable equivalent listings and attributes.
- **Low confidence / unresolved:** sources conflict, image is unclear, or the product identity cannot be established. Do not auto-force a deep subcategory; flag it for review.

## Quality safeguards

- Never infer that a product belongs to Babies solely because the word “baby” occurs in a compatible-device model or unrelated marketing phrase.
- Never classify a product by brand alone; brands can span many departments.
- Accessories and replacement parts follow their own function, not automatically the category of the device they fit.
- A travel-sized perfume remains Beauty > Perfumes; travel wording does not make it luggage or travel equipment.
- A phone armband for running belongs with running accessories, not Electronics merely because it mentions a phone brand/model.
- A makeup product remains Beauty even if unrelated baby wording appears in the title.
- A mug or kitchen tableware item belongs in Home & Living / Kitchen & Tableware, not an unrelated category triggered by a brand or material word.
- Automotive accessories and parts belong in the appropriate Automotive branch, not generic Electronics just because they contain a camera, charger, or sensor.
- A service, rental, coupon, subscription, or promotional bundle must not be forced into a physical-goods category.

## Limits and integrity

Amazon and search engines are external evidence, not guaranteed ground truth. Product pages may be unavailable, marketplace-specific, or incorrectly categorized. Never claim that a page was inspected if it was not accessible. Search snippets alone are weaker evidence than a product detail page or manufacturer specification. No paid search or AI service is required by this protocol. Do not use a paid service or incur a cost without explicit owner approval.

The automated consistency audit can verify that stored categories agree with the current classifier and taxonomy; that agreement alone does **not** independently prove that the classifier's original decision is correct. Independent researched examples and regression tests are therefore required.
