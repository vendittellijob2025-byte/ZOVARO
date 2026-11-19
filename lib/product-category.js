const RULES = [
  ["Beauty", /\b(perfume|parfum|fragrance|eau de toilette|eau de parfum|eau de perfum|eau d ambiance|cologne|aftershave|cosmetic|cosmetics|make[- ]?up|lipstick|lip ?colour|lip ?colors?|lip ?gloss|lip ?liner|lip ?balms?|lip ?polish|lip ?oil|lip ?stain|lip ?twist|gloss[- ]to[- ]balm|mascara|foundation|concealer|blush|eyeshadows?|eye shadow|eyeliner|eye liner|eye pencil|kohl|brow pencil|eyebrow pencil|brow powder|brow gel|brow creation gel|face palette|eyes? palette|makeup palette|luxury palette|face masks?|mud masks?|sheet masks?|eye masks?|under eye masks?|facial|face wash|face cleanser|cleanser|cleansing balm|cleansing oil|cleansing gel|micellar water|makeup remover|skincare|skin care|skin health|moisturi[sz](?:e|er|ing|ation)|face cream|face creme|night cream|night creme|eye cream|eye creme|eye contour|eye balm|eye gels?|hand cream|hand creme|body cream|body creme|body butter|massage cream|olive oil hair|olive oil formula|hair scalp oil|hair and scalp oil|face powder|setting powder|contour powder|serum|toner|sunscreen|spf|bb cream|beauty|seed oil|hairbrush|hair brush|hair straightening brush|hair straightener|hot comb|straightener brush|body scrub|shower scrub|bath teas?|bath soak|bath salts|bath body|microcurrent|facial toning|toning device|facial device|uv led lamp|nail lamp|after sun|cool down lotion|sun care|sun belt|self tan|tanning|whitening strips|teeth whitening|tooth whitening|masque|face massage|exfoliat(?:ing|or|ion)|exfoliant|nail polish|nail varnish|nail enamel|nail care|shampoo|conditioner|hair dye|hair masque|hair mask|treatment masks?|hair treatment|hair spray|hair gel|hair serum|hair oil|hair food|body lotion|body wash|body polish|shower gel|shower foam|deodorant|soap|essential oil|bath bombs?|bath and body|travel kit|travel size|travel starter set|travel minis|travel exclusive|travel and glow|travel glow kit|travel trio|travel duo|travel collection|travel hair kit|travel mirror|holiday collection|holiday pouch|set holiday|sets holiday|colonia|holiday kits?|holiday sets?|holiday essentials|holiday trio|full face holiday set|lip sleeping masks?|body mist|hair and body mist|gua sha|face roller|derma roller|makeup brush|cosmetic brush|blender brush|profumo|profumi|cosmetico|cosmetici|cosmetica|trucco|rossetto|crema viso|crema corpo|siero|detergente viso|protezione solare|smalto|balsamo|dopobarba|belleza|maquillaje|crema facial|protector solar)\b/i],
  ["Health & Wellness", /\b(health|wellness|medical|first aid|medical device|mobility aid|vitamins?|supplements?|capsules?|tablets?|thermometer|blood pressure|glucose monitor|pulse oximeter|whey protein|protein powder|creatine|pre workout|post workout|electrolyte|amino acid|probiotic|omega[- ]?3|fish oil|multivitamin|mosquito repellent|insect repellent|repellent patches|scar gel|immune support|stress related hair loss|salute|benessere|medicale|salud|bienestar)\b/i],
  ["Electronics", /\b(digital camera|camera|dslr|mirrorless|action camera|camcorder|webcam|camera lens|photographic|photography|photo camera|macchina fotografica|fotocamera|obiettivo fotografico|videocamera|action cam|smartphone|mobile phone|cell phone|i ?phone|i phone|android phone|samsung galaxy [sza mf]?\d*|galaxy tab|google pixel|pixel phone|tablet computer|tablet pc|i ?pad|ipad|power bank|portable charger|battery pack|wireless power bank|laptop|notebook|mac ?book|chromebook|ultrabook|desktop computer|desktop pc|pc desktop|all[- ]in[- ]one pc|mini pc|workstation|gaming pc|graphics card|gpu|processor|cpu|motherboard|ssd|hard drive|ram memory|pc component|computer|monitor|television|tv|headphones|earbuds|speaker|audio|drone|projector|printer|keyboard|computer mouse|electronics|electronic|memory card|micro sd|microsd[a-z]*|sd card|monocular|night vision|dash cam|dashcam|baby monitor|carplay|car play|android auto adapter|gps logger|wireless charging station|hardwire kit|hardwire|c[aá]mara digital|c[aá]mara|tel[eé]fono m[oó]vil|ordenador|auriculares)\b/i],
  ["Automotive", /\b(automotive|automobile|car parts|car part|replacement parts|vehicle|car accessories|auto parts|tire|tyre|wheel rim|alloy wheel|steel wheel|side mirror|wing mirror|brake pad|brake disc|car mount|car charger|car air freshener|suction cup mount|camera mount|dash cam mount|motorcycle parts|motorbike accessories|ricambi auto|accessori auto|motocicletta|autom[oó]vil|repuestos de coche)\b/i],
  ["Sports", /\b(sport|sports|fitness|padel|tennis|soccer cleats|soccer boots|football boots|football cleats|racket|racquet|overgrips?|golf|gym|cycling|bicycle|bike|yoga mat|athletic|exercise|running|yoga|palestra|ciclismo|deporte|deportes|raqueta)\b/i],
  ["Fashion", /\b(swimwear|swimsuit|swim suit|bikini|tankini|cover[- ]?up|clothing|apparel|footwear|shoes|sneakers|mules?|sandals?|boots?|heels?|handbag|wallet|purse|backpack|jewelry|garment|dress|shirt|t[- ]?shirt|trousers|pants|jeans|denim|jacket|robe|fashion accessory|wig|wigs|human hair|virgin hair|loose wave|body wave|straight hair|hair bundles|hair weave|lace closure|lace frontal|hair extensions|hairpiece|hair piece|hair tie|scrunchie|sunglasses|eyewear|tote bag|travel bag|toiletry bag|satchel|vacation top|hair loop|pouch|water wave|no baby hair|pre cut lace|clip in|bangs|temples|camiseta|sudadera|falda|pantal[oó]n|chaqueta|abbigliamento|scarpe|vestito|borsa|gioielli|ropa|calzado|vestido|bolso|peluca)\b/i],
  ["Toys & Games", /\b(toy|toys|board game|puzzle|doll|action figure|building blocks|lego|playset|stuffed animal|plush toy|video game|gaming|giocattolo|giocattoli|gioco da tavolo|bambola|pupazzo|juguete|juguetes|muñeca|rompecabezas)\b/i],
  ["Babies", /\b(baby|babies|infant|newborn|nursery|diaper|nappy|toddler|stroller|pushchair|car seat|sleep sack|pannolino|passeggino|neonato|prima infanzia|beb[eé]|reci[eé]n nacido|cochecito)\b/i],
  ["Pets", /\b(pet|pets|pet food|dog|cat|feline|canine|cat litter|pet carrier|pet shampoo|pet spray|pet bed|aquarium|bird cage|guinzaglio|crocchette|lettiera|mascota|perro|gato)\b/i],
  ["Appliances", /\b(appliance|appliances|refrigerator|fridge|washing machine|dishwasher|microwave oven|air fryer|vacuum cleaner|air conditioner|coffee machine|espresso machine|portable blender|kitchen blender|smoothie blender|toaster|elettrodomestici|frigorifero|lavatrice|lavastoviglie|aspirapolvere|electrodom[eé]sticos)\b/i],
  ["Tools & DIY", /\b(power tool|drill|saw|wrench|screwdriver|hardware|diy|home improvement|tool set|socket set|utensili|trapano|attrezzi|herramientas|taladro)\b/i],
  ["Books & Media", /\b(book|books|ebook|e-book|magazine|newspaper|ratgeber|guide|guides|dvd|blu[- ]?ray|music cd|vinyl record|libro|libri|rivista|libro digital|revista)\b/i],
  ["Food & Grocery", /\b(grocery|groceries|coffee beans|ground coffee|instant coffee|tea leaves|tea bags|loose leaf tea|milk tea|matcha|coffee pods|coffee capsules|snack|beverage|olive oil|pasta|whipped honey|raw honey|honey gift set|honey jar|honey sticks|honey syrup|honeycomb|chocolate bar|chocolate candy|cocoa powder|alimentari|cibo|bevande|caff[eè]|alimentos|comida|bebida)\b/i],
  ["Garden", /\b(gardening|lawn|horticulture|garden hose|garden tools|garden supplies|garden planter|houseplant|flower seeds|vegetable seeds|tomato seeds|herb seeds|grass seed|seed packets|fertilizer|potting soil|watering|planter|flower pot|giardinaggio|jardiner[ií]a)\b/i],
  ["Home & Living", /\b(furniture|kitchenware|cookware|bakeware|pots and pans|cutlery|kitchen|table lamp|floor lamp|desk lamp|bedside lamp|wall lamp|coffee mug|mug|tea strainer|strainer|bedding|duvet|pillow|home decor|decorative|homeware|household|scented candle|candle|diffuser|office chair|desk|dining table|sofa|couch|bed frame|shelf|bookcase|arredamento|cucina|mobili|tazza|casa|hogar|muebles|ropa de cama)\b/i],
  ["Travel", /\b(travel|luggage|suitcase|carry[- ]on|travel bag|airline|hotel|holiday|vacation|passport holder|valigia|bagaglio|borsa da viaggio|accessori viaggio|viaje|maleta|equipaje)\b/i],
  ["Office & Technology", /\b(software|stationery|office supplies|computer program|password manager|ad ?blocker|adblocker|pc fresh|file cryptor|filecryptor|defragment|festplatte|registry cleaner|media downloader|mediatheken downloader|downloader|antibrowser|privacyfix|startupstar|backup software|windows utility|windows software|file recovery|dateien verschlüsseln|informatica|ufficio|papeler[ií]a|material de oficina)\b/i]
];

