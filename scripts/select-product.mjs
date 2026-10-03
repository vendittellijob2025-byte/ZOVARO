import fs from "node:fs/promises";

const CATALOG_PATH = "data/catalog.json";
const SELECTED_PATH = "data/selected-product.json";
const SELECTED_PRODUCTS_PATH = "data/selected-products.json";

const MAX_PRODUCTS = 6;

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
      product.title &&
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

const hasDiscount =
  product => {
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

const discountValue =
  product => {
    const percentage =
      Number(
        product.discountPercentage
      );

    if (
      Number.isFinite(percentage) &&
      percentage > 0
    ) {
      return percentage;
    }

    const price =
      Number(product.price);

    const salePrice =
      Number(product.salePrice);

    if (
      Number.isFinite(price) &&
      Number.isFinite(salePrice) &&
      price > salePrice &&
      price > 0
    ) {
      return (
        ((price - salePrice) /
          price) *
        100
      );
    }

    return 0;
  };

const advertiserKey =
  product => {
    return String(
      product.advertiserId ||
      product.advertiserName ||
      product.network ||
      "unknown-advertiser"
    ).trim();
  };

const today =
  new Date()
    .toISOString()
    .slice(0, 10);

let seed = 0;

for (
  const character of today
) {
  seed =
    (
      seed * 31 +
      character.charCodeAt(0)
    ) >>> 0;
}

function randomNumber() {
  seed =
    (
      seed * 1664525 +
      1013904223
    ) >>> 0;

  return seed / 4294967296;
}

function shuffle(array) {
  const result =
    [...array];

  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        randomNumber() *
          (i + 1)
      );

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

/*
  Group products by advertiser.

  This allows ZOVARO to automatically
  create a multi-advertiser mix.

  No advertiser names are hard-coded.
*/
const advertiserGroups =
  new Map();

for (
  const product of validProducts
) {
  const key =
    advertiserKey(product);

  if (
    !advertiserGroups.has(key)
  ) {
    advertiserGroups.set(
      key,
      []
    );
  }

  advertiserGroups
    .get(key)
    .push(product);
}

/*
  Prepare each advertiser independently.

  Discounted products are always placed
  before regular products.
*/
const advertiserPools =
  [...advertiserGroups.entries()]
    .map(
      ([key, advertiserProducts]) => {
        const discounted =
          advertiserProducts.filter(
            hasDiscount
          );

        const regular =
          advertiserProducts.filter(
            product =>
              !hasDiscount(product)
          );

        const sortedDiscounted =
          [...discounted].sort(
            (a, b) =>
              discountValue(b) -
              discountValue(a)
          );

        const shuffledDiscounted =
          shuffle(
            sortedDiscounted
          );

        const shuffledRegular =
          shuffle(regular);

        return {
          key,
          discounted:
            shuffledDiscounted,
          regular:
            shuffledRegular
        };
      }
    );

/*
  Advertisers with discounted products
  have priority.

  We shuffle advertisers so the same
  companies are not always shown in the
  same order.
*/
const advertisersWithDiscounts =
  shuffle(
    advertiserPools.filter(
      group =>
        group.discounted.length > 0
    )
  );

const advertisersWithoutDiscounts =
  shuffle(
    advertiserPools.filter(
      group =>
        group.discounted.length === 0
    )
  );

/*
  First pass:
  take one discounted product from
  different advertisers.

  This guarantees advertiser variety
  whenever enough different advertisers
  are available.
*/
const selectedProducts = [];

const usedAdvertisers =
  new Set();

for (
  const group of advertisersWithDiscounts
) {
  if (
    selectedProducts.length >=
    MAX_PRODUCTS
  ) {
    break;
  }

  const product =
    group.discounted.shift();

  if (!product) {
    continue;
  }

  selectedProducts.push(
    product
  );

  usedAdvertisers.add(
    group.key
  );
}

/*
  If fewer than 6 advertisers have
  discounted products, use advertisers
  without discounts to increase variety.
*/
if (
  selectedProducts.length <
  MAX_PRODUCTS
) {
  for (
    const group of advertisersWithoutDiscounts
  ) {
    if (
      selectedProducts.length >=
      MAX_PRODUCTS
    ) {
      break;
    }

    if (
      usedAdvertisers.has(
        group.key
      )
    ) {
      continue;
    }

    const product =
      group.regular.shift();

    if (!product) {
      continue;
    }

    selectedProducts.push(
      product
    );

    usedAdvertisers.add(
      group.key
    );
  }
}

/*
  Second pass:
  fill remaining positions.

  Discounted products from any advertiser
  are still preferred before regular
  products.
*/
const remainingDiscounted = [];

const remainingRegular = [];

for (
  const group of advertiserPools
) {
  remainingDiscounted.push(
    ...group.discounted
  );

  remainingRegular.push(
    ...group.regular
  );
}

const shuffledRemainingDiscounted =
  shuffle(
    remainingDiscounted
  );

const shuffledRemainingRegular =
  shuffle(
    remainingRegular
  );

for (
  const product of
    shuffledRemainingDiscounted
) {
  if (
    selectedProducts.length >=
    MAX_PRODUCTS
  ) {
    break;
  }

  selectedProducts.push(
    product
  );
}

for (
  const product of
    shuffledRemainingRegular
) {
  if (
    selectedProducts.length >=
    MAX_PRODUCTS
  ) {
    break;
  }

  selectedProducts.push(
    product
  );
}

if (!selectedProducts.length) {
  throw new Error(
    "Unable to select products for promotion."
  );
}

/*
  Final shuffle.

  The advertiser-diversity logic happens
  first; then the final order is randomized
  so products do not always appear in the
  same advertiser order.
*/
const finalSelection =
  shuffle(
    selectedProducts
  ).slice(
    0,
    MAX_PRODUCTS
  );

/*
  Keep all catalog data required by
  ZOVARO and by the automatic video
  generator.

  A pack remains one catalog product.
  Nothing is split or invented.
*/
const selectedData =
  finalSelection.map(
    product => ({
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
        product.title,

      description:
        product.description,

      brand:
        product.brand,

      advertiserId:
        product.advertiserId,

      advertiserName:
        product.advertiserName,

      category:
        product.category,

      imageLink:
        product.imageLink,

      additionalImageLinks:
        Array.isArray(
          product.additionalImageLinks
        )
          ? product.additionalImageLinks
          : [],

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
    })
  );

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

/*
  Keep the first selected product in
  selected-product.json for compatibility
  with the existing promotion workflow.
*/
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
  "ZOVARO automatic multi-advertiser selection completed."
);

console.log(
  `Selected ${selectedData.length} products for the daily TikTok video.`
);

console.log("");

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
      `   Category: ${
        product.category ||
        "N/A"
      }`
    );

    console.log(
      `   Discount: ${
        product.discountPercentage ||
        0
      }%`
    );

    console.log("");
  }
);

const selectedAdvertisers =
  [
    ...new Set(
      selectedData.map(
        product =>
          product.advertiserName ||
          product.advertiserId ||
          "N/A"
      )
    )
  ];

console.log(
  `Advertisers represented: ${selectedAdvertisers.length}`
);

console.log(
  selectedAdvertisers
    .map(
      advertiser =>
        `- ${advertiser}`
    )
    .join("\n")
);

console.log("");

console.log(
  `Saved to: ${SELECTED_PRODUCTS_PATH}`
);

console.log(
  `Compatibility file: ${SELECTED_PATH}`
);
