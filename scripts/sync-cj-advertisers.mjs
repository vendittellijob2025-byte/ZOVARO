import fs from "node:fs/promises";
import { NETWORKS } from "./network-config.mjs";

const API_URL = "https://ads.api.cj.com/query";
const ADVERTISER_API_URL = "https://advertiser-lookup.api.cj.com/v2/advertiser-lookup";
const COMPANY_ID = "8068799";
const PUBLISHER_ID = "101881140";
const PAGE_SIZE = 1000;
const MAX_OFFSET_RESULTS = 10000;
const ADVERTISER_PAGE_SIZE = 100;
const CATALOG_PATH = "data/catalog.json";

const token = process.env.CJ_API_TOKEN;
if (!token) throw new Error("CJ_API_TOKEN is missing.");

function decodeXml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function xmlTag(block, tag) {
  const match = block.match(new RegExp("<" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + tag + ">", "i"));
  return match ? decodeXml(match[1].replace(/<[^>]+>/g, "").trim()) : "";
}

function categoryFor(advertiser, product) {
  const text = [
    advertiser.parentCategory, advertiser.childCategory, product.category,
    product.title, product.description, product.brand, advertiser.name
  ].filter(Boolean).join(" ").toLowerCase();

  if (/\b(baby|babies|infant|newborn|nursery|diaper|toddler|kids|children)\b/.test(text)) return "Babies";
  if (/\b(pet|pets|dog|dogs|cat|cats|canine|feline)\b/.test(text)) return "Pets";
  if (/\b(automotive|automobile|car parts|vehicle|motorcycle|motorbike|car accessories)\b/.test(text)) return "Automotive";
  if (/\b(travel|luggage|suitcase|airline|hotel|holiday|vacation)\b/.test(text)) return "Travel";
  if (/\b(garden|gardening|plant|plants|lawn|horticulture)\b/.test(text)) return "Garden";
  if (/\b(toy|toys|board game|puzzle|doll|action figure|video game|gaming)\b/.test(text)) return "Toys & Games";
  if (/\b(beauty|cosmetic|skincare|skin care|makeup|fragrance|perfume|haircare)\b/.test(text)) return "Beauty";
  if (/\b(fashion|clothing|apparel|footwear|shoes|sneakers|handbag|jewelry|garment)\b/.test(text)) return "Fashion";
  if (/\b(sport|sports|fitness|padel|tennis|golf|gym|cycling|athletic|exercise)\b/.test(text)) return "Sports";
  if (/\b(electronic|electronics|smartphone|mobile phone|tablet|headphone|earbud|camera|television|audio)\b/.test(text)) return "Electronics";
  if (/\b(office|software|computer|laptop|printer|keyboard|mouse|technology|tech)\b/.test(text)) return "Office & Technology";
  return "Home & Living";
}

