# ZOVARO classification research log

This log records external evidence used to validate representative product identities and turn findings into reusable classifier tests. It is not a claim that every catalogue item has been manually checked.

## Research batch — 2026-11-19

### 1. Bruno Marc CrossFlex Lite Polish Men's Non-Slip Smart Casual Oxfords

- Product identity: men's Oxford-style footwear.
- Independent evidence: Bruno Marc product page explicitly places the item under `Men / Oxfords`.
- ZOVARO decision: `Fashion > Shoes > Formal Shoes`.
- Amazon check: Amazon search was attempted, but Amazon pages were blocked to this research session; no Amazon browse path was recorded or claimed.
- Source: https://www.brunomarc.com/products/mens-casual-smart-oxford-shoes-sbox2417m
- Related collection: https://www.brunomarc.com/collections/oxfords

### 2. Anker Nano Power Bank (5K, MagGo, Slim)

- Product identity: 5,000mAh portable battery / wireless power bank for charging a phone.
- Independent evidence: Anker's product page identifies the item as a Power Bank and documents its battery capacity, USB-C port, and wireless charging output.
- ZOVARO decision: `Electronics > Phones & Tablets > Power Banks & Portable Chargers`.
- Classifier improvement: added the explicit Power Banks & Portable Chargers browse path to the ZOVARO taxonomy and a narrow title rule.
- Amazon check: Amazon search was attempted, but Amazon pages were blocked to this research session; no Amazon browse path was recorded or claimed.
- Source: https://www.anker.com/products/a1665-5k-ultra-slim-qi2-power-bank

### 3. Espoir Fresh Setting Powder

- Product identity: cosmetic face-setting powder.
- Independent evidence: the brand's retailer catalogue lists Espoir Fresh Setting Powder among Face Makeup / Face Powder products.
- ZOVARO decision: `Beauty > Makeup > Face Makeup`.
- Classifier improvement: included `setting powder` in the Face Makeup subcategory rule and added a regression test.
- Amazon check: Amazon search was attempted, but Amazon pages were blocked to this research session; no Amazon browse path was recorded or claimed.
- Source: https://global.amoremall.com/collections/espoir

### 4. OSULLOC Samdayeon Original Milk Tea

- Product identity: powdered milk tea beverage mix, supplied in individual sticks.
- Independent evidence: the product page describes tea and milk ingredients and preparation as a hot or cold drink; the OSULLOC catalogue lists it alongside other tea products.
- ZOVARO decision: `Food & Grocery > Beverages > Tea`.
- Amazon check: Amazon search was attempted, but Amazon pages were blocked to this research session; no Amazon browse path was recorded or claimed.
- Sources:
  - https://global.amoremall.com/products/osulloc-original-milk-tea-10-sticks
  - https://global.amoremall.com/collections/osulloc

## Implementation note

The product classifier regression suite now includes exact subcategory cases for the Anker power bank and Espoir setting powder. The Bruno Marc and OSULLOC examples already have primary-category regression coverage. Do not mark any of these records as Amazon-verified until an actual Amazon product page or breadcrumb has been inspected successfully.


### 5. L'Occitane Divine Youth Oil

- Product identity: facial skincare oil intended for the face and neck; the manufacturer's instructions specify morning/evening application and describe nourishing, firming and radiance benefits.
- Primary evidence: L'Occitane's official US page identifies it as a face oil; L'Occitane Colombia calls it a facial youth oil and describes its facial application.
- Independent corroboration: Costco and Nordstrom describe the same Immortelle Divine Youth Oil as a skin/face treatment.
- ZOVARO decision: `Beauty > Skincare > Face Skincare`.
- Classifier improvement: added the exact product identity and general face-oil terms, with primary-category and subcategory regression tests.
- Amazon check: Amazon search was attempted, but Amazon pages were blocked to this research session; no Amazon browse path was recorded or claimed.
- Sources:
  - https://www.loccitane.com/en-us/divine-youth-oil-27DH015I22.html
  - https://co.loccitane.com/products/aceite-de-juventud-immortelle-divina
  - https://www.costco.com/p/-/loccitane-immortelle-divine-youth-oil-1-fl-oz/4000231915
  - https://www.nordstrom.com/s/loccitane-immortelle-divine-youth-oil/4758653

