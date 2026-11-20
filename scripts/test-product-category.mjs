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
  ["Rexing Smart Hardwire Kit with 360 Motion Detection", "Automotive"],
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
  ["RotoSound Roto R11-54 whites 11-54 struny elektryk", "Musical Instruments & Studio", { advertiser: { name: "Allegro.pl" } }],
  ["Zima Winter- mała harmonijka", "Musical Instruments & Studio", { advertiser: { name: "Allegro.pl" } }],
  ["Tamiya Extra Thin Quick Setting 87182 Klej 40ml", "Arts, Crafts & Sewing", { advertiser: { name: "Allegro.pl" } }],
  ["Dmuchawa akumulatorowa 54V DeWALT DCMBA572N Body", "Garden", { advertiser: { name: "Allegro.pl" } }],
  ["Tabletki czyszczące do ekspresów Siemens TZ80001B Oryginalne", "Appliances", { advertiser: { name: "Allegro.pl" } }],
  ["Ładowarka słoneczna telefonu panel słoneczny 42W", "Energy, Solar & Electric Mobility", { advertiser: { name: "Allegro.pl" } }],
  ["Mediseptol H naturalny płyn do dezynfekcji 5 L", "Health & Wellness", { advertiser: { name: "Allegro.pl" } }],
  ["Podbierak Jaxon Safe Extra Strong teleskop aluminium długość 1,90m", "Sports", { advertiser: { name: "Allegro.pl" } }],
  ["3x Główka jigowa Dragon X-fine 1,5g hak 01", "Sports", { advertiser: { name: "Allegro.pl" } }],
  ["PG Sox Skarpety Antypoślizgowe Niebieskie r. 37-41", "Fashion", { advertiser: { name: "Allegro.pl" } }],
  ["Złoty Pierścionek Zaręczynowy 585 z Cyrkonią r.12", "Fashion", { advertiser: { name: "Allegro.pl" } }],
  ["Protective Neck Gaiter", "Fashion", { advertiser: { name: "FRP Moto Affiliate" } }],
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
assert.equal(categoryFor({ name: "Model Retailer" }, { title: "Maisto 1:24 Ferrari F40 Diecast Model Car" }), "Toys & Games");
assert.equal(categoryFor({ name: "Shoe Retailer" }, { title: "Women's Ballet Flats Shoes" }), "Fashion");
assert.equal(categoryFor({ name: "eCosmetics.com" }, {
  title: "Be. Professional 1.25 Repairing Argan Oil Vapor Iron With Thermolon Technology Flat Iron",
  sourceCategory: "Toys & Games"
}), "Beauty");
assert.equal(categoryFor({ name: "Allegro.pl" }, {
  title: "Alpha Audio kabel instrumentalny 1,5m",
  sourceCategory: "Toys & Games"
}), "Musical Instruments & Studio");
assert.equal(categoryFor({ name: "The Fragrance Outlet" }, {
  title: "Jaguar Vision Sport - 3.4 oz.",
  sourceCategory: "Sports"
}), "Beauty");
assert.equal(categoryFor({ name: "eCosmetics.com" }, {
  title: "Vitajuwel Decanter Era Set - Fitness",
  sourceCategory: "Sports"
}), "Home & Living");
assert.equal(categoryFor({ name: "Dream Pairs Shoes" }, {
  title: "DREAM PAIRS Classic Chelsea Ankle Booties",
  sourceCategory: "Travel"
}), "Fashion");
assert.equal(categoryFor({ name: "Allegro.pl" }, {
  title: "Plecionka Dragon R'n's 8X Invisible 0,12mm/150m",
  sourceCategory: "Other"
}), "Sports");
assert.equal(categoryFor({ name: "Allegro.pl" }, {
  title: "Włóczka Nako Bebe akryl premium 50g",
  sourceCategory: "Babies"
}), "Arts, Crafts & Sewing");
assert.equal(categoryFor({ name: "Allegro.pl" }, {
  title: "Rexing Tesla to J1772 Charging Adapter",
  sourceCategory: "Electronics"
}), "Automotive");
assert.equal(categoryFor({ name: "Abelssoft Int" }, {
  title: "mp3 schneiden 2025 | Dein einfaches Musikschnitt-Programm",
  sourceCategory: "Electronics"
}), "Office & Technology");
assert.equal(categoryFor({ name: "eCosmetics.com" }, { title: "Alfaparf Milano Evolution Of The Hair Color | 1.11 - Blue Black 2.05Oz", sourceCategory: "Toys & Games" }), "Beauty");
assert.equal(categoryFor({ name: "Perfumania.com" }, { title: "I Peel The Signature Facelift Gel Peel Technology", sourceCategory: "Health & Wellness" }), "Beauty");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Akumulator Bateria Tablet 7''-9'' 3500mAh", sourceCategory: "Health & Wellness" }), "Electronics");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Naturalny olejek eteryczny 12ml Drzewo Sandałowe", sourceCategory: "Other" }), "Health & Wellness");
assert.equal(categoryFor({ name: "eCosmetics.com" }, { title: "Valentino By Mario Valentino Men's Milo 1.5 Logo Leather Belt", sourceCategory: "Toys & Games" }), "Fashion");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Drewniany model statku Western 1:130 Diy", sourceCategory: "Toys & Games" }), "Toys & Games");
assert.equal(categoryFor({ name: "Abelssoft Int" }, { title: "Abelssoft AntiLogger 2025", sourceCategory: "Electronics" }), "Office & Technology");
assert.equal(categoryFor({ name: "Amore Mall" }, { title: "[1+1] ETUDE Sunprise Mild Watery Light Duo Set", sourceCategory: "Toys & Games" }), "Beauty");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Notatnik Passion Journal Baby Moleskine L", sourceCategory: "Babies" }), "Office & Technology");
assert.equal(categoryFor({ name: "eCosmetics.com" }, { title: "Fwee Blurry Pudding Pot Pk01 Baby Soft Pink", sourceCategory: "Babies" }), "Beauty");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Topeak Modula Cage XL Koszyk na butelki 1,5L Pet", sourceCategory: "Pets" }), "Sports");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Bioliq 35+ zestaw 3 kremów do cery mieszanej", sourceCategory: "Pets" }), "Beauty");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Elgydium Junior Płyn Do Płukania Dla Dzieci 500ml", sourceCategory: "Food & Grocery" }), "Health & Wellness");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Szczoteczka Do Zębów Z Bioplastiku Włosie Miękkie", sourceCategory: "Food & Grocery" }), "Health & Wellness");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Littlest Pet Shop Książka do wyklejania Kd", sourceCategory: "Pets" }), "Books & Media");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Pilot do Tv Thomson RC802N Smart Netflix", sourceCategory: "Electronics" }), "Electronics");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Uchwyt Na Tablet Telefon Do Dji Phantom 2 3 Se", sourceCategory: "Health & Wellness" }), "Electronics");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Sznurek do makramy bawełniany denim 2mm 60m", sourceCategory: "Fashion" }), "Arts, Crafts & Sewing");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Zestaw koralików do robienia bransoletek DIY", sourceCategory: "Tools & DIY" }), "Arts, Crafts & Sewing");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Sonor HS 2000 S Drum Hardware Stand Set", sourceCategory: "Tools & DIY" }), "Books & Media");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Iggy Pop TV Eye 1977 Live CD Nowa", sourceCategory: "Electronics" }), "Books & Media");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Wykrywacz Xp Orx Rc Hf 9,5x5 DD 13-81kHz", sourceCategory: "Fashion" }), "Sports");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Ibanez DCS50D-PBD Pale Blue Denim pasek do gitary", sourceCategory: "Fashion" }), "Books & Media");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Kieszeń Taktyczna Zrzutowa Zasobnik Helikon Competition Utility Pouch Olive", sourceCategory: "Fashion" }), "Sports");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Pudełko Niespodzianka Exploding Box Diy Album", sourceCategory: "Tools & DIY" }), "Arts, Crafts & Sewing");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Drucik aluminiowy Złoty drut 1,2mm 5m Diy", sourceCategory: "Tools & DIY" }), "Arts, Crafts & Sewing");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Kreatywny zestaw Koralików Diy do Bransoletek", sourceCategory: "Tools & DIY" }), "Arts, Crafts & Sewing");
assert.equal(categoryFor({ name: "Rexing" }, { title: "Rexing Type-C GPS Logger Add-On for Type-C Charger", sourceCategory: "Electronics" }), "Automotive");
assert.equal(categoryFor({ name: "Rexing" }, { title: "Rexing Type-C Smart Hardwire Kit with GPS for R4", sourceCategory: "Electronics" }), "Automotive");
assert.equal(categoryFor({ name: "eCosmetics.com" }, { title: "Crickle Daisy Bloom Baby Bloom Powder Brush Lavender Scent", sourceCategory: "Babies" }), "Beauty");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Słoik 100ML Pet Z Nakrętką Aluminiową Słoiczek Pudełko", sourceCategory: "Pets" }), "Home & Living");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Secret Life of Pets 3D Game Snakes and Ladders Gra", sourceCategory: "Pets" }), "Toys & Games");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Pellet 2mm Truskawka 1kg Method Feeder Optimal Baits", sourceCategory: "Food & Grocery" }), "Sports");
assert.equal(categoryFor({ name: "eCosmetics.com" }, { title: "Etafor Plus Massage Gun", sourceCategory: "Sports" }), "Health & Wellness");
assert.equal(categoryFor({ name: "eCosmetics.com" }, { title: "Shone 001-002 - White - Eu28", sourceCategory: "Sports" }), "Fashion");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Jigapix Pets Nowa !", sourceCategory: "Pets" }), "Toys & Games");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Butelka Pet 200ml z dozownikiem czarnym", sourceCategory: "Pets" }), "Home & Living");
assert.equal(categoryFor({ name: "eCosmetics.com" }, { title: "Color Wow Root Cover Up | Medium Brown 0.07Oz", sourceCategory: "Fashion" }), "Beauty");
assert.equal(categoryFor({ name: "eCosmetics.com" }, { title: "Marella Sport Sonale Knitted Coat-Jacket In | Blue Jeans", sourceCategory: "Sports" }), "Fashion");
assert.equal(categoryFor({ name: "Amore Mall" }, { title: "MAC Hyper Real Glow Palette Highlighter Glow Baby Glow", sourceCategory: "Babies" }), "Beauty");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Pop Jr Tv songs CD+DVD Nowa Piosenki z bajek", sourceCategory: "Electronics" }), "Books & Media");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Azuli Presents Miami 2002 David Piccioni 2xCD Nowa", sourceCategory: "Food & Grocery" }), "Books & Media");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "meridol płyn do płukania ust Ochrona Dziąseł 400ml", sourceCategory: "Food & Grocery" }), "Health & Wellness");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Zestaw do dekoracji na Święta świąteczny Diy", sourceCategory: "Tools & DIY" }), "Home & Living");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Pomysł dla niej/ dla niego Diy zdjęcia", sourceCategory: "Tools & DIY" }), "Other");
assert.equal(categoryFor({ name: "Rexing" }, { title: "Rexing L4 Series 4-Channel Dash Cams with Ultra-Wide Angle", sourceCategory: "Electronics" }), "Automotive");
assert.equal(categoryFor({ name: "Amore Mall" }, { title: "TWO SLASH FOUR Glaze Lip Changer Nu Ginger", sourceCategory: "Health & Wellness" }), "Beauty");
assert.equal(categoryFor({ name: "Amore Mall" }, { title: "TWO SLASH FOUR Strobing Face Cube 2 Purple", sourceCategory: "Health & Wellness" }), "Beauty");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Papier scrapbookingu P13 The Garden of Books", sourceCategory: "Books & Media" }), "Arts, Crafts & Sewing");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Medisept Velox Spray 5 L Tea Tonic", sourceCategory: "Sports" }), "Health & Wellness");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Satel Perfecta 16 LTE Alarm Bezprzewodowy", sourceCategory: "Pets" }), "Electronics");
assert.equal(categoryFor({ name: "Rexing" }, { title: "Rexing B1 (Black) Night Vision Goggles Binoculars", sourceCategory: "Electronics" }), "Sports");
assert.equal(categoryFor({ name: "Rexing" }, { title: "Rexing Adhesive Mount for V2 Pro AI", sourceCategory: "Electronics" }), "Automotive");
assert.equal(categoryFor({ name: "Rexing" }, { title: "Rexing Type-C GPS Module — 115200 Baud", sourceCategory: "Electronics" }), "Automotive");
assert.equal(categoryFor({ name: "Amore Mall" }, { title: "Alternativestereo Lip Potion Balmy Rose 01 Baby Rose", sourceCategory: "Babies" }), "Beauty");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Littlest Pet Shop Jak w kołowrotku Koloruj czytaj", sourceCategory: "Pets" }), "Books & Media");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Kenia Podróże z pasją Rough Guides", sourceCategory: "Books & Media" }), "Books & Media");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Siła nawyku. Dlaczego robimy to, co robimy", sourceCategory: "Food & Grocery" }), "Books & Media");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "8x Końcówka dla Dzieci do Szczoteczki Oral-B głowice do szczoteczek", sourceCategory: "Food & Grocery" }), "Health & Wellness");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "CD Lotto (Majkowski/Rychlicki/Szpura) Elite Feline", sourceCategory: "Pets" }), "Books & Media");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Littlest Pet Shop Panoramiczna kolorowanka", sourceCategory: "Pets" }), "Books & Media");
assert.equal(categoryFor({ name: "Allegro.pl" }, { title: "Best Seller [Value $315 Gift Card] UNice Women's Day Special Offer", sourceCategory: "Fashion" }), "Other");
assert.equal(categoryFor({ name: "UNice" }, { title: "[Random Color] High-elastic blend hugs your head comfortably without slipping or sliding", sourceCategory: "Sports" }), "Fashion");
assert.equal(categoryFor({ name: "eCosmetics.com" }, { title: "Vitajuwel Via Glass Bottle - Fitness", sourceCategory: "Sports" }), "Home & Living");
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
  ["Robot Vacuum Cleaner", "Appliances", "Floor Care > Robot Vacuums"],
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

