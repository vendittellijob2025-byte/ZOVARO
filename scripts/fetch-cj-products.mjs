const API_URL = "https://ads.api.cj.com/query";

const token = process.env.CJ_API_TOKEN;

if (!token) {
  throw new Error("CJ_API_TOKEN is missing.");
}

const COMPANY_ID = "8068799";
const PUBLISHER_ID = "101881140";

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
      linkCode(pid: "101881140") {
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

const products = data?.data?.products?.resultList || [];

console.log(`CJ products received: ${products.length}`);

function cleanUrl(value) {
  if (!value || typeof value !== "string") return "";

  const match = value.match(/https?:\/\/[^\s\])]+/);

  return match ? match[0] : value;
}

function amount(value) {
  if (!value || value.amount == null) return null;

  const number = Number(value.amount);

  return Number.isFinite(number) ? number : null;
}

function currency(value) {
  return value?.currency || null;
}

const normalizedProducts = products
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
    const advertiser = ADVERTISERS.find(
      item => item.id === String(product.advertiserId)
    );

    const regularPrice = amount(product.price);
    const salePrice = amount(product.salePrice);

    return {
      id: String(product.id),

      adId: String(product.adId || ""),

      title: product.title,

      description: product.description || "",

      brand: product.brand || "",

      advertiserId: String(product.advertiserId || ""),

      advertiserName:
        product.advertiserName ||
        advertiser?.name ||
        "CJ Affiliate",

      category:
        advertiser?.category ||
        "Featured",

      imageLink: cleanUrl(product.imageLink),

      additionalImageLinks: Array.isArray(product.additionalImageLink)
        ? product.additionalImageLink
            .map(cleanUrl)
            .filter(Boolean)
        : [],

      destination: cleanUrl(product.link),

      mobileLink: cleanUrl(product.mobileLink),

      price: regularPrice,

      salePrice: salePrice,

      currency:
        currency(product.salePrice) ||
        currency(product.price),

      discountPercentage:
        product.discountPercentage != null
          ? Number(product.discountPercentage)
          : null,

      joinedStatus: true
    };
  });

const catalog = {
  source: "CJ Affiliate",

  generatedAt: new Date().toISOString(),

  companyId: COMPANY_ID,

  promotionalPropertyId: PUBLISHER_ID,

  advertisers: ADVERTISERS,

  rowsReceived: products.length,

  productCount: normalizedProducts.length,

  products: normalizedProducts
};

const fs = await import("node:fs/promises");

await fs.mkdir("data", { recursive: true });

await fs.writeFile(
  "data/catalog.json",
  JSON.stringify(catalog, null, 2),
  "utf8"
);

console.log(
  `ZOVARO catalog generated: ${normalizedProducts.length} real products.`
);

console.log("Saved to: data/catalog.json");
