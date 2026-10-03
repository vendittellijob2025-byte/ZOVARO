import { NETWORKS } from "./network-config.mjs";

const API_URL = "https://ads.api.cj.com/query";

const TRANSLATION_URL =
  "https://translate.googleapis.com/translate_a/single";

const token = process.env.CJ_API_TOKEN;

if (!token) {
  throw new Error("CJ_API_TOKEN is missing.");
}

const COMPANY_ID = "8068799";
const PUBLISHER_ID = "101881140";

const CJ_NETWORK = NETWORKS.CJ;

const ADVERTISERS = [
  {
    id: "8022425",
    name: "Kaiya Baby",
    category: "Babies"
  },
  {
    id: "7969352",
    name: "Padel Iberico ES",
    category: "Sports"
  }
];

const query = `
query {
  products(
    companyId: "${COMPANY_ID}"
    partnerIds: ["8022425", "7969352"]
    partnerStatus: JOINED
    limit: 100
  ) {
    resultList {
      id
      adId
      advertiserId
      advertiserName
      title
      description
      brand
      imageLink
      additionalImageLink
      link
      mobileLink

      price {
        amount
        currency
      }

      salePrice {
        amount
        currency
      }

      discountPercentage
      joinedStatus

      linkCode(pid: "${PUBLISHER_ID}") {
        clickUrl
      }
    }

    totalCount
    count
  }
}
`;

console.log("Fetching real CJ products...");

const response = await fetch(API_URL, {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + token,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ query })
});

const text = await response.text();

console.log("CJ HTTP status:", response.status);

if (!response.ok) {
  console.error(text);
  throw new Error(
    `CJ API failed with HTTP ${response.status}`
  );
}

let data;

try {
  data = JSON.parse(text);
} catch {
  console.error(text);
  throw new Error(
    "CJ returned invalid JSON."
  );
}

if (data.errors) {
  console.error(
    JSON.stringify(
      data.errors,
      null,
      2
    )
  );

  throw new Error(
    "CJ GraphQL returned errors."
  );
}

const products =
  data?.data?.products?.resultList || [];

console.log(
  `CJ products received: ${products.length}`
);

function cleanUrl(value) {
  if (
    !value ||
    typeof value !== "string"
  ) {
    return "";
  }

  const match =
    value.match(
      /https?:\/\/[^\s\])]+/
    );

  return match
    ? match[0]
    : value;
}

function amount(value) {
  if (
    !value ||
    value.amount == null
  ) {
    return null;
  }

  const number =
    Number(value.amount);

  return Number.isFinite(number)
    ? number
    : null;
}

function currency(value) {
  return value?.currency || null;
}

function calculateDiscount(
  regularPrice,
  salePrice
) {
  if (
    !Number.isFinite(
      regularPrice
    ) ||
    !Number.isFinite(
      salePrice
    ) ||
    regularPrice <= 0 ||
    salePrice <= 0 ||
    salePrice >= regularPrice
  ) {
    return null;
  }

  const discount =
    (
      (regularPrice - salePrice) /
      regularPrice
    ) * 100;

  if (
    !Number.isFinite(
      discount
    )
  ) {
    return null;
  }

  return Math.round(
    discount
  );
}

/*
 * ---------------------------------------------------------
 * ZOVARO GLOBAL ENGLISH TRANSLATION SYSTEM
 * ---------------------------------------------------------
 *
 * All affiliate product titles and descriptions are
 * normalized into English before entering catalog.json.
 *
 * The source language is detected automatically.
 *
 * Brand names and advertiser names are kept unchanged
 * because they are proper commercial names.
 *
 * If translation fails, the product is rejected instead
 * of allowing source-language text into ZOVARO.
 */

function normalizeText(value) {
  return String(
    value ?? ""
  )
    .replace(/\r/g, "")
    .replace(
      /[ \t]+/g,
      " "
    )
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim();
}

function isProbablyEnglish(value) {
  const text =
    normalizeText(value);

  if (!text) {
    return true;
  }

  /*
   * Keep obvious English content untouched.
   * The translator is still used for non-English
   * content and mixed-language content.
   */

  const commonEnglishWords = [
    "the",
    "and",
    "with",
    "for",
    "from",
    "this",
    "that",
    "new",
    "product",
    "women",
    "men",
    "baby",
    "kids",
    "sport",
    "sports",
    "official",
    "original",
    "sale",
    "price",
    "size",
    "color",
    "black",
    "white",
    "blue",
    "red",
    "green",
    "premium",
    "quality",
    "design",
    "available"
  ];

  const lower =
    text.toLowerCase();

  const words =
    lower.match(
      /\b[a-z]{3,}\b/g
    ) || [];

  if (!words.length) {
    return false;
  }

  const matches =
    words.filter(
      word =>
        commonEnglishWords.includes(
          word
        )
    ).length;

  return (
    matches >= 2 ||
    (
      words.length <= 5 &&
      matches >= 1
    )
  );
}

