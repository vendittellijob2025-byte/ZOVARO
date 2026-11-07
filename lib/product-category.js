const RULES = [
  ["Beauty", /\b(perfume|parfum|fragrance|eau de toilette|eau de parfum|cologne|aftershave|cosmetic|cosmetics|make[- ]?up|lipstick|mascara|foundation|concealer|blush|eyeshadow|skincare|skin care|moisturizer|moisturiser|serum|toner|cleanser|sunscreen|sunscreen|beauty|nail polish|nail varnish|shampoo|conditioner|hair dye|body lotion|deodorant|soap|essential oil|profumo|profumi|cosmetico|cosmetici|cosmetica|trucco|rossetto|mascara|crema viso|crema corpo|siero|detergente viso|protezione solare|smalto|shampoo|balsamo|dopobarba)\b/i],
  ["Electronics", /\b(digital camera|camera|dslr|mirrorless|action camera|camcorder|webcam|lens|camera lens|photographic|photography|photo camera|macchina fotografica|fotocamera|obiettivo fotografico|videocamera|action cam|smartphone|mobile phone|cell phone|tablet|laptop|notebook|computer|monitor|television|tv|headphones|earbuds|speaker|audio|drone|projector|printer|keyboard|mouse|electronics|electronic)\b/i],
  ["Babies", /\b(baby|babies|infant|newborn|nursery|diaper|nappy|toddler|stroller|pushchair|car seat|baby monitor|pannolino|passeggino|neonato|prima infanzia)\b/i],
  ["Pets", /\b(pet|pets|dog|dogs|cat|cats|canine|feline|aquarium|bird cage|guinzaglio|crocchette|lettiera)\b/i],
  ["Automotive", /\b(automotive|automobile|car parts|vehicle|motorcycle|motorbike|car accessories|auto parts|ricambi auto|accessori auto|motocicletta)\b/i],
  ["Sports", /\b(sport|sports|fitness|padel|tennis|racket|racquet|golf|gym|cycling|athletic|exercise|running|yoga|palestra|ciclismo)\b/i],
  ["Travel", /\b(travel|luggage|suitcase|carry[- ]on|travel bag|airline|hotel|holiday|vacation|passport holder|valigia|bagaglio|borsa da viaggio|accessori viaggio)\b/i],
  ["Garden", /\b(garden|gardening|plant|plants|lawn|horticulture|giardinaggio|pianta|piante)\b/i],
  ["Toys & Games", /\b(toy|toys|board game|puzzle|doll|action figure|building blocks|lego|playset|stuffed animal|plush toy|video game|gaming|giocattolo|giocattoli|gioco da tavolo|bambola|pupazzo)\b/i],
  ["Fashion", /\b(fashion|clothing|apparel|footwear|shoes|sneakers|handbag|jewelry|garment|dress|shirt|trousers|jacket|fashion accessory|abbigliamento|scarpe|vestito|borsa|gioielli)\b/i],
  ["Office & Technology", /\b(office|software|computer|laptop|printer|keyboard|mouse|technology|tech|stationery|ufficio|software|informatica)\b/i],
  ["Home & Living", /\b(home|living|furniture|kitchen|bedding|decor|homeware|household|arredamento|cucina|casa|mobili)\b/i]
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
  ["Home & Living", /\b(home|living|furniture|kitchen)\b/i]
];

function textOf(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[^\p{L}\p{N}]+/gu, " ").toLowerCase().trim();
}

export function categoryFor(advertiser, product) {
  // Only the product's own attributes decide its primary category.
  // Advertiser/feed taxonomy is a fallback, never allowed to override a product signal.
  const productText = textOf([
    product?.category, product?.title, product?.description,
    product?.brand, product?.productType, product?.googleProductCategory
  ].join(" "));
  for (const [category, pattern] of RULES) {
    if (pattern.test(productText)) return category;
  }

  const advertiserText = textOf([
    advertiser?.name, advertiser?.parentCategory, advertiser?.childCategory
  ].join(" "));
  for (const [category, pattern] of ADVERTISER_RULES) {
    if (pattern.test(advertiserText)) return category;
  }
  return "Home & Living";
}
