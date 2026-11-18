import fs from "node:fs";
import { isValidSubcategoryPath } from "../lib/category-taxonomy.js";

const catalog = JSON.parse(fs.readFileSync("data/catalog.json", "utf8"));
const taxonomy = JSON.parse(fs.readFileSync("data/category-tree.json", "utf8"));
if (!Array.isArray(taxonomy.categories) || !Array.isArray(catalog.products)) {
  throw new Error("Catalog or canonical category taxonomy is missing.");
}

const products = catalog.products.filter(product => product && typeof product === "object");
const categories = taxonomy.categories.map(category => ({
  name: category.name,
  productCount: 0,
  unclassifiedProductCount: 0,
  browseTree: []
}));
const byName = new Map(categories.map(category => [category.name, category]));
const unknown = new Map();
const advertisers = new Set();
const subcategoryCounts = new Map();
const classificationStatusCounts = new Map();
const unclassifiedByCategory = new Map();
let productsWithTrackedLinks = 0;
let productsWithImages = 0;
let productsWithPrices = 0;
let productsWithKnownSubcategory = 0;
let productsWithInvalidSubcategory = 0;
let productsWithAmazonBrowsePath = 0;
let productsWithAmazonBrowseNodeId = 0;
let pendingAmazonReference = 0;
let otherCount = 0;

for (const product of products) {
  const category = String(product.englishCategory || product.category || "").trim();
  const subcategory = String(product.englishSubcategory || product.subcategory || "").trim();
  const root = byName.get(category);
  if (root) {
    root.productCount += 1;
    if (!subcategory || subcategory === "Other") {
      root.unclassifiedProductCount += 1;
      unclassifiedByCategory.set(category, (unclassifiedByCategory.get(category) || 0) + 1);
    }
  } else {
    unknown.set(category || "(blank)", (unknown.get(category || "(blank)") || 0) + 1);
  }
  if (category === "Other") otherCount += 1;

  if (root && subcategory && subcategory !== "Other") {
    if (isValidSubcategoryPath(category, subcategory, taxonomy)) {
      productsWithKnownSubcategory += 1;
      const key = category + " > " + subcategory;
      subcategoryCounts.set(key, (subcategoryCounts.get(key) || 0) + 1);
    } else {
      productsWithInvalidSubcategory += 1;
    }
  }

  const status = String(product.classificationStatus || "not_recorded");
  classificationStatusCounts.set(status, (classificationStatusCounts.get(status) || 0) + 1);
  if (String(product.amazonBrowsePath || "").trim()) productsWithAmazonBrowsePath += 1;
  if (String(product.amazonBrowseNodeId || "").trim()) productsWithAmazonBrowseNodeId += 1;
  if (product.amazonReferenceStatus === "pending_amazon_reference") pendingAmazonReference += 1;

  if (String(product.clickUrl || "").startsWith("https://")) productsWithTrackedLinks += 1;
  if (product.imageLink || (Array.isArray(product.additionalImageLink) && product.additionalImageLink.length)) productsWithImages += 1;
  if (Number(product.price?.amount ?? product.price) > 0) productsWithPrices += 1;
  if (product.advertiserName) advertisers.add(product.advertiserName);
}

function countAtPath(category, path) {
  return products.reduce((count, product) => {
    const productCategory = String(product.englishCategory || product.category || "").trim();
    const productPath = String(product.englishSubcategory || product.subcategory || "").trim();
    return count + (productCategory === category && (productPath === path || productPath.startsWith(path + " > ")) ? 1 : 0);
  }, 0);
}

let taxonomyNodeCount = 0;
let usedTaxonomyNodeCount = 0;
function buildBrowseTree(category, nodes, parentPath = "") {
  return (Array.isArray(nodes) ? nodes : []).map(node => {
    const name = typeof node === "string" ? node : String(node?.name || "");
    if (!name) return null;
    const path = parentPath ? parentPath + " > " + name : name;
    const children = typeof node === "string" ? [] : (Array.isArray(node?.children) ? node.children : []);
    const productCount = countAtPath(category, path);
    taxonomyNodeCount += 1;
    if (productCount > 0) usedTaxonomyNodeCount += 1;
    return {
      name,
      path,
      productCount,
      directProductCount: products.filter(product =>
        String(product.englishCategory || product.category || "").trim() === category &&
        String(product.englishSubcategory || product.subcategory || "").trim() === path
      ).length,
      children: buildBrowseTree(category, children, path)
    };
  }).filter(Boolean);
}

for (const category of categories) {
  const source = taxonomy.categories.find(item => item.name === category.name);
  category.browseTree = buildBrowseTree(category.name, source?.children || []);
}

const emptyCategories = categories.filter(category => category.productCount === 0).map(category => category.name);
const result = {
  generatedAt: new Date().toISOString(),
  selectedProductCount: products.length,
  inventoryProductCount: catalog.inventoryProductCount ?? null,
  uniqueAdvertiserCount: advertisers.size,
  categories,
  nonEmptyCategoryCount: categories.length - emptyCategories.length,
  emptyCategories,
  otherProductCount: otherCount,
  unknownCategories: [...unknown].map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count),
  categoryQuality: {
    taxonomyNodeCount,
    usedTaxonomyNodeCount,
    emptyTaxonomyNodeCount: taxonomyNodeCount - usedTaxonomyNodeCount,
    productsWithKnownSubcategory,
    productsWithInvalidSubcategory,
    productsWithoutSubcategory: products.length - productsWithKnownSubcategory - productsWithInvalidSubcategory,
    unclassifiedByCategory: [...unclassifiedByCategory].map(([category, count]) => ({ category, count })).sort((a,b) => b.count - a.count),
    classificationStatusCounts: Object.fromEntries([...classificationStatusCounts].sort((a,b) => a[0].localeCompare(b[0]))),
    amazonReference: {
      productsWithBrowsePath: productsWithAmazonBrowsePath,
      productsWithBrowseNodeId: productsWithAmazonBrowseNodeId,
      pendingReference: pendingAmazonReference
    },
    mostUsedBrowsePaths: [...subcategoryCounts].map(([path, count]) => ({ path, productCount: count })).sort((a,b) => b.productCount - a.productCount).slice(0, 100)
  },
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
  otherProductCount: otherCount,
  taxonomyNodeCount,
  usedTaxonomyNodeCount,
  productsWithKnownSubcategory,
  productsWithInvalidSubcategory,
  amazonBrowsePathCoverage: productsWithAmazonBrowsePath,
  amazonBrowseNodeCoverage: productsWithAmazonBrowseNodeId
}));
