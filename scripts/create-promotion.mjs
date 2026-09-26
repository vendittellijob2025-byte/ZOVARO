import fs from "node:fs/promises";

const SELECTED_PATH = "data/selected-product.json";
const OUTPUT_PATH = "data/promotion.json";

const selectedText = await fs.readFile(SELECTED_PATH, "utf8");
const product = JSON.parse(selectedText);

if (!product.productId || !product.title || !product.imageLink || !product.clickUrl) {
  throw new Error("Selected product is missing required promotion data.");
}

const priceText =
  product.salePrice != null
    ? `${product.salePrice} ${product.currency || ""}`.trim()
    : `${product.price} ${product.currency || ""}`.trim();

const promotion = {
  createdAt: new Date().toISOString(),
  productId: product.productId,
  advertiser: product.advertiserName,
  brand: product.brand,
  category: product.category,
  title: product.title,
  description: product.description,
  price: product.price,
  salePrice: product.salePrice,
  currency: product.currency,
  discountPercentage: product.discountPercentage,
  priceText,
  imageUrl: product.imageLink,
  destinationUrl: product.destination,
  trackingUrl: product.clickUrl,

  content: {
    hook: `Discover this ${product.brand || "featured"} product.`,
    headline: product.title,
    callToAction: "VIEW DEAL",
    caption: `${product.title} — available now. Check the deal through ZOVARO.`,
    hashtags: [
      "#ZOVARO",
      "#Shopping",
      "#Deals",
      `#${product.category.replace(/\s+/g, "")}`
    ]
  }
};

await fs.writeFile(
  OUTPUT_PATH,
  JSON.stringify(promotion, null, 2),
  "utf8"
);

console.log("ZOVARO promotion package created.");
console.log(`Product: ${product.title}`);
console.log(`Tracking URL: ${product.clickUrl}`);
console.log(`Saved to: ${OUTPUT_PATH}`);
