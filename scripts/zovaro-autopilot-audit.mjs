import fs from "node:fs";

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const catalog = readJson("data/catalog.json");
const taxonomy = readJson("data/category-tree.json");
const direct = readJson("data/direct-partners.json");
const opportunities = readJson("data/partner-opportunities.json");
const products = Array.isArray(catalog.products) ? catalog.products : [];
const roots = Array.isArray(taxonomy.categories) ? taxonomy.categories : [];
const counts = new Map();
let unclassified = 0;
let invalidRoot = 0;
let tracked = 0;
let images = 0;
let priced = 0;

const validPaths = new Set();
function addPaths(nodes, prefix = "") {
  for (const item of nodes || []) {
    const name = typeof item === "string" ? item : String(item?.name || "");
    if (!name) continue;
    const current = prefix ? prefix + " > " + name : name;
    validPaths.add(current);
    if (typeof item === "object") addPaths(item.children, current);
  }
}
for (const root of roots) addPaths(root.children);

for (const product of products) {
  const category = String(product.englishCategory || product.category || "").trim();
  const subcategory = String(product.englishSubcategory || product.subcategory || "").trim();
  counts.set(category || "(blank)", (counts.get(category || "(blank)") || 0) + 1);
  if (!category || !subcategory || subcategory === "Other" || category === "Other") unclassified++;
  if (category && category !== "Other" && !roots.some(root => root.name === category)) invalidRoot++;
  if (subcategory && subcategory !== "Other" && !validPaths.has(subcategory)) invalidRoot++;
  if (/^https:\/\//i.test(String(product.clickUrl || ""))) tracked++;
  if (product.imageLink || (Array.isArray(product.additionalImageLink) && product.additionalImageLink.length)) images++;
  if (Number(product.price?.amount ?? product.price) > 0) priced++;
}

const partnerRecords = [
  ...(Array.isArray(direct.partners) ? direct.partners : []),
  ...(Array.isArray(direct.prospects) ? direct.prospects : [])
];
const partnerStatusCounts = {};
for (const partner of partnerRecords) {
  const status = String(partner.status || "status_not_recorded");
  partnerStatusCounts[status] = (partnerStatusCounts[status] || 0) + 1;
}
const opportunityStatusCounts = {};
for (const item of opportunities.opportunities || []) {
  const status = String(item.status || "status_not_recorded");
  opportunityStatusCounts[status] = (opportunityStatusCounts[status] || 0) + 1;
}

const report = {
  generatedAt: new Date().toISOString(),
  mode: "read_only_audit",
  checks: {
    classificationTests: process.env.CATEGORY_TESTS_OUTCOME || "not_run",
    categoryAudit: process.env.CATEGORY_AUDIT_OUTCOME || "not_run",
    partnerRegistryAudit: process.env.PARTNER_AUDIT_OUTCOME || "not_run"
  },
  catalog: {
    selectedProducts: products.length,
    inventoryProducts: catalog.inventoryProductCount ?? null,
    advertisers: new Set(products.map(p => p.advertiserName).filter(Boolean)).size,
    categoryCount: roots.length,
    populatedCategories: [...counts.keys()].filter(name => name !== "(blank)" && name !== "Other").length,
    categoryCounts: Object.fromEntries([...counts].sort((a,b) => b[1] - a[1])),
    unclassifiedOrOtherProducts: unclassified,
    invalidCategoryOrSubcategoryPaths: invalidRoot,
    trackedHttpsLinks: tracked,
    productsWithImages: images,
    productsWithPositivePrices: priced
  },
  partners: {
    records: partnerRecords.length,
    activePartnerRecords: (direct.partners || []).filter(p => p.status === "active").length,
    prospectRecords: (direct.prospects || []).length,
    products: (direct.products || []).length,
    publishedProducts: (direct.products || []).filter(p => p.publicationStatus === "published").length,
    statusCounts: partnerStatusCounts
  },
  affiliateOpportunities: {
    records: (opportunities.opportunities || []).length,
    statusCounts: opportunityStatusCounts,
    note: "Registry health only. This scheduled workflow does not perform AI web research, submit applications, send outreach, or infer approvals."
  },
  safeguards: [
    "No paid services or purchases are invoked.",
    "No partner applications or emails are sent.",
    "No partner status is promoted to approved automatically.",
    "No product is published or removed by this audit.",
    "No catalogue or taxonomy data is modified by this audit."
  ]
};

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/zovaro-autopilot-report.json", JSON.stringify(report, null, 2) + "\n", "utf8");

const summary = [
  "# ZOVARO AUTOPILOT — six-hour operations report",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  "## Automated checks",
  `- Classification tests: **${report.checks.classificationTests}**`,
  `- Category quality audit: **${report.checks.categoryAudit}**`,
  `- Partner registry audit: **${report.checks.partnerRegistryAudit}**`,
  "",
  "## Catalogue",
  `- Selected products: **${report.catalog.selectedProducts.toLocaleString("en-US")}**`,
  `- Inventory products: **${report.catalog.inventoryProducts ?? "not recorded"}**`,
  `- Advertisers represented: **${report.catalog.advertisers}**`,
  `- Top-level categories: **${report.catalog.categoryCount}**`,
  `- Products unclassified / Other: **${report.catalog.unclassifiedOrOtherProducts.toLocaleString("en-US")}**`,
  `- Invalid category/subcategory paths: **${report.catalog.invalidCategoryOrSubcategoryPaths}**`,
  `- HTTPS tracked links: **${report.catalog.trackedHttpsLinks.toLocaleString("en-US")}**`,
  "",
  "## Affiliate pipeline",
  `- Direct partner records: **${report.partners.records}** (${report.partners.activePartnerRecords} active; ${report.partners.prospectRecords} prospects)`,
  `- Partner products: **${report.partners.products}** (${report.partners.publishedProducts} published)`,
  `- Research opportunities: **${report.affiliateOpportunities.records}**`,
  "",
  "> This is an automated read-only health report. It does not conduct live AI-assisted partner research or send applications/emails. Those actions remain separate and require owner authorization.",
  "",
  "## Safeguards",
  ...report.safeguards.map(item => `- ${item}`)
].join("\n");

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) fs.appendFileSync(summaryPath, summary + "\n");
console.log(summary);
