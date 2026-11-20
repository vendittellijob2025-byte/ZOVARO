import fs from "node:fs";
import { categoryFor, subcategoryFor, visualCategoryOverride, visualSubcategoryOverride } from "../lib/product-category.js";
import { normalizeSubcategoryPath } from "../lib/category-taxonomy.js";

const catalog = JSON.parse(fs.readFileSync("data/catalog.json", "utf8"));
const taxonomy = JSON.parse(fs.readFileSync("data/category-tree.json", "utf8"));
if (!Array.isArray(taxonomy.categories)) throw new Error("Canonical category taxonomy is missing.");
const taxonomyRoots = new Set(taxonomy.categories.map(item => item.name));
if (!Array.isArray(catalog.products)) throw new Error("Catalog products array is missing.");

const BABY_INTENT_TITLE = /\b(for baby|baby (?:wash|shampoo|lotion|cream|oil|butter|balm|wipes|sunscreen|sun cream|perfume|fragrance|stroller|monitor|carrier|clothes|clothing)|diaper|newborn|infant|nursery|toddler|sleep sack)\b/i;
let imageReport = { results: [] };
try { imageReport = JSON.parse(fs.readFileSync("data/image-audit-report.json", "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
const visualResults = new Map((imageReport.results || []).map(item => [item.key, item]));
const distribution = new Map();
const subcategoryDistribution = new Map();
const examples = [];
const otherExamples = [];
let checked = 0;
let mismatches = 0;
let invalidSubcategoryPaths = 0;
let unclassifiedProducts = 0;
const invalidSubcategoryExamples = [];
const unclassifiedByCategory = new Map();
const unclassifiedExamplesByCategory = new Map();

for (const product of catalog.products) {
  if (!product || typeof product !== "object") continue;
  const textExpected = categoryFor(
    {
      name: product.advertiserName || "",
      parentCategory: product.advertiserCategory || "",
      childCategory: product.advertiserSubcategory || ""
    },
    product
  );
  const key = [product.source || "", product.advertiserId || "", product.id || ""].join("|");
  const visualCheck = visualResults.get(key)?.categoryCheck;
  const acceptedCategory = visualCategoryOverride(visualCheck, product) || textExpected;
  if (acceptedCategory === "Other" && otherExamples.length < 120) {
    otherExamples.push({
      id: product.id || "",
      title: product.title || "",
      advertiser: product.advertiserName || "",
      category: product.category || "Other",
      subcategory: product.subcategory || "Other",
      classificationStatus: product.classificationStatus || "",
      productType: product.productType || "",
      googleProductCategory: product.googleProductCategory || "",
      sourceCategory: product.sourceCategory || "",
      description: String(product.description || product.longDescription || "").slice(0, 220)
    });
  }
  const actual = String(product.category || "");
  const subcategory = String(product.subcategory || "");
  const visualPath = visualSubcategoryOverride(visualCheck, acceptedCategory);
  const proposedSubcategory = visualPath || subcategoryFor(acceptedCategory, product);
  const expectedSubcategory = normalizeSubcategoryPath(acceptedCategory, proposedSubcategory, taxonomy);
  if (subcategory !== expectedSubcategory) {
    invalidSubcategoryPaths++;
    if (invalidSubcategoryExamples.length < 25) invalidSubcategoryExamples.push({
      id: product.id || "", title: product.title || "", category: actual,
      subcategory, expectedSubcategory, reason: "subcategory_classifier_mismatch"
    });
  }
  if (!subcategory || subcategory === "Other" || actual === "Other") {
    unclassifiedProducts++;
    const root = actual || "Other";
    unclassifiedByCategory.set(root, (unclassifiedByCategory.get(root) || 0) + 1);
    const samples = unclassifiedExamplesByCategory.get(root) || [];
    if (samples.length < 8) {
      samples.push({
        id: product.id || "",
        title: product.title || "",
        advertiser: product.advertiserName || "",
        category: actual,
        subcategory,
        classificationStatus: product.classificationStatus || "",
        productType: product.productType || "",
        googleProductCategory: product.googleProductCategory || "",
        sourceCategory: product.sourceCategory || ""
      });
      unclassifiedExamplesByCategory.set(root, samples);
    }
  }
  const rootExists = taxonomyRoots.has(actual) || actual === "Other";
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
  const englishSubcategory = String(product.englishSubcategory || "");
  if (englishSubcategory !== subcategory) {
    invalidSubcategoryPaths++;
    if (invalidSubcategoryExamples.length < 25) invalidSubcategoryExamples.push({ id: product.id || "", title: product.title || "", category: actual, subcategory, englishSubcategory, reason: "english_subcategory_mismatch" });
  }
  checked++;
  distribution.set(acceptedCategory, (distribution.get(acceptedCategory) || 0) + 1);
  const subcategoryKey = acceptedCategory + " > " + (subcategory || "Other");
  subcategoryDistribution.set(subcategoryKey, (subcategoryDistribution.get(subcategoryKey) || 0) + 1);
  if (actual !== acceptedCategory || english !== acceptedCategory) {
    mismatches++;
    if (examples.length < 25) {
      examples.push({
        id: product.id || "",
        title: product.title || "",
        actual,
        english,
        expected: acceptedCategory,
        classifierCategory: textExpected
      });
    }
  }
}

const auditReport = {
  checked,
  mismatches,
  distribution: Object.fromEntries([...distribution].sort((a,b) => a[0].localeCompare(b[0]))),
  subcategoryDistribution: Object.fromEntries([...subcategoryDistribution].sort((a,b) => a[0].localeCompare(b[0]))),
  examples,
  otherExamples,
  invalidSubcategoryPaths,
  unclassifiedProducts,
  unclassifiedByCategory: Object.fromEntries([...unclassifiedByCategory].sort((a,b) => b[1] - a[1])),
  unclassifiedExamplesByCategory: Object.fromEntries([...unclassifiedExamplesByCategory].sort((a,b) => (unclassifiedByCategory.get(b[0]) || 0) - (unclassifiedByCategory.get(a[0]) || 0))),
  imageAuditedProducts: imageReport.results?.length || 0,
  visualRootOverrides: catalog.products.filter(product => product.visualCategoryEvidence?.source === "CLIP zero-shot image classification").length,
  invalidSubcategoryExamples
};
fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/category-quality-audit.json", JSON.stringify(auditReport, null, 2) + "\n", "utf8");
console.log("Category quality audit: " + JSON.stringify({
  checked,
  mismatches,
  invalidSubcategoryPaths,
  unclassifiedProducts,
  unclassifiedByCategory: [...unclassifiedByCategory].sort((a,b) => b[1] - a[1]).slice(0, 12).map(([category, count]) => ({ category, count, examples: (unclassifiedExamplesByCategory.get(category) || []).slice(0, 3) })),
  examples: examples.slice(0, 10),
  invalidSubcategoryExamples: invalidSubcategoryExamples.slice(0, 10)
}));
if (mismatches || invalidSubcategoryPaths) {
  throw new Error("Catalog quality audit failed: " + mismatches + " primary-category mismatches and " + invalidSubcategoryPaths + " invalid category/subcategory paths.");
}