const ADVERTISER_RULES = [
  ["Beauty", /\b(beauty|cosmetic|cosmetics|ecosmetics|fragrance|perfume)\b/i],
  ["Electronics", /\b(electronic|camera|photography|computer|technology|rexing)\b/i],
  ["Babies", /\b(baby|babies|infant|kaiya baby)\b/i],
  ["Pets", /\b(pet|pets)\b/i],
  ["Automotive", /\b(automotive|automobile|car parts|car part|replacement parts|vehicle|car accessories|auto parts|tire|tyre|wheel rim|alloy wheel|steel wheel|side mirror|wing mirror|brake pad|brake disc|car mount|car charger|car air freshener|suction cup mount|camera mount|dash cam mount|motorcycle parts|motorbike accessories|ricambi auto|accessori auto|motocicletta|autom[oó]vil|repuestos de coche)\b/i],
  ["Sports", /\b(sport|sports|fitness|padel|tennis)\b/i],
  ["Travel", /\b(travel|luggage|airline|hotel|holiday)\b/i],
  ["Fashion", /\b(fashion|clothing|apparel)\b/i],
  ["Home & Living", /\b(home|living|furniture|kitchen)\b/i],
  ["Office & Technology", /\b(office|software|technology|abelssoft)\b/i]
];

const SERVICE_TITLE = /\b(installation service|setup service|repair service|professional service|service fee)\b/i;
const LUXURY_ASSET_TITLE = /\b(private jet|business jet|private aircraft|executive aircraft|private helicopter|superyacht|luxury yacht|megayacht|yacht charter|luxury boat|private island|castle|chateau|historic palace|exclusive villa|private villa|ultra[- ]luxury villa|luxury penthouse|luxury estate|limousine|stretch limousine|supercar|hypercar|patek philippe|rolex|audemars piguet|richard mille|vacheron constantin|fine art|original painting|original oil painting|oil painting|fine art painting|collector artwork|art collection|antique masterpiece)\b/i;

