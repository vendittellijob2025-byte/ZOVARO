const RULES = [
  // Beauty wins over words that can also be part of product names (Toy, Book, Sport).
  ["Beauty", /\b(perfume|parfum|fragrance|eau de toilette|eau de parfum|cologne|aftershave|cosmetic|cosmetics|make[- ]?up|lipstick|lip ?gloss|lip ?liner|lip ?balm|lip ?polish|mascara|foundation|concealer|blush|eyeshadow|eye shadow|eyeliner|eye liner|face palette|eyes? palette|makeup palette|face mask|mud mask|sheet mask|eye mask|under eye mask|facial|face wash|face cleanser|cleanser|skincare|skin care|moisturi[sz](?:e|er|ing|ation)|face cream|eye cream|hand cream|body cream|serum|toner|sunscreen|beauty|nail polish|nail varnish|nail care|shampoo|conditioner|hair dye|body lotion|body wash|shower foam|deodorant|soap|essential oil|bath bomb|makeup brush|cosmetic brush|profumo|profumi|cosmetico|cosmetici|cosmetica|trucco|rossetto|crema viso|crema corpo|siero|detergente viso|protezione solare|smalto|balsamo|dopobarba|belleza|maquillaje|crema facial|protector solar)\b/i],
  ["Electronics", /\b(digital camera|camera|dslr|mirrorless|action camera|camcorder|webcam|camera lens|photographic|photography|photo camera|macchina fotografica|fotocamera|obiettivo fotografico|videocamera|action cam|smartphone|mobile phone|cell phone|tablet|laptop|notebook|desktop computer|computer|monitor|television|tv|headphones|earbuds|speaker|audio|drone|projector|printer|keyboard|computer mouse|electronics|electronic|memory card|microsd|sd card|monocular|night vision|dash cam|dashcam|micro sd|c[aá]mara digital|c[aá]mara|tel[eé]fono m[oó]vil|ordenador|auriculares)\b/i],
  ["Automotive", /\b(automotive|automobile|car parts|vehicle|motorcycle|motorbike|car accessories|auto parts|ricambi auto|accessori auto|motocicletta|autom[oó]vil|repuestos de coche|car charger|dash cam mount)\b/i],
  ["Sports", /\b(sport|sports|fitness|padel|tennis|racket|racquet|golf|gym|cycling|athletic|exercise|running|yoga|palestra|ciclismo|deporte|deportes|raqueta)\b/i],
  ["Fashion", /\b(swimwear|swimsuit|swim suit|bikini|tankini|cover[- ]?up|clothing|apparel|footwear|shoes|sneakers|handbag|jewelry|garment|dress|shirt|trousers|jacket|fashion accessory|wig|wigs|hair extensions|abbigliamento|scarpe|vestito|borsa|gioielli|ropa|calzado|vestido|bolso|peluca)\b/i],
  ["Toys & Games", /\b(toy|toys|board game|puzzle|doll|action figure|building blocks|lego|playset|stuffed animal|plush toy|video game|gaming|giocattolo|giocattoli|gioco da tavolo|bambola|pupazzo|juguete|juguetes|muñeca|rompecabezas)\b/i],
  ["Babies", /\b(baby|babies|infant|newborn|nursery|diaper|nappy|toddler|stroller|pushchair|car seat|baby monitor|sleep sack|pannolino|passeggino|neonato|prima infanzia|beb[eé]|reci[eé]n nacido|cochecito)\b/i],
  ["Pets", /\b(pet|pets|dog|dogs|cat|cats|canine|feline|aquarium|bird cage|pet food|dog food|cat food|guinzaglio|crocchette|lettiera|mascota|perro|gato)\b/i],
  ["Appliances", /\b(appliance|appliances|refrigerator|fridge|washing machine|dishwasher|microwave oven|vacuum cleaner|air conditioner|coffee machine|espresso machine|blender|toaster|elettrodomestici|frigorifero|lavatrice|lavastoviglie|aspirapolvere|electrodom[eé]sticos)\b/i],
  ["Tools & DIY", /\b(tool|tools|power tool|drill|saw|wrench|screwdriver|hardware|diy|home improvement|utensili|trapano|attrezzi|herramientas|taladro)\b/i],
  ["Books & Media", /\b(book|books|ebook|e-book|magazine|newspaper|dvd|blu[- ]?ray|music cd|vinyl record|libro|libri|rivista|libro digital|revista)\b/i],
  ["Food & Grocery", /\b(food|grocery|groceries|coffee beans|ground coffee|instant coffee|tea leaves|snack|beverage|olive oil|pasta|chocolate|alimentari|cibo|bevande|caff[eè]|alimentos|comida|bebida)\b/i],
  ["Health & Wellness", /\b(health|wellness|medical|first aid|medical device|mobility aid|vitamin|supplement|salute|benessere|medicale|salud|bienestar)\b/i],
  ["Garden", /\b(garden|gardening|plant|plants|lawn|horticulture|giardinaggio|pianta|piante|jard[ií]n|jardiner[ií]a)\b/i],
  ["Home & Living", /\b(furniture|kitchenware|kitchen|coffee mug|mug|cup|tea strainer|strainer|bedding|duvet|pillow|home decor|decorative|homeware|household|office chair|desk|dining table|sofa|couch|bed frame|shelf|bookcase|arredamento|cucina|mobili|tazza|casa|hogar|muebles|taza|ropa de cama)\b/i],
  ["Travel", /\b(travel|luggage|suitcase|carry[- ]on|travel bag|airline|hotel|holiday|vacation|passport holder|valigia|bagaglio|borsa da viaggio|accessori viaggio|viaje|maleta|equipaje)\b/i],
  ["Office & Technology", /\b(software|stationery|office supplies|ufficio|informatica|papeler[ií]a|material de oficina)\b/i]
];

