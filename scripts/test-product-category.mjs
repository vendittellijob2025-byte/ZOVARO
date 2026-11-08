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
  ["Baby Doll", "Toys & Games"],
  ["Dog Toy", "Toys & Games"],
  ["Travel Mug", "Home & Living"],
  ["Office Chair", "Home & Living"],
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
  ["Unclassified Special Item", "Other", { advertiser: { name: "General Retailer" } }],
  ["Ahava Brightening Mud Mask Face Masks 1.7Oz", "Beauty"],
  ["Rude Return Of The Jeteye 35 Eyeshadows Palette - Book 4 1.34Oz", "Beauty"],
  ["Rude Splash Liner Eyeliner | Comic Book", "Beauty"],
  ["Farmhouse Fresh Fluffy Bunny Shea Butter Hand Cream 2Oz", "Beauty"],
  ["Sundae Body Whipped Shower Foam - Very Vanilla 8.9Oz", "Beauty"],
  ["Moschino Toy Boy Coffret - 3Pc", "Beauty", { description: "Eau de parfum with woody and spicy notes" }],
  ["Michael Kors Underwire Baby Doll Tankini Top In New Navy - S", "Fashion"],
  ["Rexing Rexing-MSD-64GB microSDXC UHS-3 Memory Card with Adapter", "Electronics"],
  ["Rexing M1S Monocular", "Electronics", { description: "4K IR Night Vision Digital Monocular with 8x Zoom" }],
  ["UNice Skin Melt HD Lace Body Wave Human Hair Wig Camera Ready Styling", "Fashion"],
  ["Vitajuwel Via Heat Tea Strainer", "Home & Living"],
  ["Rexing Installation Service", "Other"],
  ["Patchology Rose Hydrating Under Eye Masks - 5Pair", "Beauty"],
  ["Biotherm Blue Peptides Eyes & Lips Contour Reshaper Eye Cream", "Beauty"],
  ["Covergirl Perfect Blend Eyeliner | Black Brown", "Beauty"],
  ["Le 9 De Givenchy Multi Finish Eyeshadows Palette", "Beauty"],
  ["Rexing BC500 In-Car Baby Monitor HD 1080p", "Electronics"],
  ["Baby Sleep Sack Organic Cotton", "Babies"],
  ["Shiseido Sports Bb Broad Spectrum Spf 50+ Wetforce", "Beauty"],
  ["Super Pack Drop Shot Carat Pro Padel Racket", "Sports"],
  ["Jane Iredale Oval Blender Brush", "Beauty"],
  ["Etafor Portable Blender | Black", "Appliances"],
  ["Mac Love Me Liquid Lipcolour | Whatta Doll", "Beauty"],
  ["Lovery Dinosaur Egg Bath Bombs - Gift Toys With Dino Surprises Inside", "Beauty"],
  ["Kaloo Les Amis Eau D'ambiance Spray + Free Penguin Soft Toy", "Beauty"],
  ["Mac Kohl Power Eye Pencil | Feline", "Beauty"],
  ["R+Co Motorcycle Flexible Gel 5 Oz", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["Sam Edelman Lavina Buckle Mule In Natural", "Fashion"],
  ["Charlotte Tilbury Luxury Palette | Pillow Talk Dreams", "Beauty"],
  ["Drowsy Pillow Scrunchie | Dusty Gold", "Fashion"],
  ["Nox Ml10 Pro Cup Silver By Miguel Lamperti 2027", "Sports", { advertiser: { name: "Padel Iberico ES" } }],
  ["Farmhouse Fresh Triple Shot Caramel Coffee Body Polish", "Beauty"],
  ["Cliganic Mosquito Repellent Patches", "Health & Wellness"],
  ["Aveda Botanical Kinetics Energizing Eye Creme", "Beauty"],
  ["Abelssoft FileCryptor 2025 | Daten verschlüsseln", "Office & Technology"],
  ["JetDrive 9 | Defragmentiert Deine Festplatte", "Office & Technology"],
  ["Mediatheken Downloader 2025 | Legal von ARD herunterladen", "Office & Technology"],
  ["Myova Myoplus Tablets 120Ct", "Health & Wellness"],
  ["UNice Pre Cut Lace Natural Black Water Wave Hair No Baby Hair", "Fashion"]
];

for (const [title, expected, options = {}] of cases) {
  const merchant = options.advertiser || advertiser;
  assert.equal(
    categoryFor(merchant, {
      title,
      ...(options.description ? { description: options.description } : {}),
      ...(options.category ? { category: options.category } : {})
    }),
    expected,
    title
  );
}

assert.equal(categoryFor({ name: "Travel Store", parentCategory: "Travel" }, {
  title: "Toy Story Eau de Parfum",
  category: "Travel",
  sourceCategory: "Travel"
}), "Beauty");
assert.equal(categoryFor({ name: "Beauty Store" }, {
  title: "Ceramic Coffee Mug",
  category: "Beauty",
  sourceCategory: "Beauty"
}), "Home & Living");
assert.equal(categoryFor({ name: "General Retailer" }, {
  title: "Unbranded Item 123",
  category: "Beauty & Personal Care"
}), "Other");

console.log("Product primary-category tests passed (" + (cases.length + 3) + " checks).");
