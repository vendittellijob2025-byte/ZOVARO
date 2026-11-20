import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { categoryFor, subcategoryFor, visualCategoryOverride, visualSubcategoryOverride } from "../lib/product-category.js";

const advertiser = { name: "Toy Story Travel & Toys", parentCategory: "Travel", childCategory: "Toys" };
const cases = [
  // Brand/model words are weak evidence: classify by what the product actually is.
  // Wigs and extensions follow the explicit Beauty > Hair Care browse taxonomy.
  ["BRUNO MARC CrossFlex Lite Polish Men's Non Slip Smart Casual Oxfords", "Fashion"],
  ["Anker Nano Power Bank (5K, MagGo, Slim) Sky Blue", "Electronics"],
  ["Espoir Fresh Setting Powder", "Beauty"],
  ["OSULLOC Samdayeon Original Milk Tea (10 sticks)", "Food & Grocery"],
  ["AdBlocker Ultimate for Windows", "Office & Technology"],
  ["Instant Firmx Temporary Face Tightener Cream", "Beauty"],
  ["Clinique Smart Custom-Repair Eye Treatment", "Beauty"],
  ["Divine Youth Oil by L'Occitane for Unisex", "Beauty"],
  ["Etui na Ramię do Biegania Samsung S10 S20 Fe S21", "Sports"],
  ["Baby Lips Moisturizing Lip Balm", "Beauty", { advertiser: { name: "Babies & Kids Store" } }],
  ["M2U Nyc Metallic Liquid Lip | Baby Coral (Light Peach) 0.21Oz", "Beauty"],
  ["[From 20 Inches] 13x4 Bye Bye Slip Lace Frontal Water Wave Glueless Drawstring Wig", "Beauty", { description: "Product description mentions lipstick, mascara and beauty cosmetics as unrelated examples." }],
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
  ["Samsung Galaxy S26 Ultra", "Electronics"],
  ["Apple iPhone 17 Pro Max", "Electronics"],
  ["Samsung Galaxy Tab S11", "Electronics"],
  ["Apple MacBook Pro", "Electronics"],
  ["Ferrari 296 GTB", "Luxury & Prestige"],
  ["Lamborghini Revuelto", "Luxury & Prestige"],
  ["Hummer H2", "Luxury & Prestige"],
  ["Private Jet Charter", "Luxury & Prestige"],
  ["Exclusive Villa for Sale", "Luxury & Prestige"],
  ["Patek Philippe Nautilus", "Luxury & Prestige"],
  ["Rolex Submariner", "Luxury & Prestige"],
  ["Original Oil Painting by Collector", "Luxury & Prestige"],
  ["Bentley Cologne for Men by Bentley Eau de Toilette Spray", "Beauty"],
  ["Model Maisto Bugatti Chiron Sport 1:24", "Toys & Games"],
  ["Le Mans '66 (Ford vs Ferrari) DVD", "Books & Media"],
  ["Electronic Throttle Body fits for Chevy Hummer Buick GMC Isuzu Vehicles", "Automotive"],
  ["Mirrorless Camera with Travel Case", "Electronics"],
  ["Ceramic Coffee Mug", "Home & Living", { advertiser: { name: "Beauty Store" } }],
  ["Wooden Toy Train", "Toys & Games", { advertiser: { name: "Beauty Store" } }],
  ["Moisturising Face Cream", "Beauty"],
  ["Moisturizing Face Cream", "Beauty"],
  ["Hydrating Facial Moisturiser", "Beauty"],
  ["Leather Travel Suitcase", "Travel"],
  ["Baby Stroller", "Babies"],
  ["Baby Doll", "Toys & Games"],
  ["Dog Toy", "Pets"],
  ["Dog Toy with Rope", "Pets"],
  ["Cat Toy with Feather", "Pets"],
  ["Puppy Chew Toy", "Pets"],
  ["Dog Treats Chicken Recipe", "Pets"],
  ["Cat Litter Clumping Formula", "Pets"],
  ["Travel Mug", "Home & Living"],
  ["Office Chair", "Home & Living"],
  ["Digital Camera Bag", "Electronics"],
  ["Wireless Bluetooth Headphones", "Electronics"],
  ["Apple iPhone 17 Pro", "Electronics"],
  ["PlayStation 5 Slim Console", "Gaming"],
  ["Nike Court Tennis Shoes", "Sports"],
  ["Women's Running Shoes", "Sports"],
  ["Etui na Ramię do Biegania Samsung S10 S20 Fe S21", "Sports"],
  ["Cotton Summer Dress", "Fashion"],
  ["Cordless Power Drill", "Tools & DIY"],
  ["Stainless Steel Refrigerator", "Appliances"],
  ["Paperback Science Book", "Books & Media"],
  ["Organic Ground Coffee", "Food & Grocery"],
  ["Dog Food Storage Container", "Pets"],
  ["Garden Hose", "Garden"],
  ["Hair Extensions 20 Inch", "Beauty"],
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
  ["UNice Deep Wave Malaysian Remy Hair 3 Bundles Deal", "Beauty"],
  ["Premium High-Stretch Ice Silk Sleep Bonnet for Braids", "Fashion"],
  ["Safe for Sensitive Ears Starlight Spark Cubic Zirconia Stud Earrings", "Fashion"],
  ["UNice Bubble Gum Pink Wash Bag Makeup Bag", "Beauty"],
  ["Electric Curling Iron Wand Fast Heating", "Beauty"],
  ["UNice 8 Pairs 3D False Eyelashes Cat Eye", "Beauty"],
  ["Lace Tint Pen for Seamless Natural Hairline", "Beauty"],
  ["UNice Skin Melt HD Lace Body Wave Human Hair Wig Camera Ready Styling", "Beauty"],
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
  ["UNice Pre Cut Lace Natural Black Water Wave Hair No Baby Hair", "Beauty"],
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
  ["UNice Honey Blonde Highlighted Body Wave Hair Bundles", "Beauty"],
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
  ["Digital air fryer 6 quart", "Appliances"],
  ["Ceramic table lamp for living room", "Home & Living"],
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
  ["UNice Pre Cut Lace Natural Black Water Wave Curly Drawstring No Baby Hair", "Beauty"],
  ["Le Specs Air Heart Cat-Eye Sunglasses", "Fashion"],
["Rexing CPW-1 Wireless Apple CarPlay Adapter", "Electronics"],
  ["Rexing Smart Hardwire Kit with 360 Motion Detection", "Electronics"],
  ["UNice Hair 3pcs/pack Peruvian Virgin Hair Loose Wave", "Beauty"],
  ["UNice Sport-Friendly Glueless Curly Wig", "Beauty"],
  ["Chi Tea Tree Oil Travel Kit", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["Clinique Travel Size Take The Day Off Cleansing Balm", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["Style And Grace Travel Cup Gift Bath And Body Gift Sets", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["Joe's Jeans The Hi Honey Skinny Ankle Jeans In Divine", "Fashion"],
  ["Women's Drawstring Jogger Pants", "Fashion"],
  ["Lovery Almond Milk And Honey Body Butter", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["Savannah Bee Company Whipped Honey Gift Set", "Food & Grocery"],
  ["Vacation Arizona Lip Balms 3Pc", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["Nuda Self Tan Travel Kit", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["Teaology Yoga Care Radiance Butter Shower Scrub", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["Chrome By Azzaro And Versace Pour Homme By Versace - Default Title", "Beauty", { advertiser: { name: "Perfumania.com" } }],
  ["OSULLOC Camellia Forest Tea (20 count)", "Food & Grocery", { advertiser: { name: "Amore Mall" } }],
  ["FRP Moto Sahara 40 40cc Kids ATV for Ages 6+ — Dual Disc Brakes - Green / Max", "Automotive", { advertiser: { name: "FRP Moto Affiliate" } }],
  ["RotoSound Roto R11-54 whites 11-54 struny elektryk", "Musical Instruments & Studio"],
  ["Zima Winter- mała harmonijka", "Musical Instruments & Studio"],
  ["Tamiya Extra Thin Quick Setting 87182 Klej 40ml", "Arts, Crafts & Sewing"],
  ["Dmuchawa akumulatorowa 54V DeWALT DCMBA572N Body", "Garden"],
  ["Tabletki czyszczące do ekspresów Siemens TZ80001B Oryginalne", "Appliances"],
  ["Ładowarka słoneczna telefonu panel słoneczny 42W", "Energy, Solar & Electric Mobility"],
  ["Mediseptol H naturalny płyn do dezynfekcji 5 L", "Health & Wellness"],
  ["Podbierak Jaxon Safe Extra Strong teleskop aluminium długość 1,90m", "Sports"],
  ["3x Główka jigowa Dragon X-fine 1,5g hak 01", "Sports"],
  ["PG Sox Skarpety Antypoślizgowe Niebieskie r. 37-41", "Fashion"],
  ["Złoty Pierścionek Zaręczynowy 585 z Cyrkonią r.12", "Fashion"],
  ["Protective Neck Gaiter", "Fashion"],
  ["Vitajuwel Via Heat Tea Strainer", "Home & Living"],
  ["Divine Youth Oil by L'Occitane for Unisex", "Beauty", { advertiser: { name: "L'Occitane" } }],
  ["Clinique Smart Custom-Repair Eye Treatment", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
  ["Instant Firmx Temporary Face Tightener Cream", "Beauty", { advertiser: { name: "eCosmetics.com" } }],
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
  ["Women's Running Shoes", "Sports", "Running > Running Shoes"],
  ["Men's Leather Sneakers", "Fashion", "Shoes > Sneakers"],
  ["Leather Ankle Boots", "Fashion", "Shoes > Boots"],
  ["Women's Sandals", "Fashion", "Shoes > Sandals"],
  ["Formal Oxford Shoes", "Fashion", "Shoes > Formal Shoes"],
  ["DREAM PAIRS Faux Suede Moccasin Slippers", "Fashion", "Shoes > Slippers"],
  ["BRUNO MARC Men s Classic Metallic Horsebit Loafers", "Fashion", "Shoes > Formal Shoes"],
  ["Single Shoe", "Fashion", "Shoes"],
  ["Men's Leather Wallet", "Fashion", "Bags & Luggage"],
  ["Baby Bottle with Silicone Nipple", "Babies", "Feeding & Nursing"],
  ["Baby Stroller Travel System", "Babies", "Strollers & Accessories"],
  ["Baby Pre-Walker Shoes", "Babies", "Baby Shoes > Pre-Walker Shoes"],
  ["Baby Pink Sneakers", "Fashion", "Shoes > Sneakers"],
  ["Shoe Storage Rack", "Home & Living", "Storage & Organization"],
  ["Leather Shoe Polish", "Fashion", "Accessories"],
  ["Shoe Travel Bag", "Fashion", "Bags & Luggage"],
  ["Stainless Steel Cookware Set", "Home & Living", "Kitchen & Dining"],
  ["Robot Vacuum Cleaner", "Appliances", "Floor Care"],
  ["Dog Harness Adjustable", "Pets", "Dogs > Collars, Leashes & Harnesses"],
  ["LEGO Building Blocks Set", "Toys & Games", "Building & Construction"],
  ["Arabica Coffee Beans", "Food & Grocery", "Beverages > Coffee"],
  ["Laptop Computer 15 inch", "Electronics", "Computers > Laptops"],
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
assert.equal(categoryFor({ name: "Padel Iberico ES" }, { title: "Padel Court Shoes" }), "Sports");
assert.equal(subcategoryFor("Sports", { title: "Padel Court Shoes", advertiserName: "Padel Iberico ES" }), "Sports Apparel > Sports Footwear");
assert.equal(subcategoryFor("Sports", { title: "Camiseta Head Tie Break Women", advertiserName: "Padel Iberico ES" }), "Sports Apparel > Sports Clothing");
assert.equal(subcategoryFor("Sports", { title: "Nox ML10 Pro Cup Padel Racket", advertiserName: "Padel Iberico ES" }), "Padel > Padel Rackets");
assert.equal(subcategoryFor("Sports", { title: "Paletero Padel Bag", advertiserName: "Padel Iberico ES" }), "Padel > Padel Bags");
assert.equal(categoryFor({ name: "Kaiya Baby" }, { title: "All Season Long Sleeve Sleep Sack" }), "Babies");
assert.equal(subcategoryFor("Beauty", { title: "UNice Pre Cut Lace Natural Black Water Wave Hair No Baby Hair" }), "Hair Care > Wigs & Hair Extensions");
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
  ["Sports", "Sports Apparel > Sports Footwear"],
  ["Sports", "Running > Running Shoes"],
  ["Sports", "Running"],
  ["Sports", "Padel > Padel Rackets"],
  ["Sports", "Padel > Padel Bags"],
  ["Babies", "Baby Clothing > Baby Sleepwear"],
  ["Babies", "Baby Clothing > Baby Bodysuits"],
  ["Babies", "Baby Shoes > Pre-Walker Shoes"],
  ["Fashion", "Shoes > Running Shoes"],
  ["Fashion", "Shoes > Sneakers"],
  ["Fashion", "Shoes > Boots"],
  ["Fashion", "Shoes > Sandals"],
  ["Fashion", "Shoes > Formal Shoes"],
  ["Fashion", "Shoes > Slippers"]
]) {
  assert.equal(treeHasPath(category, path), true, "Missing browse-tree path: " + category + " > " + path);
}
for (const [title, category, subcategory] of [...autoCases, ...departmentCases]) {
  assert.equal(treeHasPath(category, subcategory), true, "Missing browse-tree path: " + category + " > " + subcategory + " (" + title + ")");
}
console.log("Amazon.it browse-tree path integrity passed (" + (autoCases.length + departmentCases.length) + " paths).");

assert.equal(categoryFor({ name: "General Retailer" }, { title: "Etui na Ramię do Biegania Samsung S10 S20 Fe S21" }), "Sports");
assert.equal(categoryFor({ name: "General Retailer" }, { title: "BRUNO MARC CrossFlex Lite Polish Men’s Non Slip Smart Casual Oxfords" }), "Fashion");
console.log("Product primary-category and hierarchy tests passed (" + (cases.length + 3 + autoCases.length * 2 + departmentCases.length * 2) + " checks).");

assert.equal(visualCategoryOverride({status:"possible_mismatch",visualAction:"reclassify",detectedCategory:"Beauty",confidence:0.62,margin:0.21}),"Beauty");
assert.equal(visualCategoryOverride({status:"possible_mismatch",visualAction:"review",detectedCategory:"Beauty",confidence:0.62,margin:0.21}),null);
assert.equal(visualCategoryOverride({status:"possible_mismatch",visualAction:"reclassify",detectedCategory:"Beauty",confidence:0.30,margin:0.03}),null);
assert.equal(visualSubcategoryOverride({detectedCategory:"Beauty",visualSubcategoryAction:"apply",visualSubcategoryPath:"Makeup > Lip Makeup",visualSubcategoryConfidence:0.71,visualSubcategoryMargin:0.42},"Beauty"),"Makeup > Lip Makeup");
assert.equal(visualSubcategoryOverride({detectedCategory:"Beauty",visualSubcategoryAction:"apply",visualSubcategoryPath:"Makeup > Lip Makeup",visualSubcategoryConfidence:0.71,visualSubcategoryMargin:0.42},"Fashion"),null);


const subcategoryCases = [
  ["Gaming", "PlayStation 5 Slim Console", "Consoles > PlayStation"],
  ["Gaming", "Xbox Series X Console", "Consoles > Xbox"],
  ["Electronics", "Anker Nano Power Bank (5K, MagGo, Slim) Sky Blue", "Phones & Tablets > Power Banks & Portable Chargers"],
  ["Electronics", "Samsung Galaxy S26 Smartphone", "Phones & Tablets > Smartphones > Samsung Galaxy"],
  ["Electronics", "Apple iPhone 17 Pro", "Phones & Tablets > Smartphones > Apple iPhone"],
  ["Electronics", "Apple iPad Air Tablet", "Phones & Tablets > Tablets > Apple iPad"],
  ["Electronics", "Samsung Galaxy Tab S11 Tablet", "Phones & Tablets > Tablets > Samsung Galaxy Tab"],
  ["Electronics", "Apple MacBook Pro 16", "Computers > Laptops > Apple MacBook"],
  ["Electronics", "ASUS ROG Gaming Laptop", "Computers > Laptops > Gaming Laptops"],
  ["Electronics", "Lenovo ThinkPad Business Laptop", "Computers > Laptops > Business Laptops"],
  ["Electronics", "Dell Precision Workstation", "Computers > Desktop Computers > Workstations"],
  ["Electronics", "HP All-in-One PC", "Computers > Desktop Computers > All-in-One PCs"],
  ["Electronics", "Mini PC Ryzen Desktop", "Computers > Desktop Computers > Mini PCs"],
  ["Electronics", "NVIDIA GeForce RTX Graphics Card", "Computers > Computer Components > Graphics Cards"],
  ["Sports", "Nike Court Tennis Shoes", "Tennis > Tennis Shoes"],
  ["Sports", "Adidas Men's Tennis Sneakers", "Tennis > Tennis Shoes"],
  ["Fashion", "Reebok Classic Leather Sneakers", "Shoes > Sneakers"],
  ["Fashion", "Cotton T-Shirt", "Clothing > T-Shirts & Tops"],
  ["Fashion", "Nike Women's Running Leggings", "Women's Clothing"],
  ["Fashion", "Men's Denim Jeans", "Clothing > Jeans & Trousers"],
  ["Beauty", "Espoir Fresh Setting Powder", "Makeup > Face Makeup"],
  ["Beauty", "Divine Youth Oil by L'Occitane for Unisex", "Skincare > Face Skincare"],
  ["Beauty", "Clinique Smart Custom-Repair Eye Treatment", "Skincare > Eye Treatments"],
  ["Beauty", "Instant Firmx Temporary Face Tightener Cream", "Skincare > Face Skincare"],
  ["Beauty", "Chrome By Azzaro And Versace Pour Homme By Versace - Default Title", "Fragrances & Perfumes"],
  ["Food & Grocery", "OSULLOC Camellia Forest Tea (20 count)", "Beverages > Tea"],
  ["Automotive", "FRP Moto Sahara 40 40cc Kids ATV for Ages 6+ — Dual Disc Brakes", "Motorcycles, Accessories & Parts > ATV & Powersports"],
  ["Musical Instruments & Studio", "RotoSound Roto R11-54 whites 11-54 struny elektryk", "Instrument Accessories > Strings & Reeds"],
  ["Musical Instruments & Studio", "Zima Winter- mała harmonijka", "Instruments > Wind Instruments"],
  ["Arts, Crafts & Sewing", "Tamiya Extra Thin Quick Setting 87182 Klej 40ml", "Crafts & Creative DIY > Models & Miniatures"],
  ["Garden", "Dmuchawa akumulatorowa 54V DeWALT DCMBA572N Body", "Lawn Care > Leaf Blowers"],
  ["Appliances", "Tabletki czyszczące do ekspresów Siemens TZ80001B Oryginalne", "Kitchen Appliances > Coffee Machine Accessories"],
  ["Energy, Solar & Electric Mobility", "Ładowarka słoneczna telefonu panel słoneczny 42W", "Solar & Renewable Energy > Solar Panels"],
  ["Health & Wellness", "Mediseptol H naturalny płyn do dezynfekcji 5 L", "Home Cleaning & Care > Disinfectants"],
  ["Sports", "Podbierak Jaxon Safe Extra Strong teleskop aluminium długość 1,90m", "Fishing > Fishing Tackle"],
  ["Sports", "3x Główka jigowa Dragon X-fine 1,5g hak 01", "Fishing > Fishing Tackle"],
  ["Fashion", "PG Sox Skarpety Antypoślizgowe Niebieskie r. 37-41", "Clothing > Socks"],
  ["Fashion", "Złoty Pierścionek Zaręczynowy 585 z Cyrkonią r.12", "Jewelry > Rings"],
  ["Fashion", "Protective Neck Gaiter", "Accessories > Scarves"],
  ["Home & Living", "Vitajuwel Via Heat Tea Strainer", "Kitchen & Dining"],
  ["TVs & Home Cinema", "LG OLED Smart TV", "Televisions > OLED TVs"],
  ["TVs & Home Cinema", "Samsung QLED TV", "Televisions > QLED & Mini-LED TVs"],
  ["Luxury & Prestige", "Ferrari 296 GTB", "Luxury Cars & Hypercars > Ferrari"],
  ["Luxury & Prestige", "Lamborghini Revuelto", "Luxury Cars & Hypercars > Lamborghini"],
  ["Luxury & Prestige", "Porsche 911 GT3", "Luxury Cars & Hypercars > Porsche"],
  ["Luxury & Prestige", "Hummer H2", "Luxury Cars & Hypercars > Hummer & Luxury 4x4"],
  ["Luxury & Prestige", "Stretch Limousine Rental", "Luxury Cars & Hypercars > Limousines & Chauffeur Cars"],
  ["Luxury & Prestige", "Rolex Submariner Watch", "Luxury Watches & Jewelry > Rolex Watches"],
  ["Luxury & Prestige", "Patek Philippe Nautilus", "Luxury Watches & Jewelry > Patek Philippe Watches"],
  ["Luxury & Prestige", "Private Jet Charter", "Yacht & Aviation Charter > Private Jets & Business Aviation"],
  ["Luxury & Prestige", "Luxury Villa for Sale", "Exclusive Villas & Real Estate > Luxury Villas for Sale"],
  ["Luxury & Prestige", "Luxury Villa for Rent", "Luxury Stays & Property Rentals > Luxury Villas & Chalets for Rent"],
  ["Luxury & Prestige", "Original Oil Painting by Collector", "Fine Art & Collectibles > Original Paintings"]
];
const subcategoryFailures = [];
for (const [category, title, expected] of subcategoryCases) {
  const actual = subcategoryFor(category, { title, englishTitle: title });
  if (actual !== expected) subcategoryFailures.push({ category, title, expected, actual });
  assert.equal(treeHasPath(category, expected), true, "Missing browse-tree path: " + category + " > " + expected + " (" + title + ")");
}
console.log(JSON.stringify({ subcategoryTestCount: subcategoryCases.length, subcategoryFailures }, null, 2));
if (subcategoryFailures.length) throw new Error("Product subcategory tests failed: " + subcategoryFailures.length);
