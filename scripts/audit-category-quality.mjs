import fs from "node:fs";
import { categoryFor } from "../lib/product-category.js";

const catalog = JSON.parse(fs.readFileSync("data/catalog.json", "utf8"));
if (!Array.isArray(catalog.products)) throw new Error("Catalog products array is missing.");

const distribution = new Map();
const examples = [];
let checked = 0;
let mismatches = 0;

for (const product of catalog.products) {
  if (!product || typeof product !== "object") continue;
  const expected = categoryFor(
    {
      name: product.advertiserName || "",
      parentCategory: product.advertiserCategory || "",
      childCategory: product.advertiserSubcategory || ""
    },
    product
  );
  const actual = String(product.category || "");
  const english = String(product.englishCategory || "");
  checked++;
  distribution.set(expected, (distribution.get(expected) || 0) + 1);
  if (actual !== expected || english !== expected) {
    mismatches++;
    if (examples.length < 25) {
      examples.push({
        id: product.id || "",
        title: product.title || "",
        actual,
        english,
        expected
      });
    }
  }
}

console.log("Primary category consistency audit: " + JSON.stringify({
  checked,
  mismatches,
  distribution: Object.fromEntries([...distribution].sort((a,b) => a[0].localeCompare(b[0]))),
  examples
}));
if (mismatches) {
  throw new Error("Category consistency audit found " + mismatches + " products whose stored categories differ from the primary-product classifier.");
}
