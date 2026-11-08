const RULES = [
  ["Beauty", /\b(perfume|parfum|fragrance|eau de toilette|eau de parfum|eau d ambiance|cologne|aftershave|cosmetic|cosmetics|make[- ]?up|lipstick|lip ?colour|lip ?color|lip ?gloss|lip ?liner|lip ?balm|lip ?polish|lip ?oil|lip ?stain|lip ?twist|mascara|foundation|concealer|blush|eyeshadows?|eye shadow|eyeliner|eye liner|eye pencil|kohl|brow pencil|eyebrow pencil|brow powder|brow gel|face palette|eyes? palette|makeup palette|luxury palette|face masks?|mud masks?|sheet masks?|eye masks?|under eye masks?|facial|face wash|face cleanser|cleanser|skincare|skin care|skin health|moisturi[sz](?:e|er|ing|ation)|face cream|night cream|eye cream|hand cream|body cream|face powder|contour powder|serum|toner|sunscreen|spf|bb cream|beauty|teeth whitening|tooth whitening|masque|face massage|nail polish|nail varnish|nail enamel|nail care|shampoo|conditioner|hair dye|hair masque|hair mask|hair treatment|hair spray|hair gel|hair serum|hair oil|body lotion|body wash|body polish|shower gel|shower foam|deodorant|soap|essential oil|bath bombs?|gua sha|face roller|derma roller|exfoliat(?:ing|or)|lip twist|makeup brush|cosmetic brush|blender brush|profumo|profumi|cosmetico|cosmetici|cosmetica|trucco|rossetto|crema viso|crema corpo|siero|detergente viso|protezione solare|smalto|balsamo|dopobarba|belleza|maquillaje|crema facial|protector solar)\b/i],
  ["Health & Wellness", /\b(health|wellness|medical|first aid|medical device|mobility aid|vitamins?|supplements?|capsules?|tablets?|thermometer|blood pressure|mosquito repellent|insect repellent|repellent patches|scar gel|teeth whitening|tooth whitening|immune support|stress related hair loss|salute|benessere|medicale|salud|bienestar)\b/i],
  ["Electronics", /\b(digital camera|camera|dslr|mirrorless|action camera|camcorder|webcam|camera lens|photographic|photography|photo camera|macchina fotografica|fotocamera|obiettivo fotografico|videocamera|action cam|smartphone|mobile phone|cell phone|tablet computer|tablet pc|ipad|laptop|notebook|desktop computer|computer|monitor|television|tv|headphones|earbuds|speaker|audio|drone|projector|printer|keyboard|computer mouse|electronics|electronic|memory card|micro sd|microsd[a-z]*|sd card|monocular|night vision|dash cam|dashcam|baby monitor|carplay|android auto adapter|gps logger|wireless charging station|micro sd|c[aá]mara digital|c[aá]mara|tel[eé]fono m[oó]vil|ordenador|auriculares)\b/i],
  ["Automotive", /\b(automotive|automobile|car parts|vehicle|car accessories|auto parts|car mount|car charger|car air freshener|suction cup mount|camera mount|carplay|dash cam mount|motorcycle parts|motorbike accessories|ricambi auto|accessori auto|motocicletta|autom[oó]vil|repuestos de coche)\b/i],
  ["Sports", /\b(sport|sports|fitness|padel|tennis|racket|racquet|overgrip|golf|gym|cycling|athletic|exercise|running|yoga|palestra|ciclismo|deporte|deportes|raqueta)\b/i],
  ["Fashion", /\b(swimwear|swimsuit|swim suit|bikini|tankini|cover[- ]?up|clothing|apparel|footwear|shoes|sneakers|mules?|sandals?|boots?|heels?|handbag|jewelry|garment|dress|shirt|t[- ]?shirt|trousers|pants|jacket|robe|fashion accessory|wig|wigs|human hair|hair bundles|lace closure|lace frontal|hair extensions|hairpiece|hair piece|hair tie|scrunchie|sunglasses|eyewear|water wave|drawstring|no baby hair|pre cut lace|camiseta|sudadera|falda|pantal[oó]n|chaqueta|abbigliamento|scarpe|vestito|borsa|gioielli|ropa|calzado|vestido|bolso|peluca)\b/i],
  ["Toys & Games", /\b(toy|toys|board game|puzzle|doll|action figure|building blocks|lego|playset|stuffed animal|plush toy|video game|gaming|giocattolo|giocattoli|gioco da tavolo|bambola|pupazzo|juguete|juguetes|muñeca|rompecabezas)\b/i],
  ["Babies", /\b(baby|babies|infant|newborn|nursery|diaper|nappy|toddler|stroller|pushchair|car seat|sleep sack|pannolino|passeggino|neonato|prima infanzia|beb[eé]|reci[eé]n nacido|cochecito)\b/i],
  ["Pets", /\b(pet|pets|pet food|dog food|cat food|cat litter|dog leash|dog collar|cat collar|pet carrier|pet shampoo|pet spray|pet bed|aquarium|bird cage|guinzaglio|crocchette|lettiera|mascota|perro|gato)\b/i],
  ["Appliances", /\b(appliance|appliances|refrigerator|fridge|washing machine|dishwasher|microwave oven|vacuum cleaner|air conditioner|coffee machine|espresso machine|portable blender|kitchen blender|smoothie blender|toaster|elettrodomestici|frigorifero|lavatrice|lavastoviglie|aspirapolvere|electrodom[eé]sticos)\b/i],
  ["Tools & DIY", /\b(power tool|drill|saw|wrench|screwdriver|hardware|diy|home improvement|tool set|socket set|utensili|trapano|attrezzi|herramientas|taladro)\b/i],
  ["Books & Media", /\b(book|books|ebook|e-book|magazine|newspaper|dvd|blu[- ]?ray|music cd|vinyl record|libro|libri|rivista|libro digital|revista)\b/i],
  ["Food & Grocery", /\b(food|grocery|groceries|coffee beans|ground coffee|instant coffee|tea leaves|tea bags|loose leaf tea|coffee pods|coffee capsules|snack|beverage|olive oil|pasta|honey|honeycomb|chocolate bar|chocolate candy|cocoa powder|alimentari|cibo|bevande|caff[eè]|alimentos|comida|bebida)\b/i],
  ["Garden", /\b(garden|gardening|lawn|horticulture|garden hose|houseplant|seeds?|fertilizer|potting soil|watering|planter|flower pot|giardinaggio|giardino|jard[ií]n|jardiner[ií]a)\b/i],
  ["Home & Living", /\b(furniture|kitchenware|kitchen|coffee mug|mug|tea strainer|strainer|bedding|duvet|pillow|home decor|decorative|homeware|household|office chair|desk|dining table|sofa|couch|bed frame|shelf|bookcase|arredamento|cucina|mobili|tazza|casa|hogar|muebles|ropa de cama)\b/i],
  ["Travel", /\b(travel|luggage|suitcase|carry[- ]on|travel bag|airline|hotel|holiday|vacation|passport holder|valigia|bagaglio|borsa da viaggio|accessori viaggio|viaje|maleta|equipaje)\b/i],
  ["Office & Technology", /\b(software|stationery|office supplies|computer program|password manager|file cryptor|filecryptor|defragment|festplatte|registry cleaner|media downloader|antibrowser|privacyfix|startupstar|backup software|windows utility|windows software|file recovery|dateien verschlüsseln|informatica|ufficio|papeler[ií]a|material de oficina)\b/i]
];

