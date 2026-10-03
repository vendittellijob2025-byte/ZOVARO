import fs from "node:fs/promises";

const CATALOG_PATH = "data/catalog.json";
const SELECTED_PATH = "data/selected-product.json";
const SELECTED_PRODUCTS_PATH = "data/selected-products.json";

const catalogText = await fs.readFile(CATALOG_PATH, "utf8");
const catalog = JSON.parse(catalogText);

const products = Array.isArray(catalog.products)
  ? catalog.products
  : [];

const validProducts = products.filter(product => {
  return (
    product &&
    product.id &&
    product.title &&
    product.imageLink &&
    product.clickUrl &&
    product.joinedStatus === true
  );
});

if (!validProducts.length) {
  throw new Error("No valid CJ products available for promotion.");
}

const hasDiscount = product => {
  const discountPercentage =
    Number(product.discountPercentage);

  if (
    Number.isFinite(discountPercentage) &&
    discountPercentage > 0
  ) {
    return true;
  }

  const price = Number(product.price);
  const salePrice = Number(product.salePrice);

  return (
    Number.isFinite(price) &&
    Number.isFinite(salePrice) &&
    price > 0 &&
    salePrice > 0 &&
    salePrice < price
  );
};

const today =
  new Date().toISOString().slice(0, 10);

let hash = 0;

for (const character of today) {
  hash =
    (hash * 31 +
      character.charCodeAt(0)) >>>
    0;
}

const discountedProducts =
  validProducts.filter(hasDiscount);

const regularProducts =
  validProducts.filter(product =>
    !hasDiscount(product)
  );

const preferredPool =
  discountedProducts.length >= 6
    ? discountedProducts
    : [
        ...discountedProducts,
        ...regularProducts
      ];

const shuffled = [...preferredPool];

let seed = hash;

for (let i = shuffled.length - 1; i > 0; i--) {
  seed =
    (seed * 1664525 + 1013904223) >>>
    0;

  const j = seed % (i + 1);

  [
    shuffled[i],
    shuffled[j]
  ] = [
    shuffled[j],
    shuffled[i]
  ];
}

const selectedProducts =
  shuffled.slice(
    0,
    Math.min(6, shuffled.length)
  );

if (!selectedProducts.length) {
  throw new Error(
    "Unable to select products for promotion."
  );
}

const selectedData =
  selectedProducts.map(product => ({
    selectedAt:
      new Date().toISOString(),
    date: today,
    source: product.source,
    network: product.network,
    productId: product.id,
    title: product.title,
    description: product.description,
    brand: product.brand,
    advertiserId: product.advertiserId,
    advertiserName: product.advertiserName,
    category: product.category,
    imageLink: product.imageLink,
    price: product.price,
    salePrice: product.salePrice,
    currency: product.currency,
    discountPercentage:
      product.discountPercentage,
    destination: product.destination,
    clickUrl: product.clickUrl
  }));

await fs.writeFile(
  SELECTED_PRODUCTS_PATH,
  JSON.stringify(
    {
      date: today,
      productCount:
        selectedData.length,
      products: selectedData
    },
    null,
    2
  ),
  "utf8"
);

// Keep the first selected product in the
// existing file so the current workflow
// remains compatible until the next step.
await fs.writeFile(
  SELECTED_PATH,
  JSON.stringify(
    selectedData[0],
    null,
    2
  ),
  "utf8"
);

console.log(
  "ZOVARO automatic selection completed."
);

console.log(
  `Selected ${selectedData.length} products for the daily TikTok video.`
);

selectedData.forEach(
  (product, index) => {
    console.log(
      `${index + 1}. ${product.title}`
    );
    console.log(
      `   Advertiser: ${product.advertiserName || "N/A"}`
    );
    console.log(
      `   Discount: ${product.discountPercentage || 0}%`
    );
  }
);

console.log(
  `Saved to: ${SELECTED_PRODUCTS_PATH}`
);

console.log(
  `Compatibility file: ${SELECTED_PATH}`
);