function cleanUrl(value) {
  if (typeof value !== "string") return "";
  const candidate = value.trim().replace(/&amp;/g, "&");
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function amount(value) {
  const number = Number(value?.amount);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function parseAdvertisers(xml) {
  const advertisersBlock = (xml.match(/<advertisers\b[^>]*>([\s\S]*?)<\/advertisers>/i) || [])[1] || "";
  const records = advertisersBlock.match(/<advertiser(?:\s[^>]*)?>[\s\S]*?<\/advertiser>/gi) || [];
  return records.map(block => {
    const categoryBlock = (block.match(/<primary-category(?:\s[^>]*)?>([\s\S]*?)<\/primary-category>/i) || [])[1] || "";
    return {
      id: xmlTag(block, "advertiser-id"),
      name: xmlTag(block, "advertiser-name"),
      accountStatus: xmlTag(block, "account-status"),
      relationshipStatus: xmlTag(block, "relationship-status").toLowerCase(),
      parentCategory: xmlTag(categoryBlock, "parent"),
      childCategory: xmlTag(categoryBlock, "child")
    };
  }).filter(item => item.id && item.relationshipStatus === "joined" && (!item.accountStatus || item.accountStatus.toLowerCase() === "active"));
}

async function getJoinedAdvertisers() {
  const all = [];
  for (let page = 1; page <= 1000; page++) {
    const url = new URL(ADVERTISER_API_URL);
    url.searchParams.set("requestor-cid", COMPANY_ID);
    url.searchParams.set("advertiser-ids", "joined");
    url.searchParams.set("page-number", String(page));
    url.searchParams.set("records-per-page", String(ADVERTISER_PAGE_SIZE));

    const response = await fetch(url, {
      headers: { Authorization: "Bearer " + token, Accept: "application/xml" }
    });
    if (!response.ok) throw new Error("CJ Advertiser Lookup failed with HTTP " + response.status);
    const xml = await response.text();
    const pageItems = parseAdvertisers(xml);
    all.push(...pageItems);

    const totalMatch = xml.match(/<advertisers\b[^>]*\btotal-matched=["'](\d+)["']/i);
    const returnedMatch = xml.match(/<advertisers\b[^>]*\brecords-returned=["'](\d+)["']/i);
    const total = totalMatch ? Number(totalMatch[1]) : null;
    const returned = returnedMatch ? Number(returnedMatch[1]) : pageItems.length;

    if (returned < ADVERTISER_PAGE_SIZE || (total !== null && all.length >= total) || returned === 0) break;
    if (page === 1000) throw new Error("Advertiser pagination exceeded the safety limit.");
  }

  const unique = new Map();
  for (const advertiser of all) unique.set(advertiser.id, advertiser);
  return [...unique.values()];
}

async function graphql(query) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });

  const body = await response.text();
  if (!response.ok) throw new Error("CJ Product Feed API failed with HTTP " + response.status);

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    throw new Error("CJ Product Feed API returned invalid JSON.");
  }

  if (payload.errors?.length) {
    throw new Error("CJ GraphQL error: " + payload.errors.map(item => item.message || "unknown error").join("; "));
  }
  if (!payload.data) throw new Error("CJ GraphQL response did not contain data.");
  return payload.data;
}

async function getProductFeeds(advertiserIds) {
  const feeds = [];
  for (let index = 0; index < advertiserIds.length; index += 40) {
    const batch = advertiserIds.slice(index, index + 40);
    const query = [
      "query {",
      "  productFeeds(companyId: \"" + COMPANY_ID + "\", partnerIds: " + JSON.stringify(batch) + ") {",
      "    totalCount count",
      "    resultList { adId feedName advertiserId advertiserName productCount advertiserCountry language currency lastUpdated }",
      "  }",
      "}"
    ].join("\n");

    const result = (await graphql(query)).productFeeds;
    if (!result || !Array.isArray(result.resultList)) throw new Error("CJ returned an invalid product feed summary.");
    if (Number(result.count) < Number(result.totalCount)) {
      throw new Error("CJ product feed summary was incomplete; catalog update cancelled for safety.");
    }
    feeds.push(...result.resultList);
  }
  return feeds;
}

function productQuery(advertiserId, offset) {
  return [
    "query {",
    "  products(companyId: \"" + COMPANY_ID + "\", partnerIds: [\"" + advertiserId + "\"], limit: " + PAGE_SIZE + ", offset: " + offset + ") {",
    "    resultList {",
    "      id adId advertiserId advertiserName title description brand imageLink additionalImageLink link mobileLink",
    "      price { amount currency }",
    "      salePrice { amount currency }",
    "      discountPercentage",
    "      linkCode(pid: \"" + PUBLISHER_ID + "\") { clickUrl }",
    "    }",
    "    totalCount count",
    "  }",
    "}"
  ].join("\n");
}

async function getProductsForAdvertiser(advertiser) {
  const all = [];
  let offset = 1;
  let totalCount = null;

  while (true) {
    const result = (await graphql(productQuery(advertiser.id, offset))).products;
    if (!result || !Array.isArray(result.resultList)) throw new Error("CJ returned an invalid products response for advertiser " + advertiser.id);

    if (totalCount === null) totalCount = Number(result.totalCount || 0);
    if (totalCount > MAX_OFFSET_RESULTS) {
      throw new Error("Advertiser " + advertiser.id + " has more than 10,000 products; pagination token support is required before importing it safely.");
    }

    all.push(...result.resultList);
    const count = Number(result.count ?? result.resultList.length);
    if (count === 0 || all.length >= totalCount || count < PAGE_SIZE) break;
    offset += count;
  }

  return all;
}

function makeCatalogProduct(product, advertiser) {
  const id = String(product.id || "").trim();
  const title = String(product.title || "").trim();
  const imageLink = cleanUrl(product.imageLink);
  const clickUrl = cleanUrl(product.linkCode?.clickUrl);
  const destination = cleanUrl(product.link);
  const regularPrice = amount(product.price);
  const rawSalePrice = amount(product.salePrice);
  const salePrice = regularPrice && rawSalePrice && rawSalePrice < regularPrice ? rawSalePrice : null;

  if (!id || !title || !imageLink || !clickUrl || regularPrice === null) return null;

  const parsedClick = new URL(clickUrl);
  const parsedDestination = destination ? new URL(destination) : null;
  if (parsedDestination && parsedClick.hostname === parsedDestination.hostname && parsedClick.pathname === parsedDestination.pathname) return null;

  return {
    source: "CJ",
    network: NETWORKS.CJ.network,
    id,
    adId: String(product.adId || ""),
    title,
    description: String(product.description || ""),
    brand: String(product.brand || ""),
    advertiserId: advertiser.id,
    advertiserName: String(product.advertiserName || advertiser.name || "CJ Affiliate"),
    category: categoryFor(advertiser, product),
    imageLink,
    additionalImageLinks: Array.isArray(product.additionalImageLink) ? product.additionalImageLink.map(cleanUrl).filter(Boolean) : [],
    destination,
    clickUrl,
    mobileLink: cleanUrl(product.mobileLink),
    price: regularPrice,
    salePrice,
    currency: product.salePrice?.currency || product.price?.currency || "USD",
    discountPercentage: salePrice ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : null,
    joinedStatus: true
  };
}

function productKey(product) {
  return [product.source || "", product.advertiserId || "", product.id || ""].join("|");
}

async function readCatalog() {
  try {
    const raw = await fs.readFile(CATALOG_PATH, "utf8");
    const catalog = JSON.parse(raw);
    if (!catalog || !Array.isArray(catalog.products)) throw new Error("Catalog has no products array.");
    return catalog;
  } catch (error) {
    if (error.code === "ENOENT") throw new Error("Existing catalog is missing; refusing to create a replacement catalog.");
    throw error;
  }
}

const catalog = await readCatalog();
const joinedAdvertisers = await getJoinedAdvertisers();
if (!joinedAdvertisers.length) throw new Error("CJ returned no active joined advertisers; existing catalog was left untouched.");

console.log("Active joined CJ advertisers found: " + joinedAdvertisers.length);

const joinedIds = new Set(joinedAdvertisers.map(item => item.id));
const feeds = await getProductFeeds([...joinedIds]);
const eligibleFeedAdvertisers = new Set(
  feeds.filter(feed => joinedIds.has(String(feed.advertiserId)) && Number(feed.productCount) > 0)
    .map(feed => String(feed.advertiserId))
);

console.log("Joined advertisers with product feeds: " + eligibleFeedAdvertisers.size);
if (!feeds.length) throw new Error("CJ returned no product feed summaries; existing catalog was left untouched.");

const advertiserMap = new Map(joinedAdvertisers.map(item => [item.id, item]));
const importedByKey = new Map();
let received = 0;

for (const advertiserId of eligibleFeedAdvertisers) {
  const advertiser = advertiserMap.get(advertiserId);
  if (!advertiser) continue;

  const products = await getProductsForAdvertiser(advertiser);
  received += products.length;

  for (const product of products) {
    if (String(product.advertiserId || advertiserId) !== advertiserId) continue;
    const normalized = makeCatalogProduct(product, advertiser);
    if (normalized) importedByKey.set(productKey(normalized), normalized);
  }
}

const imported = [...importedByKey.values()];
if (!imported.length) {
  throw new Error("CJ returned no products with valid prices, images and affiliate click URLs; existing catalog was left untouched.");
}

const previousProducts = catalog.products;
const merged = new Map(previousProducts.map(product => [productKey(product), product]));

for (const product of imported) {
  const key = productKey(product);
  const previous = merged.get(key);
  const next = { ...(previous || {}), ...product };

  if (previous && previous.title !== product.title) delete next.englishTitle;
  if (previous && previous.description !== product.description) delete next.englishDescription;
  if (previous && previous.category !== product.category) delete next.englishCategory;

  merged.set(key, next);
}

const finalProducts = [...merged.values()];
const advertiserRecords = new Map(
  (Array.isArray(catalog.advertisers) ? catalog.advertisers : []).map(item => [String(item.id), item])
);

for (const advertiser of joinedAdvertisers) {
  if (eligibleFeedAdvertisers.has(advertiser.id)) {
    advertiserRecords.set(advertiser.id, {
      id: advertiser.id,
      name: advertiser.name,
      category: categoryFor(advertiser, {})
    });
  }
}

const sourceRecords = new Map(
  (Array.isArray(catalog.sources) ? catalog.sources : []).map(item => [item.source, item])
);
sourceRecords.set("CJ", {
  ...(sourceRecords.get("CJ") || {}),
  source: "CJ",
  network: NETWORKS.CJ.network,
  status: "active"
});

const now = new Date().toISOString();
const updatedCatalog = {
  ...catalog,
  sources: [...sourceRecords.values()],
  generatedAt: now,
  companyId: COMPANY_ID,
  promotionalPropertyId: PUBLISHER_ID,
  advertisers: [...advertiserRecords.values()],
  rowsReceived: received,
  productCount: finalProducts.length,
  products: finalProducts,
  sync: {
    ...(catalog.sync || {}),
    lastSuccessfulSyncAt: now,
    joinedAdvertisersFound: joinedAdvertisers.length,
    advertisersWithProductFeeds: eligibleFeedAdvertisers.size,
    productsReceived: received,
    productsWithValidTrackingLinks: imported.length,
    productsPreservedFromPreviousCatalog: previousProducts.length
  }
};

await fs.mkdir("data", { recursive: true });
const tempPath = CATALOG_PATH + ".tmp";
await fs.writeFile(tempPath, JSON.stringify(updatedCatalog, null, 2), "utf8");
await fs.rename(tempPath, CATALOG_PATH);

console.log("ZOVARO CJ catalog merge completed.");
console.log("Products received from CJ: " + received);
console.log("Products with valid CJ tracking links: " + imported.length);
console.log("Previous catalog products preserved: " + previousProducts.length);
console.log("Total products in merged catalog: " + finalProducts.length);
