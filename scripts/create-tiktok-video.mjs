import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const SELECTED_PRODUCTS_PATH =
  "data/selected-products.json";

const VIDEO_OUTPUT_PATH =
  "data/tiktok-video.mp4";

const TEMP_DIR =
  ".zovaro-video-temp";

const MUSIC_PATH =
  "assets/ZOVARO_AFFILIATE.MP3";

const BACKGROUND_PATH =
  "assets/Negozio futuristico ZOVARO Shop.png";

const WIDTH = 1080;
const HEIGHT = 1920;

/*
  FINAL SCREEN

  After the last product, ZOVARO shows the shop
  background alone for a short moment.

  Then the ZOVARO logo and final text appear
  gradually while the shop fades to black.
*/

const FINAL_DURATION = 6;

const FINAL_SHOP_HOLD = 2.5;
const FINAL_LOGO_FADE = 2.0;

const MIN_PRODUCTS = 6;
const MAX_PRODUCTS = 20;

const TRANSITION_DURATION = 0.75;

/*
  PRODUCT IMAGE OPACITY

  FULL OPACITY.

  The original white background of the product
  image remains clearly visible.
*/

const PRODUCT_OPACITY = 1.00;

/*
  BACKGROUND VISIBILITY
*/

const BACKGROUND_WHITE_OVERLAY = 0.10;

/*
  TEXT MINI PANELS

  This opacity was visually approved.
*/

const TEXT_BOX_COLOR = "white@0.82";
const TEXT_BOX_BORDER = 18;

/*
  TEXT PANEL LAYOUT

  The visual style remains unchanged.

  The panels are now positioned using fixed
  vertical zones with guaranteed separation.

  The largest panel is the product title,
  which may occupy multiple lines.

  The title zone therefore receives extra
  vertical space so that a two-line title
  cannot collide with the merchant panel.

  The old price and discount also have
  independent zones.

  IMPORTANT:
  These coordinates are intentionally kept
  away from the product image and from each
  other. This layout applies automatically
  to every affiliate product.
*/

const TEXT_LAYOUT = {
  categoryY: 1000,
  titleY: 1085,
  merchantY: 1265,
  priceY: 1355,
  oldPriceY: 1465,
  discountY: 1555
};

const TEXT_SAFE_GAP = 22;

/*
  Calculate an additional vertical offset
  for multi-line text.

  This does NOT change the font, color,
  panel opacity or style.

  It only guarantees that a text panel with
  multiple lines receives enough vertical
  room before the next panel begins.
*/

function textLineCount(value) {
  const text = String(value ?? "")
    .replace(/\r/g, "")
    .trim();

  if (!text) {
    return 0;
  }

  return text.split("\n").length;
}

function calculatePanelHeight(
  lineCount,
  fontSize,
  lineSpacing = 0
) {
  if (!lineCount) {
    return 0;
  }

  return (
    lineCount * fontSize +
    Math.max(0, lineCount - 1) *
      lineSpacing +
    TEXT_BOX_BORDER * 2
  );
}

function escapeFilterPath(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:");
}

