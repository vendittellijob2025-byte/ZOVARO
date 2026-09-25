# ZOVARO V2 — AI Product Discovery

ZOVARO is an AI-assisted product discovery platform designed to help users discover products from trusted affiliate networks.

## Current status

The CJ Affiliate integration is active and operational.

### CJ Affiliate

* Real CJ Affiliate product feed
* 100 real products currently synchronized
* Active advertisers:

  * Kaiya Baby
  * Padel Iberico ES
* Real CJ tracking links
* Automatic catalog synchronization
* GitHub Actions workflow
* Product catalog generated automatically in `data/catalog.json`

The live ZOVARO frontend loads the synchronized catalog automatically.

## Affiliate architecture

ZOVARO is structured to support multiple affiliate networks.

Current network status:

* CJ Affiliate — Active
* Awin — Planned
* Additional networks — Future

Only networks explicitly marked as active are loaded into the live product catalog.

## Automatic synchronization

The CJ product catalog is synchronized through GitHub Actions.

The workflow:

1. Connects to the CJ Affiliate API.
2. Retrieves joined advertiser products.
3. Generates the normalized ZOVARO catalog.
4. Saves the catalog to `data/catalog.json`.
5. Commits updated catalog data automatically when changes are detected.

The scheduled synchronization runs every 12 hours.

## Project structure

```text
ZOVARO/
├── .github/
│   └── workflows/
│       └── cj-products.yml
├── data/
│   └── catalog.json
├── scripts/
│   ├── fetch-cj-products.mjs
│   └── network-config.mjs
├── app-cj-loader.js
├── app.js
├── index.html
├── products.js
└── styles.css
```

## Network configuration

Affiliate networks are controlled through:

`scripts/network-config.mjs`

A network can be marked as active or planned without changing the frontend architecture.

## Important

`data/catalog.json` is generated automatically.

Do not manually edit the generated CJ catalog.

The CJ API token is stored securely as a GitHub Actions secret and is not included in the repository.

## GitHub Pages

The live site is published from the `main` branch.

The live site updates automatically after changes are committed to the publishing branch.
