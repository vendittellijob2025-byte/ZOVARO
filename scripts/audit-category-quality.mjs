import fs from "node:fs";
import { categoryFor } from "../lib/product-category.js";

const catalog = JSON.parse(fs.readFileSync("data/catalog.json", "utf8"));
const taxonomy = JSON.parse(fs.readFileSync("data/category-tree.json", "utf8"));
if (!Array.isArray(taxonomy.categories)) throw new Error("Canonical category taxonomy is missing.");
const taxonomyRoots = new Set(taxonomy.categories.map(item => item.name));
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
let invalidSubcategoryPaths = 0;
const invalidSubcategoryExamples = [];

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
    !/padel iberico/i.test(String(product.advertiserName || "")) &&
    visual.expectedCategory === expected &&
    Number(visual.confidence) >= 0.45 &&
    Number(visual.margin) >= 0.10 &&
    typeof visual.detectedCategory === "string" &&
    visual.detectedCategory !== "Other" &&
    !BABY_INTENT_TITLE.test(title);

  const acceptedCategory = trustedVisualOverride ? visual.detectedCategory : expected;
  const actual = String(product.category || "");
  const subcategory = String(product.subcategory || "");
  const rootExists = taxonomyRoots.has(actual);
  const subcategoryValid = !subcategory || subcategory === "Other" || (() => {
    const root = taxonomy.categories.find(item => item.name === actual);
    let nodes = Array.isArray(root?.children) ? root.children : [];
    for (const part of subcategory.split(" > ").map(value => value.trim()).filter(Boolean)) {
      const found = nodes.find(node => (typeof node === "string" ? node : node?.name) === part);
      if (!found) return false;
      nodes = typeof found === "string" || !Array.isArray(found.children) ? [] : found.children;
    }
    return true;
  })();
  if (!rootExists || !subcategoryValid) {
    invalidSubcategoryPaths++;
    if (invalidSubcategoryExamples.length < 25) invalidSubcategoryExamples.push({ id: product.id || "", title: product.title || "", category: actual, subcategory, rootExists, subcategoryValid });
  }
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
  examples,
  invalidSubcategoryPaths,
  invalidSubcategoryExamples
}));
if (mismatches || invalidSubcategoryPaths) {
  throw new Error("Catalog quality audit failed: " + mismatches + " primary-category mismatches and " + invalidSubcategoryPaths + " invalid category/subcategory paths.");
}