async function run(command, args) {
  console.log(
    `Running: ${command} ${args.join(" ")}`
  );

  const result = await execFileAsync(
    command,
    args,
    {
      maxBuffer: 20 * 1024 * 1024
    }
  );

  if (result.stdout) {
    console.log(result.stdout);
  }

  if (result.stderr) {
    console.log(result.stderr);
  }

  return result;
}

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadFile(url, outputPath) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Unable to download ${url}: HTTP ${response.status}`
    );
  }

  const buffer = Buffer.from(
    await response.arrayBuffer()
  );

  await fs.writeFile(
    outputPath,
    buffer
  );
}

function formatMoney(value, currency) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "";
  }

  const code = String(
    currency || "USD"
  ).toUpperCase();

  const symbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CAD: "C$",
    AUD: "A$"
  };

  const symbol =
    symbols[code] || `${code} `;

  return `${symbol}${number.toFixed(2)}`;
}

function wrapText(value, maxCharacters) {
  const text = String(value ?? "")
    .replace(/\r/g, "")
    .trim();

  if (!text) {
    return "";
  }

  const paragraphs = text.split("\n");
  const lines = [];

  for (const paragraph of paragraphs) {
    const words = paragraph
      .split(/\s+/)
      .filter(Boolean);

    if (!words.length) {
      lines.push("");
      continue;
    }

    let current = "";

    for (const word of words) {
      const candidate = current
        ? `${current} ${word}`
        : word;

      if (
        candidate.length <=
        maxCharacters
      ) {
        current = candidate;
      } else {
        if (current) {
          lines.push(current);
        }

        current = word;
      }
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines.join("\n");
}

const selectedText =
  await fs.readFile(
    SELECTED_PRODUCTS_PATH,
    "utf8"
  );

const selectedData =
  JSON.parse(selectedText);

const allProducts =
  Array.isArray(selectedData.products)
    ? selectedData.products
    : [];

if (
  allProducts.length <
  MIN_PRODUCTS
) {
  throw new Error(
    `ZOVARO requires at least ${MIN_PRODUCTS} products for the automatic TikTok video, but only ${allProducts.length} were selected.`
  );
}

if (
  !(await fileExists(MUSIC_PATH))
) {
  throw new Error(
    `ZOVARO Affiliate music not found: ${MUSIC_PATH}`
  );
}

if (
  !(await fileExists(BACKGROUND_PATH))
) {
  throw new Error(
    `ZOVARO background not found: ${BACKGROUND_PATH}`
  );
}

const musicProbe =
  await run(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      MUSIC_PATH
    ]
  );

const musicDuration =
  Number(
    musicProbe.stdout.trim()
  );

if (
  !Number.isFinite(musicDuration) ||
  musicDuration <= FINAL_DURATION
) {
  throw new Error(
    "Unable to determine a valid music duration."
  );
}

console.log(
  `Detected ZOVARO Affiliate music duration: ${musicDuration.toFixed(3)} seconds`
);

let productCount =
  Math.floor(
    (musicDuration - FINAL_DURATION) / 4
  );

productCount =
  Math.max(
    MIN_PRODUCTS,
    productCount
  );

productCount =
  Math.min(
    MAX_PRODUCTS,
    productCount,
    allProducts.length
  );

if (
  productCount < MIN_PRODUCTS
) {
  throw new Error(
    `Not enough selected products to build the automatic video. Required: ${MIN_PRODUCTS}. Available: ${allProducts.length}.`
  );
}

const productDuration =
  (
    musicDuration -
    FINAL_DURATION
  ) /
  productCount;

console.log(
  `Automatic product count: ${productCount}`
);

console.log(
  `Automatic product duration: ${productDuration.toFixed(3)} seconds`
);

console.log(
  `Final ZOVARO screen: ${FINAL_DURATION} seconds`
);

console.log(
  `Final shop-only hold: ${FINAL_SHOP_HOLD} seconds`
);

console.log(
  `Final logo fade: ${FINAL_LOGO_FADE} seconds`
);

const selectedProducts =
  allProducts.slice(
    0,
    productCount
  );

await fs.rm(
  TEMP_DIR,
  {
    recursive: true,
    force: true
  }
);

await fs.mkdir(
  TEMP_DIR,
  {
    recursive: true
  }
);

console.log(
  `Preparing automatic TikTok video with ${selectedProducts.length} products.`
);

const logoCandidates = [
  "assets/zovaro-logo.png",
  "Logo ZOVARO con globo orbitante al neon (1).png"
];

let logoPath = null;

for (
  const candidate of logoCandidates
) {
  if (
    await fileExists(candidate)
  ) {
    logoPath = candidate;
    break;
  }
}

if (!logoPath) {
  throw new Error(
    "ZOVARO logo not found in assets."
  );
}

console.log(
  `Using ZOVARO logo: ${logoPath}`
);

console.log(
  `Using ZOVARO background: ${BACKGROUND_PATH}`
);

const productVideoPaths = [];

for (
  let index = 0;
  index < selectedProducts.length;
  index++
) {
  const product =
    selectedProducts[index];

  if (
    !product.imageLink ||
    typeof product.imageLink !== "string"
  ) {
    throw new Error(
      `Product ${index + 1} is missing imageLink.`
    );
  }

  const imagePath =
    `${TEMP_DIR}/product-${index + 1}.jpg`;

  const videoPath =
    `${TEMP_DIR}/product-video-${index + 1}.mp4`;

  const textDirectory =
    `${TEMP_DIR}/text-${index + 1}`;

  await fs.mkdir(
    textDirectory,
    {
      recursive: true
    }
  );

  const category =
    String(
      product.englishCategory ||
      product.category ||
      "Featured"
    );

  const name =
    String(
      product.englishTitle ||
      product.title ||
      product.brand ||
      product.advertiserName ||
      "ZOVARO Offer"
    );

  const merchant =
    String(
      product.advertiserName ||
      "CJ Affiliate"
    );

  console.log(
    `Preparing product ${index + 1}: ${name}`
  );

  console.log(
    `English category: ${category}`
  );

  console.log(
    `Merchant: ${merchant}`
  );

  console.log(
    `Downloading product image ${index + 1}`
  );

  await downloadFile(
    product.imageLink,
    imagePath
  );

  const regularPrice =
    Number(product.price);

  const salePrice =
    Number(product.salePrice);

  const hasSale =
    Number.isFinite(
      regularPrice
    ) &&
    regularPrice > 0 &&
    Number.isFinite(
      salePrice
    ) &&
    salePrice > 0 &&
    salePrice < regularPrice;

  const displayedPrice =
    hasSale
      ? salePrice
      : regularPrice;

  const displayedOldPrice =
    hasSale
      ? regularPrice
      : null;

  const discountNumber =
    Number(
      product.discountPercentage
    );

  const displayedDiscount =
    Number.isFinite(
      discountNumber
    ) &&
    discountNumber > 0
      ? Math.round(
          discountNumber
        )
      : (
          hasSale &&
          regularPrice > 0
            ? Math.round(
                (
                  (
                    regularPrice -
                    salePrice
                  ) /
                  regularPrice
                ) *
                100
              )
            : 0
        );

  const priceText =
    formatMoney(
      displayedPrice,
      product.currency
    );

  const oldPriceText =
    displayedOldPrice !== null
      ? formatMoney(
          displayedOldPrice,
          product.currency
        )
      : "";

  const discountText =
    displayedDiscount > 0
      ? `-${displayedDiscount}%`
      : "";

  const categoryFile =
    `${textDirectory}/category.txt`;

  const nameFile =
    `${textDirectory}/name.txt`;

  const merchantFile =
    `${textDirectory}/merchant.txt`;

  const priceFile =
    `${textDirectory}/price.txt`;

  const oldPriceFile =
    `${textDirectory}/old-price.txt`;

  const discountFile =
    `${textDirectory}/discount.txt`;

  const wrappedCategory =
    wrapText(
      category,
      36
    );

  const wrappedName =
    wrapText(
      name,
      27
    );

  const wrappedMerchant =
    wrapText(
      merchant,
      36
    );

  await fs.writeFile(
    categoryFile,
    wrappedCategory,
    "utf8"
  );

  await fs.writeFile(
    nameFile,
    wrappedName,
    "utf8"
  );

  await fs.writeFile(
    merchantFile,
    wrappedMerchant,
    "utf8"
  );

  await fs.writeFile(
    priceFile,
    priceText,
    "utf8"
  );

  await fs.writeFile(
    oldPriceFile,
    oldPriceText,
    "utf8"
  );

  await fs.writeFile(
    discountFile,
    discountText,
    "utf8"
  );

  const categoryText =
    escapeFilterPath(
      categoryFile
    );

  const nameText =
    escapeFilterPath(
      nameFile
    );

  const merchantText =
    escapeFilterPath(
      merchantFile
    );

  const priceTextFile =
    escapeFilterPath(
      priceFile
    );

  const oldPriceTextFile =
    escapeFilterPath(
      oldPriceFile
    );

  const discountTextFile =
    escapeFilterPath(
      discountFile
    );

  /*
    AUTOMATIC PANEL HEIGHT ANALYSIS

    We calculate the actual number of lines
    before rendering the panels.

    This is the important protection against
    overlapping rectangles.
  */

  const categoryLines =
    textLineCount(
      wrappedCategory
    );

  const titleLines =
    textLineCount(
      wrappedName
    );

  const merchantLines =
    textLineCount(
      wrappedMerchant
    );

  const categoryHeight =
    calculatePanelHeight(
      categoryLines,
      28,
      8
    );

  const titleHeight =
    calculatePanelHeight(
      titleLines,
      46,
      12
    );

  const merchantHeight =
    calculatePanelHeight(
      merchantLines,
      26,
      8
    );

  /*
    The starting coordinates are based on the
    approved visual design.

    If a previous panel becomes taller because
    of multiple lines, the following panel is
    automatically pushed downward.

    Therefore a long title cannot overlap
    the merchant, price, old-price or discount
    panels.
  */

  let categoryY =
    TEXT_LAYOUT.categoryY;

  let titleY =
    TEXT_LAYOUT.titleY;

  let merchantY =
    TEXT_LAYOUT.merchantY;

  let priceY =
    TEXT_LAYOUT.priceY;

  let oldPriceY =
    TEXT_LAYOUT.oldPriceY;

  let discountY =
    TEXT_LAYOUT.discountY;

  /*
    CATEGORY → TITLE
  */

  const minimumTitleY =
    categoryY +
    categoryHeight +
    TEXT_SAFE_GAP;

  titleY =
    Math.max(
      titleY,
      minimumTitleY
    );

  /*
    TITLE → MERCHANT
  */

  const minimumMerchantY =
    titleY +
    titleHeight +
    TEXT_SAFE_GAP;

  merchantY =
    Math.max(
      merchantY,
      minimumMerchantY
    );

  /*
    MERCHANT → PRICE
  */

  const minimumPriceY =
    merchantY +
    merchantHeight +
    TEXT_SAFE_GAP;

  priceY =
    Math.max(
      priceY,
      minimumPriceY
    );

  /*
    PRICE PANEL

    Current price uses one line and a
    larger font.
  */

  const priceHeight =
    calculatePanelHeight(
      1,
      70,
      0
    );

  /*
    PRICE → OLD PRICE
  */

  const minimumOldPriceY =
    priceY +
    priceHeight +
    TEXT_SAFE_GAP;

  oldPriceY =
    Math.max(
      oldPriceY,
      minimumOldPriceY
    );

  /*
    OLD PRICE → DISCOUNT

    If there is no old price, the discount
    still receives its own safe position
    after the current price.
  */

  const oldPriceHeight =
    oldPriceText
      ? calculatePanelHeight(
          1,
          34,
          0
        )
      : 0;

  const minimumDiscountY =
    oldPriceText
      ? oldPriceY +
        oldPriceHeight +
        TEXT_SAFE_GAP
      : priceY +
        priceHeight +
        TEXT_SAFE_GAP;

  discountY =
    Math.max(
      discountY,
      minimumDiscountY
    );

  /*
    FINAL SAFETY LIMIT

    If exceptionally long text causes the
    calculated layout to approach the bottom
    of the vertical canvas, we reduce the
    available line spacing progressively
    rather than allowing panels to overlap.

    Normal products remain exactly within
    the approved visual layout.
  */

  const maximumDiscountBottom =
    discountY +
    calculatePanelHeight(
      discountText ? 1 : 0,
      38,
      0
    );

  if (
    maximumDiscountBottom >
    HEIGHT - 80
  ) {
    const correction =
      maximumDiscountBottom -
      (HEIGHT - 80);

    discountY -= correction;

    if (
      discountY <
      oldPriceY +
      oldPriceHeight +
      TEXT_SAFE_GAP
    ) {
      discountY =
        oldPriceY +
        oldPriceHeight +
        TEXT_SAFE_GAP;
    }
  }

  console.log(
    `Text panel positions for product ${index + 1}:`
  );

  console.log(
    `Category Y: ${categoryY}`
  );

  console.log(
    `Title Y: ${titleY}`
  );

  console.log(
    `Merchant Y: ${merchantY}`
  );

  console.log(
    `Price Y: ${priceY}`
  );

  console.log(
    `Old price Y: ${oldPriceY}`
  );

  console.log(
    `Discount Y: ${discountY}`
  );

  console.log(
    `Category lines: ${categoryLines}`
  );

  console.log(
    `Title lines: ${titleLines}`
  );

  console.log(
    `Merchant lines: ${merchantLines}`
  );

  const filterParts = [
    `[1:v]` +
      `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,` +
      `crop=${WIDTH}:${HEIGHT}` +
      `[background]`,

    `[background]` +
      `drawbox=` +
      `x=0:` +
      `y=0:` +
      `w=${WIDTH}:` +
      `h=${HEIGHT}:` +
      `color=white@${BACKGROUND_WHITE_OVERLAY}:` +
      `t=fill` +
      `[softbackground]`,

    `[0:v]` +
      `scale=900:880:force_original_aspect_ratio=decrease,` +
      `format=rgba,` +
      `colorchannelmixer=aa=${PRODUCT_OPACITY}` +
      `[product]`,

    `[softbackground][product]` +
      `overlay=(W-w)/2:55:format=auto` +
      `[scene1]`,

    /*
      TEXT 1 — CATEGORY
    */

    `[scene1]` +
      `drawtext=` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
      `textfile='${categoryText}':` +
      `fontcolor=444444:` +
      `fontsize=28:` +
      `x=(w-text_w)/2:` +
      `y=${categoryY}:` +
      `line_spacing=8:` +
      `expansion=none:` +
      `box=1:` +
      `boxcolor=${TEXT_BOX_COLOR}:` +
      `boxborderw=${TEXT_BOX_BORDER}` +
      `[text1]`,

    /*
      TEXT 2 — PRODUCT TITLE
    */

    `[text1]` +
      `drawtext=` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
      `textfile='${nameText}':` +
      `fontcolor=111111:` +
      `fontsize=46:` +
      `x=(w-text_w)/2:` +
      `y=${titleY}:` +
      `line_spacing=12:` +
      `expansion=none:` +
      `box=1:` +
      `boxcolor=${TEXT_BOX_COLOR}:` +
      `boxborderw=${TEXT_BOX_BORDER}` +
      `[text2]`,

    /*
      TEXT 3 — MERCHANT
    */

    `[text2]` +
      `drawtext=` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
      `textfile='${merchantText}':` +
      `fontcolor=555555:` +
      `fontsize=26:` +
      `x=(w-text_w)/2:` +
      `y=${merchantY}:` +
      `line_spacing=8:` +
      `expansion=none:` +
      `box=1:` +
      `boxcolor=${TEXT_BOX_COLOR}:` +
      `boxborderw=${TEXT_BOX_BORDER}` +
      `[text3]`,

    /*
      TEXT 4 — CURRENT PRICE
    */

    `[text3]` +
      `drawtext=` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
      `textfile='${priceTextFile}':` +
      `fontcolor=111111:` +
      `fontsize=70:` +
      `x=(w-text_w)/2:` +
      `y=${priceY}:` +
      `expansion=none:` +
      `box=1:` +
      `boxcolor=${TEXT_BOX_COLOR}:` +
      `boxborderw=${TEXT_BOX_BORDER}` +
      `[text4]`
  ];

  /*
    OLD PRICE

    Its position is calculated automatically
    from the current-price panel.
  */

  if (oldPriceText) {
    filterParts.push(
      `[text4]` +
        `drawtext=` +
        `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
        `textfile='${oldPriceTextFile}':` +
        `fontcolor=777777:` +
        `fontsize=34:` +
        `x=(w-text_w)/2:` +
        `y=${oldPriceY}:` +
        `expansion=none:` +
        `box=1:` +
        `boxcolor=${TEXT_BOX_COLOR}:` +
        `boxborderw=${TEXT_BOX_BORDER}` +
        `[text5]`
    );
  } else {
    filterParts.push(
      `[text4]null[text5]`
    );
  }

  /*
    DISCOUNT

    Its position is always below the
    preceding panel with a guaranteed gap.
  */

  if (discountText) {
    filterParts.push(
      `[text5]` +
        `drawtext=` +
        `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
        `textfile='${discountTextFile}':` +
        `fontcolor=111111:` +
        `fontsize=38:` +
        `x=(w-text_w)/2:` +
        `y=${discountY}:` +
        `expansion=none:` +
        `box=1:` +
        `boxcolor=${TEXT_BOX_COLOR}:` +
        `boxborderw=${TEXT_BOX_BORDER}` +
        `[text6]`
    );
  } else {
    filterParts.push(
      `[text5]null[text6]`
    );
  }

  filterParts.push(
    `[text6]` +
      `format=rgba,` +
      `fade=t=out:st=${Math.max(
        0,
        productDuration - TRANSITION_DURATION
      ).toFixed(3)}:d=${TRANSITION_DURATION}:alpha=1` +
      `[outputrgba]`
  );

  filterParts.push(
    `[outputrgba]format=yuv420p[output]`
  );

  await run(
    "ffmpeg",
    [
      "-y",

      "-loop",
      "1",

      "-i",
      imagePath,

      "-loop",
      "1",

      "-i",
      BACKGROUND_PATH,

      "-t",
      productDuration.toFixed(3),

      "-filter_complex",
      filterParts.join(";"),

      "-map",
      "[output]",

      "-r",
      "30",

      "-an",

      "-c:v",
      "libx264",

      "-preset",
      "veryfast",

      "-crf",
      "23",

      "-pix_fmt",
      "yuv420p",

      videoPath
    ]
  );

  productVideoPaths.push(
    `product-video-${index + 1}.mp4`
  );
}

/*
  FINAL STATIC SCREEN

  Used as the visual reference frame.
*/

const finalScreenPath =
  `${TEMP_DIR}/final-screen.png`;

await run(
  "ffmpeg",
  [
    "-y",

    "-loop",
    "1",

    "-i",
    BACKGROUND_PATH,

    "-i",
    logoPath,

    "-filter_complex",

    [
      `[0:v]` +
        `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,` +
        `crop=${WIDTH}:${HEIGHT}` +
        `[finalbg]`,

      `[finalbg]` +
        `drawbox=` +
        `x=0:` +
        `y=0:` +
        `w=${WIDTH}:` +
        `h=${HEIGHT}:` +
        `color=white@0.10:` +
        `t=fill` +
        `[finalsoft]`,

      `[1:v]` +
        `scale=720:720:force_original_aspect_ratio=decrease` +
        `[logo]`,

      `[finalsoft][logo]` +
        `overlay=(W-w)/2:420:format=auto` +
        `[finalscene]`,

      `[finalscene]` +
        `drawtext=` +
        `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
        `text='DISCOVER. SHARE. SHOP.':` +
        `fontcolor=white:` +
        `fontsize=52:` +
        `x=(w-text_w)/2:` +
        `y=1240` +
        `[finaltext1]`,

      `[finaltext1]` +
        `drawtext=` +
        `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
        `text='Products and deals through ZOVARO':` +
        `fontcolor=white:` +
        `fontsize=32:` +
        `x=(w-text_w)/2:` +
        `y=1325` +
        `[finaloutput]`
    ].join(";"),

    "-map",
    "[finaloutput]",

    "-frames:v",
    "1",

    "-c:v",
    "png",

    finalScreenPath
  ]
);

const finalVideoPath =
  `${TEMP_DIR}/final-screen-video.mp4`;

/*
  FINAL VIDEO

  PHASE 1:
  0 → 2.5 sec
  Only the ZOVARO shop remains visible.

  PHASE 2:
  2.5 → 4.5 sec
  The logo and final text fade in gently.
  At the same time the shop background
  dissolves progressively into black.

  PHASE 3:
  4.5 → 6 sec
  Full black background with the
  ZOVARO logo and white final text.
*/

await run(
  "ffmpeg",
  [
    "-y",

    "-loop",
    "1",

    "-i",
    BACKGROUND_PATH,

    "-loop",
    "1",

    "-i",
    logoPath,

    "-filter_complex",

    [
      `[0:v]` +
        `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,` +
        `crop=${WIDTH}:${HEIGHT},` +
        `drawbox=` +
        `x=0:` +
        `y=0:` +
        `w=${WIDTH}:` +
        `h=${HEIGHT}:` +
        `color=white@0.10:` +
        `t=fill,` +
        `fade=t=out:st=${FINAL_SHOP_HOLD.toFixed(3)}:d=${FINAL_LOGO_FADE.toFixed(3)}:color=black` +
        `[endingbg]`,

      `[1:v]` +
        `scale=720:720:force_original_aspect_ratio=decrease,` +
        `format=rgba,` +
        `fade=t=in:st=${FINAL_SHOP_HOLD.toFixed(3)}:d=${FINAL_LOGO_FADE.toFixed(3)}:alpha=1` +
        `[endinglogo]`,

      `[endingbg][endinglogo]` +
        `overlay=(W-w)/2:420:format=auto` +
        `[endingscene]`,

      `[endingscene]` +
        `drawtext=` +
        `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
        `text='DISCOVER. SHARE. SHOP.':` +
        `fontcolor=white:` +
        `fontsize=52:` +
        `x=(w-text_w)/2:` +
        `y=1240:` +
        `alpha='if(lt(t\\,${FINAL_SHOP_HOLD.toFixed(3)})\\,0\\,min(1\\,(t-${FINAL_SHOP_HOLD.toFixed(3)})/${FINAL_LOGO_FADE.toFixed(3)}))'` +
        `[endingtext1]`,

      `[endingtext1]` +
        `drawtext=` +
        `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
        `text='Products and deals through ZOVARO':` +
        `fontcolor=white:` +
        `fontsize=32:` +
        `x=(w-text_w)/2:` +
        `y=1325:` +
        `alpha='if(lt(t\\,${FINAL_SHOP_HOLD.toFixed(3)})\\,0\\,min(1\\,(t-${FINAL_SHOP_HOLD.toFixed(3)})/${FINAL_LOGO_FADE.toFixed(3)}))'` +
        `[endingoutput]`
    ].join(";"),

    "-map",
    "[endingoutput]",

    "-t",
    FINAL_DURATION.toFixed(3),

    "-r",
    "30",

    "-an",

    "-c:v",
    "libx264",

    "-preset",
    "veryfast",

    "-crf",
    "23",

    "-pix_fmt",
    "yuv420p",

    "-movflags",
    "+faststart",

    finalVideoPath
  ]
);

const concatListPath =
  `${TEMP_DIR}/concat.txt`;

const concatFiles = [
  ...productVideoPaths,
  "final-screen-video.mp4"
];

const concatContent =
  concatFiles
    .map(
      file =>
        `file '${file.replace(
          /'/g,
          "'\\''"
        )}'`
    )
    .join("\n");

