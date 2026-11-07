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
  const productText = [
    product.category, product.title, product.description, product.brand
  ].filter(Boolean).join(" ").toLowerCase();
  const advertiserText = [
    advertiser.name, advertiser.parentCategory, advertiser.childCategory
  ].filter(Boolean).join(" ").toLowerCase();
  const text = [productText, advertiserText].filter(Boolean).join(" ");

  // Product/merchant sports signals take priority over broad feed taxonomy.
  // Some CJ feeds expose a generic or incorrect parent category (for example
  // Pets) even when the advertiser is a specialist padel/sports retailer.
  if (/\b(sport|sports|fitness|padel|tennis|racket|racquet|golf|gym|cycling|athletic|exercise)\b/.test(productText) ||
      /\b(padel|tennis|sports retailer|sporting goods)\b/.test(advertiserText)) return "Sports";

  if (/\b(baby|babies|infant|newborn|nursery|diaper|toddler|kids|children)\b/.test(text)) return "Babies";
  if (/\b(pet|pets|dog|dogs|cat|cats|canine|feline)\b/.test(text)) return "Pets";
  if (/\b(automotive|automobile|car parts|vehicle|motorcycle|motorbike|car accessories)\b/.test(text)) return "Automotive";
  if (/\b(travel|luggage|suitcase|airline|hotel|holiday|vacation)\b/.test(text)) return "Travel";
  if (/\b(garden|gardening|plant|plants|lawn|horticulture)\b/.test(text)) return "Garden";
  if (/\b(toy|toys|board game|puzzle|doll|action figure|video game|gaming)\b/.test(text)) return "Toys & Games";
  if (/\b(beauty|cosmetic|skincare|skin care|makeup|fragrance|perfume|haircare)\b/.test(text)) return "Beauty";
  if (/\b(fashion|clothing|apparel|footwear|shoes|sneakers|handbag|jewelry|garment)\b/.test(text)) return "Fashion";
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
      "  productFeeds(companyId: \"" + COMPANY_ID + "\", partnerIds: " + JSON.stringify(batch) + ", limit: 1000) {",
      "    totalCount count",
      "    resultList { adId feedName advertiserId advertiserName productCount advertiserCountry language currency lastUpdated }",
      "  }",
      "}"
    ].join("\n");

    const result = (await graphql(query)).productFeeds;
    if (!result || !Array.isArray(result.resultList)) throw new Error("CJ returned an invalid product feed summary.");
    if (Number(result.count) < Number(result.totalCount)) {
      throw new Error("CJ product feed summary exceeded the safe page; catalog update cancelled.");
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

function productTokenQuery(advertiserId, pageToken = null) {
  const pageArgument = pageToken
    ? `, page: ${JSON.stringify(pageToken)}`
    : "";

  return `query {
    products(companyId: "${COMPANY_ID}", partnerIds: ["${advertiserId}"], limit: 10000${pageArgument}) {
      nextPage
      resultList {
        id adId advertiserId advertiserName title description brand imageLink additionalImageLink link mobileLink
        price { amount currency }
        salePrice { amount currency }
        discountPercentage
        linkCode(pid: "${PUBLISHER_ID}") { clickUrl }
      }
      totalCount count
    }
  }`;
}

async function getProductsBeyondTenThousand(advertiser, expectedTotal) {
  const all = [];
  let pageToken = null;
  let pageNumber = 0;
  const seenTokens = new Set();

  while (true) {
    pageNumber += 1;
    const result = (await graphql(productTokenQuery(advertiser.id, pageToken))).products;
    if (!result || !Array.isArray(result.resultList)) {
      throw new Error("CJ returned an invalid token-paginated products response for advertiser " + advertiser.id);
    }

    const pageProducts = result.resultList;
    if (!pageProducts.length) {
      throw new Error("CJ returned an empty page before completing advertiser " + advertiser.id);
    }

    all.push(...pageProducts);
    console.log("CJ advertiser " + advertiser.id + ": token page " + pageNumber + ", received " + pageProducts.length + "; accumulated " + all.length + " of " + expectedTotal + ".");

    if (all.length > expectedTotal) {
      throw new Error("CJ token pagination exceeded the advertised total for advertiser " + advertiser.id + "; existing catalog left untouched.");
    }

    const nextPage = result.nextPage;
    if (!nextPage) break;
    if (typeof nextPage !== "string" || seenTokens.has(nextPage)) {
      throw new Error("CJ returned an invalid or repeated nextPage token for advertiser " + advertiser.id);
    }
    seenTokens.add(nextPage);
    pageToken = nextPage;

    if (pageNumber > 1000) {
      throw new Error("CJ token pagination exceeded the safety limit for advertiser " + advertiser.id);
    }
  }

  if (all.length !== expectedTotal) {
    throw new Error("CJ token pagination incomplete for advertiser " + advertiser.id + ": received " + all.length + " of " + expectedTotal + "; existing catalog left untouched.");
  }
  return all;
}

async function getProductsForAdvertiser(advertiser) {
  const all = [];
  let offset = 0;
  let totalCount = null;
  let pageNumber = 0;

  while (true) {
    pageNumber += 1;
    const result = (await graphql(productQuery(advertiser.id, offset))).products;
    if (!result || !Array.isArray(result.resultList)) {
      throw new Error("CJ returned an invalid products response for advertiser " + advertiser.id);
    }

    if (totalCount === null) {
      totalCount = Number(result.totalCount);
      if (!Number.isFinite(totalCount) || totalCount < 0) {
        throw new Error("CJ returned an invalid totalCount for advertiser " + advertiser.id);
      }
      if (totalCount > MAX_OFFSET_RESULTS) {
        console.log("CJ advertiser " + advertiser.id + " exceeds 10,000 products; switching to CJ nextPage token pagination.");
        return await getProductsBeyondTenThousand(advertiser, totalCount);
      }
    }

    const pageProducts = result.resultList;
    const pageCount = pageProducts.length;
    console.log("CJ advertiser " + advertiser.id + ": page " + pageNumber + ", received " + pageCount + " of " + totalCount + " products.");

    if (pageCount === 0) break;
    all.push(...pageProducts);
    if (all.length >= totalCount) break;
    offset += pageCount;

    if (pageNumber > MAX_OFFSET_RESULTS) {
      throw new Error("CJ pagination exceeded the safety limit for advertiser " + advertiser.id);
    }
  }

  if (all.length !== totalCount) {
    throw new Error("CJ product pagination incomplete for advertiser " + advertiser.id + ": received " + all.length + " of " + totalCount + "; existing catalog left untouched.");
  }

  return all;
}

async function diagnoseShoppingProducts(advertiser) {
  const query = [
    "query {",
    "  shoppingProducts(companyId: \"" + COMPANY_ID + "\", partnerIds: [\"" + advertiser.id + "\"], limit: 3) {",
    "    resultList { id adId advertiserId title imageLink link price { amount currency } linkCode(pid: \"" + PUBLISHER_ID + "\") { clickUrl } }",
    "    totalCount count",
    "  }",
    "}"
  ].join("\n");

  try {
    const result = (await graphql(query)).shoppingProducts;
    const samples = Array.isArray(result?.resultList) ? result.resultList : [];
    console.log("CJ shoppingProducts diagnostic: " + JSON.stringify({
      advertiserId: advertiser.id,
      advertiserName: advertiser.name,
      totalCount: result?.totalCount ?? null,
      count: result?.count ?? samples.length,
      samples: samples.map(product => ({
        id: product.id || "",
        adId: product.adId || "",
        title: String(product.title || "").slice(0, 100),
        hasImage: Boolean(product.imageLink),
        hasDestination: Boolean(product.link),
        hasPrice: amount(product.price) !== null,
        hasLinkCode: product.linkCode !== null && product.linkCode !== undefined,
        hasClickUrl: Boolean(cleanUrl(product.linkCode?.clickUrl))
      }))
    }));
  } catch (error) {
    console.log("CJ shoppingProducts diagnostic failed: " + JSON.stringify({
      advertiserId: advertiser.id,
      advertiserName: advertiser.name,
      error: String(error.message || error).slice(0, 500)
    }));
  }
}

function productRejectionReasons(product) {
  const reasons = [];
  const id = String(product.id || "").trim();
  const title = String(product.title || "").trim();
  const rawImage = product.imageLink;
  const rawClickUrl = product.linkCode?.clickUrl;
  const imageLink = cleanUrl(rawImage);
  const clickUrl = cleanUrl(rawClickUrl);
  const destination = cleanUrl(product.link);
  const regularPrice = amount(product.price);

  if (!id) reasons.push("missing_product_id");
  if (!title) reasons.push("missing_title");
  if (!rawImage) reasons.push("missing_image_url");
  else if (!imageLink) reasons.push("invalid_image_url");
  if (!rawClickUrl) reasons.push("missing_cj_click_url");
  else if (!clickUrl) reasons.push("invalid_cj_click_url");
  if (regularPrice === null) reasons.push("missing_or_invalid_price");

  if (clickUrl && destination) {
    const parsedClick = new URL(clickUrl);
    const parsedDestination = new URL(destination);
    if (parsedClick.hostname === parsedDestination.hostname && parsedClick.pathname === parsedDestination.pathname) {
      reasons.push("click_url_matches_destination");
    }
  }

  return reasons;
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
console.log("CJ joined advertiser list: " + JSON.stringify(joinedAdvertisers.map(item => ({
  advertiserId: item.id,
  advertiserName: item.name,
  accountStatus: item.accountStatus || "not-provided",
  relationshipStatus: item.relationshipStatus
}))));

const joinedIds = new Set(joinedAdvertisers.map(item => item.id));
const feeds = await getProductFeeds([...joinedIds]);
const eligibleFeedAdvertisers = new Set(
  feeds.filter(feed => joinedIds.has(String(feed.advertiserId)) && Number(feed.productCount) > 0)
    .map(feed => String(feed.advertiserId))
);

console.log("CJ feed summary: " + JSON.stringify(feeds.map(feed => ({
  advertiserId: String(feed.advertiserId),
  advertiserName: feed.advertiserName,
  adId: feed.adId,
  feedName: feed.feedName,
  productCount: Number(feed.productCount) || 0,
  country: feed.advertiserCountry || "",
  language: feed.language || "",
  currency: feed.currency || ""
}))));
const advertisersWithoutProductFeeds = joinedAdvertisers.filter(item => !eligibleFeedAdvertisers.has(item.id));
console.log("CJ joined advertisers without a positive product feed: " + JSON.stringify(advertisersWithoutProductFeeds.map(item => ({
  advertiserId: item.id,
  advertiserName: item.name
}))));

console.log("Joined advertisers with product feeds: " + eligibleFeedAdvertisers.size);
if (!feeds.length) throw new Error("CJ returned no product feed summaries; existing catalog was left untouched.");

const advertiserMap = new Map(joinedAdvertisers.map(item => [item.id, item]));
const importedByKey = new Map();
const advertiserDiagnostics = new Map();
let received = 0;
let advertiserMismatchCount = 0;

for (const advertiserId of eligibleFeedAdvertisers) {
  const advertiser = advertiserMap.get(advertiserId);
  if (!advertiser) continue;

  const diagnostic = {
    advertiserId,
    advertiserName: advertiser.name,
    productsReceived: 0,
    advertiserIdMismatch: 0,
    productsPassingValidation: 0,
    duplicateProductKeys: 0,
    rejectedByReason: {}
  };
  advertiserDiagnostics.set(advertiserId, diagnostic);

  let products;
  try {
    products = await getProductsForAdvertiser(advertiser);
  } catch (error) {
    diagnostic.syncStatus = "failed";
    diagnostic.syncError = String(error.message || error).slice(0, 500);
    console.error("CJ advertiser sync failed; continuing with other joined advertisers: " + JSON.stringify({
      advertiserId,
      advertiserName: advertiser.name,
      error: diagnostic.syncError
    }));
    continue;
  }

  diagnostic.syncStatus = "completed";
  if (products.length && products.every(product => !cleanUrl(product.linkCode?.clickUrl))) {
    await diagnoseShoppingProducts(advertiser);
  }
  received += products.length;
  diagnostic.productsReceived = products.length;

  for (const product of products) {
    if (String(product.advertiserId || advertiserId) !== advertiserId) {
      diagnostic.advertiserIdMismatch += 1;
      advertiserMismatchCount += 1;
      continue;
    }

    const reasons = productRejectionReasons(product);
    if (reasons.length) {
      for (const reason of reasons) {
        diagnostic.rejectedByReason[reason] = (diagnostic.rejectedByReason[reason] || 0) + 1;
      }
      continue;
    }

    const normalized = makeCatalogProduct(product, advertiser);
    if (!normalized) {
      diagnostic.rejectedByReason.unclassified_validation_rejection =
        (diagnostic.rejectedByReason.unclassified_validation_rejection || 0) + 1;
      continue;
    }

    diagnostic.productsPassingValidation += 1;
    const key = productKey(normalized);
    if (importedByKey.has(key)) diagnostic.duplicateProductKeys += 1;
    importedByKey.set(key, normalized);
  }
}

console.log("CJ product import diagnostics: " + JSON.stringify({
  productsReceived: received,
  productsPassingValidationBeforeDeduplication: [...advertiserDiagnostics.values()].reduce((sum, item) => sum + item.productsPassingValidation, 0),
  uniqueProductsPassingValidation: importedByKey.size,
  advertiserMismatchCount,
  advertisers: [...advertiserDiagnostics.values()]
}));

const imported = [...importedByKey.values()];
const importedCategoryCounts = imported.reduce((counts, product) => {
  const category = product.category || "Uncategorized";
  counts[category] = (counts[category] || 0) + 1;
  return counts;
}, {});
console.log("CJ imported products by category: " + JSON.stringify(importedCategoryCounts));

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

// Keep the public catalog lean: the storefront only needs these fields.
// Long descriptions and unused feed metadata otherwise make the 50k+ product
// JSON unnecessarily large and slow to download on mobile connections.
function compactCatalogProduct(product) {
  const compact = {
    source: product.source || "CJ",
    network: product.network || NETWORKS.CJ.network,
    id: String(product.id || ""),
    title: String(product.title || "").slice(0, 240),
    description: String(product.englishDescription || product.description || "").slice(0, 180),
    brand: String(product.brand || "").slice(0, 100),
    advertiserId: String(product.advertiserId || ""),
    advertiserName: String(product.advertiserName || "CJ Affiliate").slice(0, 120),
    category: String(product.category || "Featured").slice(0, 80),
    imageLink: cleanUrl(product.imageLink),
    clickUrl: cleanUrl(product.clickUrl),
    price: product.price ?? null,
    salePrice: product.salePrice ?? null,
    currency: String(product.currency || "USD").slice(0, 8),
    discountPercentage: product.discountPercentage ?? null,
    joinedStatus: product.joinedStatus === true
  };

  if (product.englishTitle) compact.englishTitle = String(product.englishTitle).slice(0, 240);
  if (product.englishCategory) compact.englishCategory = String(product.englishCategory).slice(0, 80);

  return compact;
}

// Publish a balanced storefront selection rather than forcing every
// visitor to download the entire 50k+ affiliate inventory. Each category is
// capped at 1,200 products and sampled round-robin across advertisers.
function selectStorefrontProducts(products, perCategoryLimit = 1200) {
  const categories = new Map();

  for (const product of products) {
    const category = String(product.category || "Featured").trim() || "Featured";
    const advertiser = String(product.advertiserId || "unknown");
    if (!categories.has(category)) categories.set(category, new Map());
    const advertisers = categories.get(category);
    if (!advertisers.has(advertiser)) advertisers.set(advertiser, []);
    advertisers.get(advertiser).push(product);
  }

  const selected = [];
  for (const [category, advertisers] of categories) {
    const groups = [...advertisers.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, items]) => items);
    const cursors = groups.map(() => 0);
    let categoryCount = 0;

    while (categoryCount < perCategoryLimit) {
      let addedInRound = false;
      for (let i = 0; i < groups.length && categoryCount < perCategoryLimit; i += 1) {
        const item = groups[i][cursors[i]];
        if (!item) continue;
        selected.push(item);
        cursors[i] += 1;
        categoryCount += 1;
        addedInRound = true;
      }
      if (!addedInRound) break;
    }
  }

  return selected;
}

