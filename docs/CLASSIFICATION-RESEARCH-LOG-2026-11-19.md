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
