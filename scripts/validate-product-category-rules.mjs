import fs from "node:fs";
import { categoryFor } from "../lib/product-category.js";

const taxonomy = JSON.parse(fs.readFileSync("data/category-tree.json", "utf8"));
const roots = new Set((taxonomy.categories || []).map(category => category.name));
const cases = [
  ["Accessible & Adaptive Living", "Foldable electric wheelchair"],
  ["Arts, Crafts & Sewing", "Wooden beads raw decoupage 42mm"],
  ["Business, Wholesale & Bulk Supply", "Commercial packaging supplies bulk case pack"],
  ["Energy, Solar & Electric Mobility", "Portable power station solar generator"],
  ["Food Delivery & Restaurant Orders", "Weekly meal kit delivery box"],
  ["Gaming", "Xbox Series X gaming console"],
  ["Industrial & Scientific", "Creality Ender-5 Max 3D printer"],
  ["Musical Instruments & Studio", "Acoustic guitar with case"],
  ["Real Estate", "Luxury villa for sale in Tuscany"],
  ["Refurbished, Pre-Owned & Outlet", "Certified refurbished iPhone 15"],
  ["Repair & Circular Economy", "Phone repair service"],
  ["Security & Safety", "Wireless security camera system"],
  ["Luxury & Prestige", "999.9 Gold Diamond Necklace"],
  ["TVs & Home Cinema", "4K OLED Smart TV"],
  ["Beauty", "Baby Pink Lipstick"],
  ["Babies", "Newborn sleep sack"],
  ["Sports", "DREAM PAIRS soccer cleats"],
  ["Automotive", "OEDRO floor mats for 2016 Honda Civic"],
  ["Automotive", "KSP Performance aluminum intake manifold"],
  ["TVs & Home Cinema", "Aurzen projector mount"],
  ["Beauty", "LUNA 4 body Peach Perfect", "Foreo"],
  ["Fashion", "UNice $99 Surprise Box", "UNice"],
  ["Luxury & Prestige", "999.9 Gold Diamond Pendant", "Chow Sang Sang"],
  ["Food & Grocery", "OSULLOC Original Milk Tea", "OSULLOC"],
  ["Industrial & Scientific", "Ender-5 Max 3D-Drucker", "Creality"],
  ["Travel", "Europe XXL Political and Road Map", "Maps International"],
  ["Other", "Rexing Installation Service", "Rexing"]
];

const failures = [];
for (const [expected, title, advertiser = "ZOVARO Test"] of cases) {
  const actual = categoryFor({ name: advertiser }, { title, englishTitle: title });
  if (actual !== expected) failures.push({ title, expected, actual });
  if (actual !== "Other" && !roots.has(actual)) failures.push({ title, expectedRoot: "canonical taxonomy root", actual });
}
console.log(JSON.stringify({ testCount: cases.length, failures }, null, 2));
if (failures.length) throw new Error("Product category classifier tests failed: " + failures.length);
