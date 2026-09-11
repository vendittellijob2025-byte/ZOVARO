const API_URL = "https://ads.api.cj.com/query";
const COMPANY_ID = "8068799";
const PID = "101881140";

const token = process.env.CJ_API_TOKEN;

if (!token) {
  throw new Error("CJ_API_TOKEN is missing.");
}

const query = `
{
  products(companyId: "${COMPANY_ID}") {
    resultList {
      advertiserId
      catalogId
      id
      title
      description
      price {
        amount
        currency
      }
      linkCode(pid: "${PID}") {
        clickUrl
      }
    }
  }
}
`;

const response = await fetch(API_URL, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ query })
});

const text = await response.text();

if (!response.ok) {
  throw new Error(`CJ API HTTP ${response.status}: ${text}`);
}

let data;

try {
  data = JSON.parse(text);
} catch {
  throw new Error(`CJ API returned invalid JSON: ${text}`);
}

if (data.errors?.length) {
  console.error(JSON.stringify(data.errors, null, 2));
  throw new Error("CJ Product Feed API returned GraphQL errors.");
}

const products = data?.data?.products?.resultList ?? [];

const catalog = {
  source: "CJ Affiliate",
  generatedAt: new Date().toISOString(),
  companyId: COMPANY_ID,
  promotionalPropertyId: PID,
  productCount: products.length,
  products: products.map((product) => ({
    id: product.id ?? null,
    advertiserId: product.advertiserId ?? null,
    catalogId: product.catalogId ?? null,
    title: product.title ?? "",
    description: product.description ?? "",
    price: product.price?.amount ?? null,
    currency: product.price?.currency ?? null,
    clickUrl: product.linkCode?.clickUrl ?? null
  }))
};

const fs = await import("node:fs/promises");

await fs.mkdir("data", { recursive: true });

await fs.writeFile(
  "data/catalog.json",
  JSON.stringify(catalog, null, 2) + "\n",
  "utf8"
);

console.log(`CJ sync completed: ${products.length} products imported.`);