const LUXURY_CAR_BRAND_TITLE = /\b(ferrari|lamborghini|porsche|rolls[- ]?royce|bentley|bugatti|aston martin|mc ?laren|hummer)\b/i;
const LUXURY_CAR_MODEL_TITLE = /\b(ferrari\s+(?:296|sf90|812|roma|purosangue|488|458)|lamborghini\s+(?:revuelto|urus|huracan|aventador|gallardo)|porsche\s+(?:911|taycan|panamera|cayenne|macan|718)|rolls[- ]?royce\s+(?:phantom|ghost|cullinan|spectre)|bentley\s+(?:continental|flying spur|bentayga|mulsanne)|bugatti\s+(?:chiron|veyron|tourbillon)|aston martin\s+(?:db\d+|vantage|dbx)|mc ?laren\s+(?:720|750|artura|765|gt)|hummer\s+(?:h1|h2|h3|ev))\b/i;
const LUXURY_CAR_CONTEXT_TITLE = /\b(car|vehicle|suv|coupe|roadster|sports car|supercar|hypercar|rental|for sale|chauffeur|limousine)\b/i;
const LUXURY_NON_VEHICLE_TITLE = /\b(model|diecast|scale|toy|miniature|1:\d+|dvd|blu[- ]?ray|movie|film|book|novel|cologne|perfume|fragrance)\b/i;
const SCALE_MODEL_TITLE = /\b(scale model|die[- ]?cast|model car|model vehicle|model ship|model aircraft|maisto|burago|bburago|hot wheels|matchbox|1\s+\d{1,3})\b/i;
const HOME_DECOR_TITLE = /\b(candle|diffuser)\b/i;
const BABY_APPAREL_SIZE_TITLE = /\b(newborn|\d{1,2}\s*[-–]\s*\d{1,2}\s*(?:m|months?)|\d{1,2}\s*(?:m|months?))\b/i;
const PAPER_NOTEBOOK_TITLE = /\b(?:a[345]|paper|spiral|ruled|lined|exercise|school)\s+notebooks?\b|\bnotebooks?\s+(?:and\s+)?stationery\b/i;
const BEAUTY_PRODUCT_TITLE = /\b(body mist|body spray|hair dryer|travel dryer|hair regimen|curling iron|curling wand|false eyelashes|false lash(?:es)?|eyelashes|lash tint|lace tint|makeup bag|cosmetic bag)\b/i;
const MAKEUP_ITEM_TITLE = /\b(lipstick|lip stick|liquid lip|lip gloss|lip liner|lip balm|lip oil|lip stain|lip color|lip colour|lip tint|mascara|foundation|concealer|blush|eyeshadow|eye shadow|eyeliner|eye liner|kohl|brow pencil|eyebrow pencil|makeup|make up|cosmetic|cosmetics|nail polish|nail varnish|nail enamel|false eyelashes|false lashes|eyelashes|beauty blender|makeup brush|cosmetic brush|face palette|eye palette)\b/i;
const COSMETIC_ITEM_TITLE = /\b(lipstick|lip stick|lip gloss|lip liner|lip balm|lip oil|lip stain|mascara|foundation|concealer|blush|eyeshadow|eye shadow|eyeliner|eye liner|kohl|brow pencil|eyebrow pencil|makeup|make up|cosmetic|cosmetics|nail polish|nail varnish|nail enamel|false eyelashes|false lashes|eyelashes|beauty blender|makeup brush|cosmetic brush|face palette|eye palette|skin care|skincare|face cream|facial cream|face moisturizer|facial moisturizer|moisturizer|moisturiser|serum|toner|sunscreen|spf|micellar water|makeup remover|face cleanser|facial cleanser|eye cream|night cream|body lotion|body butter|body cream|hand cream|perfume|fragrance|eau de parfum|eau de toilette)\b/i;
const FASHION_ACCESSORY_TITLE = /\b(tote bag|toiletry bag|travel bag|hair loop|satchel|vacation top|earrings?|stud earrings?|jewell?ery|sleep bonnet|hair bonnet|headwrap)\b/i;
const TRAVEL_BEAUTY_TITLE = /\b(travel (?:set|spray|lotion|kit|trio|duo|hair regimen|dryer|must haves|selection|gift set)|travel friendly (?:ipl|hair removal)|travel system kit)\b/i;
const TRAVEL_HEALTH_TITLE = /\btravel well patch\b/i;
const BABY_CARE_TITLE = /\b(baby (?:wash|shampoo|lotion|cream|oil|butter|balm|wipes|massage oil|massage|sunscreen|sun cream|perfume|fragrance)|(?:eau de toilette|eau de parfum|perfume|fragrance) for baby|diaper rash|for baby)\b/i;
const HAIR_APPAREL_TITLE = /\b(wig|human hair|virgin hair|remy hair|peruvian hair|malaysian hair|loose wave|body wave|straight hair|hair bundles|bundles deal|hair weave|lace closure|lace frontal|hair extensions|hairpiece|hair piece|water wave|no baby hair|pre cut lace|clip in|bangs|temples)\b/i;
const FASHION_FOOTWEAR_TITLE = /\b(footwear|shoes?|sneakers?|trainers?|boots?|sandals?|heels?|flats?|slippers?|loafers?|moccasins?|cleats?|zapatillas?|calzado|scarpe|stivali|sandali)\b/i;
const PET_PRODUCT_TITLE = /\b(?:dog|cat|puppy|kitten|feline|canine)\b.*\b(?:toy|toys|food|treats?|chews?|collars?|leashes?|harnesses?|beds?|carriers?|litter|shampoo|grooming|bowls?|feeders?|scratchers?|crates?|cages?)\b|\b(?:toy|toys|food|treats?|chews?|collars?|leashes?|harnesses?|beds?|carriers?|litter|shampoo|grooming|bowls?|feeders?|scratchers?|crates?|cages?)\b.*\b(?:dog|cat|puppy|kitten|feline|canine)\b/i;
const BABY_SHOE_TITLE = /\b(?:baby|infant|newborn|toddler|pre[- ]walker)(?:'s)?\s+(?:(?:boy|girl)\s+)?(?:first\s+)?(?:shoes?|footwear|sneakers?|boots?|sandals?|slippers?)\b|\b(?:shoes?|footwear|sneakers?|boots?|sandals?|slippers?)\s+(?:for\s+)?(?:baby|infant|newborn|toddler)s?\b/i;
const RUNNING_ACCESSORY_TITLE = /\\b(running armband|running arm band|armband for running|phone armband|running phone holder)\\b/i;
const SPORTS_FOOTWEAR_TITLE = /(?=.*\b(running|trail|hiking|soccer|football|basketball|tennis|padel|volleyball|cycling|bike|athletic|sports?|court|golf|cricket|track|gym|training|skate|skating)\b)(?=.*\b(shoes?|sneakers?|trainers?|boots?|cleats?|footwear|spikes?)\b)/i;
const FOOTWEAR_ACCESSORY_TITLE = /\b(shoe rack|shoe storage|shoe organizer|shoe cabinet|shoe cleaner|shoe polish|shoe brush|shoe travel bag|shoe carrying bag|shoe bag|shoe horn|shoe stretcher|shoe laces?|shoelaces?)\b/i;
const SHOE_STORAGE_TITLE = /\b(shoe rack|shoe storage|shoe organizer|shoe cabinet)\b/i;
const SHOE_CARE_TITLE = /\b(shoe cleaner|shoe polish|shoe brush|shoe horn|shoe stretcher|shoe laces?|shoelaces?)\b/i;
const SHOE_BAG_TITLE = /\b(?:shoe travel bag|shoe carrying bag|shoe bag)\b/i;

function textOf(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .toLowerCase()
    .trim();
}

function matchRule(text, rules) {
  for (const [category, pattern] of rules) {
    if (pattern.test(text)) return category;
  }
  return null;
}

// Descriptions are supporting evidence, not a source of broad keyword guesses.
// Accept a description-derived category only when its product-type language
// points to exactly one top-level category.
function uniqueDescriptionCategory(text, rules) {
  const matches = new Set();
  for (const [category, pattern] of rules) {
    if (pattern.test(text)) matches.add(category);
    if (matches.size > 1) return null;
  }
  return matches.size === 1 ? [...matches][0] : null;
}


const AUTOMOTIVE_VEHICLE_TITLE = /\b(used cars? for sale|new cars? for sale|cars? for sale|vehicle listings?|vehicles? for sale|car dealership|automotive dealership|sedan for sale|suv for sale|pickup truck for sale|electric car for sale)\b/i;
const AUTOMOTIVE_PARTS_TITLE = /\b(side mirror|wing mirror|rear view mirror|brake pad|brake disc|brake rotor|alternator|starter motor|spark plug|throttle body|electronic throttle body|oil filter|air filter|fuel filter|timing belt|serpentine belt|shock absorber|strut|suspension arm|control arm|radiator|water pump|fuel pump|clutch kit|transmission|exhaust pipe|intake manifold|wheel spacer|lug nuts?|downpipe|muffler|catalytic converter|headlight|tail light|taillight|turn signal|windshield wiper|wiper blade|bumper|fender|hood|grille|car battery|automotive battery|steering wheel cover|car charger|car mount|dash cam|carplay|motorcycle part|motorbike part|ricambi auto|pneumatic[oi]|cerchio in lega|specchietto|pastiglie freno|filtro olio|filtro aria|faro auto|tergicristallo|batteria auto|paraurti|cofano|frizione)\b/i;
const AUTOMOTIVE_ACCESSORY_TITLE = /\b(car accessory|auto accessory|vehicle accessory|car accessories|auto accessories|vehicle accessories|car interior|car organizer|car vacuum|car cover|car seat cover|floor mats?|steering wheel cover|roof rack|roof box|bike rack|car phone holder|car cup holder|seat cushion|trunk organizer|boot liner|carpet mat|car fragrance|car air freshener|gps navigation|sat nav|parking sensor|reverse camera|backup camera|tire inflator|tyre inflator|jump starter|emergency kit|car tool kit|automotive accessory|accessori auto|accessorio auto)\b/i;
const AUTOMOTIVE_CARE_TITLE = /\b(car wash|car shampoo|car wax|car polish|car detailing|car cleaner|interior cleaner|wheel cleaner|tire shine|tyre shine|engine oil|motor oil|brake fluid|coolant|antifreeze|transmission fluid|car care|automotive paint|car touch up paint|lavaggio auto|olio motore|liquido freni)\b/i;

const REPAIR_SERVICE_TITLE = /\b(repair service|device repair|appliance repair|phone repair|computer repair|refurbishment service|reconditioning service|electronics recycling|trade[- ]?in|buyback)\b/i;
const SPECIAL_CATEGORY_RULES = [
  ["Accessible & Adaptive Living", /\b(wheelchair|mobility scooter|rollator|walker|walking frame|walking aid|crutches|hearing aid|braille|accessible bathroom|bath transfer bench|shower chair|grab bar|raised toilet seat|lift chair|adaptive utensil|daily living aid|reachers?|reacher tool|stair lift)\b/i],
  ["Arts, Crafts & Sewing", /\b(beads?|beading|decoupage|sewing machine|sewing kit|sewing pattern|sewing fabric|fabric by the yard|fabric bolt|fabric bundle|embroidery|crochet|knitting|yarn|quilting|scrapbooking|craft kit|craft supplies|art supplies|paint set|paint brush|wooden balls|raw decoupage|stencil|needlework|jewelry making)\b/i],
  ["Business, Wholesale & Bulk Supply", /\b(wholesale|bulk supply|bulk order|business supplies|commercial supplies|retail supplies|hospitality supplies|packaging supplies|shipping supplies|pallet quantity|case pack|b2b supplies)\b/i],
  ["Energy, Solar & Electric Mobility", /\b(solar panel|solar generator|solar inverter|solar power|portable power station|power station|home battery storage|battery storage system|energy storage|ev charger|electric vehicle charger|electric bike|e[- ]bike|electric scooter|electric mobility|charge controller|off grid solar)\b/i],
  ["Food Delivery & Restaurant Orders", /\b(food delivery|restaurant delivery|meal delivery|meal kit|prepared meals|takeaway|take out|order online food|grocery delivery|supermarket delivery|catering order|restaurant voucher)\b/i],
  ["Gaming", /\b(gaming console|video game|video games|playstation|play station|ps5|ps4|xbox|nintendo switch|steam deck|gaming pc|gaming laptop|gaming headset|gaming keyboard|gaming mouse|game controller|gaming chair|vr gaming|virtual reality game)\b/i],
  ["Industrial & Scientific", /\b(3d printer|3d printing|3d printer enclosure|laboratory|lab equipment|microscope|centrifuge|spectrometer|scientific instrument|industrial machinery|industrial pump|calibration equipment|measurement instrument|test instrument|lab consumable|commercial catering equipment|personal protective equipment|workwear|industrial tool)\b/i],
  ["Musical Instruments & Studio", /\b(guitar|electric guitar|acoustic guitar|bass guitar|piano|digital piano|keyboard instrument|synthesizer|drum kit|percussion|violin|ukulele|saxophone|trumpet|midi controller|audio interface|studio monitor|recording studio|dj controller|musical instrument|music stand|guitar amplifier)\b/i],
  ["Real Estate", /\b(real estate|property for sale|property for rent|apartment for rent|apartment for sale|house for sale|house for rent|villa for sale|villa for rent|land for sale|commercial property|residential property|castle for sale|private island for sale|property listing)\b/i],
  ["Refurbished, Pre-Owned & Outlet", /\b(refurbished|certified refurbished|renewed|pre[- ]owned|second[- ]hand|used (?:laptop|computer|phone|camera|watch|jewelry|jewellery|car|vehicle)|open box|reconditioned|recertified|factory refurbished|outlet clearance)\b/i],
  ["Repair & Circular Economy", /\b(repair service|device repair|appliance repair|phone repair|computer repair|refurbishment service|reconditioning service|electronics recycling|trade[- ]?in|buyback|repair kit|screen replacement kit|recycling programme)\b/i],
  ["Security & Safety", /\b(security camera|surveillance camera|cctv|home alarm|intruder alarm|burglar alarm|smart doorbell|smart lock|access control|smoke detector|carbon monoxide detector|fire extinguisher|fire alarm|security safe|personal alarm|safety harness|protective equipment|workplace safety)\b/i],
  ["Luxury & Prestige", /\b(luxury watch|fine watch|rolex|patek philippe|audemars piguet|richard mille|cartier|van cleef|fine jewelry|fine jewellery|diamond necklace|diamond ring|diamond earrings|gold diamond|999\.9 gold|luxury car|hypercar|supercar|private jet|private helicopter|superyacht|yacht charter|luxury villa|luxury property|fine art|rare collectible|limited edition art|designer luxury)\b/i],
  ["TVs & Home Cinema", /\b(television|smart tv|oled tv|qled tv|4k tv|8k tv|projector|projector screen|home cinema|home theater|home theatre|soundbar|av receiver|surround sound|tv stand|tv mount|streaming device)\b/i]
];

export function subcategoryFor(category, product = {}) {
  const title = textOf([product?.title, product?.englishTitle, product?.name, product?.brand].join(" "));
  const evidence = textOf([product?.productType, product?.googleProductCategory, product?.sourceCategory].join(" "));
  const merchantName = textOf(product?.advertiserName || "");
  const text = title + " " + evidence;

  if (category === "Home & Living" && SHOE_STORAGE_TITLE.test(text)) return "Storage & Organization";
  if (category === "Fashion" && SHOE_CARE_TITLE.test(text)) return "Accessories";
  if (category === "Fashion" && SHOE_BAG_TITLE.test(text)) return "Bags & Luggage";
  if (category === "Beauty" && HAIR_APPAREL_TITLE.test(text)) return "Hair Care > Wigs & Hair Extensions";

  if (category === "Babies" && BABY_SHOE_TITLE.test(text) && !FOOTWEAR_ACCESSORY_TITLE.test(text)) {
    if (/pre[- ]walker/.test(text)) return "Baby Shoes > Pre-Walker Shoes";
    if (/soft sole/.test(text)) return "Baby Shoes > Soft Sole Shoes";
    return "Baby Shoes";
  }

  if (category === "Sports" && RUNNING_ACCESSORY_TITLE.test(text)) return "Running";
  if (category === "Sports" && !/padel iberico/.test(merchantName) && SPORTS_FOOTWEAR_TITLE.test(text)) {
    if (/\b(tennis|court)\b/i.test(text)) return "Tennis > Tennis Shoes";
    if (/\b(running|trail)\b/i.test(text)) return "Running > Running Shoes";
    return "Sports Apparel > Sports Footwear";
  }

  // Kaiya Baby's joined feed is a specialist infant-clothing catalogue.
  // Give its sleep sacks and clothing explicit Amazon-style browse paths.
  if (category === "Babies" && /kaiya baby/.test(merchantName)) {
    if (/sleep sack|sleep suit sack|sleepwear|pajama|pyjama|sleeper/.test(text)) return "Baby Clothing > Baby Sleepwear";
    if (/bodysuit|romper|sleepsuit/.test(text)) return "Baby Clothing > Baby Bodysuits";
    return "Baby Clothing";
  }

  // Padel Iberico ES is a specialist padel/sports retailer. Its products
  // should remain discoverable in Sports even when titles omit "padel".
  if (category === "Sports" && /padel iberico/.test(merchantName)) {
    if (/racket|racquet|pala|raqueta/.test(text)) return "Padel > Padel Rackets";
    if (/ball|pelota/.test(text)) return "Padel > Padel Balls";
    if (/paletero|padel bag|racket bag|bolso|bag/.test(text)) return "Padel > Padel Bags";
    if (/shoe|shoes|sneaker|zapatilla|footwear/.test(text)) return "Sports Apparel > Sports Footwear";
    if (/camiseta|sudadera|pantalon|shorts?|skirt|falda|polo|t shirt|shirt|clothing|apparel|leggings|jogger|jersey/.test(text)) return "Sports Apparel > Sports Clothing";
    if (/protector|overgrip|grip|wristband|headband|accessor|accesorio|muñequera|munequera/.test(text)) return "Padel > Padel Accessories";
    return "Padel";
  }

  if (category === "Automotive") {
    if (AUTOMOTIVE_VEHICLE_TITLE.test(text)) return "Vehicles for Sale";
    if (/\b(tire|tyre|pneumatic|pneumatici)\b/i.test(text)) return "Rims & Tires > Car Tires";
    if (/\b(wheel rim|alloy wheel|steel wheel|wheel|rim|cerchione)\b/i.test(text)) return "Rims & Tires > Wheels & Rims";
    if (/\b(side mirror|wing mirror|rear view mirror|specchietto)\b/i.test(text)) return "Car Parts > Mirrors & Glass";
    if (/\b(brake pad|brake disc|brake rotor|pastiglie freno)\b/i.test(text)) return "Car Parts > Brakes";
    if (/\b(oil filter|air filter|fuel filter|filtro olio|filtro aria)\b/i.test(text)) return "Car Parts > Filters";
    if (/\b(alternator|starter motor|spark plug|timing belt|serpentine belt|radiator|water pump|fuel pump|clutch kit|engine part)\b/i.test(text)) return "Car Parts > Engine & Engine Parts";
    if (/\b(car battery|automotive battery|batteria auto)\b/i.test(text)) return "Car Parts > Batteries & Electrical";
    if (/\b(headlight|tail light|taillight|turn signal|faro auto)\b/i.test(text)) return "Car Parts > Lighting";
    if (/\b(shock absorber|strut|suspension arm|control arm)\b/i.test(text)) return "Car Parts > Steering & Suspension";
    if (/\b(transmission|exhaust pipe|muffler|catalytic converter|frizione)\b/i.test(text)) return "Car Parts > Transmission & Drivetrain";
    if (/\b(windshield wiper|wiper blade|tergicristallo)\b/i.test(text)) return "Car Parts > Wipers & Washers";
    if (/\b(bumper|fender|grille|ricambi auto|paraurti)\b/i.test(text)) return "Car Parts > Body Parts & Trim";
    if (AUTOMOTIVE_ACCESSORY_TITLE.test(text)) return "Car Accessories";
    if (/\b(car wash|car shampoo|car cleaner|lavaggio auto|interior cleaner)\b/i.test(text)) return "Vehicle Care > Exterior Cleaning";
    if (/\b(car wax|car polish|car detailing|tire shine|tyre shine)\b/i.test(text)) return "Vehicle Care > Wax, Polish & Detailing";
    if (AUTOMOTIVE_CARE_TITLE.test(text)) return "Vehicle Care";
    if (/\b(motorcycle|motorbike|scooter|powersports|motocicletta|moto)\b/i.test(text)) return "Motorcycles, Accessories & Parts";
    if (/\b(tool|jack|lift|wrench|socket|diagnostic scanner|torque wrench|attrezzi)\b/i.test(text)) return "Vehicle Tools";
    if (/\b(gps|navigation|sat nav)\b/i.test(text)) return "GPS Navigation";
    if (/\b(engine oil|motor oil|brake fluid|coolant|antifreeze|transmission fluid)\b/i.test(text)) return "Oils & Fluids";
    if (/\b(car paint|automotive paint|touch up paint|vehicle paint)\b/i.test(text)) return "Vehicle Paint";
    return "Car Accessories";
  }
  if (category === "Fashion") {
    if (/\b(sneakers?|trainers?)\b/i.test(text)) return "Shoes > Sneakers";
    if (/\b(boots?)\b/i.test(text)) return "Shoes > Boots";
    if (/\b(sandals?)\b/i.test(text)) return "Shoes > Sandals";
    if (/\b(heels?|pumps?)\b/i.test(text)) return "Shoes > Heels";
    if (/\b(flats?|ballet flats?)\b/i.test(text)) return "Shoes > Flats";
    if (/\b(slippers?)\b/i.test(text)) return "Shoes > Slippers";
    if (/\b(formal shoes?|oxfords?|loafers?|moccasins?)\b/i.test(text)) return "Shoes > Formal Shoes";
    if (FASHION_FOOTWEAR_TITLE.test(text) && !FOOTWEAR_ACCESSORY_TITLE.test(text)) return "Shoes";
  }

  const maps = {
    "Accessible & Adaptive Living": [
      [/\b(wheelchair|mobility scooter|rollator|walker|crutches|walking aid|stair lift)\b/i,"Mobility & Independence"],
      [/\b(grab bar|shower chair|bath transfer bench|raised toilet|accessible bathroom)\b/i,"Accessible Home & Bathroom"],
      [/\b(hearing aid|braille|magnifier|communication device)\b/i,"Vision, Hearing & Communication"],
      [/\b(adaptive utensil|ergonomic|daily living aid|reacher)\b/i,"Ergonomics & Daily Living"]
    ],
    "Arts, Crafts & Sewing": [
      [/\b(sewing|fabric|thread|quilting|needlework)\b/i,"Sewing & Textiles"],
      [/\b(paint|canvas|drawing|brush|sketch|art supply)\b/i,"Art Supplies"],
      [/\b(bead|decoupage|crochet|knitting|craft|embroidery|scrapbook|stencil|jewelry making)\b/i,"Crafts & Creative DIY"]
    ],
    "Business, Wholesale & Bulk Supply": [
      [/\b(packaging|shipping|mailing|box|label|pallet)\b/i,"Packaging & Shipping Supplies"],
      [/\b(hospitality|restaurant|retail|commercial kitchen|hotel supply)\b/i,"Retail & Hospitality Supplies"],
      [/\b(wholesale|bulk|business supply|commercial supply|b2b)\b/i,"Wholesale Products"]
    ],
    "Energy, Solar & Electric Mobility": [
      [/\b(solar panel|solar generator|solar inverter|charge controller)\b/i,"Solar & Renewable Energy"],
      [/\b(power station|battery storage|home battery|energy storage|backup power)\b/i,"Power Storage & Backup"],
      [/\b(electric bike|e[- ]bike|electric scooter|ev charger|electric vehicle charger)\b/i,"Electric Mobility"]
    ],
    "Food Delivery & Restaurant Orders": [
      [/\b(meal kit|prepared meal|meal delivery)\b/i,"Meal Kits & Prepared Meals"],
      [/\b(grocery delivery|supermarket delivery)\b/i,"Grocery & Supermarket Delivery"],
      [/\b(pizza|fast food|burger|takeaway)\b/i,"Fast Food & Pizza"],
      [/\b(catering|group order)\b/i,"Group Orders & Catering"],
      [/\b(restaurant|food delivery|take out)\b/i,"Restaurant Meals"]
    ],
    "Gaming": [
      [/\b(playstation|play station|ps5|ps4|ps vita)\b/i,"Consoles > PlayStation"],
      [/\b(xbox)\b/i,"Consoles > Xbox"],
      [/\b(nintendo switch|nintendo)\b/i,"Consoles > Nintendo"],
      [/\b(steam deck|handheld gaming console)\b/i,"Consoles > Handheld Gaming Consoles"],
      [/\b(console)\b/i,"Consoles"],
      [/\b(video game|game disc|game download|game code)\b/i,"Video Games"],
      [/\b(gaming pc|gaming laptop|gaming headset|gaming keyboard|gaming mouse|game controller|gaming chair|vr gaming)\b/i,"Gaming Hardware"]
    ],
    "Industrial & Scientific": [
      [/\b(laboratory|lab equipment|microscope|centrifuge|spectrometer|lab consumable|scientific instrument)\b/i,"Lab & Scientific Equipment"],
      [/\b(commercial catering|commercial kitchen|industrial machinery|industrial pump|3d printer|3d printing|calibration equipment)\b/i,"Industrial Machinery"],
      [/\b(workwear|personal protective|ppe|safety boot|safety glove)\b/i,"Workwear & PPE"],
      [/\b(catering equipment)\b/i,"Commercial & Catering Equipment"]
    ],
    "Musical Instruments & Studio": [
      [/\b(audio interface|studio monitor|recording studio|microphone|midi controller)\b/i,"Recording & Production"],
      [/\b(dj controller|live sound|pa system|mixer|speaker)\b/i,"Live Sound & DJ"],
      [/\b(guitar|piano|keyboard instrument|synthesizer|drum|violin|ukulele|saxophone|trumpet)\b/i,"Instruments"],
      [/\b(guitar string|music stand|instrument cable|instrument case|guitar amplifier)\b/i,"Instrument Accessories"]
    ],
    "Real Estate": [
      [/\b(commercial property|office property|retail property)\b/i,"Commercial Property"],
      [/\b(land for sale|development land|building plot)\b/i,"Land & Development"],
      [/\b(castle|private island|historic estate|luxury villa|mansion)\b/i,"Special Properties"],
      [/\b(for rent|to rent|rental|lease)\b/i,"Residential Property for Rent"],
      [/\b(for sale|sale listing)\b/i,"Residential Property for Sale"]
    ],
    "Refurbished, Pre-Owned & Outlet": [
      [/\b(refurbished|certified refurbished|renewed|reconditioned|recertified|open box)\b/i,"Certified Refurbished Electronics"],
      [/\b(pre[- ]owned|second[- ]hand|used|vintage|designer resale)\b/i,"Pre-Owned Fashion & Luxury"],
      [/\b(outlet|clearance|last season)\b/i,"Outlet & Clearance"]
    ],
    "Repair & Circular Economy": [
      [/\b(repair service|device repair|appliance repair|phone repair|computer repair)\b/i,"Repair Services"],
      [/\b(repair kit|replacement part|spare part|screen replacement|component)\b/i,"Parts & Components"],
      [/\b(refurbishment|reconditioning|recycling|trade[- ]?in|buyback|reuse)\b/i,"Reuse & Reconditioning"],
      [/\b(rental|sharing|hire)\b/i,"Rental & Sharing"]
    ],
    "Security & Safety": [
      [/\b(security camera|surveillance camera|cctv|home alarm|intruder alarm|burglar alarm|smart doorbell|smart lock|access control|security safe)\b/i,"Home & Business Security"],
      [/\b(smoke detector|carbon monoxide|fire extinguisher|fire alarm|safety harness|protective equipment|personal alarm)\b/i,"Personal & Workplace Safety"]
    ],
    "Luxury & Prestige": [
      [/\b(patek philippe|patek)\b/i,"Luxury Watches & Jewelry > Patek Philippe Watches"],
      [/\b(rolex)\b/i,"Luxury Watches & Jewelry > Rolex Watches"],
      [/\b(audemars piguet|audemars|richard mille|vacheron constantin|cartier|watch|jewelry|jewellery|diamond|gold)\b/i,"Luxury Watches & Jewelry"],
      [/\b(private island)\b/i,"Private Islands"],
      [/\b(castle|chateau|historic palace|historic estate|manor house)\b/i,"Castles & Historic Estates"],
      [/\b(private jet charter|jet charter|business jet charter)\b/i,"Yacht & Aviation Charter > Private Jets & Business Aviation"],
      [/\b(private jet for sale|business jet for sale|aircraft for sale)\b/i,"Private Helicopters & Aviation > Private Jets for Sale"],
      [/\b(private jet|business jet|helicopter|aviation|aircraft charter|executive aircraft)\b/i,"Private Helicopters & Aviation"],
      [/\b(yacht charter|superyacht charter|boat charter)\b/i,"Yacht & Aviation Charter > Crewed Yachts & Superyachts"],
      [/\b(superyacht|megayacht|luxury yacht)\b/i,"Yachts & Boats > Luxury Yachts"],
      [/\b(yacht|boat|catamaran|motorboat)\b/i,"Yachts & Boats"],
      [/\b(original painting|oil painting|fine art painting|collector artwork|art collection|private art collection)\b/i,"Fine Art & Collectibles > Original Paintings"],
      [/\b(fine art auction|art auction)\b/i,"Fine Art & Collectibles > Fine Art Auctions"],
      [/\b(fine art|artwork|sculpture|collectible|rare collectible|antique masterpiece)\b/i,"Fine Art & Collectibles"],
      [/\b(luxury villa for sale|villa for sale|exclusive villa for sale)\b/i,"Exclusive Villas & Real Estate > Luxury Villas for Sale"],
      [/\b(luxury villa for rent|villa for rent|exclusive villa rental)\b/i,"Luxury Stays & Property Rentals > Luxury Villas & Chalets for Rent"],
      [/\b(villa|mansion|luxury property|estate|penthouse)\b/i,"Exclusive Villas & Real Estate"],
      [/\b(ferrari)\b/i,"Luxury Cars & Hypercars > Ferrari"],
      [/\b(lamborghini)\b/i,"Luxury Cars & Hypercars > Lamborghini"],
      [/\b(porsche)\b/i,"Luxury Cars & Hypercars > Porsche"],
      [/\b(hummer)\b/i,"Luxury Cars & Hypercars > Hummer & Luxury 4x4"],
      [/\b(limousine|chauffeur[- ]driven)\b/i,"Luxury Cars & Hypercars > Limousines & Chauffeur Cars"],
      [/\b(rolls[- ]?royce)\b/i,"Luxury Cars & Hypercars > Rolls-Royce"],
      [/\b(bentley)\b/i,"Luxury Cars & Hypercars > Bentley"],
      [/\b(bugatti)\b/i,"Luxury Cars & Hypercars > Bugatti"],
      [/\b(aston martin)\b/i,"Luxury Cars & Hypercars > Aston Martin"],
      [/\b(mc ?laren)\b/i,"Luxury Cars & Hypercars > McLaren"],
      [/\b(car|hypercar|supercar|vehicle)\b/i,"Luxury Cars & Hypercars"],
      [/\b(designer|fashion|handbag|accessories)\b/i,"Designer Fashion & Accessories Rental"]
    ],
    "TVs & Home Cinema": [
      [/\b(oled)\b/i,"Televisions > OLED TVs"],
      [/\b(qled|mini[- ]?led)\b/i,"Televisions > QLED & Mini-LED TVs"],
      [/\b(led tv|lcd tv)\b/i,"Televisions > LED & LCD TVs"],
      [/\b(4k tv|8k tv|uhd tv)\b/i,"Televisions > 8K & 4K TVs"],
      [/\b(smart tv)\b/i,"Televisions > Smart TVs"],
      [/\b(television|tv)\b/i,"Televisions"],
      [/\b(projector|projector screen|home cinema|home theater|home theatre|soundbar|av receiver|surround sound)\b/i,"Home Cinema"],
      [/\b(tv stand|tv mount|streaming device|remote control)\b/i,"TV Accessories"]
    ],

    "Beauty": [
      [/\b(lipstick|lip gloss|lip liner|lip balm|lip oil|lip stain|lip tint)\b/i,"Makeup > Lip Makeup"],
      [/\b(mascara|eyeshadow|eye shadow|eyeliner|eye liner|kohl|brow|eyebrow|false lash|eyelash)\b/i,"Makeup > Eye Makeup"],
      [/\b(foundation|concealer|blush|face powder|contour|highlighter|face palette)\b/i,"Makeup > Face Makeup"],
      [/\b(nail polish|nail varnish|nail enamel|nail care|cuticle)\b/i,"Manicure & Pedicure > Nail Polish"],
      [/\b(makeup brush|beauty blender|cosmetic brush|makeup sponge|makeup tool)\b/i,"Makeup > Makeup Tools & Accessories"],
      [/\b(perfume|fragrance|eau de parfum|eau de toilette|cologne|body mist)\b/i,"Fragrances & Perfumes"],
      [/\b(shampoo|conditioner|hair mask|hair treatment|hair oil|hair spray|hair gel|hair serum|hair dye|wig|hair extension)\b/i,"Hair Care"],
      [/\b(serum|essence)\b/i,"Skincare > Serums & Essences"],
      [/\b(face cleanser|facial cleanser|face wash|micellar)\b/i,"Skincare > Face Cleansers"],
      [/\b(eye cream|eye care|eye contour)\b/i,"Skincare > Eye Care"],
      [/\b(sunscreen|spf|sun protection)\b/i,"Skincare > Sun Protection"],
      [/\b(face mask|sheet mask|mud mask)\b/i,"Skincare > Face Masks"],
      [/\b(moistur|face cream|night cream)\b/i,"Skincare > Moisturizers"],
      [/\b(skin care|skincare|toner|acne|exfoliat)\b/i,"Skincare"],
      [/\b(body wash|shower gel|body lotion|body cream|body butter|body scrub|deodorant|hand cream|bath salt|bath bomb|soap)\b/i,"Bath & Body"],
      [/\b(shav|beard|aftershave|grooming)\b/i,"Men's Grooming"],
      [/\b(hair dryer|straightener|curling iron|facial device|led lamp|nail lamp|epilator)\b/i,"Beauty Devices"]
    ],
    "Health & Wellness": [
      [/\b(multivitamin)\b/i,"Nutrition > Vitamins, Minerals & Supplements > Multivitamins"],
      [/\b(vitamin d(?:2|3)?)\b/i,"Nutrition > Vitamins, Minerals & Supplements > Vitamin D"],
      [/\b(vitamin c(?:\d+)?)\b/i,"Nutrition > Vitamins, Minerals & Supplements > Vitamin C"],
      [/\b(vitamin b(?:\d+)?)\b/i,"Nutrition > Vitamins, Minerals & Supplements > Vitamin B"],
      [/\b(omega|fish oil)\b/i,"Nutrition > Vitamins, Minerals & Supplements > Omega Oils"],
      [/\b(probiotic)\b/i,"Nutrition > Vitamins, Minerals & Supplements > Probiotics"],
      [/\b(mineral)\b/i,"Nutrition > Vitamins, Minerals & Supplements > Minerals"],
      [/\b(vitamin|supplement|herbal|capsule|gummy supplement)\b/i,"Nutrition > Vitamins, Minerals & Supplements"],
      [/\b(whey protein|protein powder)\b/i,"Nutrition > Sports Supplements > Protein Powders"],
      [/\b(creatine)\b/i,"Nutrition > Sports Supplements > Creatine"],
      [/\b(pre workout)\b/i,"Nutrition > Sports Supplements > Pre-Workout"],
      [/\b(post workout|recovery)\b/i,"Nutrition > Sports Supplements > Post-Workout"],
      [/\b(electrolyte|amino acid|mass gainer)\b/i,"Nutrition > Sports Supplements"],
      [/\b(first aid|bandage|dressing|gauze|medical tape|wound care)\b/i,"First Aid & Wound Care > First Aid"],
      [/\b(thermometer|blood pressure|glucose monitor|pulse oximeter|body composition|weighing scale)\b/i,"Medical Devices & Equipment > Diagnostic & Monitoring Devices"],
      [/\b(toothbrush|toothpaste|dental floss|mouthwash|oral irrigator|feminine care|incontinence)\b/i,"Oral Hygiene"],
      [/\b(wheelchair|walking stick|cane|walker|mobility|brace|support sleeve|orthopedic)\b/i,"Medical Devices & Equipment > Mobility & Daily Living Aids"],
      [/\b(pain relief|hot and cold|heating pad|ice pack|massage gun|tens unit|ems unit)\b/i,"First Aid & Wound Care > Hot & Cold Therapies"],
      [/\b(sleep aid|earplugs|eye mask|melatonin|relaxation|aromatherapy)\b/i,"Wellness > Sleep & Relaxation"],
      [/\b(reading glasses|magnifier|hearing aid|hearing accessories)\b/i,"Eye Care"],
      [/\b(nebulizer|inhaler|medical device|medical equipment|diagnostic)\b/i,"Medical Devices & Equipment > Diagnostic & Monitoring Devices"]
    ],
    "Sports": [
      [/\b(tennis|court)\b(?=.*\b(shoes?|sneakers?|trainers?|footwear)\b)|\b(tennis shoes?|tennis sneakers?|tennis footwear)\b/i,"Tennis > Tennis Shoes"],
      [/\b(dumbbell|kettlebell|weight plate|barbell|resistance band|weight bench|power rack|home gym)\b/i,"Fitness & Gym"],
      [/\b(treadmill|exercise bike|elliptical|rowing machine|jump rope|stepper)\b/i,"Fitness & Gym > Cardio Machines"],
      [/\b(yoga mat)\b/i,"Fitness & Gym > Yoga & Pilates > Yoga Mats"],
      [/\b(pilates)\b/i,"Fitness & Gym > Yoga & Pilates > Pilates Equipment"],
      [/\b(yoga)\b/i,"Fitness & Gym > Yoga & Pilates"],
      [/\b(running|jogging)\b/i,"Running"],
      [/\b(bike helmet|cycling helmet)\b/i,"Cycling > Helmets & Protection"],
      [/\b(bicycle|mountain bike|road bike|bike)\b/i,"Cycling > Bicycles"],
      [/\b(bike pump|bike light|bike repair)\b/i,"Cycling > Pumps & Repair"],
      [/\b(cycling)\b/i,"Cycling"],
      [/\b(padel)\b/i,"Padel"],
      [/\b(tennis)\b/i,"Tennis"],
      [/\b(badminton)\b/i,"Badminton"],
      [/\b(squash|racquet|racket)\b/i,"Tennis"],
      [/\b(basketball)\b/i,"Basketball"],
      [/\b(baseball)\b/i,"Baseball"],
      [/\b(volleyball)\b/i,"Volleyball"],
      [/\b(ice hockey)\b/i,"Ice Hockey"],
      [/\b(field hockey)\b/i,"Field Hockey"],
      [/\b(soccer|football|goal|shin guard)\b/i,"Soccer"],
      [/\b(camping|hiking|trekking|climbing|tent|sleeping bag|backpack)\b/i,"Camping & Outdoor"],
      [/\b(swimming|surf|paddleboard|kayak|diving|snorkel)\b/i,"Water Sports"],
      [/\b(ski|snowboard|ice skate)\b/i,"Winter Sports"],
      [/\b(golf)\b/i,"Golf"],
      [/\b(boxing)\b/i,"Boxing"],
      [/\b(martial arts|karate|taekwondo|mma)\b/i,"Martial Arts"],
      [/\b(sports? apparel|sports? clothing|sports? shoes|sports? bag|athletic wear)\b/i,"Sports Apparel"]
    ],
    "Electronics": [
      [/\b(i ?phone|apple i ?phone)\b/i,"Phones & Tablets > Smartphones > Apple iPhone"],
      [/\b(samsung galaxy (?:s|z|a|m|f|note)\s?\d*|galaxy s\d+|galaxy z\w*|galaxy a\d+)\b/i,"Phones & Tablets > Smartphones > Samsung Galaxy"],
      [/\b(google pixel|pixel phone)\b/i,"Phones & Tablets > Smartphones > Google Pixel"],
      [/\b(smartphone|mobile phone|cell phone|android phone|android smartphone)\b/i,"Phones & Tablets > Smartphones > Other Android Smartphones"],
      [/\b(basic phone|feature phone)\b/i,"Phones & Tablets > Basic Phones"],
      [/\b(i ?pad|apple tablet)\b/i,"Phones & Tablets > Tablets > Apple iPad"],
      [/\b(samsung galaxy tab|galaxy tab)\b/i,"Phones & Tablets > Tablets > Samsung Galaxy Tab"],
      [/\b(windows tablet|surface pro|surface go)\b/i,"Phones & Tablets > Tablets > Windows Tablets"],
      [/\b(android tablet|tablet computer|tablet pc|tablet)\b/i,"Phones & Tablets > Tablets > Android Tablets"],
      [/\b(e reader|e-reader|kindle)\b/i,"Phones & Tablets > E-Readers"],
      [/\b(macbook|mac book)\b/i,"Computers > Laptops > Apple MacBook"],
      [/\b(chromebook)\b/i,"Computers > Laptops > Chromebooks"],
      [/\b(gaming laptop|laptop gaming)\b/i,"Computers > Laptops > Gaming Laptops"],
      [/\b(mobile workstation|workstation laptop)\b/i,"Computers > Laptops > Mobile Workstations"],
      [/\b(2[- ]in[- ]1 laptop|convertible laptop|laptop tablet)\b/i,"Computers > Laptops > 2-in-1 & Convertible Laptops"],
      [/\b(business laptop)\b/i,"Computers > Laptops > Business Laptops"],
      [/\b(windows laptop|windows notebook)\b/i,"Computers > Laptops > Windows Laptops"],
      [/\b(laptop|notebook|ultrabook)\b/i,"Computers > Laptops"],
      [/\b(gaming desktop|gaming pc)\b/i,"Computers > Desktop Computers > Gaming Desktops"],
      [/\b(workstation|cad workstation|professional workstation)\b/i,"Computers > Desktop Computers > Workstations"],
      [/\b(all[- ]in[- ]one pc|all[- ]in[- ]one computer|imac)\b/i,"Computers > Desktop Computers > All-in-One PCs"],
      [/\b(mini pc|mini computer)\b/i,"Computers > Desktop Computers > Mini PCs"],
      [/\b(desktop computer|desktop pc|pc tower|tower pc)\b/i,"Computers > Desktop Computers > Tower PCs"],
      [/\b(graphics card|gpu)\b/i,"Computers > Computer Components > Graphics Cards"],
      [/\b(processor|cpu)\b/i,"Computers > Computer Components > Processors & CPUs"],
      [/\b(motherboard)\b/i,"Computers > Computer Components > Motherboards"],
      [/\b(ram memory|memory kit|ddr[345])\b/i,"Computers > Computer Components > RAM & Memory"],
      [/\b(ssd|solid state drive|hard drive|hdd)\b/i,"Computers > Computer Components > SSD & Hard Drives"],
      [/\b(computer monitor|monitor)\b/i,"Computers > Monitors"],
      [/\b(keyboard|computer mouse|router|network switch)\b/i,"Computers"],
      [/\b(camera|dslr|mirrorless|camcorder|webcam|camera lens|tripod|action cam)\b/i,"Cameras & Photography"],
      [/\b(headphones|earbuds|earphones|speaker|microphone|soundbar|audio)\b/i,"Audio"],
      [/\b(television|smart tv|projector|home theater|streaming device|tv mount)\b/i,"TV & Home Theater"],
      [/\b(smart home|smart plug|smart bulb|security camera|smart doorbell|home hub)\b/i,"Smart Home"],
      [/\b(smartwatch|fitness tracker|vr headset|virtual reality)\b/i,"Wearable Technology"],
      [/\b(dash cam|dashcam|gps navigation|carplay|android auto|car audio|backup camera)\b/i,"Car Electronics"]
    ],
    "Fashion": [
      [/\b(dress|skirt|blouse|women's top|women clothing|leggings|women jeans|women jacket|lingerie|swimwear|bikini)\b/i,"Women's Clothing"],
      [/\b(men's shirt|men's jeans|men clothing|men jacket|polo shirt|men trousers|men underwear)\b/i,"Men's Clothing"],
      [/\b(kids clothing|girls clothing|boys clothing|school uniform)\b/i,"Kids' Clothing"],
      [/\b(dress)\b/i,"Clothing > Dresses"],
      [/\b(t[- ]?shirts?|tees?|tops?)\b/i,"Clothing > T-Shirts & Tops"],
      [/\b(shirts?|blouses?)\b/i,"Clothing > Shirts & Blouses"],
      [/\b(jeans|trousers|pants)\b/i,"Clothing > Jeans & Trousers"],
      [/\b(shorts?)\b/i,"Clothing > Shorts"],
      [/\b(jackets?|coats?)\b/i,"Clothing > Jackets & Coats"],
      [/\b(hoodies?|sweatshirts?|sweaters?)\b/i,"Clothing > Sweatshirts & Hoodies"],
      [/\b(activewear|sportswear|leggings|tracksuit)\b/i,"Clothing > Activewear"],
      [/\b(underwear|lingerie|sleepwear|pajamas?|pyjamas)\b/i,"Clothing > Underwear & Sleepwear"],
      [/\b(socks?)\b/i,"Clothing > Socks"],

      [/\b(shoes|sneakers|boots|sandals|heels|flats|slippers)\b/i,"Shoes"],
      [/\b(handbag|tote bag|purse|wallet|backpack|suitcase|duffel|luggage)\b/i,"Bags & Luggage"],
      [/\b(jewelry|jewellery|necklace|bracelet|earrings|ring)\b/i,"Jewelry"],
      [/\b(sunglasses|eyewear|belt|hat|cap|scarf|gloves|hair accessory|bonnet|headwrap)\b/i,"Accessories"]
    ],
    "Babies": [
      [/\b(diaper|nappy|changing pad|diaper bag|diaper pail)\b/i,"Diaper Changing"],
      [/\b(baby wash|baby shampoo|baby bath)\b/i,"Hygiene & Wellness > Baby Bath"],
      [/\b(baby lotion|baby cream|baby oil|baby butter|baby balm|baby wipes)\b/i,"Hygiene & Wellness > Baby Skin Care"],
      [/\b(bottle|nipple|breast pump|breastfeeding|high chair|bottle warmer|baby formula)\b/i,"Feeding & Nursing"],
      [/\b(stroller|pushchair|pram|travel system)\b/i,"Strollers & Accessories"],
      [/\b(infant car seat|convertible car seat|booster seat|car seat base)\b/i,"Car Seats & Accessories"],
      [/\b(baby carrier|baby sling|marsupial)\b/i,"Baby Carriers"],
      [/\b(baby monitor|safety gate|corner guard|cabinet lock)\b/i,"Baby Safety"],
      [/\b(crib|nursery|crib mattress|changing table|baby bedding|nursery decor)\b/i,"Nursery"],
      [/\b(newborn|infant|baby clothes|baby clothing|baby bodysuit|baby sleepsuit)\b/i,"Baby Clothing"],
      [/\b(teether|rattle|baby toy|activity gym|bath toy|pacifier|soother)\b/i,"Baby Toys"]
    ],
    "Home & Living": [
      [/\b(sofa|couch|bed frame|dresser|wardrobe|dining table|office chair|bookcase|furniture)\b/i,"Furniture"],
      [/\b(cookware|bakeware|kitchen|knife|cutlery|tableware|mug|cup|glassware|food storage)\b/i,"Kitchen & Dining"],
      [/\b(bedsheet|sheet set|duvet|comforter|pillow|blanket|towel|bath mat|shower curtain)\b/i,"Bedding & Bath"],
      [/\b(wall art|wall decor|mirror|candle|vase|decorative|clock|diffuser)\b/i,"Home Décor"],
      [/\b(storage|organizer|shelving|closet|laundry basket|storage bin)\b/i,"Storage & Organization"],
      [/\b(cleaning|detergent|laundry|paper towel|tissue|air freshener)\b/i,"Cleaning & Household"],
      [/\b(lamp|lighting|light fixture|ceiling light|desk lamp)\b/i,"Lighting"],
      [/\b(hardware|paint|plumbing|electrical|home improvement|door lock)\b/i,"Home Improvement"]
    ],
    "Appliances": [
      [/\b(coffee machine|espresso machine|blender|mixer|air fryer|microwave|toaster|food processor|refrigerator)\b/i,"Kitchen Appliances"],
      [/\b(washing machine|washer|dryer|iron|steamer)\b/i,"Laundry Appliances"],
      [/\b(vacuum|robot vacuum|steam cleaner)\b/i,"Floor Care"],
      [/\b(air conditioner|fan|heater|air purifier|humidifier|dehumidifier)\b/i,"Climate Control"],
      [/\b(hair dryer|electric shaver|epilator|electric toothbrush)\b/i,"Personal Appliances"]
    ],
    "Garden": [
      [/\b(seeds?|bulbs?|fertilizer|soil|planter|flower pot|watering|irrigation|garden tool)\b/i,"Gardening"],
      [/\b(lawn mower|trimmer|edger|leaf blower|lawn treatment)\b/i,"Lawn Care"],
      [/\b(patio|outdoor furniture|grill|barbecue|canopy|garden decor)\b/i,"Outdoor Living"],
      [/\b(pool|spa|hot tub)\b/i,"Pools & Spas"]
    ],
    "Pets": [
      [/\b(dog food|dog treat)\b/i,"Dogs > Dog Food & Treats"],
      [/\b(dog harness|dog leash|dog collar)\b/i,"Dogs > Collars, Leashes & Harnesses"],
      [/\b(dog bed)\b/i,"Dogs > Beds & Furniture"],
      [/\b(dog)\b/i,"Dogs"],
      [/\b(cat food|cat treat)\b/i,"Cats > Cat Food"],
      [/\b(cat litter|litter box)\b/i,"Cats > Litter & Litter Boxes"],
      [/\b(cat)\b/i,"Cats"],
      [/\b(bird|avian)\b/i,"Birds"],[/\b(aquarium|fish tank|fish food)\b/i,"Fish & Aquatics"],
      [/\b(hamster|rabbit|guinea pig|small animal)\b/i,"Small Animals"]
    ],
    "Toys & Games": [
      [/\b(lego|building block|construction set|building set)\b/i,"Building & Construction"],
      [/\b(doll|action figure|figurine)\b/i,"Dolls & Figures"],
      [/\b(board game|card game|puzzle|jigsaw)\b/i,"Board Games & Puzzles"],
      [/\b(ride on|playhouse|outdoor toy|water toy)\b/i,"Outdoor Play"],
      [/\b(art and craft|craft kit|stem toy|educational toy|learning toy)\b/i,"Creative & Learning"],
      [/\b(video game|gaming console|controller|gaming headset)\b/i,"Video Games"]
    ],
    "Food & Grocery": [
      [/\b(pasta|rice)\b/i,"Pantry Staples > Pasta & Rice"],
      [/\b(cooking oil|olive oil)\b/i,"Pantry Staples > Cooking Oils"],
      [/\b(sauce|condiment)\b/i,"Pantry Staples > Sauces & Condiments"],
      [/\b(flour|baking|canned food)\b/i,"Pantry Staples"],
      [/\b(chocolate|candy|cookie|biscuit|chips|snack)\b/i,"Snacks & Sweets"],
      [/\b(coffee)\b/i,"Beverages > Coffee"],
      [/\b(tea)\b/i,"Beverages > Tea"],
      [/\b(water)\b/i,"Beverages > Water"],
      [/\b(juice|soft drink|beverage)\b/i,"Beverages"],
      [/\b(organic|gluten free|vegan|dietary food)\b/i,"Specialty & Organic"],
      [/\b(gift basket|honey|gourmet|gift set)\b/i,"Food Gifts"]
    ],
    "Books & Media": [
      [/\b(book|ebook|novel|textbook|guide|manual)\b/i,"Books"],
      [/\b(cd|vinyl|record|digital music)\b/i,"Music"],
      [/\b(dvd|blu ray|movie|film)\b/i,"Movies & TV"],
      [/\b(magazine|periodical|journal)\b/i,"Magazines & Periodicals"]
    ],
    "Office & Technology": [
      [/\b(paper|pen|pencil|stationery|filing|binder|desk accessory)\b/i,"Office Supplies"],
      [/\b(software|antivirus|security suite|productivity app|utility|file recovery)\b/i,"Software"],
      [/\b(printer|scanner|shredder|calculator|conference phone)\b/i,"Office Electronics"],
      [/\b(cable|adapter|usb hub|networking accessory|computer peripheral)\b/i,"IT Accessories"]
    ],
    "Tools & DIY": [
      [/\b(drill|saw|sander|grinder|impact driver|power tool)\b/i,"Power Tools"],
      [/\b(screwdriver|wrench|pliers|hammer|hand tool)\b/i,"Hand Tools"],
      [/\b(drill bit|saw blade|sanding|tool battery|tool charger)\b/i,"Power Tool Accessories"],
      [/\b(tool storage|workbench|safety gear|measuring tool)\b/i,"Workshop & Safety"]
    ],
    "Travel": [
      [/\b(suitcase|carry on|luggage|duffel bag|travel backpack)\b/i,"Luggage"],
      [/\b(passport|packing cube|travel pillow|luggage tag|travel adapter)\b/i,"Travel Accessories"],
      [/\b(camping|hiking|adventure travel)\b/i,"Outdoor & Adventure Travel"]
    ]
  };
  for (const [pattern, name] of maps[category] || []) if (pattern.test(text)) return name;
  return "Other";
}

export function categoryFor(advertiser, product) {
  const title = textOf([product?.title, product?.englishTitle, product?.name].filter(Boolean).join(" "));
  const merchantName = textOf(advertiser?.name || "");

  if (RUNNING_ACCESSORY_TITLE.test(title)) return "Sports";
  if (SERVICE_TITLE.test(title)) return REPAIR_SERVICE_TITLE.test(title) ? "Repair & Circular Economy" : "Other";
  if (SCALE_MODEL_TITLE.test(title)) return "Toys & Games";
  const isNonLuxuryModelOrMedia = LUXURY_NON_VEHICLE_TITLE.test(title);
  const isLuxuryCar = !isNonLuxuryModelOrMedia &&
    !AUTOMOTIVE_PARTS_TITLE.test(title) &&
    !AUTOMOTIVE_ACCESSORY_TITLE.test(title) &&
    LUXURY_CAR_BRAND_TITLE.test(title) &&
    (LUXURY_CAR_MODEL_TITLE.test(title) || LUXURY_CAR_CONTEXT_TITLE.test(title));
  if ((!isNonLuxuryModelOrMedia && LUXURY_ASSET_TITLE.test(title)) || isLuxuryCar) return "Luxury & Prestige";
  // Pet-specific products must not be captured by generic Toys & Games keywords.
  if (PET_PRODUCT_TITLE.test(title)) return "Pets";
  // Paper/stationery notebooks belong to Office & Technology, while notebook computers remain Electronics.
  if (PAPER_NOTEBOOK_TITLE.test(title)) return "Office & Technology";
  if (SHOE_STORAGE_TITLE.test(title)) return "Home & Living";
  if (SHOE_CARE_TITLE.test(title) || SHOE_BAG_TITLE.test(title)) return "Fashion";
  // Keep infant footwear in Babies, sports footwear in Sports, and ordinary
  // fashion footwear in Fashion > Shoes. Never let merchant-level rules scatter shoes.
  if (BABY_SHOE_TITLE.test(title) && !FOOTWEAR_ACCESSORY_TITLE.test(title)) return "Babies";
  if (FASHION_FOOTWEAR_TITLE.test(title) && !FOOTWEAR_ACCESSORY_TITLE.test(title) &&
      (SPORTS_FOOTWEAR_TITLE.test(title) || /\bpadel iberico\b/.test(merchantName))) return "Sports";
  if (FASHION_FOOTWEAR_TITLE.test(title) && !FOOTWEAR_ACCESSORY_TITLE.test(title)) return "Fashion";

  // Keep the specialist Padel Iberico inventory together in Sports; its
  // subcategory classifier separates rackets, balls, bags and sportswear.
  if (/padel iberico/.test(merchantName)) return "Sports";
  if (AUTOMOTIVE_VEHICLE_TITLE.test(title) || AUTOMOTIVE_PARTS_TITLE.test(title) ||
      AUTOMOTIVE_ACCESSORY_TITLE.test(title) || AUTOMOTIVE_CARE_TITLE.test(title)) return "Automotive";
  // These merchants have a single, clearly defined catalogue focus; apply
  // their identity before generic words such as "projector" or "cushion cover".
  if (/\bnilight\b|\boedro\b|\bksp performance\b/.test(merchantName)) return "Automotive";
  if (/\bforeo\b|\bstylevana\b/.test(merchantName)) return "Beauty";
  if (/\bchow sang sang\b/.test(merchantName)) return "Luxury & Prestige";
  if (/\baurzen\b/.test(merchantName)) return "TVs & Home Cinema";
  if (/\bcreality\b/.test(merchantName)) return "Industrial & Scientific";
  if (/\bosulloc\b/.test(merchantName)) return "Food & Grocery";
  if (/\bmaps international\b/.test(merchantName)) return "Travel";
  if (HAIR_APPAREL_TITLE.test(title)) return "Beauty";
  if (HOME_DECOR_TITLE.test(title)) return "Home & Living";
  const structuredProductEvidence = textOf([
    product?.productType,
    product?.googleProductCategory,
    product?.sourceCategory
  ].join(" "));
  const specialIdentity = title + " " + structuredProductEvidence;
  const specialCategory = matchRule(specialIdentity, SPECIAL_CATEGORY_RULES);
  if (specialCategory) return specialCategory;
  // A concrete cosmetic identity outranks weak marketing/model words such as
  // "baby", "babies", or a baby-themed brand/collection name.
  // Explicit makeup objects outrank "Baby" used as a shade or collection name.
  if (MAKEUP_ITEM_TITLE.test(title) || MAKEUP_ITEM_TITLE.test(structuredProductEvidence)) return "Beauty";
  // Products explicitly intended for infants remain in Babies.
  if (BABY_CARE_TITLE.test(title)) return "Babies";
  if (
    BEAUTY_PRODUCT_TITLE.test(title) ||
    COSMETIC_ITEM_TITLE.test(title) ||
    COSMETIC_ITEM_TITLE.test(structuredProductEvidence)
  ) return "Beauty";
  if (FASHION_ACCESSORY_TITLE.test(title)) return "Fashion";
  if (/\bkaiya baby\b/i.test(merchantName) && BABY_APPAREL_SIZE_TITLE.test(title)) return "Babies";
  if (HAIR_APPAREL_TITLE.test(title)) return "Fashion";

  if (/\bcamera[- ]ready\b/i.test(title) && /\b(e cosmetics|ecosmetics|beauty)\b/i.test(merchantName)) return "Beauty";
  if (TRAVEL_HEALTH_TITLE.test(title)) return "Health & Wellness";
  if (TRAVEL_BEAUTY_TITLE.test(title) && /\b(e cosmetics|ecosmetics|fragrance|fragranceshop|perfume|beauty)\b/i.test(merchantName)) return "Beauty";
  if (/\btoy boy\b/i.test(title) && /\b(fragrance|perfume|fragranceshop|e cosmetics|ecosmetics)\b/i.test(merchantName)) {
    return "Beauty";
  }

  const titleMatch = matchRule(title, RULES);
  if (titleMatch) return titleMatch;

  // Read the actual product description when the title is inconclusive.
  // Ambiguous descriptions mentioning multiple departments do not decide.
  const description = textOf(String(product?.description || product?.longDescription || "").slice(0, 3000));
  const descriptionMatch = uniqueDescriptionCategory(description, RULES);
  if (descriptionMatch) return descriptionMatch;

  // Trust only actual structured taxonomy fields; never reuse ZOVARO's old category.
  const structured = textOf([product?.productType, product?.googleProductCategory, product?.sourceCategory].join(" "));
  const structuredMatch = matchRule(structured, RULES);
  if (structuredMatch) return structuredMatch;

  const advertiserName = textOf(advertiser?.name || "");
  // Merchant-level fallback is allowed only for a known advertiser identity.
  // Seller taxonomy is deliberately ignored because it often labels every SKU
  // with one broad category and overrides the product's real object type.
  if (/\babelssoft\b/i.test(advertiserName)) return "Office & Technology";
  return matchRule(advertiserName, ADVERTISER_RULES) || "Other";
}

export function visualCategoryOverride(check) {
  if (!check || check.status !== "possible_mismatch" || check.visualAction !== "reclassify") return null;
  if (Number(check.confidence || 0) < 0.34 || Number(check.margin || 0) < 0.08) return null;
  return typeof check.detectedCategory === "string" && check.detectedCategory.trim() ? check.detectedCategory.trim() : null;
}

export function visualSubcategoryOverride(check, category) {
  if (!check || check.visualSubcategoryAction !== "apply") return null;
  if (check.detectedCategory && check.detectedCategory !== category) return null;
  if (Number(check.visualSubcategoryConfidence || 0) < 0.22 || Number(check.visualSubcategoryMargin || 0) < 0.035) return null;
  return typeof check.visualSubcategoryPath === "string" && check.visualSubcategoryPath.trim() ? check.visualSubcategoryPath.trim() : null;
}