function splitForTranslation(
  text,
  maxLength = 3500
) {
  const normalized =
    normalizeText(text);

  if (
    normalized.length <=
    maxLength
  ) {
    return [
      normalized
    ];
  }

  const paragraphs =
    normalized.split(
      /\n{2,}/
    );

  const chunks = [];
  let current = "";

  for (
    const paragraph of paragraphs
  ) {
    const candidate =
      current
        ? `${current}\n\n${paragraph}`
        : paragraph;

    if (
      candidate.length <=
      maxLength
    ) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(
        current
      );
      current = "";
    }

    if (
      paragraph.length <=
      maxLength
    ) {
      current = paragraph;
      continue;
    }

    const sentences =
      paragraph.split(
        /(?<=[.!?。！？])\s+/
      );

    for (
      const sentence of sentences
    ) {
      const sentenceCandidate =
        current
          ? `${current} ${sentence}`
          : sentence;

      if (
        sentenceCandidate.length <=
        maxLength
      ) {
        current =
          sentenceCandidate;
      } else {
        if (current) {
          chunks.push(
            current
          );
        }

        current = sentence;
      }
    }
  }

  if (current) {
    chunks.push(
      current
    );
  }

  return chunks.filter(
    Boolean
  );
}

async function translateChunkToEnglish(
  text
) {
  const source =
    normalizeText(text);

  if (!source) {
    return "";
  }

  if (
    isProbablyEnglish(source)
  ) {
    return source;
  }

  const url =
    new URL(
      TRANSLATION_URL
    );

  url.searchParams.set(
    "client",
    "gtx"
  );

  url.searchParams.set(
    "sl",
    "auto"
  );

  url.searchParams.set(
    "tl",
    "en"
  );

  url.searchParams.set(
    "dt",
    "t"
  );

  url.searchParams.set(
    "q",
    source
  );

  let lastError = null;

  for (
    let attempt = 1;
    attempt <= 3;
    attempt++
  ) {
    try {
      const response =
        await fetch(
          url,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0"
            }
          }
        );

      if (!response.ok) {
        throw new Error(
          `Translation HTTP ${response.status}`
        );
      }

      const result =
        await response.json();

      const translated =
        Array.isArray(result?.[0])
          ? result[0]
              .map(
                item =>
                  Array.isArray(
                    item
                  )
                    ? item[0]
                    : ""
              )
              .filter(Boolean)
              .join("")
          : "";

      const finalText =
        normalizeText(
          translated
        );

      if (!finalText) {
        throw new Error(
          "Translation returned empty text."
        );
      }

      return finalText;
    } catch (error) {
      lastError = error;

      console.warn(
        `Translation attempt ${attempt}/3 failed: ${error.message}`
      );

      if (
        attempt < 3
      ) {
        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              1200 * attempt
            )
        );
      }
    }
  }

  throw new Error(
    `Unable to translate text to English: ${
      lastError?.message ||
      "unknown error"
    }`
  );
}

async function translateToEnglish(
  value
) {
  const source =
    normalizeText(value);

  if (!source) {
    return "";
  }

  const chunks =
    splitForTranslation(
      source
    );

  const translatedChunks = [];

  for (
    const chunk of chunks
  ) {
    translatedChunks.push(
      await translateChunkToEnglish(
        chunk
      )
    );
  }

  const translated =
    normalizeText(
      translatedChunks.join(
        "\n\n"
      )
    );

  if (!translated) {
    throw new Error(
      "English translation is empty."
    );
  }

  return translated;
}

async function translateProduct(
  product
) {
  const originalTitle =
    normalizeText(
      product.title
    );

  const originalDescription =
    normalizeText(
      product.description
    );

  if (!originalTitle) {
    throw new Error(
      "Product title is empty."
    );
  }

  console.log(
    `Translating product: ${originalTitle}`
  );

  const englishTitle =
    await translateToEnglish(
      originalTitle
    );

  const englishDescription =
    originalDescription
      ? await translateToEnglish(
          originalDescription
        )
      : "";

  return {
    englishTitle,
    englishDescription
  };
}

/*
 * ---------------------------------------------------------
 * TRANSLATE ALL PRODUCTS BEFORE CATALOG CREATION
 * ---------------------------------------------------------
 */

const normalizedProducts = [];

let translationSuccessCount =
  0;

let translationSkippedCount =
  0;

