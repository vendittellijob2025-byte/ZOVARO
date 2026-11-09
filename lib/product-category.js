const RULES = [
  ["Beauty", /\b(perfume|parfum|fragrance|eau de toilette|eau de parfum|eau de perfum|eau d ambiance|cologne|aftershave|cosmetic|cosmetics|make[- ]?up|lipstick|lip ?colour|lip ?colors?|lip ?gloss|lip ?liner|lip ?balms?|lip ?polish|lip ?oil|lip ?stain|lip ?twist|gloss[- ]to[- ]balm|mascara|foundation|concealer|blush|eyeshadows?|eye shadow|eyeliner|eye liner|eye pencil|kohl|brow pencil|eyebrow pencil|brow powder|brow gel|brow creation gel|face palette|eyes? palette|makeup palette|luxury palette|face masks?|mud masks?|sheet masks?|eye masks?|under eye masks?|facial|face wash|face cleanser|cleanser|cleansing balm|cleansing oil|cleansing gel|micellar water|makeup remover|skincare|skin care|skin health|moisturi[sz](?:e|er|ing|ation)|face cream|face creme|night cream|night creme|eye cream|eye creme|eye contour|eye balm|eye gels?|hand cream|hand creme|body cream|body creme|body butter|massage cream|olive oil hair|olive oil formula|hair scalp oil|hair and scalp oil|face powder|contour powder|serum|toner|sunscreen|spf|bb cream|beauty|seed oil|hairbrush|hair brush|hair straightening brush|hair straightener|hot comb|straightener brush|body scrub|shower scrub|bath teas?|bath soak|bath salts|bath body|microcurrent|facial toning|toning device|facial device|uv led lamp|nail lamp|after sun|cool down lotion|sun care|sun belt|self tan|tanning|whitening strips|teeth whitening|tooth whitening|masque|face massage|exfoliat(?:ing|or|ion)|exfoliant|nail polish|nail varnish|nail enamel|nail care|shampoo|conditioner|hair dye|hair masque|hair mask|treatment masks?|hair treatment|hair spray|hair gel|hair serum|hair oil|hair food|body lotion|body wash|body polish|shower gel|shower foam|deodorant|soap|essential oil|bath bombs?|bath and body|travel kit|travel size|travel starter set|travel minis|travel exclusive|travel and glow|travel glow kit|travel trio|travel duo|travel collection|travel hair kit|travel mirror|holiday collection|holiday pouch|set holiday|sets holiday|colonia|holiday kits?|holiday sets?|holiday essentials|holiday trio|full face holiday set|lip sleeping masks?|body mist|hair and body mist|gua sha|face roller|derma roller|makeup brush|cosmetic brush|blender brush|profumo|profumi|cosmetico|cosmetici|cosmetica|trucco|rossetto|crema viso|crema corpo|siero|detergente viso|protezione solare|smalto|balsamo|dopobarba|belleza|maquillaje|crema facial|protector solar)\b/i],
  ["Health & Wellness", /\b(health|wellness|medical|first aid|medical device|mobility aid|vitamins?|supplements?|capsules?|tablets?|thermometer|blood pressure|mosquito repellent|insect repellent|repellent patches|scar gel|immune support|stress related hair loss|salute|benessere|medicale|salud|bienestar)\b/i],
  ["Electronics", /\b(digital camera|camera|dslr|mirrorless|action camera|camcorder|webcam|camera lens|photographic|photography|photo camera|macchina fotografica|fotocamera|obiettivo fotografico|videocamera|action cam|smartphone|mobile phone|cell phone|tablet computer|tablet pc|ipad|laptop|notebook|desktop computer|computer|monitor|television|tv|headphones|earbuds|speaker|audio|drone|projector|printer|keyboard|computer mouse|electronics|electronic|memory card|micro sd|microsd[a-z]*|sd card|monocular|night vision|dash cam|dashcam|baby monitor|carplay|car play|android auto adapter|gps logger|wireless charging station|hardwire kit|hardwire|c[aá]mara digital|c[aá]mara|tel[eé]fono m[oó]vil|ordenador|auriculares)\b/i],
  ["Automotive", /\b(automotive|automobile|car parts|car part|replacement parts|vehicle|car accessories|auto parts|tire|tyre|wheel rim|alloy wheel|steel wheel|side mirror|wing mirror|brake pad|brake disc|car mount|car charger|car air freshener|suction cup mount|camera mount|dash cam mount|motorcycle parts|motorbike accessories|ricambi auto|accessori auto|motocicletta|autom[oó]vil|repuestos de coche)\b/i],
  ["Sports", /\b(sport|sports|fitness|padel|tennis|racket|racquet|overgrips?|golf|gym|cycling|athletic|exercise|running|yoga|palestra|ciclismo|deporte|deportes|raqueta)\b/i],
  ["Fashion", /\b(swimwear|swimsuit|swim suit|bikini|tankini|cover[- ]?up|clothing|apparel|footwear|shoes|sneakers|mules?|sandals?|boots?|heels?|handbag|jewelry|garment|dress|shirt|t[- ]?shirt|trousers|pants|jeans|denim|jacket|robe|fashion accessory|wig|wigs|human hair|virgin hair|loose wave|body wave|straight hair|hair bundles|hair weave|lace closure|lace frontal|hair extensions|hairpiece|hair piece|hair tie|scrunchie|sunglasses|eyewear|tote bag|travel bag|toiletry bag|satchel|vacation top|hair loop|pouch|water wave|drawstring|no baby hair|pre cut lace|clip in|bangs|temples|camiseta|sudadera|falda|pantal[oó]n|chaqueta|abbigliamento|scarpe|vestito|borsa|gioielli|ropa|calzado|vestido|bolso|peluca)\b/i],
  ["Toys & Games", /\b(toy|toys|board game|puzzle|doll|action figure|building blocks|lego|playset|stuffed animal|plush toy|video game|gaming|giocattolo|giocattoli|gioco da tavolo|bambola|pupazzo|juguete|juguetes|muñeca|rompecabezas)\b/i],
  ["Babies", /\b(baby|babies|infant|newborn|nursery|diaper|nappy|toddler|stroller|pushchair|car seat|sleep sack|pannolino|passeggino|neonato|prima infanzia|beb[eé]|reci[eé]n nacido|cochecito)\b/i],
  ["Pets", /\b(pet|pets|pet food|dog food|cat food|cat litter|dog leash|dog collar|cat collar|pet carrier|pet shampoo|pet spray|pet bed|aquarium|bird cage|guinzaglio|crocchette|lettiera|mascota|perro|gato)\b/i],
  ["Appliances", /\b(appliance|appliances|refrigerator|fridge|washing machine|dishwasher|microwave oven|vacuum cleaner|air conditioner|coffee machine|espresso machine|portable blender|kitchen blender|smoothie blender|toaster|elettrodomestici|frigorifero|lavatrice|lavastoviglie|aspirapolvere|electrodom[eé]sticos)\b/i],
  ["Tools & DIY", /\b(power tool|drill|saw|wrench|screwdriver|hardware|diy|home improvement|tool set|socket set|utensili|trapano|attrezzi|herramientas|taladro)\b/i],
  ["Books & Media", /\b(book|books|ebook|e-book|magazine|newspaper|ratgeber|guide|guides|dvd|blu[- ]?ray|music cd|vinyl record|libro|libri|rivista|libro digital|revista)\b/i],
  ["Food & Grocery", /\b(grocery|groceries|coffee beans|ground coffee|instant coffee|tea leaves|tea bags|loose leaf tea|coffee pods|coffee capsules|snack|beverage|olive oil|pasta|whipped honey|raw honey|honey gift set|honey jar|honey sticks|honey syrup|honeycomb|chocolate bar|chocolate candy|cocoa powder|alimentari|cibo|bevande|caff[eè]|alimentos|comida|bebida)\b/i],
  ["Garden", /\b(gardening|lawn|horticulture|garden hose|garden tools|garden supplies|garden planter|houseplant|flower seeds|vegetable seeds|grass seed|seed packets|fertilizer|potting soil|watering|planter|flower pot|giardinaggio|jardiner[ií]a)\b/i],
  ["Home & Living", /\b(furniture|kitchenware|kitchen|coffee mug|mug|tea strainer|strainer|bedding|duvet|pillow|home decor|decorative|homeware|household|scented candle|candle|diffuser|office chair|desk|dining table|sofa|couch|bed frame|shelf|bookcase|arredamento|cucina|mobili|tazza|casa|hogar|muebles|ropa de cama)\b/i],
  ["Travel", /\b(travel|luggage|suitcase|carry[- ]on|travel bag|airline|hotel|holiday|vacation|passport holder|valigia|bagaglio|borsa da viaggio|accessori viaggio|viaje|maleta|equipaje)\b/i],
  ["Office & Technology", /\b(software|stationery|office supplies|computer program|password manager|pc fresh|file cryptor|filecryptor|defragment|festplatte|registry cleaner|media downloader|mediatheken downloader|downloader|antibrowser|privacyfix|startupstar|backup software|windows utility|windows software|file recovery|dateien verschlüsseln|informatica|ufficio|papeler[ií]a|material de oficina)\b/i]
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
const HOME_DECOR_TITLE = /\b(candle|diffuser)\b/i;
const BABY_APPAREL_SIZE_TITLE = /\b(newborn|\d{1,2}\s+\d{1,2}\s*(?:m|months?)|\d{1,2}\s*(?:m|months?))\b/i;
const BEAUTY_PRODUCT_TITLE = /\b(body mist|body spray|hair dryer|travel dryer|hair regimen|curling iron|curling wand|false eyelashes|false lash(?:es)?|eyelashes|lash tint|lace tint|makeup bag|cosmetic bag)\b/i;
const MAKEUP_ITEM_TITLE = /\b(lipstick|lip stick|liquid lip|lip gloss|lip liner|lip balm|lip oil|lip stain|lip color|lip colour|lip tint|mascara|foundation|concealer|blush|eyeshadow|eye shadow|eyeliner|eye liner|kohl|brow pencil|eyebrow pencil|makeup|make up|cosmetic|cosmetics|nail polish|nail varnish|nail enamel|false eyelashes|false lashes|eyelashes|beauty blender|makeup brush|cosmetic brush|face palette|eye palette)\b/i;
const COSMETIC_ITEM_TITLE = /\b(lipstick|lip stick|lip gloss|lip liner|lip balm|lip oil|lip stain|mascara|foundation|concealer|blush|eyeshadow|eye shadow|eyeliner|eye liner|kohl|brow pencil|eyebrow pencil|makeup|make up|cosmetic|cosmetics|nail polish|nail varnish|nail enamel|false eyelashes|false lashes|eyelashes|beauty blender|makeup brush|cosmetic brush|face palette|eye palette|skin care|skincare|face cream|facial cream|face moisturizer|facial moisturizer|moisturizer|moisturiser|serum|toner|sunscreen|spf|micellar water|makeup remover|face cleanser|facial cleanser|eye cream|night cream|body lotion|body butter|body cream|hand cream|perfume|fragrance|eau de parfum|eau de toilette)\b/i;
const FASHION_ACCESSORY_TITLE = /\b(tote bag|toiletry bag|travel bag|hair loop|satchel|vacation top|earrings?|stud earrings?|jewell?ery|sleep bonnet|hair bonnet|headwrap)\b/i;
const TRAVEL_BEAUTY_TITLE = /\b(travel (?:set|spray|lotion|kit|trio|duo|hair regimen|dryer|must haves|selection|gift set)|travel friendly (?:ipl|hair removal)|travel system kit)\b/i;
const TRAVEL_HEALTH_TITLE = /\btravel well patch\b/i;
const BABY_CARE_TITLE = /\b(baby (?:wash|shampoo|lotion|cream|oil|butter|balm|wipes|massage oil|massage|sunscreen|sun cream|perfume|fragrance)|(?:eau de toilette|eau de parfum|perfume|fragrance) for baby|diaper rash|for baby)\b/i;
const HAIR_APPAREL_TITLE = /\b(wig|human hair|virgin hair|remy hair|peruvian hair|malaysian hair|loose wave|body wave|straight hair|hair bundles|bundles deal|hair weave|lace closure|lace frontal|hair extensions|hairpiece|hair piece|water wave|drawstring|no baby hair|pre cut lace|clip in|bangs|temples)\b/i;

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


const AUTOMOTIVE_VEHICLE_TITLE = /\b(used cars? for sale|new cars? for sale|cars? for sale|vehicle listings?|vehicles? for sale|car dealership|automotive dealership|sedan for sale|suv for sale|pickup truck for sale|electric car for sale)\b/i;
const AUTOMOTIVE_PARTS_TITLE = /\b(side mirror|wing mirror|rear view mirror|brake pad|brake disc|brake rotor|alternator|starter motor|spark plug|oil filter|air filter|fuel filter|timing belt|serpentine belt|shock absorber|strut|suspension arm|control arm|radiator|water pump|fuel pump|clutch kit|transmission|exhaust pipe|muffler|catalytic converter|headlight|tail light|taillight|turn signal|windshield wiper|wiper blade|bumper|fender|hood|grille|car battery|automotive battery|steering wheel cover|car charger|car mount|dash cam|carplay|motorcycle part|motorbike part|ricambi auto|pneumatic[oi]|cerchio in lega|specchietto|pastiglie freno|filtro olio|filtro aria|faro auto|tergicristallo|batteria auto|paraurti|cofano|frizione)\b/i;
const AUTOMOTIVE_ACCESSORY_TITLE = /\b(car accessory|auto accessory|vehicle accessory|car accessories|auto accessories|vehicle accessories|car interior|car organizer|car vacuum|car cover|car seat cover|floor mat|steering wheel cover|roof rack|roof box|bike rack|car phone holder|car cup holder|seat cushion|trunk organizer|boot liner|carpet mat|car fragrance|car air freshener|gps navigation|sat nav|parking sensor|reverse camera|backup camera|tire inflator|tyre inflator|jump starter|emergency kit|car tool kit|automotive accessory|accessori auto|accessorio auto)\b/i;
const AUTOMOTIVE_CARE_TITLE = /\b(car wash|car shampoo|car wax|car polish|car detailing|car cleaner|interior cleaner|wheel cleaner|tire shine|tyre shine|engine oil|motor oil|brake fluid|coolant|antifreeze|transmission fluid|car care|automotive paint|car touch up paint|lavaggio auto|olio motore|liquido freni)\b/i;

export function subcategoryFor(category, product = {}) {
  const title = textOf([product?.title, product?.englishTitle, product?.name, product?.brand].join(" "));
  const evidence = textOf([product?.productType, product?.googleProductCategory, product?.sourceCategory].join(" "));
  const text = title + " " + evidence;
  if (category === "Automotive") {
    if (AUTOMOTIVE_VEHICLE_TITLE.test(text)) return "Vehicles for Sale";
    if (/\b(tire|tyre|wheel rim|alloy wheel|steel wheel|wheel|rim|pneumatic|cerchione)\b/i.test(text)) return "Tires & Wheels";
    if (AUTOMOTIVE_PARTS_TITLE.test(text)) return "Replacement Parts";
    if (AUTOMOTIVE_ACCESSORY_TITLE.test(text)) return "Accessories";
    if (AUTOMOTIVE_CARE_TITLE.test(text)) return "Car Care & Fluids";
    
    if (/\b(motorcycle|motorbike|scooter|powersports|motocicletta|moto)\b/i.test(text)) return "Motorcycles & Powersports";
    if (/\b(tool|jack|lift|wrench|socket|diagnostic scanner|torque wrench|attrezzi)\b/i.test(text)) return "Tools & Equipment";
    return "Accessories";
  }
  const maps = {
    "Beauty": [[/\b(lipstick|lip gloss|mascara|foundation|concealer|eyeliner|blush|eyeshadow|nail polish|false lashes|makeup)\b/i,"Makeup"],[/\b(perfume|fragrance|eau de toilette|cologne|body mist)\b/i,"Fragrance"],[/\b(serum|face cream|moisturizer|cleanser|sunscreen|skincare|skin care)\b/i,"Skincare"],[/\b(shampoo|conditioner|hair oil|hair mask|hair spray)\b/i,"Hair Care"]],
    "Electronics": [[/\b(phone|smartphone|tablet|ipad)\b/i,"Phones & Tablets"],[/\b(laptop|notebook|desktop|computer|pc)\b/i,"Computers"],[/\b(camera|lens|webcam|dash cam)\b/i,"Cameras & Photography"],[/\b(headphones|earbuds|speaker|audio)\b/i,"Audio"]],
    "Fashion": [[/\b(shoes|sneakers|boots|sandals|heels)\b/i,"Shoes"],[/\b(handbag|tote|purse|wallet|backpack|luggage)\b/i,"Bags & Accessories"],[/\b(dress|shirt|trousers|jeans|jacket|apparel|clothing)\b/i,"Clothing"]]
  };
  for (const [pattern, name] of maps[category] || []) if (pattern.test(text)) return name;
  return "Other";
}

export function categoryFor(advertiser, product) {
  const title = textOf(product?.title || product?.englishTitle || product?.name || "");
  const merchantName = textOf(advertiser?.name || "");

  if (SERVICE_TITLE.test(title)) return "Other";
  if (AUTOMOTIVE_VEHICLE_TITLE.test(title) || AUTOMOTIVE_PARTS_TITLE.test(title) ||
      AUTOMOTIVE_ACCESSORY_TITLE.test(title) || AUTOMOTIVE_CARE_TITLE.test(title)) return "Automotive";
  if (HOME_DECOR_TITLE.test(title)) return "Home & Living";
  // A concrete cosmetic identity outranks weak marketing/model words such as
  // "baby", "babies", or a baby-themed brand/collection name.
  const structuredProductEvidence = textOf([
    product?.productType,
    product?.googleProductCategory,
    product?.sourceCategory
  ].join(" "));
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