assert.equal(visualCategoryOverride({status:"possible_mismatch",visualAction:"reclassify",detectedCategory:"Beauty",confidence:0.62,margin:0.21},{title:"Mystery Product 123",advertiserName:"General Retailer",sourceCategory:"Other"}),"Beauty");
assert.equal(visualCategoryOverride({status:"possible_mismatch",visualAction:"reclassify",detectedCategory:"Toys & Games",confidence:0.95,margin:0.50},{title:"Be. Professional Flat Iron",advertiserName:"eCosmetics.com",sourceCategory:"Toys & Games"}),null);
assert.equal(visualCategoryOverride({status:"possible_mismatch",visualAction:"reclassify",detectedCategory:"Beauty",confidence:0.95,margin:0.50},{title:"[US Only] $100 OFF Coupon",advertiserName:"UNice"}),null);
assert.equal(visualCategoryOverride({status:"possible_mismatch",visualAction:"review",detectedCategory:"Beauty",confidence:0.62,margin:0.21},{title:"Mystery Product 123",advertiserName:"General Retailer"}),null);
assert.equal(visualCategoryOverride({status:"possible_mismatch",visualAction:"reclassify",detectedCategory:"Beauty",confidence:0.30,margin:0.03},{title:"Mystery Product 123",advertiserName:"General Retailer"}),null);
assert.equal(visualSubcategoryOverride({detectedCategory:"Beauty",visualSubcategoryAction:"apply",visualSubcategoryPath:"Makeup > Lip Makeup",visualSubcategoryConfidence:0.71,visualSubcategoryMargin:0.42},"Beauty"),"Makeup > Lip Makeup");
assert.equal(visualSubcategoryOverride({detectedCategory:"Beauty",visualSubcategoryAction:"apply",visualSubcategoryPath:"Makeup > Lip Makeup",visualSubcategoryConfidence:0.71,visualSubcategoryMargin:0.42},"Fashion"),null);
assert.equal(subcategoryFor("Beauty", { title: "Jaguar Vision Sport - 3.4 oz.", advertiserName: "The Fragrance Outlet" }), "Fragrances & Perfumes");
assert.equal(subcategoryFor("Home & Living", { title: "Vitajuwel Via Glass Bottle - Fitness" }), "Kitchen & Dining > Drinkware");
assert.equal(subcategoryFor("Fashion", { title: "[Random Color] High-elastic blend hugs your head comfortably without slipping or sliding", advertiserName: "UNice" }), "Accessories > Hair Accessories");
assert.equal(subcategoryFor("Office & Technology", { title: "Abelssoft AntiLogger 2025", advertiserName: "Abelssoft Int" }), "Software > Utilities");


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
  ["Beauty", "Be. Professional 1.25 Repairing Argan Oil Vapor Iron Flat Iron", "Hair Care > Hair Styling Tools"],
  ["Beauty", "FOREO LUNA 4 body Peach Perfect", "Skincare > Body Skincare"],
  ["Beauty", "Acne Clearing Wash", "Skincare > Face Cleansers"],
  ["Beauty", "ODYSSEY Romantic Skin Emulsion 130ml", "Skincare > Face Skincare"],
  ["Health & Wellness", "Anker soundcore Eye Mask", "Wellness > Sleep & Relaxation > Sleep Masks"],
  ["Electronics", "FRP Limited Edition Crab Phone Mount", "Phones & Tablets > Phone Mounts & Holders"],
  ["Automotive", "Rexing Tesla to J1772 Charging Adapter", "Car Accessories > Electric Vehicle Charging > Charging Adapters"],
  ["Home & Living", "Vitajuwel Decanter Era Set - Fitness", "Kitchen & Dining > Drinkware"],
  ["Home & Living", "Kanapa rozkładana z funkcją spania", "Furniture > Living Room Furniture"],
  ["Home & Living", "FRP Limited Edition LED Desk Light", "Lighting > Desk Lamps"],
  ["Fashion", "DREAM PAIRS Classic Chelsea Ankle Booties", "Shoes > Boots"],
  ["Fashion", "DREAM PAIRS Low Wedge Espadrilles", "Shoes > Sandals"],
  ["Fashion", "UNice headwrap hair accessory", "Accessories > Hair Accessories"],
  ["Sports", "Plecionka Dragon R'n's 8X Invisible 0,12mm/150m", "Fishing > Lines & Hooks"],
  ["Books & Media", "Władca Pierścieni Drużyna Pierścienia Rozszerzona", "Movies & TV > DVD"],
  ["Arts, Crafts & Sewing", "Włóczka Nako Bebe akryl premium 50g", "Sewing & Textiles > Yarn & Knitting"],
  ["Industrial & Scientific", "CR-PETG Filament 1,75 mm 1 kg", "3D Printing & Additive Manufacturing > 3D Printer Filament"],
  ["Industrial & Scientific", "Hojas de acrílico opaco brillante 8x8x1/8''", "3D Printing & Additive Manufacturing > 3D Printing Materials"],
  ["Office & Technology", "Abelssoft FindMyFiles 2025", "Software > Utilities"],
  ["Appliances", "Anker SOLIX EverFrost 2 40L Electric Cooler", "Kitchen Appliances > Portable Coolers"],
  ["Babies", "Pod Organics Vitamin E Baby Massage Oil 4.05Oz", "Hygiene & Wellness > Baby Skin Care"],
  ["Beauty", "Alfaparf Milano Evolution Of The Hair Color", "Hair Care > Hair Color"],
  ["Beauty", "I Peel The Signature Facelift Gel Peel Technology", "Skincare > Face Peels"],
  ["Health & Wellness", "Naturalny olejek eteryczny 12ml Drzewo Sandałowe", "Wellness > Alternative Therapies > Essential Oils"],
  ["Health & Wellness", "8x Końcówka do Szczoteczki Oral-B", "Oral Hygiene > Toothbrushes"],
  ["Electronics", "Akumulator Bateria Tablet 7''-9'' 3500mAh", "Phones & Tablets > Batteries & Power Supplies"],
  ["Electronics", "Lanberg Kabel Hdmi 2.0 Tv 7,5m 4K Ultra Hd", "TV & Home Theater > Cables & Accessories"],
  ["Fashion", "Valentino Men's Milo 1.5 Logo Leather Belt", "Accessories > Belts"],
  ["Books & Media", "Tata i Ja Poznaję świat Smart Books 1-3 lata", "Books > Children's Books"],
  ["Books & Media", "Siła nawyku. Dlaczego robimy to, co robimy", "Books > Nonfiction"],
  ["Books & Media", "CD Lotto Elite Feline", "Music > CDs"],
  ["Toys & Games", "Drewniany model statku Western 1:130 Diy", "Model Kits"],
  ["Babies", "Baby Tous - 3.4 oz.", "Hygiene & Wellness > Baby Fragrances"],
  ["Pets", "Giovanni Deodorizing & Finishing Pet Spray Oatmeal & Coconut", "Pet Grooming & Health > Deodorizing & Finishing Sprays"],
  ["Industrial & Scientific", "Ender PLA+ 1,75 mm Filament d’impression 3D 1 kg", "3D Printing & Additive Manufacturing > 3D Printer Filament"],
  ["Industrial & Scientific", "Creality K2-Series Unicorn Quick Change Nozzle", "3D Printing & Additive Manufacturing > 3D Printer Accessories"],
  ["Beauty", "ETUDE Sunprise Mild Watery Light Duo Set", "Skincare > Sun Protection & Tanning"],
  ["Beauty", "ABOUT_TONE Blur Powder Pact 9g 1.5 Cool Fair", "Makeup > Face Makeup"],
  ["Beauty", "Clarinsmen Super Moisture Face Balm 1.6 Oz", "Skincare > Moisturizers"],
  ["Beauty", "Fwee Blurry Pudding Pot Pk01 Baby Soft Pink", "Makeup > Lip Makeup"],
  ["Beauty", "Crickle Daisy Bloom Baby Bloom Powder Brush Lavender Scent 1.4Oz", "Makeup > Makeup Tools & Accessories > Makeup Brushes"],
  ["Home & Living", "Aeriscape Baskets imprimées en 3D Black 35", "Home Décor > Decorative Objects"],
  ["Sports", "Peltor SportTac Active Hearing Protection", "Hunting > Hunting Accessories"],
  ["Sports", "Mata fitness do jogi ćwiczeń antypoślizgowa Reebok 4 mm", "Fitness & Gym > Yoga & Pilates > Yoga Mats"],
  ["Sports", "Nike Lebron 8 Empire Jade 5.5", "Sports Apparel > Sports Footwear"],
  ["Sports", "Topeak Modula Cage XL Koszyk na butelki 1.5L Pet", "Cycling > Bike Components"],
  ["Sports", "Ibanez DCS50D-PBD Pale Blue Denim pasek do gitary", "Music > Instruments > Guitar Accessories > Guitar Straps"],
  ["Books & Media", "Terminator Genisys Arnold Schwarzenegger Clarke 4K", "Movies & TV > Blu-ray"],
  ["Books & Media", "Littlest Pet Shop Książka do wyklejania Kd", "Books > Children's Books"],
  ["Books & Media", "Iggy Pop TV Eye 1977 Live CD Nowa", "Music > CDs"],
  ["Books & Media", "Sonor HS 2000 S Drum Hardware Stand Set", "Music > Instruments > Drums & Percussion > Stands"],
  ["Books & Media", "Diagnoza psychiatryczna", "Books > Education & Reference"],
  ["Health & Wellness", "Elgydium Junior Płyn Do Płukania Dla Dzieci 500ml", "Oral Hygiene > Mouthwash"],
  ["Fashion", "Brocchi Travel Toiletry Bag Black", "Bags & Luggage > Toiletry Bags"],
  ["Arts, Crafts & Sewing", "Sznurek do makramy bawełniany denim 2mm 60m", "Crafts & Creative DIY"],
  ["Arts, Crafts & Sewing", "Diy Zestaw Koralików Do Robienia Bransoletek", "Crafts & Creative DIY > Beads & Jewelry Making > Bead Kits"],
  ["Electronics", "Anker Prime Wireless Charging Station 3-in-1 MagGo AirCool Foldable", "Phones & Tablets > Wireless Chargers"],
  ["Electronics", "Pilot do Tv Thomson RC802N Smart Netflix", "TV & Home Theater > Remote Controls"],
  ["Electronics", "Uchwyt Na Tablet Telefon Do Dji Phantom 2 3 Se", "Cameras & Photography > Camera Accessories"],
  ["Office & Technology", "Notatnik Passion Journal Baby Moleskine L", "Office Supplies > Desk Accessories"],
  ["Toys & Games", "Secret Life of Pets 3D Game Snakes and Ladders Gra", "Board Games & Puzzles > Board Games"],
  ["Beauty", "Dedcool Madonna Lilly Black Pepper Sandalwood Bergamot 1.7Oz", "Fragrances & Perfumes"],
  ["Beauty", "Andis Cool Care Plus 5-In-1 Clipper Blade Cleaner And Lubricant 15.5Oz", "Hair Care > Hair Styling Tools"],
  ["Beauty", "Woodys Beard And Tattoo Oil 1Oz", "Skincare > Body Skincare"],
  ["Industrial & Scientific", "8×8×1/8インチ レーザー彫刻機用光沢カラーアクリル板", "3D Printing & Additive Manufacturing > Laser Engraving Materials"],
  ["Industrial & Scientific", "CR-Wood - wood", "3D Printing & Additive Manufacturing > 3D Printer Filament"],
  ["Home & Living", "Aeriscape Baskets imprimées en 3D Black 35", "Home Décor > Decorative Objects"],
  ["Sports", "Bielizna termoaktywna chłodząca Viking Nessa Coolmax Set L Komplet", "Sports Apparel > Sports Clothing"],
  ["Sports", "Mata do jogi ćwiczeń antypoślizgowa Reebok 7 mm", "Fitness & Gym > Yoga & Pilates > Yoga Mats"],
  ["Sports", "Outdoor Voices Brown the Exercise Dress Xs Saddle", "Sports Apparel > Sports Clothing"],
  ["Books & Media", "Mało lat mam, a czytam sam. 616 naklejek. Część 1", "Books > Children's Books"],
  ["Books & Media", "Diagnoza psychiatryczna", "Books > Education & Reference"],
  ["Books & Media", "New Language Leader Upper-Intermediate MyEnglishLab", "Books > Education & Reference"],
  ["Health & Wellness", "VITALBEAUTIE Energy Shot Body&Brain 28days", "Nutrition > Vitamins, Minerals & Supplements > Energy & Focus"],
  ["Health & Wellness", "VITALBEAUTIE Super Collagen Liftshot 28ea", "Nutrition > Vitamins, Minerals & Supplements > Collagen Supplements"],
  ["Sports", "Wykrywacz Xp Orx Rc Hf 9,5x5 DD 13-81kHz", "Hunting > Metal Detectors"],
  ["Books & Media", "Ibanez DCS50D-PBD Pale Blue Denim pasek do gitary", "Music > Instruments > Guitar Accessories > Guitar Straps"],
  ["Sports", "Helikon Competition Utility Pouch Olive", "Hunting > Tactical Gear & Accessories"],
  ["Arts, Crafts & Sewing", "Pudełko Niespodzianka Exploding Box Diy Album", "Crafts & Creative DIY > Paper Crafts > Scrapbooking"],
  ["Arts, Crafts & Sewing", "Drucik aluminiowy Złoty drut 1,2mm 5m Diy", "Crafts & Creative DIY > Beads & Jewelry Making > Craft Wire"],
  ["Arts, Crafts & Sewing", "Kreatywny zestaw Koralików Diy do Bransoletek", "Crafts & Creative DIY > Beads & Jewelry Making > Bead Kits"],
  ["Electronics", "Anker Prime Wireless Charging Station 3-in-1 MagGo AirCool Foldable", "Phones & Tablets > Wireless Chargers"],
  ["Automotive", "Rexing Type-C GPS Logger Add-On for Type-C Charger", "Vehicle Electronics > GPS & Navigation"],
  ["Automotive", "Rexing Type-C Smart Hardwire Kit with GPS for R4 L4 RH2", "Vehicle Electronics > Dash Cameras"],
  ["Beauty", "Crickle Daisy Bloom Baby Bloom Powder Brush Lavender Scent 1.4Oz", "Makeup > Makeup Tools & Accessories > Makeup Brushes"],
  ["Home & Living", "Słoik 100ML Pet Z Nakrętką Aluminiową Słoiczek Pudełko", "Kitchen & Dining > Food Storage"],
  ["Toys & Games", "Secret Life of Pets 3D Game Snakes and Ladders Gra", "Board Games & Puzzles > Board Games"],
  ["Sports", "Pellet 2mm Truskawka 1kg Method Feeder Optimal Baits", "Fishing > Baits & Lures"],
  ["Health & Wellness", "Etafor Plus Massage Gun", "Wellness > Massage & Relaxation > Massage Guns"],
  ["Health & Wellness", "VITALBEAUTIE MetaGreen Booster Shot 7days x 4 boxes", "Nutrition > Weight Management"],
  ["Health & Wellness", "VITALBEAUTIE Super Retinol 30days", "Nutrition > Vitamins, Minerals & Supplements > Skin Health"],
  ["Health & Wellness", "Ds Laboratories Revita.sod Tablets For Stress Related Hair Loss 30Ct", "Hair Care > Hair Health & Treatments > Hair Loss Treatments"],
  ["Fashion", "Shone 001-002 - White - Eu28", "Shoes > Kids' Shoes"],
  ["Beauty", "Color Wow Root Cover Up Medium Brown 0.07Oz", "Hair Care > Hair Color"],
  ["Fashion", "Marella Sport Sonale Knitted Coat-Jacket In Blue Jeans", "Women's Clothing > Jackets & Coats"],
  ["Sports", "Champion The Authentic Sports Bra In White Xs", "Sports Apparel > Sports Clothing"],
  ["Sports", "Legginsy bezszwowe wysoki stan beżowe Xs Carpatree", "Sports Apparel > Sports Clothing"],
  ["Books & Media", "Zabawy manualne 2-latka Love Books", "Books > Children's Books"],
  ["Books & Media", "Amici d'Italia 3 libro dello studente podręcznik", "Books > Education & Reference"],
  ["Books & Media", "Pop Jr Tv songs CD+DVD Nowa Piosenki z bajek", "Music > CDs"],
  ["Books & Media", "Azuli Presents Miami 2002 David Piccioni 2xCD Nowa", "Music > CDs"],
  ["Electronics", "Zasilacz Antenowy 12V Wzmacniacz DVB-T2 Do Tv Naziemnej", "TV & Home Theater > Antennas & Accessories"],
  ["Automotive", "Rexing L4 Series 4-Channel Dash Cams with Ultra-Wide Angle", "Vehicle Electronics > Dash Cameras"],
  ["Babies", "Cherry Baby Perfume 2.5 oz.", "Hygiene & Wellness > Baby Fragrances"],
  ["Babies", "Tweezerman Baby Manicure Kit 4Pcs", "Hygiene & Wellness > Baby Grooming"],
  ["Beauty", "MAC Hyper Real Glow Palette Glow Baby Glow", "Makeup > Face Makeup"],
  ["Home & Living", "Butelka Pet 200ml z dozownikiem czarnym", "Kitchen & Dining > Drinkware"],
  ["Home & Living", "Zestaw do dekoracji na Święta świąteczny Diy", "Home Décor > Seasonal Decor"],
  ["Toys & Games", "Jigapix Pets Nowa Nintendo DS", "Video Games > Video Games > Nintendo DS"],
  ["Beauty", "Invisibobble Power The Strong Grip Hair Ring", "Hair Care > Hair Styling Accessories"],
  ["Beauty", "Goody Fabric Headwraps Assorted Colors 6Ct", "Hair Care > Hair Styling Accessories"],
  ["Beauty", "Moraz J And M Herbal Massage Ointment 1.7Oz", "Skincare > Body Skincare"],
  ["Beauty", "TWO SLASH FOUR Glaze Lip Changer Nu Ginger", "Makeup > Lip Makeup"],
  ["Beauty", "TWO SLASH FOUR Strobing Face Cube 2 Purple", "Makeup > Face Makeup"],
  ["Sports", "Koa+Roy Fitness Cube 2.8Oz", "Sports Medicine > Therapy & Rehabilitation > Muscle Recovery"],
  ["Sports", "Rexing B1 (Black) Night Vision Goggles Binoculars", "Hunting > Outdoor Optics > Night Vision"],
  ["Health & Wellness", "Medisept Velox Spray 5 L Tea Tonic", "Home Cleaning & Care > Disinfectants"],
  ["Health & Wellness", "Demoxoft Płyn do oczyszczania powiek na świąd i podrażnienie 100 ml", "Eye Care > Eyelid Cleansers"],
  ["Health & Wellness", "Colgate Plax płyn do płukania jamy ustnej 3x500 ml", "Oral Hygiene > Mouthwash"],
  ["Electronics", "Satel Perfecta 16 LTE Alarm Bezprzewodowy", "Smart Home > Sensors & Alarms"],
  ["Automotive", "Rexing Adhesive Mount for V2 Pro AI", "Vehicle Electronics > Dash Cameras"],
  ["Automotive", "Rexing Type-C GPS Module 115200 Baud", "Vehicle Electronics > GPS & Navigation"],
  ["Fashion", "ISEE HAIR Wear Go Highlight Brown Wigs Silky Straight Pre-plucked Glueless Lace Wigs", "Accessories > Wigs & Hair Extensions"],
  ["Books & Media", "Kenia Podróże z pasją Rough Guides", "Books > Travel & Geography"],
  ["Arts, Crafts & Sewing", "Papier scrapbookingu P13 The Garden of Books", "Crafts & Creative DIY > Paper Crafts > Scrapbooking"],
  ["Books & Media", "Littlest Pet Shop Jak w kołowrotku Koloruj czytaj", "Books > Children's Books"],
  ["Babies", "Mustela Vitamin Barrier Cream For Baby - 3.8Oz", "Hygiene & Wellness > Baby Skin Care"],
  ["Home & Living", "Vitajuwel Via Heat Tea Strainer", "Kitchen & Dining > Drinkware"],
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