for (
  const product of products
) {
  if (
    !product ||
    product.joinedStatus !== true ||
    !product.id ||
    !product.title ||
    !product.imageLink ||
    !product.link
  ) {
    continue;
  }

  try {
    const translated =
      await translateProduct(
        product
      );

    const advertiser =
      ADVERTISERS.find(
        item =>
          item.id ===
          String(
            product.advertiserId
          )
      );

    const regularPrice =
      amount(
        product.price
      );

    const rawSalePrice =
      amount(
        product.salePrice
      );

    /*
     * IMPORTANT PRICE VALIDATION
     *
     * CJ can sometimes return salePrice = 0
     * even when the product is NOT actually free.
     *
     * A sale price is valid ONLY when:
     *
     *   - regular price exists
     *   - sale price exists
     *   - sale price is greater than 0
     *   - sale price is lower than regular price
     *
     * Otherwise there is NO sale.
     */

    const validSalePrice =
      regularPrice !== null &&
      rawSalePrice !== null &&
      rawSalePrice > 0 &&
      rawSalePrice <
        regularPrice
        ? rawSalePrice
        : null;

    const sourceDiscount =
      product.discountPercentage != null
        ? Number(
            product.discountPercentage
          )
        : null;

    const calculatedDiscount =
      calculateDiscount(
        regularPrice,
        validSalePrice
      );

    const validDiscount =
      validSalePrice !== null
        ? (
            Number.isFinite(
              sourceDiscount
            ) &&
            sourceDiscount > 0 &&
            sourceDiscount < 100
              ? Math.round(
                  sourceDiscount
                )
              : calculatedDiscount
          )
        : null;

    normalizedProducts.push({
      source:
        CJ_NETWORK.source,

      network:
        CJ_NETWORK.network,

      id:
        String(product.id),

      adId:
        String(
          product.adId || ""
        ),

      /*
       * IMPORTANT:
       *
       * The public ZOVARO catalog now stores
       * the English version as the primary
       * title and description.
       */

      title:
        translated.englishTitle,

      description:
        translated.englishDescription,

      /*
       * Keep original commercial identity
       * fields unchanged.
       */

      brand:
        product.brand || "",

      advertiserId:
        String(
          product.advertiserId || ""
        ),

      advertiserName:
        product.advertiserName ||
        advertiser?.name ||
        "CJ Affiliate",

      /*
       * ZOVARO categories are already controlled
       * English categories.
       */

      category:
        advertiser?.category ||
        "Featured",

      imageLink:
        cleanUrl(
          product.imageLink
        ),

      additionalImageLinks:
        Array.isArray(
          product.additionalImageLink
        )
          ? product.additionalImageLink
              .map(cleanUrl)
              .filter(Boolean)
          : [],

      destination:
        cleanUrl(
          product.link
        ),

      clickUrl:
        cleanUrl(
          product?.linkCode?.clickUrl
        ) ||
        cleanUrl(
          product.link
        ),

      mobileLink:
        cleanUrl(
          product.mobileLink
        ),

      price:
        regularPrice,

      salePrice:
        validSalePrice,

      currency:
        currency(
          product.salePrice
        ) ||
        currency(
          product.price
        ),

      discountPercentage:
        validDiscount,

      joinedStatus:
        true
    });

    translationSuccessCount++;

    console.log(
      `English translation completed: ${translated.englishTitle}`
    );
  } catch (error) {
    translationSkippedCount++;

    console.warn("");
    console.warn(
      "--------------------------------------------------"
    );
    console.warn(
      "PRODUCT SKIPPED - ENGLISH TRANSLATION FAILED"
    );
    console.warn(
      `Original title: ${product.title}`
    );
    console.warn(
      `Reason: ${error.message}`
    );
    console.warn(
      "The original-language product will NOT enter ZOVARO."
    );
    console.warn(
      "--------------------------------------------------"
    );
    console.warn("");
  }
}

if (
  normalizedProducts.length === 0
) {
  throw new Error(
    "No products could be added to the ZOVARO catalog after English translation."
  );
}

const catalog = {
  sources: [
    {
      source:
        CJ_NETWORK.source,

      network:
        CJ_NETWORK.network,

      status:
        "active"
    }
  ],

  generatedAt:
    new Date().toISOString(),

  companyId:
    COMPANY_ID,

  promotionalPropertyId:
    PUBLISHER_ID,

  advertisers:
    ADVERTISERS,

  rowsReceived:
    products.length,

  productCount:
    normalizedProducts.length,

  translation: {
    targetLanguage:
      "English",

    automatic:
      true,

    sourceLanguageDetection:
      "automatic",

    translatedProducts:
      translationSuccessCount,

    skippedProducts:
      translationSkippedCount,

    rule:
      "All affiliate product titles and descriptions must be available in English before entering the ZOVARO catalog."
  },

  products:
    normalizedProducts
};

const fs =
  await import(
    "node:fs/promises"
  );

await fs.mkdir(
  "data",
  {
    recursive: true
  }
);

await fs.writeFile(
  "data/catalog.json",
  JSON.stringify(
    catalog,
    null,
    2
  ),
  "utf8"
);

console.log("");
console.log(
  "========================================"
);

console.log(
  "ZOVARO CJ CATALOG GENERATED"
);

console.log(
  "========================================"
);

console.log(
  `CJ products received: ${products.length}`
);

console.log(
  `Products translated to English: ${translationSuccessCount}`
);

console.log(
  `Products skipped because translation failed: ${translationSkippedCount}`
);

console.log(
  `Final ZOVARO products: ${normalizedProducts.length}`
);

console.log(
  "Global English translation rule: ACTIVE"
);

console.log(
  "Automatic language detection: ACTIVE"
);

console.log(
  "Invalid zero/negative/non-sale prices are NOT treated as discounts."
);

console.log(
  "Saved to: data/catalog.json"
);