## Implementation note

The regression suite now covers the Anker power bank, Espoir setting powder, Instant Firmx face-tightening cream, Clinique eye treatment, and L'Occitane facial oil at both primary-category and subcategory level where applicable. The Bruno Marc and OSULLOC examples retain primary-category coverage. Do not mark any of these records as Amazon-verified until an actual Amazon product page or breadcrumb has been inspected successfully.


### 6. High-confidence classification from the catalog's Other sample

The following product identities were checked against manufacturer or marketplace descriptions and are now covered by regression tests:

- Perfumania fragrance listing → `Beauty > Fragrances & Perfumes`; the retailer has an official Beauty & Cosmetics catalogue.
- OSULLOC Camellia Forest Tea → `Food & Grocery > Beverages > Tea`; the product page identifies a black-tea blend and tea-bag preparation.
- FRP Moto Sahara 40 → `Automotive > Motorcycles, Accessories & Parts > ATV & Powersports`; the manufacturer identifies it as a 40cc kids ATV.
- RotoSound Roto Whites 11-54 → `Musical Instruments & Studio > Instrument Accessories > Strings & Reeds`; the manufacturer identifies them as electric-guitar strings.
- Tamiya Extra Thin Cement Quick Setting 87182 → `Arts, Crafts & Sewing > Crafts & Creative DIY > Models & Miniatures`; the manufacturer describes it as cement for model construction.
- DeWALT DCMBA572 → `Garden > Lawn Care > Leaf Blowers`; the manufacturer lists it in cordless leaf blowers.
- Siemens TZ80001B → `Appliances > Kitchen Appliances > Coffee Machine Accessories`; Siemens identifies it as cleaning tablets for automatic coffee machines.
- Solar phone charger with panel → `Energy, Solar & Electric Mobility > Solar & Renewable Energy > Solar Panels`; the Allegro listing identifies it as a solar phone charger.
- Mediseptol H → `Health & Wellness > Home Cleaning & Care > Disinfectants`; the product listing describes surface disinfection in medical and service environments.
- Jaxon Safe Extra Strong landing net and Dragon jig heads → `Sports > Fishing > Fishing Tackle`; Allegro's product and category listings identify the landing net as fishing equipment.
- Polish anti-slip socks, gold engagement ring and protective neck gaiter → Fashion clothing/jewelry/accessory paths.

Amazon status: these examples are **not** marked Amazon-verified. Amazon.com returned a robots.txt access block in this research session, so the above decisions rely on manufacturer or independent marketplace evidence instead.

Sources:
- https://perfumania.com/collections/beauty-cosmetics
- https://global.amoremall.com/products/osulloc-camellia-flower-tea-20-count-1
- https://www.frpmoto.com/products/40cc-sahara-40-kids-atv
- https://www.rotosound.com/product/r11-54/
- https://www.tamiya.com/english/products/87182/index.html
- https://www.dewalt.com.au/en-au/product/dcmba572n-xe/54v-xr-flexvolt-blower-tool-only
- https://www.siemens-home.bsh-group.com/es/es/product/limpieza-y-mantenimiento/cafeteras/productos-limpieza-para-cafeteras/TZ80001B
- https://allegro.pl/kategoria/dom-i-ogrod?string=%C5%82adowarka+s%C5%82oneczna+do+telefonu
- https://www.ceneo.pl/162714824
- https://allegro.pl/oferta/podbierak-jaxon-safe-extra-strong-teleskop-aluminium-dlugosc-2-30m-9761235772

## Implementation note

The classifier now has regression coverage for representative perfume, tea, ATV, guitar strings, harmonica, model adhesive, leaf blower, coffee-machine cleaning tablets, solar charger, disinfectant, fishing gear and Polish fashion listings. Every subcategory case is checked against the canonical taxonomy tree before it can pass.