const ADVERTISER_RULES = [
  ["Beauty", /\b(beauty|cosmetic|cosmetics|ecosmetics|fragrance|perfume)\b/i],
  ["Electronics", /\b(electronic|camera|photography|computer|technology)\b/i],
  ["Babies", /\b(baby|babies|infant)\b/i],
  ["Pets", /\b(pet|pets)\b/i],
  ["Automotive", /\b(automotive|automobile|vehicle)\b/i],
  ["Sports", /\b(sport|sports|fitness|padel|tennis)\b/i],
  ["Travel", /\b(travel|luggage|airline|hotel|holiday)\b/i],
  ["Fashion", /\b(fashion|clothing|apparel)\b/i],
  ["Home & Living", /\b(home|living|furniture|kitchen)\b/i],
  ["Office & Technology", /\b(office|software|technology|abelssoft)\b/i]
];

const SERVICE_TITLE = /\b(installation service|setup service|repair service|professional service|service fee)\b/i;
const FRAGRANCE_DESCRIPTION = /\b(eau de parfum|eau de toilette|fragrance|perfume|parfum|cologne)\b/i;

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

export function categoryFor(advertiser, product) {
  const title = textOf(product?.title || product?.englishTitle || product?.name || "");
  const description = textOf(product?.description || "");

  if (SERVICE_TITLE.test(title)) return "Other";
  if (/\btoy boy\b/i.test(title) && FRAGRANCE_DESCRIPTION.test(description)) return "Beauty";

  const cameraSafeTitle = title.replace(/\bcamera ready\b/g, " ");
  const titleMatch = matchRule(cameraSafeTitle, RULES);
  if (titleMatch) return titleMatch;

  // Trust only actual structured taxonomy fields; never reuse ZOVARO's old category.
  const structured = textOf([product?.productType, product?.googleProductCategory].join(" "));
  const structuredMatch = matchRule(structured, RULES);
  if (structuredMatch) return structuredMatch;

  // Descriptions are only used when they contain strong product-identity clues.
  const descriptionRules = [
    ["Beauty", /\b(perfume|parfum|fragrance|eau de toilette|eau de parfum|lipstick|lip balm|lip colour|lip color|mascara|eyeliner|eyeshadow|face mask|mud mask|face wash|face cream|eye cream|hair masque|hair mask|hair treatment|hair gel|hair spray|shampoo|conditioner|body lotion|body wash|sunscreen|gua sha|face roller|makeup brush|cosmetic brush)\b/i],
    ["Electronics", /\b(digital camera|dash cam|dashcam|memory card|micro sd|microsd|monocular|night vision|gps logger|baby monitor|wireless charging|carplay|android auto adapter|smartphone|laptop|computer|headphones|drone)\b/i],
    ["Health & Wellness", /\b(vitamin|supplement|capsules?|tablets?|thermometer|blood pressure|mosquito repellent|insect repellent|teeth whitening|medical device)\b/i],
    ["Appliances", /\b(refrigerator|washing machine|dishwasher|vacuum cleaner|air conditioner|espresso machine|portable blender|kitchen blender|toaster)\b/i],
    ["Food & Grocery", /\b(coffee beans|ground coffee|tea leaves|honey|honeycomb|olive oil|pasta|snack|beverage|chocolate bar|cocoa powder)\b/i],
    ["Sports", /\b(padel racket|tennis racket|golf club|fitness equipment|exercise bike|yoga mat|overgrip)\b/i],
    ["Pets", /\b(pet food|dog food|cat food|cat litter|dog leash|pet shampoo|pet carrier|aquarium)\b/i]
  ];
  const descriptionMatch = matchRule(description, descriptionRules);
  if (descriptionMatch) return descriptionMatch;

  const advertiserText = textOf([
    advertiser?.name,
    advertiser?.parentCategory,
    advertiser?.childCategory
  ].join(" "));
  return matchRule(advertiserText, ADVERTISER_RULES) || "Other";
}
