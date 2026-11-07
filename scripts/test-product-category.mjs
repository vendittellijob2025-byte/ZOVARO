import assert from "node:assert/strict";
import { categoryFor } from "../lib/product-category.js";

const advertiser = { name: "Toy Story Travel & Toys", parentCategory: "Travel", childCategory: "Toys" };
const cases = [
  ["Toy Story Eau de Parfum 100ml", "Beauty", { description: "Luxury fragrance for women" }],
  ["Toy Story Perfume Gift Set", "Beauty", { category: "Toys & Games" }],
  ["Compact Digital Camera 24MP", "Electronics", { description: "Small camera ideal for trips" }],
  ["Mirrorless Camera with Travel Case", "Electronics"],
  ["Ceramic Coffee Mug", "Home & Living", { advertiser: { name: "Beauty Store" } }],
  ["Wooden Toy Train", "Toys & Games", { advertiser: { name: "Beauty Store" } }],
  ["Moisturising Face Cream", "Beauty"],
  ["Moisturizing Face Cream", "Beauty"],
  ["Hydrating Facial Moisturiser", "Beauty"],
  ["Leather Travel Suitcase", "Travel"],
  ["Baby Stroller", "Babies"],
  ["Digital Camera Bag", "Electronics"],
  ["Wireless Bluetooth Headphones", "Electronics"],
  ["Women's Running Shoes", "Sports"],
  ["Cotton Summer Dress", "Fashion"],
  ["Cordless Power Drill", "Tools & DIY"],
  ["Stainless Steel Refrigerator", "Appliances"],
  ["Paperback Science Book", "Books & Media"],
  ["Organic Ground Coffee", "Food & Grocery"],
  ["Dog Food Storage Container", "Pets"],
  ["Garden Hose", "Garden"],
  ["Hair Extensions 20 Inch", "Fashion"],
  ["Unclassified Special Item", "Other", { advertiser: { name: "General Retailer" } }]
];

for (const [title, expected, options = {}] of cases) {
  const merchant = options.advertiser || advertiser;
  assert.equal(
    categoryFor(merchant, { title, ...(options.description ? { description: options.description } : {}), ...(options.category ? { category: options.category } : {}) }),
    expected,
    title
  );
}

// A product title must beat conflicting advertiser and feed taxonomy.
assert.equal(categoryFor({ name: "Travel Store", parentCategory: "Travel" }, {
  title: "Toy Story Eau de Parfum",
  category: "Travel"
}), "Beauty");
assert.equal(categoryFor({ name: "Beauty Store" }, {
  title: "Ceramic Coffee Mug",
  category: "Beauty"
}), "Home & Living");

console.log("Product primary-category tests passed (" + (cases.length + 2) + " checks).");
