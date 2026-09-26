import fs from "node:fs/promises";

const INPUT_PATH = "data/promotion.json";
const OUTPUT_PATH = "data/social-image.svg";

const promotionText = await fs.readFile(INPUT_PATH, "utf8");
const promotion = JSON.parse(promotionText);

if (!promotion.imageUrl || !promotion.title) {
  throw new Error("Promotion data is missing image or title.");
}

const imageResponse = await fetch(promotion.imageUrl);

if (!imageResponse.ok) {
  throw new Error(
    `Unable to download product image: ${imageResponse.status}`
  );
}

const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
const contentType =
  imageResponse.headers.get("content-type") || "image/jpeg";

const imageData = `data:${contentType};base64,${imageBuffer.toString("base64")}`;

const escapeXml = value =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const title = escapeXml(promotion.title);
const price = escapeXml(promotion.priceText || "");
const brand = escapeXml(promotion.brand || "ZOVARO");
const category = escapeXml(promotion.category || "");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="1080"
     height="1920"
     viewBox="0 0 1080 1920">

  <rect width="1080" height="1920" fill="#ffffff"/>

  <text x="540" y="110"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="42"
        font-weight="700"
        fill="#111111">
    ZOVARO
  </text>

  <text x="540" y="165"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="24"
        fill="#666666">
    ${category}
  </text>

  <image
    href="${imageData}"
    x="90"
    y="250"
    width="900"
    height="900"
    preserveAspectRatio="xMidYMid meet"/>

  <text x="540" y="1280"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="42"
        font-weight="700"
        fill="#111111">
    ${brand}
  </text>

  <text x="540" y="1360"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="34"
        fill="#222222">
    ${title}
  </text>

  <text x="540" y="1500"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="72"
        font-weight="700"
        fill="#111111">
    ${price}
  </text>

  <rect x="190" y="1610"
        width="700"
        height="130"
        rx="65"
        fill="#111111"/>

  <text x="540" y="1695"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="38"
        font-weight="700"
        fill="#ffffff">
    VIEW DEAL
  </text>

  <text x="540" y="1815"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="24"
        fill="#666666">
    Shop through ZOVARO
  </text>

</svg>`;

await fs.writeFile(
  OUTPUT_PATH,
  svg,
  "utf8"
);

console.log("ZOVARO social image created with embedded product image.");
console.log(`Product: ${promotion.title}`);
console.log(`Saved to: ${OUTPUT_PATH}`);