const ADVERTISER_RULES = [
  ["Beauty", /\b(beauty|cosmetic|fragrance|perfume)\b/i],
  ["Electronics", /\b(electronic|camera|photography|computer|technology)\b/i],
  ["Babies", /\b(baby|babies|infant)\b/i],
  ["Pets", /\b(pet|pets)\b/i],
  ["Automotive", /\b(automotive|automobile|vehicle)\b/i],
  ["Sports", /\b(sport|sports|fitness|padel|tennis)\b/i],
  ["Travel", /\b(travel|luggage|airline|hotel|holiday)\b/i],
  ["Fashion", /\b(fashion|clothing|apparel)\b/i],
  ["Home & Living", /\b(home|living|furniture|kitchen)\b/i],
  ["Office & Technology", /\b(office|software|technology)\b/i]
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
  const title = textOf([product?.title, product?.englishTitle, product?.name].join(" "));
  const description = textOf(product?.description || "");

  // Services are not books or physical goods, even if a merchant uses a book-like label.
  if (SERVICE_TITLE.test(title)) return "Other";

  // "Toy Boy" is a fragrance name; product description resolves this brand-specific ambiguity.
  if (/\btoy boy\b/i.test(title) && FRAGRANCE_DESCRIPTION.test(description)) return "Beauty";

  // Remove the hair/bridal marketing phrase "camera ready" before detecting actual cameras.
  const cameraSafeTitle = title.replace(/\bcamera ready\b/g, " ");
  const titleMatch = matchRule(cameraSafeTitle, RULES);
  if (titleMatch) return titleMatch;

  // Only true structured taxonomy fields are trusted. Never reuse category/sourceCategory:
  // those fields may contain an earlier ZOVARO classification and cause self-reinforcing errors.
  const structured = textOf([
    product?.productType,
    product?.googleProductCategory
  ].join(" "));
  const structuredMatch = matchRule(structured, RULES);
  if (structuredMatch) return structuredMatch;

  const descriptionSafe = description.replace(/\bcamera ready\b/g, " ");
  const descriptionMatch = matchRule(descriptionSafe, RULES);
  if (descriptionMatch) return descriptionMatch;

  const advertiserText = textOf([
    advertiser?.name,
    advertiser?.parentCategory,
    advertiser?.childCategory
  ].join(" "));
  return matchRule(advertiserText, ADVERTISER_RULES) || "Other";
}
