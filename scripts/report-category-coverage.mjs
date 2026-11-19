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
const productExample = product => ({
  title: String(product.englishTitle || product.title || product.name || "").slice(0, 220),
  brand: String(product.brand || "").slice(0, 100),
  advertiser: String(product.advertiserName || "").slice(0, 120),
  productType: String(product.productType || "").slice(0, 160),
  googleProductCategory: String(product.googleProductCategory || "").slice(0, 180),
  sourceCategory: String(product.sourceCategory || "").slice(0, 180),
  description: String(product.description || product.longDescription || "").slice(0, 220)
});
const otherExamples = products
  .filter(product => String(product.englishCategory || product.category || "").trim() === "Other")
  .slice(0, 150)
  .map(productExample);
const missingSubcategoryExamples = products
  .filter(product => {
    const category = String(product.englishCategory || product.category || "").trim();
    const subcategory = String(product.englishSubcategory || product.subcategory || "").trim();
    return byName.has(category) && (!subcategory || subcategory === "Other");
  })
  .slice(0, 150)
  .map(product => ({
    ...productExample(product),
    category: String(product.englishCategory || product.category || "").trim()
  }));
const otherByAdvertiser = new Map();
for (const product of products) {
  if (String(product.englishCategory || product.category || "").trim() !== "Other") continue;
  const advertiser = String(product.advertiserName || "(unknown advertiser)");
  otherByAdvertiser.set(advertiser, (otherByAdvertiser.get(advertiser) || 0) + 1);
}
const brandCoverage = {};
for (const brand of ["Nike", "Adidas", "Reebok"]) {
  const pattern = new RegExp("\\b" + brand + "\\b", "i");

  const matches = products.filter(product => {
    const productBrand = String(product.brand || "").trim();
    const title = String(product.englishTitle || product.title || product.name || "");
    // A populated, different brand field is authoritative: do not count
    // unrelated books or descriptions that merely mention the brand name.
    if (productBrand) return pattern.test(productBrand);
    return pattern.test(title) && !/\b(book|author|memoir|biography|history)\b/i.test(title);
  });
  const footwearMatches = matches.filter(product =>
    /\b(shoes?|sneakers?|trainers?|footwear|cleats?|zapatillas?|scarpe)\b/i.test(String(product.englishTitle || product.title || product.name || ""))
  );
  const tennisShoes = footwearMatches.filter(product =>
    /\b(tennis|court)\b/i.test(String(product.englishTitle || product.title || product.name || ""))
  );
  brandCoverage[brand] = {
    productCount: matches.length,
    footwearProductCount: footwearMatches.length,
    tennisShoeCount: tennisShoes.length,
    byCategory: [...matches.reduce((map, product) => {
      const category = String(product.englishCategory || product.category || "Other");
      map.set(category, (map.get(category) || 0) + 1);
      return map;
    }, new Map())].map(([category, count]) => ({ category, count })).sort((a,b) => b.count-a.count),
    examples: matches.slice(0, 10).map(productExample)
  };
}
const focusedProductCoverage = {
  televisions: products.filter(product => {
    const category = String(product.englishCategory || product.category || "");
    const subcategory = String(product.englishSubcategory || product.subcategory || "");
    return category === "TVs & Home Cinema" && /Televisions/.test(subcategory);
  }).length,
  smartphones: products.filter(product => /Phones & Tablets > Smartphones/.test(String(product.englishSubcategory || product.subcategory || ""))).length,
  playstationConsoles: products.filter(product => /Consoles > PlayStation/.test(String(product.englishSubcategory || product.subcategory || ""))).length,
  gamingConsoles: products.filter(product => String(product.englishCategory || product.category || "") === "Gaming" && /Consoles/.test(String(product.englishSubcategory || product.subcategory || ""))).length,
  fashionClothing: products.filter(product => String(product.englishCategory || product.category || "") === "Fashion" && /Clothing|Women's Clothing|Men's Clothing|Kids' Clothing/.test(String(product.englishSubcategory || product.subcategory || ""))).length,
  tennisShoes: products.filter(product => String(product.englishCategory || product.category || "") === "Sports" && /Tennis > Tennis Shoes/.test(String(product.englishSubcategory || product.subcategory || ""))).length,
  fashionSneakers: products.filter(product => String(product.englishCategory || product.category || "") === "Fashion" && /Shoes > Sneakers/.test(String(product.englishSubcategory || product.subcategory || ""))).length,
  sportsFootwear: products.filter(product => String(product.englishCategory || product.category || "") === "Sports" && /Sports Footwear/.test(String(product.englishSubcategory || product.subcategory || ""))).length
};
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
    mostUsedBrowsePaths: [...subcategoryCounts].map(([path, count]) => ({ path, productCount: count })).sort((a,b) => b.productCount - a.productCount).slice(0, 100),
    otherByAdvertiser: [...otherByAdvertiser].map(([advertiser, count]) => ({ advertiser, productCount: count })).sort((a,b) => b.productCount - a.productCount).slice(0, 30),
    otherExamples,
    missingSubcategoryExamples
  },
  brandCoverage,
  focusedProductCoverage,
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
  amazonBrowseNodeCoverage: productsWithAmazonBrowseNodeId,
  priorityProductCoverage: focusedProductCoverage,
  brandCounts: Object.fromEntries(Object.entries(brandCoverage).map(([brand, data]) => [brand, data.productCount]))
}));
