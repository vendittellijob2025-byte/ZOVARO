import fs from "node:fs/promises";

const SELECTED_PATH = "data/selected-product.json";
const OUTPUT_PATH = "data/promotion.json";

const ZOVARO_WEBSITE = "https://zovaro.vercel.app/";

const ZOVARO_DESCRIPTION =
  "Discover ZOVARO — a global product discovery platform bringing together thousands of products, deals and discoveries from retailers and brands around the world. ZOVARO is rapidly expanding its presence in the global market.";

const selectedText = await fs.readFile(SELECTED_PATH, "utf8");
const product = JSON.parse(selectedText);

const title =
  product.englishTitle ||
  product.title ||
  "Featured Product";

const description =
  product.englishDescription ||
  product.description ||
  "Discover this product on ZOVARO.";

const category =
  product.englishCategory ||
  product.category ||
  "Shopping";

const advertiser =
  product.advertiserName ||
  product.advertiser ||
  "Featured Retailer";

const brand =
  product.brand ||
  advertiser ||
  "Featured Brand";

if (
  !product.productId ||
  !title ||
  !product.imageLink ||
  !product.clickUrl
) {
  throw new Error(
    "Selected product is missing required promotion data."
  );
}

const priceText =
  product.salePrice != null &&
  Number(product.salePrice) > 0
    ? `${product.salePrice} ${product.currency || ""}`.trim()
    : `${product.price} ${product.currency || ""}`.trim();

const discountText =
  product.discountPercentage != null &&
  Number(product.discountPercentage) > 0
    ? `${product.discountPercentage}% OFF`
    : "";

const categoryHashtag =
  category
    .replace(/[^a-zA-Z0-9]+/g, "")
    .trim() || "Shopping";

const hashtags = [
  "#ZOVARO",
  "#Shopping",
  "#Deals",
  `#${categoryHashtag}`
];

const productHook =
  product.discountPercentage != null &&
  Number(product.discountPercentage) > 0
    ? `Discover this ${brand} deal with ${product.discountPercentage}% OFF.`
    : `Discover this featured ${brand} product on ZOVARO.`;

const productLine =
  discountText
    ? `${title} — ${priceText} — ${discountText}.`
    : `${title} — ${priceText}.`;

let tiktokCaption =
  `${productLine} ` +
  `${description} ` +
  `${ZOVARO_DESCRIPTION} ` +
  `Discover more on ZOVARO: ${ZOVARO_WEBSITE} ` +
  `${hashtags.join(" ")}`;

const MAX_TIKTOK_TITLE_LENGTH = 2200;

if (tiktokCaption.length > MAX_TIKTOK_TITLE_LENGTH) {
  tiktokCaption =
    tiktokCaption.slice(
      0,
      MAX_TIKTOK_TITLE_LENGTH - 3
    ) + "...";
}

const promotion = {
  createdAt: new Date().toISOString(),

  productId: product.productId,

  advertiser,
  brand,
  category,
  title,
  description,

  price: product.price,
  salePrice: product.salePrice,
  currency: product.currency,
  discountPercentage: product.discountPercentage,
  priceText,

  imageUrl: product.imageLink,
  destinationUrl: product.destination,
  trackingUrl: product.clickUrl,

  zovaro: {
    name: "ZOVARO",
    websiteUrl: ZOVARO_WEBSITE,
    description: ZOVARO_DESCRIPTION
  },

  content: {
    hook: productHook,
    headline: title,
    callToAction: "VIEW DEAL",

    caption: tiktokCaption,

    productDescription: description,

    zovaroDescription: ZOVARO_DESCRIPTION,

    websiteUrl: ZOVARO_WEBSITE,

    hashtags
  },

  tiktok: {
    caption: tiktokCaption,

    productDescription: description,

    zovaroDescription: ZOVARO_DESCRIPTION,

    websiteUrl: ZOVARO_WEBSITE,

    callToAction: "Discover more on ZOVARO",

    hashtags
  }
};

await fs.writeFile(
  OUTPUT_PATH,
  JSON.stringify(promotion, null, 2),
  "utf8"
);

console.log("ZOVARO TikTok promotion package created.");
console.log(`Product: ${title}`);
console.log(`Advertiser: ${advertiser}`);
console.log(`Website: ${ZOVARO_WEBSITE}`);
console.log("TikTok metadata: ready");
console.log(`Tracking URL: ${product.clickUrl}`);
console.log(`Saved to: ${OUTPUT_PATH}`);
