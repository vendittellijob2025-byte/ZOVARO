import fs from "node:fs";

const catalog = JSON.parse(fs.readFileSync("data/catalog.json", "utf8"));
if (!Array.isArray(catalog.products)) throw new Error("Catalog products array is missing.");

const activeNetworks = new Set(
  (Array.isArray(catalog.sources) ? catalog.sources : [])
    .filter(source => source && source.status === "active")
    .map(source => source.network)
);
const counts = {
  total: catalog.products.length,
  activeNetwork: 0,
  joined: 0,
  trackedHttps: 0,
  translatedTitle: 0,
  originalTitleFallback: 0,
  translatedCategory: 0,
  image: 0,
  validPrice: 0,
  loaderEligible: 0
};
const categories = new Map();
const networks = new Map();

for (const p of catalog.products) {
  if (!p || typeof p !== "object") continue;
  const active = activeNetworks.has(p.network);
  const joined = p.joinedStatus === true;
  const tracked = typeof p.clickUrl === "string" && /^https:\/\//i.test(p.clickUrl.trim());
  const title = (typeof p.englishTitle === "string" && !!p.englishTitle.trim()) || (typeof p.title === "string" && !!p.title.trim());
  const category = typeof p.englishCategory === "string" && !!p.englishCategory.trim();
  const image = !!String(p.imageLink || (Array.isArray(p.additionalImageLinks) ? p.additionalImageLinks[0] || "" : "")).trim();
  const price = typeof p.price === "number" && Number.isFinite(p.price) && p.price > 0;
  if (active) counts.activeNetwork++;
  if (joined) counts.joined++;
  if (tracked) counts.trackedHttps++;
  if (typeof p.englishTitle === "string" && p.englishTitle.trim()) counts.translatedTitle++;
  else if (typeof p.title === "string" && p.title.trim()) counts.originalTitleFallback++;
  if (category) counts.translatedCategory++;
  if (image) counts.image++;
  if (price) counts.validPrice++;
  if (active && joined && tracked && title && category && image && price) {
    counts.loaderEligible++;
    const label = p.englishCategory.trim().replace(/\s+/g, " ");
    categories.set(label, (categories.get(label) || 0) + 1);
    const network = String(p.network || "(missing)");
    networks.set(network, (networks.get(network) || 0) + 1);
  }
}
console.log("Catalog display eligibility audit: " + JSON.stringify(counts));
console.log("Active source networks: " + JSON.stringify([...activeNetworks]));
console.log("Products actually eligible for CJ loader by category: " +
  JSON.stringify(Object.fromEntries([...categories].sort((a,b) => a[0].localeCompare(b[0])))));
console.log("Products actually eligible for CJ loader by network: " +
  JSON.stringify(Object.fromEntries([...networks].sort((a,b) => a[0].localeCompare(b[0])))));
if (!counts.loaderEligible) throw new Error("CJ loader would display zero products.");
