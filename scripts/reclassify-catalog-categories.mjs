import fs from "node:fs/promises";
import { categoryFor, subcategoryFor } from "../lib/product-category.js";
import { normalizeSubcategoryPath } from "../lib/category-taxonomy.js";

const path = "data/catalog.json";
const catalog = JSON.parse(await fs.readFile(path, "utf8"));
const taxonomy = JSON.parse(await fs.readFile("data/category-tree.json", "utf8"));
if (!Array.isArray(taxonomy.categories)) throw new Error("Canonical category taxonomy is missing.");
if (!Array.isArray(catalog.products)) throw new Error("Catalog products array is missing.");

const changes = {};
const examples = {};
let changed = 0;
for (const product of catalog.products) {
  if (!product || typeof product !== "object") continue;
  const nextCategory = categoryFor(
    {
      name: product.advertiserName || "",
      parentCategory: product.advertiserCategory || "",
      childCategory: product.advertiserSubcategory || ""
    },
    product
  );
  // Image-model disagreements are recorded by the image audit for review.
  // They are never allowed to silently overwrite a category without matching
  // product-title/description evidence.
  const previous = String(product.category || "");
  if (previous !== nextCategory) {
    changes[previous || "(empty)"] = (changes[previous || "(empty)"] || 0) + 1;
    if (!examples[previous || "(empty)"]) examples[previous || "(empty)"] = [];
    if (examples[previous || "(empty)"].length < 5) {
      examples[previous || "(empty)"].push({
        title: product.englishTitle || product.title || "",
        to: nextCategory
      });
    }
    product.category = nextCategory;
    changed++;
  }
  product.englishCategory = nextCategory;
  const proposedSubcategory = subcategoryFor(nextCategory, product);
  product.subcategory = normalizeSubcategoryPath(nextCategory, proposedSubcategory, taxonomy);
  product.englishSubcategory = product.subcategory;
}
await fs.writeFile(path, JSON.stringify(catalog), "utf8");
console.log("Primary category audit completed for " + catalog.products.length + " catalog products.");
console.log("Reclassified products: " + changed + ".");
console.log("Previous category counts: " + JSON.stringify(changes));
console.log("Reclassification examples: " + JSON.stringify(examples));
