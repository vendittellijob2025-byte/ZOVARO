import fs from "node:fs";
import { categoryFor } from "../lib/product-category.js";

const catalog = JSON.parse(fs.readFileSync("data/catalog.json", "utf8"));
const taxonomy = JSON.parse(fs.readFileSync("data/category-tree.json", "utf8"));
if (!Array.isArray(taxonomy.categories) || !Array.isArray(catalog.products)) {
  throw new Error("Catalog or canonical category taxonomy is missing.");
}

const categories = taxonomy.categories.map(category => ({
  name: category.name,
  productCount: 0
}));
const byName = new Map(categories.map(category => [category.name, category]));
const unknown = new Map();
const advertisers = new Set();
let productsWithTrackedLinks = 0;
let productsWithImages = 0;
let productsWithPrices = 0;
let otherCount = 0;
for (const product of catalog.products) {
  const category = String(product.englishCategory || product.category || "").trim();
  if (byName.has(category)) byName.get(category).productCount += 1;
  else unknown.set(category || "(blank)", (unknown.get(category || "(blank)") || 0) + 1);
  if (category === "Other") otherCount += 1;
  if (String(product.clickUrl || "").startsWith("https://")) productsWithTrackedLinks += 1;
  if (product.imageLink || (Array.isArray(product.additionalImageLink) && product.additionalImageLink.length)) productsWithImages += 1;
  if (Number(product.price?.amount ?? product.price) > 0) productsWithPrices += 1;
  if (product.advertiserName) advertisers.add(product.advertiserName);
}
const emptyCategories = categories.filter(category => category.productCount === 0).map(category => category.name);
const result = {
  generatedAt: new Date().toISOString(),
  selectedProductCount: catalog.products.length,
  inventoryProductCount: catalog.inventoryProductCount ?? null,
  uniqueAdvertiserCount: advertisers.size,
  categories,
  nonEmptyCategoryCount: categories.length - emptyCategories.length,
  emptyCategories,
  otherProductCount: otherCount,
  unknownCategories: [...unknown].map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count),
  productCompleteness: {
    withTrackedHttpsLinks: productsWithTrackedLinks,
    withImages: productsWithImages,
    withPositivePrices: productsWithPrices
  },
  sources: catalog.sources || []
};
fs.writeFileSync("data/category-coverage.json", JSON.stringify(result, null, 2) + "\n", "utf8");
console.log("ZOVARO category coverage: " + JSON.stringify({
  selectedProductCount: result.selectedProductCount,
  uniqueAdvertiserCount: result.uniqueAdvertiserCount,
  nonEmptyCategoryCount: result.nonEmptyCategoryCount,
  categoryCount: categories.length,
  emptyCategories,
  otherProductCount: otherCount
}));