await fs.writeFile(
  concatListPath,
  concatContent,
  "utf8"
);

console.log(
  "Created concat list:"
);

console.log(
  concatContent
);

const silentVideoPath =
  `${TEMP_DIR}/silent-video.mp4`;

await run(
  "ffmpeg",
  [
    "-y",

    "-f",
    "concat",

    "-safe",
    "0",

    "-i",
    concatListPath,

    "-c:v",
    "libx264",

    "-preset",
    "veryfast",

    "-crf",
    "23",

    "-pix_fmt",
    "yuv420p",

    "-r",
    "30",

    "-an",

    silentVideoPath
  ]
);

await run(
  "ffmpeg",
  [
    "-y",

    "-i",
    silentVideoPath,

    "-stream_loop",
    "-1",

    "-i",
    MUSIC_PATH,

    "-map",
    "0:v:0",

    "-map",
    "1:a:0",

    "-c:v",
    "copy",

    "-c:a",
    "aac",

    "-b:a",
    "192k",

    "-t",
    musicDuration.toFixed(3),

    "-shortest",

    "-movflags",
    "+faststart",

    VIDEO_OUTPUT_PATH
  ]
);

await fs.rm(
  TEMP_DIR,
  {
    recursive: true,
    force: true
  }
);

console.log("");