const activeNonCjNetworks = new Set(
  (Array.isArray(catalog.sources) ? catalog.sources : [])
    .filter(source => source.status === "active" && source.network && source.network !== NETWORKS.CJ.network)
    .map(source => source.network)
);

const storefrontEligibleProducts = finalProducts.filter(product => {
  const isCurrentJoinedCjProduct =
    (product.source === "CJ" || product.network === NETWORKS.CJ.network) &&
    product.joinedStatus === true &&
    eligibleFeedAdvertisers.has(String(product.advertiserId));

  const isActiveOtherNetworkProduct =
    product.source !== "CJ" &&
    product.network !== NETWORKS.CJ.network &&
    product.joinedStatus === true &&
    activeNonCjNetworks.has(product.network);

  const hasValidClickUrl =
    typeof product.clickUrl === "string" &&
    product.clickUrl.startsWith("https://");

  const hasValidImage =
    typeof product.imageLink === "string" &&
    product.imageLink.startsWith("https://");

  const hasPrice =
    Number.isFinite(Number(product.price)) &&
    Number(product.price) > 0;

  return (isCurrentJoinedCjProduct || isActiveOtherNetworkProduct) &&
    hasValidClickUrl && hasValidImage && hasPrice;
});

const storefrontProducts = selectStorefrontProducts(storefrontEligibleProducts);
const compactProducts = storefrontProducts.map(compactCatalogProduct);
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
  productCount: compactProducts.length,
  inventoryProductCount: finalProducts.length,
  selectionPolicy: "up to 1200 products per category, balanced across advertisers",
  products: compactProducts,
  sync: {
    ...(catalog.sync || {}),
    lastSuccessfulSyncAt: now,
    joinedAdvertisersFound: joinedAdvertisers.length,
    advertisersWithProductFeeds: eligibleFeedAdvertisers.size,
    productsReceived: received,
    productsWithValidTrackingLinks: imported.length,
    productsPreservedFromPreviousCatalog: previousProducts.length,
    advertisersFailed: [...advertiserDiagnostics.values()].filter(item => item.syncStatus === "failed").map(item => ({
      advertiserId: item.advertiserId,
      advertiserName: item.advertiserName,
      error: item.syncError
    })),
    syncStatus: [...advertiserDiagnostics.values()].some(item => item.syncStatus === "failed") ? "partial" : "complete"
  }
};

await fs.mkdir("data", { recursive: true });
const tempPath = CATALOG_PATH + ".tmp";
await fs.writeFile(tempPath, JSON.stringify(updatedCatalog), "utf8");
await fs.rename(tempPath, CATALOG_PATH);

console.log("ZOVARO CJ catalog merge completed.");
console.log("Products received from CJ: " + received);
console.log("Products with valid CJ tracking links: " + imported.length);
console.log("Previous catalog products preserved: " + previousProducts.length);
console.log("Validated products in full CJ inventory: " + finalProducts.length);
console.log("Active products eligible for public storefront: " + storefrontEligibleProducts.length);
console.log("Products selected for public storefront: " + compactProducts.length);
console.log("Compact catalog product fields saved; descriptions truncated to 180 characters.");
