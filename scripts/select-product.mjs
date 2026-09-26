import fs from "node:fs/promises";

const CATALOG_PATH = "data/catalog.json";

const catalogText = await fs.readFile(CATALOG_PATH, "utf8");
const catalog = JSON.parse(catalogText);

const products = Array.isArray(catalog.products)
  ? catalog.products
  : [];

const validProducts = products.filter(product => {
  return (
    product &&
    product.id &&
    product.title &&
    product.imageLink &&
    product.clickUrl &&
    product.joinedStatus === true
  );
});

if (!validProducts.length) {
  throw new Error("No valid CJ products available for promotion.");
}

// Rotate automatically according to the current UTC day.
// The same product is selected throughout one day,
// while the selection changes on the following day.
const today = new Date().toISOString().slice(0, 10);

let hash = 0;

for (const character of today) {
  hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
}

const index = hash % validProducts.length;
const selected = validProducts[index];

const promotion = {
  selectedAt: new Date().toISOString(),
  date: today,
  source: selected.source,
  network: selected.network,
  productId: selected.id,
  title: selected.title,
  description: selected.description,
  brand: selected.brand,
  advertiserId: selected.advertiserId,
  advertiserName: selected.advertiserName,
  category: selected.category,
  imageLink: selected.imageLink,
  price: selected.price,
  salePrice: selected.salePrice,
  currency: selected.currency,
  discountPercentage: selected.discountPercentage,
  destination: selected.destination,
  clickUrl: selected.clickUrl
};

await fs.writeFile(
  "data/selected-product.json",
  JSON.stringify(promotion, null, 2),
  "utf8"
);

console.log("ZOVARO automatic product selection completed.");
console.log(`Selected product: ${selected.title}`);
console.log(`Advertiser: ${selected.advertiserName}`);
console.log(`Product ID: ${selected.id}`);
console.log(`Saved to: data/selected-product.json`);