Regression safeguard: the generic word "tea" is not a primary-category rule. OSULLOC is identified by brand, while tea strainers remain Home & Living > Kitchen & Dining; this prevents a beverage keyword from overriding a kitchen utensil.


### 7. Source-category and visual-evidence safeguards

- A partner's source category is now fallback evidence, not an authority that can override a clear product title or a known specialist advertiser.
- Visual root classification is permitted only when text, product description and known advertiser identity cannot classify the product. It cannot overwrite a confident text/merchant classification.
- Coupons, discount codes, memberships and installation/service offers are excluded from image-based product classification.
- Added regression cases for flat irons, instrument cables, fragrance listings, decanters, shoes, fishing lines, yarn, EV adapters and software where partner categories previously conflicted with the product identity.


### 8. Second precision pass from the post-reclassification examples

- Mapped fragrance-retailer offers to fragrance subcategories without relying on generic words such as “Sport”.
- Corrected hair-color and face-peel products, tablet batteries, Oral-B brush heads, Polish books/CDs, pet deodorizing sprays, baby fragrances, HDMI cables, leather belts, and wooden ship model kits.
- Added merchant-aware mappings for UNice hair accessories, Vitajuwel drinkware, and Abelssoft utilities.
- Kept gift cards, coupons, memberships and installation services outside the physical-product taxonomy.
- Added multilingual product signals for French 3D filament listings and Polish product titles.


### 9. Manufacturer-verified and multilingual category corrections

- Rexing B1 night-vision binoculars are classified under Sports / Hunting / Outdoor Optics; the adhesive mount and GPS module for Rexing dash cameras are Automotive accessories.
- SATEL Perfecta is an alarm control panel, not a pet product; Medisept Velox Spray is a medical-surface disinfectant.
- KOA+ROY Fitness Cube is a post-workout muscle balm; TWO SLASH FOUR Glaze Lip Changer and Strobing Face Cube are makeup products.
- Added exact paths for hair accessories, wigs, travel guides, scrapbooking paper, eyelid cleansers, mouthwash, alarm panels, dash-camera accessories and night-vision optics.
- Source references: https://www.rexingusa.com/product/b1-black/ ; https://rexing.com/products/rexing-adhesive-mount-for-v2-pro-ai ; https://www.satel.pl/en/products/intruder-alarms/perfecta/alarm-control-panels/perfecta-16-lte/ ; https://medisept.pl/pobierz-atrybut/CqY2MGTDGOLzlixLNjhspBhx9pt4Brit/pdf/Ulotka%20produktowa%20%28EN%29 ; https://koaroy.com/products/fitness-cube ; https://en.twoslashfour.com/product/glaze-lip-changer-nu-ginger/23/


### 10. Follow-up corrections from the newest catalog audit

- ETAFOR massage guns are Health & Wellness / Massage & Relaxation; VITALBEAUTIE MetaGreen is weight-management nutrition and Super Retinol is grouped with skin-health supplements.
- Shone 001-002 is children's footwear; Color Wow Root Cover Up is hair-color touch-up powder; Marella Sport's knitted coat is Fashion rather than Sports.
- Jigapix Pets is a Nintendo DS video game, and “PET” in the Polish bottle listing refers to plastic, not animals.
- Corrected the remaining title collisions for “Glow Baby Glow”, music CDs/DVDs, mouthwash, seasonal decorations, dash cameras and antenna power supplies.
- Research sources: ETAFOR product listing https://www.ecosmetics.com/product/plus-massage-gun/ ; Shone model listing https://www.moda-nova.com/?product_tag=girl ; VITALBEAUTIE brand products https://www.belieef.com/vitalbeautie ; Amorepacific VITALBEAUTIE MetaGreen product-design overview https://design.amorepacific.com/en/work/2024/vitalbeautie/meta-green-line/ ; JIGAPIX PETS Nintendo DS listing https://allegro.pl/produkt/jigapix-pets-nintendo-ds-pudelkowa-d328badb-b58d-4206-9b17-15d567256c85 ; COLOR WOW Root Cover Up official page https://colorwowhair.com/products/root-cover-up .
