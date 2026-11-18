import fs from "node:fs/promises";
import { categoryFor, subcategoryFor, visualCategoryOverride, visualSubcategoryOverride } from "../lib/product-category.js";
import { normalizeSubcategoryPath } from "../lib/category-taxonomy.js";

const path = "data/catalog.json";
const catalog = JSON.parse(await fs.readFile(path, "utf8"));
const taxonomy = JSON.parse(await fs.readFile("data/category-tree.json", "utf8"));
let imageReport = { results: [] };
try { imageReport = JSON.parse(await fs.readFile("data/image-audit-report.json", "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
const visualResults = new Map((imageReport.results || []).map(item => [item.key, item]));
if (!Array.isArray(taxonomy.categories)) throw new Error("Canonical category taxonomy is missing.");
if (!Array.isArray(catalog.products)) throw new Error("Catalog products array is missing.");

const changes = {};
const examples = {};
let changed = 0;
for (const product of catalog.products) {
  if (!product || typeof product !== "object") continue;
  const textCategory = categoryFor(
    {
      name: product.advertiserName || "",
      parentCategory: product.advertiserCategory || "",
      childCategory: product.advertiserSubcategory || ""
    },
    product
  );
  const key = [product.source || "", product.advertiserId || "", product.id || ""].join("|");
  const visualCheck = visualResults.get(key)?.categoryCheck;
  const nextCategory = visualCategoryOverride(visualCheck) || textCategory;
  // A visual override is accepted only when CLIP's top category clears the
  // explicit confidence and margin thresholds in visualCategoryOverride().
  // All lower-confidence disagreements remain review signals, not overrides.
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
  const visualPath = visualSubcategoryOverride(visualCheck, nextCategory);
  const proposedSubcategory = visualPath || subcategoryFor(nextCategory, product);
  product.subcategory = normalizeSubcategoryPath(nextCategory, proposedSubcategory, taxonomy);
  if (visualCheck && visualCheck.visualAction === "reclassify") {
    product.visualCategoryEvidence = { category: nextCategory, confidence: visualCheck.confidence, margin: visualCheck.margin, source: "CLIP zero-shot image classification", auditedAt: visualResults.get(key)?.auditedAt || null };
  }
  product.englishSubcategory = product.subcategory;
  // Do not label a product Amazon-verified without a real browse-path/node match.
  // Keep uncertain entries visible to the audit pipeline instead of guessing.
  product.amazonBrowsePath = product.amazonBrowsePath || "";
  product.amazonBrowseNodeId = product.amazonBrowseNodeId || "";
  product.amazonReferenceStatus = product.amazonBrowseNodeId || product.amazonBrowsePath
    ? "amazon_reference_recorded"
    : "pending_amazon_reference";
  product.classificationStatus = product.category === "Other" || product.subcategory === "Other"
    ? "needs_classification"
    : "provisional";
  product.classificationBasis = product.classificationBasis ||
    "Existing ZOVARO product classifier; Amazon browse-path verification still required";
}
await fs.writeFile(path, JSON.stringify(catalog), "utf8");
console.log("Primary category audit completed for " + catalog.products.length + " catalog products.");
console.log("Reclassified products: " + changed + ".");
console.log("Products with confident image-root overrides: " + catalog.products.filter(product => product.visualCategoryEvidence?.source === "CLIP zero-shot image classification").length + ".");
console.log("Previous category counts: " + JSON.stringify(changes));
console.log("Reclassification examples: " + JSON.stringify(examples));
