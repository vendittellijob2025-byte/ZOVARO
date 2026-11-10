import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { categoryFor, subcategoryFor } from "../lib/product-category.js";

const advertiser = { name: "Toy Story Travel & Toys", parentCategory: "Travel", childCategory: "Toys" };
const cases = [
  // Brand/model words are weak evidence: classify by what the product actually is.
  ["Baby Lips Moisturizing Lip Balm", "Beauty", { advertiser: { name: "Babies & Kids Store" } }],
  ["M2U Nyc Metallic Liquid Lip | Baby Coral (Light Peach) 0.21Oz", "Beauty"],
  ["[From 20 Inches] 13x4 Bye Bye Slip Lace Frontal Water Wave Glueless Drawstring Wig", "Fashion", { description: "Product description mentions lipstick, mascara and beauty cosmetics as unrelated examples." }],
  ["Baby Doll Matte Liquid Lipstick", "Beauty", { advertiser: { name: "Baby Fashion Brand" } }],
  ["Baby Pink Waterproof Mascara", "Beauty", { advertiser: { name: "Babies Store" } }],
  ["Baby Glow Hydrating Face Cream", "Beauty", { advertiser: { name: "Baby & Kids Shop" } }],
  ["Babies Collection Women's Concealer", "Beauty", { advertiser: { name: "Babies Collection" } }],
  ["Noodle & Boo Baby Balm For Face And Body - Fragrance Free 3.4Oz", "Babies"],
  ["Le Bebe Jacadi Eau De Toilette For Baby (Alcohol Free) 3.4Oz", "Babies"],
  ["Vacation Baby Oil Spf 30 3.4Oz", "Babies"],
  ["Mustela Vitamin Barrier Cream For Baby", "Babies"],
  ["Pod Organics Vitamin C Baby Wash", "Babies"],
  ["Baby Sleep Sack Organic Cotton", "Babies"],
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
  ["Moschino Toy Boy Coffret - 3Pc", "Beauty", { advertiser: { name: "FragranceShop.com" } }],
  ["Moschino Toy Boy Gift Set", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["Michael Kors Underwire Baby Doll Tankini Top In New Navy - S", "Fashion"],
  ["Rexing Rexing-MSD-64GB microSDXC UHS-3 Memory Card with Adapter", "Electronics"],
  ["Rexing M1S Monocular", "Electronics", { description: "4K IR Night Vision Digital Monocular with 8x Zoom" }],
  ["UNice Deep Wave Malaysian Remy Hair 3 Bundles Deal", "Fashion"],
  ["Premium High-Stretch Ice Silk Sleep Bonnet for Braids", "Fashion"],
  ["Safe for Sensitive Ears Starlight Spark Cubic Zirconia Stud Earrings", "Fashion"],
  ["UNice Bubble Gum Pink Wash Bag Makeup Bag", "Beauty"],
  ["Electric Curling Iron Wand Fast Heating", "Beauty"],
  ["UNice 8 Pairs 3D False Eyelashes Cat Eye", "Beauty"],
  ["Lace Tint Pen for Seamless Natural Hairline", "Beauty"],
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
  ["UNice Pre Cut Lace Natural Black Water Wave Hair No Baby Hair", "Fashion"],
["Miracle Fruit Oil Miracle Fruit Seed Oil Treatment - 1.7Oz", "Beauty"],
  ["Naturemary Relaxing Blend Blooming Garden Escape Bath Teas", "Beauty"],
  ["Bougies La Francaise Scented Candle | Blue Garden", "Home & Living"],
  ["Jean Paul Gaultier Le Beau Paradise Garden Eau De Perfum", "Beauty"],
  ["Olivia Garden Ceramic Ion Thermal Hairbrush", "Beauty"],
  ["Cliganic Organic Rosehip Seed Oil", "Beauty"],
  ["L'erbolario Eye Contour Cream With Camelia And Grape Seed", "Beauty"],
  ["Chi Luxury Black Seed Oil Intense Repair Hot Oil Treatment", "Beauty"],
  ["Chi Deep Brilliance Finish Flexible Hold Spray", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["Klara Native Mountain Pepperleaf Exfoliant", "Beauty"],
  ["Cannuka Cbd Calming Eye Balm", "Beauty"],
  ["Tarte Maracuja Tinted Hydrator Honey Shade", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["UNice Honey Blonde Highlighted Body Wave Hair Bundles", "Fashion"],
  ["4on Totalgrip Paste 50 Ml Overgrips", "Sports", { advertiser: { name: "Padel Iberico ES" } }],
  ["Patchology Lip Service Gloss-To-Balm Treatment", "Beauty"],
  ["Farmhouse Fresh Honey Lavender Fine Sea Salt Body Scrub", "Beauty"],
  ["Matrix Food For Soft Rich Hydrating Treatment Mask", "Beauty"],
  ["Palmers Hair Food Formula", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["NuFace Trinity Pro Facial Toning Kit", "Beauty"],
  ["Glamnetic Handheld UV LED Lamp", "Beauty"],
  ["Millefiori Icon Classic Car Air Freshener", "Automotive"],
  ["Voluspa 3 Wick Decorative Tin Candle | Gardenia Colonia 12Oz", "Home & Living"],
  ["Acqua Di Parma Luce Di Colonia Diffuser - 6Oz", "Home & Living"],
  ["Brocchi Travel Toiletry Bag | Black", "Fashion"],
  ["Bebe Silver Body Mist 8.4Oz", "Beauty"],
  ["Brocchi Foldable Dual-Power Mini Travel Dryer", "Beauty"],
  ["Goomee The Markless Hair Loop Set | Holiday Edition", "Fashion"],
  ["Free People Next Vacation Top In - Xl | Ivory Combo", "Fashion"],
  ["Organic Cotton Drawstring Comfy Jogger Lightning Pants - Shell - 6-9 Months", "Babies", { advertiser: { name: "Kaiya Baby" } }],
  ["Organic Cotton Drawstring Comfy Jogger Lightning Pants - Khaki - Newborn", "Babies", { advertiser: { name: "Kaiya Baby" } }],
  ["Smashbox Camera-Ready Party Favors Gift Set Gift Set 3Pc", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["Valmont V-Lift Eye Anti-Wrinkle Eye Contour Cream", "Beauty"],
  ["Mustela Vitamin Barrier Cream For Baby", "Babies"],
  ["Pod Organics Vitamin C Baby Wash", "Babies"],
  ["Sun Bum After Sun Cool Down Lotion", "Beauty"],
  ["Inopro Advanced Teeth Whitening Strips", "Beauty"],
  ["Vorsorge Paket 2026 Umfangreicher Ratgeber Dokumente", "Books & Media"],
  ["Abelssoft StartupStar 2025", "Office & Technology", { advertiser: { name: "Abelssoft Int" } }],
  ["Abelssoft Undeleter 2025", "Office & Technology", { advertiser: { name: "Abelssoft Int" } }],
  ["Abelssoft WashAndGo 24", "Office & Technology", { advertiser: { name: "Abelssoft Int" } }],
  ["UNice Pre Cut Lace Natural Black Water Wave Curly Drawstring No Baby Hair", "Fashion"],
  ["Le Specs Air Heart Cat-Eye Sunglasses", "Fashion"],
["Rexing CPW-1 Wireless Apple CarPlay Adapter", "Electronics"],
  ["Rexing Smart Hardwire Kit with 360 Motion Detection", "Electronics"],
  ["UNice Hair 3pcs/pack Peruvian Virgin Hair Loose Wave", "Fashion"],
  ["UNice Sport-Friendly Glueless Curly Wig", "Fashion"],
  ["Chi Tea Tree Oil Travel Kit", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["Clinique Travel Size Take The Day Off Cleansing Balm", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["Style And Grace Travel Cup Gift Bath And Body Gift Sets", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["Joe's Jeans The Hi Honey Skinny Ankle Jeans In Divine", "Fashion"],
  ["Lovery Almond Milk And Honey Body Butter", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["Savannah Bee Company Whipped Honey Gift Set", "Food & Grocery"],
  ["Vacation Arizona Lip Balms 3Pc", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["Nuda Self Tan Travel Kit", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["Teaology Yoga Care Radiance Butter Shower Scrub", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["Rexing Hard Travel Case Replacement", "Travel"],
  ["Millefiori Icon Classic Car Air Freshener", "Automotive"]
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
assert.equal(categoryFor({ name: "General Retailer" }, {
  title: "Unbranded Item 123",
  category: "Beauty & Personal Care",
  sourceCategory: "Electronics"
}), "Electronics");
assert.equal(categoryFor({ name: "Abelssoft Int", parentCategory: "Electronics" }, {
  title: "Abelssoft StartupStar 2025"
}), "Office & Technology");
assert.equal(categoryFor({ name: "UNice", parentCategory: "Beauty" }, {
  title: "UNice Surprise Box Gift Set"
}), "Other");


const autoCases = [
  ["Michelin Pilot Sport 4 Tire", "Automotive", "Rims & Tires > Car Tires"],
  ["Universal Side Mirror Replacement", "Automotive", "Car Parts > Mirrors & Glass"],
  ["Car Interior Organizer", "Automotive", "Car Accessories"],
  ["Car Wash Shampoo", "Automotive", "Vehicle Care > Exterior Cleaning"],
  ["Used Cars for Sale - Dealer Inventory", "Automotive", "Vehicles for Sale"],
  ["Baby Pink Lipstick", "Beauty", "Makeup > Lip Makeup"],
  ["Baby Wash for Newborn", "Babies", "Hygiene & Wellness > Baby Bath"]
];
for (const [title, expectedCategory, expectedSubcategory] of autoCases) {
  const actualCategory = categoryFor({ name: "General Retailer" }, { title });
  assert.equal(actualCategory, expectedCategory, title);
  assert.equal(subcategoryFor(actualCategory, { title }), expectedSubcategory, title + " subcategory");
}

const departmentCases = [
  ["Vitamin D3 2000 IU Supplement", "Health & Wellness", "Nutrition > Vitamins, Minerals & Supplements > Vitamin D"],
  ["Digital Blood Pressure Monitor", "Health & Wellness", "Medical Devices & Equipment > Diagnostic & Monitoring Devices"],
  ["First Aid Adhesive Bandages", "Health & Wellness", "First Aid & Wound Care > First Aid"],
  ["Whey Protein Powder", "Health & Wellness", "Nutrition > Sports Supplements > Protein Powders"],
  ["Yoga Mat Non Slip", "Sports", "Fitness & Gym > Yoga & Pilates > Yoga Mats"],
  ["Padel Racket Carbon", "Sports", "Padel"],
  ["Mountain Bike Helmet", "Sports", "Cycling > Helmets & Protection"],
  ["Women's Floral Summer Dress", "Fashion", "Women's Clothing"],
  ["Men's Leather Wallet", "Fashion", "Bags & Luggage"],
  ["Baby Bottle with Silicone Nipple", "Babies", "Feeding & Nursing"],
  ["Baby Stroller Travel System", "Babies", "Strollers & Accessories"],
  ["Stainless Steel Cookware Set", "Home & Living", "Kitchen & Dining"],
  ["Robot Vacuum Cleaner", "Appliances", "Floor Care"],
  ["Dog Harness Adjustable", "Pets", "Dogs > Collars, Leashes & Harnesses"],
  ["LEGO Building Blocks Set", "Toys & Games", "Building & Construction"],
  ["Arabica Coffee Beans", "Food & Grocery", "Beverages > Coffee"],
  ["Laptop Computer 15 inch", "Electronics", "Computers"],
  ["Wireless Bluetooth Headphones", "Electronics", "Audio"],
  ["Cordless Power Drill", "Tools & DIY", "Power Tools"],
  ["Carry On Suitcase", "Travel", "Luggage"],
  ["Organic Tomato Seeds", "Garden", "Gardening"]
];
for (const [title, expectedCategory, expectedSubcategory] of departmentCases) {
  const actualCategory = categoryFor({ name: "General Retailer" }, { title });
  assert.equal(actualCategory, expectedCategory, title);
  assert.equal(subcategoryFor(actualCategory, { title }), expectedSubcategory, title + " subcategory");
}

assert.equal(categoryFor({ name: "Padel Iberico ES" }, { title: "Camiseta Head Tie Break Women" }), "Sports");
assert.equal(subcategoryFor("Sports", { title: "Camiseta Head Tie Break Women", advertiserName: "Padel Iberico ES" }), "Sports Apparel > Sports Clothing");
assert.equal(subcategoryFor("Sports", { title: "Nox ML10 Pro Cup Padel Racket", advertiserName: "Padel Iberico ES" }), "Padel > Padel Rackets");
assert.equal(subcategoryFor("Sports", { title: "Paletero Padel Bag", advertiserName: "Padel Iberico ES" }), "Padel > Padel Bags");
assert.equal(categoryFor({ name: "Kaiya Baby" }, { title: "All Season Long Sleeve Sleep Sack" }), "Babies");
assert.equal(subcategoryFor("Babies", { title: "All Season Long Sleeve Sleep Sack", advertiserName: "Kaiya Baby" }), "Baby Clothing > Baby Sleepwear");
assert.equal(subcategoryFor("Babies", { title: "Organic Cotton Snap Bodysuit", advertiserName: "Kaiya Baby" }), "Baby Clothing > Baby Bodysuits");
assert.equal(subcategoryFor("Babies", { title: "Organic Cotton Jogger Pants", advertiserName: "Kaiya Baby" }), "Baby Clothing");

const categoryTree = JSON.parse(await fs.readFile(new URL("../data/category-tree.json", import.meta.url), "utf8"));
function treeHasPath(categoryName, path) {
  const root = categoryTree.categories.find(item => item.name === categoryName);
  if (!root) return false;
  let nodes = root.children || [];
  for (const part of path.split(" > ")) {
    const node = nodes.find(item => (typeof item === "string" ? item : item.name) === part);
    if (!node) return false;
    nodes = typeof node === "string" ? [] : (node.children || []);
  }
  return true;
}
for (const [category, path] of [
  ["Sports", "Sports Apparel > Sports Clothing"],
  ["Sports", "Padel > Padel Rackets"],
  ["Sports", "Padel > Padel Bags"],
  ["Babies", "Baby Clothing > Baby Sleepwear"],
  ["Babies", "Baby Clothing > Baby Bodysuits"]
]) {
  assert.equal(treeHasPath(category, path), true, "Missing browse-tree path: " + category + " > " + path);
}
for (const [title, category, subcategory] of [...autoCases, ...departmentCases]) {
  assert.equal(treeHasPath(category, subcategory), true, "Missing browse-tree path: " + category + " > " + subcategory + " (" + title + ")");
}
console.log("Amazon.it browse-tree path integrity passed (" + (autoCases.length + departmentCases.length) + " paths).");

console.log("Product primary-category and hierarchy tests passed (" + (cases.length + 3 + autoCases.length * 2 + departmentCases.length * 2) + " checks).");
