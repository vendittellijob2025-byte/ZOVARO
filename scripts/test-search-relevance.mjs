import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const start = source.indexOf("const SEARCH_SYNONYMS = Object.freeze({");
const end = source.indexOf("\n$(\"#searchForm\").addEventListener", start);
assert.ok(start >= 0 && end > start, "Search relevance block must exist");
const isolated = source.slice(start, end) + "\nglobalThis.searchTestApi = { scoreProductSearch };";
const context = vm.createContext({});
vm.runInContext(isolated, context);
const score = (title, query, category = "Electronics", subcategory = "") =>
  context.searchTestApi.scoreProductSearch({
    name: title, title, englishTitle: title, category, subcategory
  }, [query]);

assert.ok(score("Samsung Galaxy S25 Ultra 256GB", "Samsung Galaxy S25") > 0,
  "Exact model query should find the product");
assert.equal(score("Samsung Galaxy S25 Silicone Case", "Samsung Galaxy S25"), 0,
  "A model search must not return its case");
assert.ok(score("Samsung Galaxy S25 Silicone Case", "Samsung Galaxy S25 case") > 0,
  "An explicitly requested case should remain searchable");
assert.equal(score("Case for iPhone 17", "iPhone 17"), 0,
  "An iPhone model search must not return accessories");
assert.ok(score("Case for iPhone 17", "iPhone 17 case") > 0,
  "Explicit iPhone case query should return the case");
assert.equal(score("Dior Homme Eau de Toilette", "Dior Sauvage",
  "Beauty", "Sauvage Perfume"), 0,
  "Words split between title and taxonomy must not create a false match");
assert.ok(score("Dior Sauvage Eau de Parfum", "Dior Sauvage", "Beauty") > 0,
  "Exact branded perfume query should match");
assert.ok(score("Universal Phone Screen Protector", "phone screen protector") > 0,
  "Multi-word accessory intent should permit the requested accessory");
assert.equal(score("Universal Phone Case", "phone"), 0,
  "Generic phone search must exclude phone cases");
assert.ok(score("Apple iPad Pro 13-inch", "tablets", "Electronics", "Phones & Tablets") > 0,
  "A single-word category query should match the category taxonomy");
assert.ok(score("Dior Sauvage Eau de Parfum", "beauty", "Beauty") > 0,
  "A single-word category query should match the product category");

console.log("Search relevance tests passed: exact models, accessory exclusions, explicit accessory queries, split-field false positives and category searches.");
