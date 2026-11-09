import fs from "node:fs/promises";
import { categoryFor, subcategoryFor } from "../lib/product-category.js";

const path = "data/catalog.json";
const catalog = JSON.parse(await fs.readFile(path, "utf8"));
if (!Array.isArray(catalog.products)) throw new Error("Catalog products array is missing.");

const imageAuditPath = "data/image-audit-report.json";
const imageAudits = new Map();
try {
  const report = JSON.parse(await fs.readFile(imageAuditPath, "utf8"));
  for (const item of Array.isArray(report.results) ? report.results : []) {
    if (item?.key) imageAudits.set(String(item.key), item);
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const BABY_INTENT_TITLE = /\\b(for baby|baby (?:wash|shampoo|lotion|cream|oil|butter|balm|wipes|sunscreen|sun cream|perfume|fragrance|stroller|monitor|carrier|clothes|clothing)|diaper|newborn|infant|nursery|toddler|sleep sack)\\b/i;
const changes = {};
const examples = {};
let changed = 0;
for (const product of catalog.products) {
  if (!product || typeof product !== "object") continue;
  let nextCategory = categoryFor(
    {
      name: product.advertiserName || "",
      parentCategory: product.advertiserCategory || "",
      childCategory: product.advertiserSubcategory || ""
    },
    product
  );
  // Use image understanding only as a high-confidence second opinion.
  // Explicit infant-use products are protected from being reclassified by
  // visually similar adult skincare or cosmetics.
  const imageKey = [product.source || "", product.advertiserId || "", product.id || ""].join("|");
  const imageAudit = imageAudits.get(imageKey);
  const visualCheck = imageAudit?.imageUrl === product.imageLink ? imageAudit.categoryCheck : null;
  const title = String(product.englishTitle || product.title || "");
  if (
    visualCheck?.status === "possible_mismatch" &&
    Number(visualCheck.confidence) >= 0.45 &&
    Number(visualCheck.margin) >= 0.10 &&
    typeof visualCheck.detectedCategory === "string" &&
    visualCheck.detectedCategory !== "Other" &&
    !BABY_INTENT_TITLE.test(title)
  ) {
    nextCategory = visualCheck.detectedCategory;
  }
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
  product.subcategory = subcategoryFor(nextCategory, product);
  product.englishSubcategory = product.subcategory;
}
await fs.writeFile(path, JSON.stringify(catalog), "utf8");
console.log("Primary category audit completed for " + catalog.products.length + " catalog products.");
console.log("Reclassified products: " + changed + ".");
console.log("Previous category counts: " + JSON.stringify(changes));
console.log("Reclassification examples: " + JSON.stringify(examples));
