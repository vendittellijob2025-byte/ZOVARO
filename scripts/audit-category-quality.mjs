import fs from "node:fs";
import { categoryFor } from "../lib/product-category.js";

const catalog = JSON.parse(fs.readFileSync("data/catalog.json", "utf8"));
if (!Array.isArray(catalog.products)) throw new Error("Catalog products array is missing.");

const imageAudits = new Map();
try {
  const report = JSON.parse(fs.readFileSync("data/image-audit-report.json", "utf8"));
  for (const item of Array.isArray(report.results) ? report.results : []) {
    if (item?.key) imageAudits.set(String(item.key), item);
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const BABY_INTENT_TITLE = /\b(for baby|baby (?:wash|shampoo|lotion|cream|oil|butter|balm|wipes|sunscreen|sun cream|perfume|fragrance|stroller|monitor|carrier|clothes|clothing)|diaper|newborn|infant|nursery|toddler|sleep sack)\b/i;
const distribution = new Map();
const examples = [];
let checked = 0;
let mismatches = 0;
let visualOverrides = 0;

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
  const imageKey = [product.source || "", product.advertiserId || "", product.id || ""].join("|");
  const audit = imageAudits.get(imageKey);
  const visual = audit?.imageUrl === product.imageLink ? audit.categoryCheck : null;
  const title = String(product.englishTitle || product.title || "");
  const trustedVisualOverride =
    visual?.status === "possible_mismatch" &&
    visual.expectedCategory === expected &&
    Number(visual.confidence) >= 0.45 &&
    Number(visual.margin) >= 0.10 &&
    typeof visual.detectedCategory === "string" &&
    visual.detectedCategory !== "Other" &&
    !BABY_INTENT_TITLE.test(title);

  const acceptedCategory = trustedVisualOverride ? visual.detectedCategory : expected;
  const actual = String(product.category || "");
  const english = String(product.englishCategory || "");
  checked++;
  distribution.set(acceptedCategory, (distribution.get(acceptedCategory) || 0) + 1);
  if (trustedVisualOverride) visualOverrides++;
  if (actual !== acceptedCategory || english !== acceptedCategory) {
    mismatches++;
    if (examples.length < 25) {
      examples.push({
        id: product.id || "",
        title: product.title || "",
        actual,
        english,
        expected: acceptedCategory,
        classifierCategory: expected,
        visualOverride: Boolean(trustedVisualOverride)
      });
    }
  }
}

console.log("Primary category consistency audit: " + JSON.stringify({
  checked,
  mismatches,
  trustedVisualOverrides: visualOverrides,
  distribution: Object.fromEntries([...distribution].sort((a,b) => a[0].localeCompare(b[0]))),
  examples
}));
if (mismatches) {
  throw new Error("Category consistency audit found " + mismatches + " products whose stored categories differ from the trusted classifier/image decision.");
}
