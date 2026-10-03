import { NETWORKS } from "./network-config.mjs";

const API_URL = "https://ads.api.cj.com/query";

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
  throw new Error(`CJ API failed with HTTP ${response.status}`);
}

let data;

try {
  data = JSON.parse(text);
} catch {
  console.error(text);
  throw new Error("CJ returned invalid JSON.");
}

if (data.errors) {
  console.error(JSON.stringify(data.errors, null, 2));
  throw new Error("CJ GraphQL returned errors.");
}

const products =
  data?.data?.products?.resultList || [];

console.log(
  `CJ products received: ${products.length}`
);

function cleanUrl(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  const match =
    value.match(/https?:\/\/[^\s\])]+/);

  return match ? match[0] : value;
}

function amount(value) {
  if (!value || value.amount == null) {
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
    !Number.isFinite(regularPrice) ||
    !Number.isFinite(salePrice) ||
    regularPrice <= 0 ||
    salePrice <= 0 ||
    salePrice >= regularPrice
  ) {
    return null;
  }

  const discount =
    ((regularPrice - salePrice) /
      regularPrice) *
    100;

  if (!Number.isFinite(discount)) {
    return null;
  }

  return Math.round(discount);
}

const normalizedProducts =
  products
    .filter(product => {
      return (
        product &&
        product.joinedStatus === true &&
        product.id &&
        product.title &&
        product.imageLink &&
        product.link
      );
    })
    .map(product => {
      const advertiser =
        ADVERTISERS.find(
          item =>
            item.id ===
            String(product.advertiserId)
        );

      const regularPrice =
        amount(product.price);

      const rawSalePrice =
        amount(product.salePrice);

      /*
       * IMPORTANT PRICE VALIDATION
       *
       * CJ can sometimes return salePrice = 0
       * even when the product is NOT actually free.
       *
       * A sale price is considered valid ONLY when:
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
        rawSalePrice < regularPrice
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

      return {
        source:
          CJ_NETWORK.source,

        network:
          CJ_NETWORK.network,

        id:
          String(product.id),

        adId:
          String(product.adId || ""),

        title:
          product.title,

        description:
          product.description || "",

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
          cleanUrl(product.link),

        clickUrl:
          cleanUrl(
            product?.linkCode?.clickUrl
          ) ||
          cleanUrl(product.link),

        mobileLink:
          cleanUrl(
            product.mobileLink
          ),

        price:
          regularPrice,

        salePrice:
          validSalePrice,

        currency:
          currency(product.salePrice) ||
          currency(product.price),

        discountPercentage:
          validDiscount,

        joinedStatus:
          true
      };
    });

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

  products:
    normalizedProducts
};

const fs =
  await import(
    "node:fs/promises"
  );

await fs.mkdir(
  "data",
  { recursive: true }
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

console.log(
  `ZOVARO catalog generated: ${normalizedProducts.length} real products.`
);

console.log(
  "Price validation completed."
);

console.log(
  "Invalid zero/negative/non-sale prices are no longer treated as discounts."
);

console.log(
  "Saved to: data/catalog.json"
);
