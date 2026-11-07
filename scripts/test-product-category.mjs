import assert from "node:assert/strict";
import { categoryFor } from "../lib/product-category.js";

const advertiser = { name: "Toy Story Travel & Toys", parentCategory: "Travel", childCategory: "Toys" };
assert.equal(categoryFor(advertiser, { title: "Toy Story Eau de Parfum 100ml", description: "Luxury fragrance for women" }), "Beauty");
assert.equal(categoryFor(advertiser, { title: "Toy Story Perfume Gift Set", category: "Toys & Games" }), "Beauty");
assert.equal(categoryFor({ name: "Travel Shop", parentCategory: "Travel" }, { title: "Compact Digital Camera 24MP", description: "Small camera ideal for trips" }), "Electronics");
assert.equal(categoryFor({ name: "Travel Shop", parentCategory: "Travel" }, { title: "Mirrorless Camera with Travel Case" }), "Electronics");
assert.equal(categoryFor({ name: "Beauty Store" }, { title: "Ceramic Coffee Mug" }), "Home & Living"); // the actual product beats the merchant category
assert.equal(categoryFor({ name: "Beauty Store" }, { title: "Wooden Toy Train" }), "Toys & Games");
assert.equal(categoryFor({ name: "General Retailer" }, { title: "Moisturising Face Cream" }), "Beauty");
assert.equal(categoryFor({ name: "General Retailer" }, { title: "Leather Travel Suitcase" }), "Travel");
assert.equal(categoryFor({ name: "General Retailer" }, { title: "Baby Stroller" }), "Babies");
console.log("Product primary-category tests passed (9 checks).");
