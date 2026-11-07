import fs from "node:fs/promises";
import { categoryFor } from "../lib/product-category.js";

const path = "data/catalog.json";
const catalog = JSON.parse(await fs.readFile(path, "utf8"));
if (!Array.isArray(catalog.products)) throw new Error("Catalog products array is missing.");

const changes = {};
let changed = 0;
for (const product of catalog.products) {
  if (!product || typeof product !== "object") continue;
  const nextCategory = categoryFor(
    { name: product.advertiserName || "", parentCategory: product.advertiserCategory || "", childCategory: product.advertiserSubcategory || "" },
    product
  );
  const previous = String(product.category || "");
  if (previous !== nextCategory) {
    changes[previous || "(empty)"] = (changes[previous || "(empty)"] || 0) + 1;
    product.category = nextCategory;
    changed++;
  }
  // This is a canonical English taxonomy, not free-form translation.
  if (product.englishCategory !== nextCategory) product.englishCategory = nextCategory;
}
await fs.writeFile(path, JSON.stringify(catalog), "utf8");
console.log("Primary category audit completed for " + catalog.products.length + " catalog products.");
console.log("Reclassified products: " + changed + ".");
console.log("Previous category counts: " + JSON.stringify(changes));
