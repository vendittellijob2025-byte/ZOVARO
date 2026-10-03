import fs from "node:fs/promises";

const CATALOG_PATH = "data/catalog.json";
const SELECTED_PATH = "data/selected-product.json";
const SELECTED_PRODUCTS_PATH = "data/selected-products.json";

const catalogText =
  await fs.readFile(
    CATALOG_PATH,
    "utf8"
  );

const catalog =
  JSON.parse(catalogText);

const products =
  Array.isArray(catalog.products)
    ? catalog.products
    : [];


const validProducts =
  products.filter(product => {

    return (
      product &&
      product.id &&
      product.imageLink &&
      product.clickUrl &&
      product.joinedStatus === true
    );

  });


if (!validProducts.length) {
  throw new Error(
    "No valid CJ products available for promotion."
  );
}


/* =========================================================
   DISCOUNT DETECTION
   ========================================================= */

const hasDiscount = product => {

  const discountPercentage =
    Number(
      product.discountPercentage
    );

  if (
    Number.isFinite(
      discountPercentage
    ) &&
    discountPercentage > 0
  ) {
    return true;
  }


  const price =
    Number(product.price);

  const salePrice =
    Number(product.salePrice);


  return (
    Number.isFinite(price) &&
    Number.isFinite(salePrice) &&
    price > 0 &&
    salePrice > 0 &&
    salePrice < price
  );

};


/* =========================================================
   DAILY DETERMINISTIC SEED
   ========================================================= */

const today =
  new Date()
    .toISOString()
    .slice(0, 10);

let hash = 0;

for (
  const character of today
) {

  hash =
    (
      hash * 31 +
      character.charCodeAt(0)
    ) >>> 0;

}


/* =========================================================
   SHUFFLE
   ========================================================= */

function shuffle(items) {

  const result =
    [...items];

  let seed =
    hash;

  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {

    seed =
      (
        seed * 1664525 +
        1013904223
      ) >>> 0;

    const j =
      seed % (i + 1);

    [
      result[i],
      result[j]
    ] = [
      result[j],
      result[i]
    ];

  }

  return result;

}


/* =========================================================
   PRIORITY POOLS
   ========================================================= */

const discountedProducts =
  validProducts.filter(
    hasDiscount
  );

const regularProducts =
  validProducts.filter(
    product =>
      !hasDiscount(product)
  );


/*
  Prefer discounted products.

  SalePrice must be > 0,
  therefore products with
  salePrice = 0 are never
  treated as real deals.
*/

const preferredPool =
  discountedProducts.length >= 8
    ? discountedProducts
    : [
        ...discountedProducts,
        ...regularProducts
      ];


/* =========================================================
   ADVERTISER DIVERSITY
   ========================================================= */

const shuffledPool =
  shuffle(
    preferredPool
  );


const selectedProducts = [];

const usedAdvertisers =
  new Set();


/*
  First pass:
  try to select different
  advertisers.
*/

for (
  const product of shuffledPool
) {

  const advertiser =
    String(
      product.advertiserId ||
      product.advertiserName ||
      "unknown"
    );


  if (
    usedAdvertisers.has(
      advertiser
    )
  ) {
    continue;
  }


  selectedProducts.push(
    product
  );

  usedAdvertisers.add(
    advertiser
  );


  if (
    selectedProducts.length >= 8
  ) {
    break;
  }

}


/*
  Second pass:
  if fewer than 8 advertisers
  are available, fill the
  remaining positions with
  other valid products.
*/

if (
  selectedProducts.length < 8
) {

  for (
    const product of shuffledPool
  ) {

    if (
      selectedProducts.includes(
        product
      )
    ) {
      continue;
    }


    selectedProducts.push(
      product
    );


    if (
      selectedProducts.length >= 8
    ) {
      break;
    }

  }

}


if (
  !selectedProducts.length
) {

  throw new Error(
    "Unable to select products for promotion."
  );

}


/* =========================================================
   ENGLISH CONTENT
   ========================================================= */

const selectedData =
  selectedProducts.map(
    product => {

      const englishTitle =
        product.englishTitle ||
        product.title ||
        product.brand ||
        product.advertiserName ||
        "ZOVARO Offer";


      const englishDescription =
        product.englishDescription ||
        product.description ||
        `${product.brand ? product.brand + " — " : ""}${englishTitle}`;


      const englishCategory =
        product.englishCategory ||
        product.category ||
        "Featured";


      return {

        selectedAt:
          new Date().toISOString(),

        date:
          today,

        source:
          product.source,

        network:
          product.network,

        productId:
          product.id,

        title:
          englishTitle,

        description:
          englishDescription,

        brand:
          product.brand,

        advertiserId:
          product.advertiserId,

        advertiserName:
          product.advertiserName,

        category:
          englishCategory,

        imageLink:
          product.imageLink,

        additionalImageLinks:
          product.additionalImageLinks,

        price:
          product.price,

        salePrice:
          product.salePrice,

        currency:
          product.currency,

        discountPercentage:
          product.discountPercentage,

        destination:
          product.destination,

        clickUrl:
          product.clickUrl

      };

    }
  );


/* =========================================================
   SAVE MULTI-PRODUCT PACKAGE
   ========================================================= */

await fs.writeFile(

  SELECTED_PRODUCTS_PATH,

  JSON.stringify(

    {
      date:
        today,

      productCount:
        selectedData.length,

      products:
        selectedData
    },

    null,
    2

  ),

  "utf8"

);


/* =========================================================
   COMPATIBILITY FILE
   ========================================================= */

await fs.writeFile(

  SELECTED_PATH,

  JSON.stringify(

    selectedData[0],

    null,
    2

  ),

  "utf8"

);


/* =========================================================
   LOG
   ========================================================= */

console.log(
  "ZOVARO automatic selection completed."
);

console.log(
  `Selected ${selectedData.length} products for the daily TikTok video.`
);

console.log(
  `Different advertisers used: ${new Set(
    selectedData.map(
      product =>
        product.advertiserId ||
        product.advertiserName ||
        "unknown"
    )
  ).size}`
);


selectedData.forEach(
  (product, index) => {

    console.log(
      `${index + 1}. ${product.title}`
    );

    console.log(
      `   Advertiser: ${
        product.advertiserName ||
        "N/A"
      }`
    );

    console.log(
      `   Discount: ${
        product.discountPercentage ||
        0
      }%`
    );

  }
);


console.log(
  `Saved to: ${SELECTED_PRODUCTS_PATH}`
);

console.log(
  `Compatibility file: ${SELECTED_PATH}`
);