console.log(
  "========================================"
);

console.log(
  "ZOVARO AUTOMATIC TIKTOK VIDEO CREATED"
);

console.log(
  "========================================"
);

console.log(
  `Music duration: ${musicDuration.toFixed(3)}s`
);

console.log(
  `Products: ${productCount}`
);

console.log(
  `Product duration: ${productDuration.toFixed(3)}s`
);

console.log(
  `Final screen duration: ${FINAL_DURATION}s`
);

console.log(
  `Final shop-only hold: ${FINAL_SHOP_HOLD}s`
);

console.log(
  `Final logo fade: ${FINAL_LOGO_FADE}s`
);

console.log(
  `Transition duration: ${TRANSITION_DURATION.toFixed(2)}s`
);

console.log(
  `Product image opacity: ${PRODUCT_OPACITY}`
);

console.log(
  `Background white overlay: ${BACKGROUND_WHITE_OVERLAY}`
);

console.log(
  `Text panel opacity: 0.82`
);

console.log(
  `Text panel spacing: automatic collision-safe layout`
);

console.log(
  `Final video FPS: 30`
);

console.log(
  `Final concat: re-encoded to prevent frozen ending`
);

console.log(
  `Text panels: automatically separated with safe vertical gaps`
);

console.log(
  `Total video duration: ${musicDuration.toFixed(3)}s`
);

console.log(
  `Music: ${MUSIC_PATH}`
);

console.log(
  `Background: ${BACKGROUND_PATH}`
);

console.log(
  `Output: ${VIDEO_OUTPUT_PATH}`
);
