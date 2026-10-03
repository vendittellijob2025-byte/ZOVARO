import fs from "node:fs/promises";

const CATALOG_PATH = "data/catalog.json";
const CACHE_PATH = "data/translation-cache.json";

const TARGET_LANGUAGE = "en";

async function readJson(path, fallback) {
  try {
    const text = await fs.readFile(path, "utf8");
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

async function translateText(text) {
  if (!text || typeof text !== "string") {
    return "";
  }

  const cleanText = text.trim();

  if (!cleanText) {
    return "";
  }

  /*
   * Avoid unnecessary translation requests
   * for text that is already clearly English.
   */

  const url =
    "https://translate.googleapis.com/translate_a/single" +
    "?client=gtx" +
    "&sl=auto" +
    `&tl=${TARGET_LANGUAGE}` +
    "&dt=t" +
    "&q=" +
    encodeURIComponent(cleanText);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Translation request failed: HTTP ${response.status}`
    );
  }

  const data = await response.json();

  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error(
      "Translation service returned an unexpected response."
    );
  }

  const translated = data[0]
    .map(item => item?.[0] || "")
    .join("")
    .trim();

  if (!translated) {
    throw new Error(
      "Translation service returned empty text."
    );
  }

  return translated;
}

function cacheKey(text) {
  return String(text || "").trim();
}

const catalog = await readJson(
  CATALOG_PATH,
  null
);

if (
  !catalog ||
  !Array.isArray(catalog.products)
) {
  throw new Error(
    "data/catalog.json does not contain a valid products array."
  );
}

const cache = await readJson(
  CACHE_PATH,
  {}
);

let translatedCount = 0;
let cachedCount = 0;

async function translateCached(text) {
  const key = cacheKey(text);

  if (!key) {
    return "";
  }

  if (
    Object.prototype.hasOwnProperty.call(
      cache,
      key
    )
  ) {
    cachedCount++;
    return cache[key];
  }

  const translated =
    await translateText(key);

  cache[key] = translated;

  translatedCount++;

  return translated;
}

console.log(
  `ZOVARO translation system: ${catalog.products.length} products found.`
);

for (
  let index = 0;
  index < catalog.products.length;
  index++
) {
  const product =
    catalog.products[index];

  if (!product) {
    continue;
  }

  console.log(
    `Translating product ${index + 1}/${catalog.products.length}: ${
      product.title || "Untitled"
    }`
  );

  product.englishTitle =
    await translateCached(
      product.title || ""
    );

  product.englishDescription =
    await translateCached(
      product.description || ""
    );

  product.englishCategory =
    await translateCached(
      product.category || ""
    );

  /*
   * Brand and advertiser names are preserved
   * exactly as supplied by the affiliate network.
   *
   * Prices, currencies, discounts and IDs are
   * never sent through the translation system.
   */
}

await fs.writeFile(
  CATALOG_PATH,
  JSON.stringify(
    catalog,
    null,
    2
  ),
  "utf8"
);

await fs.writeFile(
  CACHE_PATH,
  JSON.stringify(
    cache,
    null,
    2
  ),
  "utf8"
);

console.log("");
console.log(
  "ZOVARO automatic English translation completed."
);

console.log(
  `New translations: ${translatedCount}`
);

console.log(
  `Cached translations reused: ${cachedCount}`
);

console.log(
  "English fields added to data/catalog.json."
);

console.log(
  "Translation cache saved to data/translation-cache.json."
);
