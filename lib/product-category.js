const RULES = [
  ["Beauty", /\b(perfume|parfum|fragrance|eau de toilette|eau de parfum|cologne|aftershave|cosmetic|cosmetics|make[- ]?up|lipstick|mascara|foundation|concealer|blush|eyeshadow|skincare|skin care|moisturi[sz](?:e|er|ing|ation)|face cream|body cream|serum|toner|cleanser|sunscreen|beauty|nail polish|nail varnish|shampoo|conditioner|hair dye|body lotion|deodorant|soap|essential oil|profumo|profumi|cosmetico|cosmetici|cosmetica|trucco|rossetto|crema viso|crema corpo|siero|detergente viso|protezione solare|smalto|balsamo|dopobarba|belleza|perfume|maquillaje|crema facial|protector solar)\b/i],
  ["Electronics", /\b(digital camera|camera|dslr|mirrorless|action camera|camcorder|webcam|camera lens|photographic|photography|photo camera|macchina fotografica|fotocamera|obiettivo fotografico|videocamera|action cam|smartphone|mobile phone|cell phone|tablet|laptop|notebook|desktop computer|computer|monitor|television|tv|headphones|earbuds|speaker|audio|drone|projector|printer|keyboard|computer mouse|electronics|electronic|c[aá]mara digital|c[aá]mara|tel[eé]fono m[oó]vil|ordenador|auriculares)\b/i],
  ["Toys & Games", /\b(toy|toys|board game|puzzle|doll|action figure|building blocks|lego|playset|stuffed animal|plush toy|video game|gaming|giocattolo|giocattoli|gioco da tavolo|bambola|pupazzo|juguete|juguetes|muñeca|rompecabezas)\b/i],
  ["Babies", /\b(baby|babies|infant|newborn|nursery|diaper|nappy|toddler|stroller|pushchair|car seat|baby monitor|pannolino|passeggino|neonato|prima infanzia|beb[eé]|reci[eé]n nacido|cochecito)\b/i],
  ["Pets", /\b(pet|pets|dog|dogs|cat|cats|canine|feline|aquarium|bird cage|guinzaglio|crocchette|lettiera|mascota|perro|gato)\b/i],
  ["Automotive", /\b(automotive|automobile|car parts|vehicle|motorcycle|motorbike|car accessories|auto parts|ricambi auto|accessori auto|motocicletta|autom[oó]vil|repuestos de coche)\b/i],
  ["Sports", /\b(sport|sports|fitness|padel|tennis|racket|racquet|golf|gym|cycling|athletic|exercise|running|yoga|palestra|ciclismo|deporte|deportes|raqueta)\b/i],
  ["Appliances", /\b(appliance|appliances|refrigerator|fridge|washing machine|dishwasher|microwave oven|vacuum cleaner|air conditioner|coffee machine|blender|toaster|elettrodomestici|frigorifero|lavatrice|lavastoviglie|aspirapolvere|electrodom[eé]sticos)\b/i],
  ["Tools & DIY", /\b(tool|tools|power tool|drill|saw|wrench|screwdriver|hardware|diy|home improvement|utensili|trapano|attrezzi|herramientas|taladro)\b/i],
  ["Books & Media", /\b(book|books|ebook|e-book|magazine|newspaper|dvd|blu[- ]?ray|music cd|vinyl record|libro|libri|rivista|libro digital|revista)\b/i],
  ["Food & Grocery", /\b(food|grocery|groceries|coffee beans|ground coffee|coffee grounds|instant coffee|tea leaves|snack|beverage|olive oil|pasta|chocolate|alimentari|cibo|bevande|caff[eè]|alimentos|comida|bebida)\b/i],
  ["Health & Wellness", /\b(health|wellness|medical|first aid|medical device|mobility aid|vitamin|supplement|salute|benessere|medicale|salud|bienestar)\b/i],
  ["Fashion", /\b(fashion|clothing|apparel|footwear|shoes|sneakers|handbag|jewelry|garment|dress|shirt|trousers|jacket|fashion accessory|abbigliamento|scarpe|vestito|borsa|gioielli|ropa|calzado|vestido|bolso|peluca|wigs?|hair extensions)\b/i],
  ["Garden", /\b(garden|gardening|plant|plants|lawn|horticulture|giardinaggio|pianta|piante|jard[ií]n|jardiner[ií]a)\b/i],
  ["Home & Living", /\b(furniture|kitchenware|kitchen|coffee mug|mug|cup|bedding|duvet|pillow|home decor|decorative|homeware|household|arredamento|cucina|mobili|tazza|casa|hogar|muebles|taza|ropa de cama)\b/i]
  ["Travel", /\b(travel|luggage|suitcase|carry[- ]on|travel bag|airline|hotel|holiday|vacation|passport holder|valigia|bagaglio|borsa da viaggio|accessori viaggio|viaje|maleta|equipaje)\b/i],
  ["Office & Technology", /\b(software|stationery|office supplies|ufficio|software|informatica|papeler[ií]a|material de oficina)\b/i],
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
  // Strongest evidence first: what the item is called, not the merchant's business.
  const title = textOf([product?.title, product?.englishTitle, product?.name].join(" "));
  const titleMatch = matchRule(title, RULES);
  if (titleMatch) return titleMatch;

  // Structured product taxonomy is more reliable than descriptive marketing copy.
  const structured = textOf([
    product?.productType,
    product?.googleProductCategory,
    product?.category
  ].join(" "));
  const structuredMatch = matchRule(structured, RULES);
  if (structuredMatch) return structuredMatch;

  // Descriptions are a fallback: ignore generic brand/merchant marketing language.
  const description = textOf(product?.description || "");
  const descriptionMatch = matchRule(description, RULES);
  if (descriptionMatch) return descriptionMatch;

  // Advertiser taxonomy is the final fallback only.
  const advertiserText = textOf([
    advertiser?.name,
    advertiser?.parentCategory,
    advertiser?.childCategory
  ].join(" "));
  return matchRule(advertiserText, ADVERTISER_RULES) || "Other";
}
