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

const FINAL_DURATION = 6;

const MIN_PRODUCTS = 6;
const MAX_PRODUCTS = 20;

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

function escapeFilterPath(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:");
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

  /*
    ALL PRODUCT TEXT MUST BE ENGLISH.

    The translation pipeline already creates:

    englishCategory
    englishTitle
    englishDescription

    The video uses the English fields first.
  */

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

  /*
    SALE PRICE LOGIC

    Zero or negative sale prices are invalid.

    A sale exists only when:

    regular price > 0
    sale price > 0
    sale price < regular price
  */

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

  /*
    TEXT FILES

    Descriptions are intentionally NOT created
    because descriptions are no longer displayed
    in the TikTok video.
  */

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

  await fs.writeFile(
    categoryFile,
    wrapText(
      category,
      45
    ),
    "utf8"
  );

  await fs.writeFile(
    nameFile,
    wrapText(
      name,
      34
    ),
    "utf8"
  );

  await fs.writeFile(
    merchantFile,
    wrapText(
      merchant,
      45
    ),
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
    VIDEO SCENE

    1080x1920

    Background:
    ZOVARO futuristic shop,
    intentionally softened with a white
    transparent layer.

    Product:
    large and centered.

    Information panel:
    category
    title
    affiliate merchant
    price
    old price
    discount

    Description:
    REMOVED.

    WHITE BACKGROUNDS:
    Both the product backing area and the
    information panel use 78% opacity so that
    the futuristic ZOVARO background remains
    visibly present.
  */

  const filterParts = [
    /*
      Background image.
    */

    `[1:v]` +
      `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,` +
      `crop=${WIDTH}:${HEIGHT}` +
      `[background]`,

    /*
      Soft white layer over the background.

      This keeps the ZOVARO Shop image visible
      but reduces its visual intensity.
    */

    `[background]` +
      `drawbox=` +
      `x=0:` +
      `y=0:` +
      `w=${WIDTH}:` +
      `h=${HEIGHT}:` +
      `color=white@0.78:` +
      `t=fill` +
      `[softbackground]`,

    /*
      Product image.

      The white area behind the product is now
      slightly transparent so the ZOVARO Shop
      background remains visible.
    */

    `[0:v]` +
      `scale=900:880:force_original_aspect_ratio=decrease,` +
      `pad=900:880:(ow-iw)/2:(oh-ih)/2:color=white@0.78` +
      `[product]`,

    /*
      Place product near the top.
    */

    `[softbackground][product]` +
      `overlay=(W-w)/2:45:format=auto` +
      `[scene1]`,

    /*
      Information panel.

      78% white opacity instead of solid white.
    */

    `[scene1]` +
      `drawbox=` +
      `x=35:` +
      `y=975:` +
      `w=1010:` +
      `h=900:` +
      `color=white@0.78:` +
      `t=fill` +
      `[scene2]`,

    /*
      CATEGORY
    */

    `[scene2]` +
      `drawtext=` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
      `textfile='${categoryText}':` +
      `fontcolor=555555:` +
      `fontsize=30:` +
      `x=(w-text_w)/2:` +
      `y=1015:` +
      `line_spacing=5:` +
      `expansion=none` +
      `[text1]`,

    /*
      LARGE PRODUCT TITLE
    */

    `[text1]` +
      `drawtext=` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
      `textfile='${nameText}':` +
      `fontcolor=111111:` +
      `fontsize=50:` +
      `x=(w-text_w)/2:` +
      `y=1080:` +
      `line_spacing=8:` +
      `expansion=none` +
      `[text2]`,

    /*
      AFFILIATE / MERCHANT
    */

    `[text2]` +
      `drawtext=` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
      `textfile='${merchantText}':` +
      `fontcolor=666666:` +
      `fontsize=28:` +
      `x=(w-text_w)/2:` +
      `y=1245:` +
      `line_spacing=5:` +
      `expansion=none` +
      `[text3]`,

    /*
      CURRENT PRICE
    */

    `[text3]` +
      `drawtext=` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
      `textfile='${priceTextFile}':` +
      `fontcolor=111111:` +
      `fontsize=72:` +
      `x=(w-text_w)/2:` +
      `y=1310:` +
      `expansion=none` +
      `[text4]`
  ];

  /*
    OLD PRICE
  */

  if (oldPriceText) {
    filterParts.push(
      `[text4]` +
        `drawtext=` +
        `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
        `textfile='${oldPriceTextFile}':` +
        `fontcolor=888888:` +
        `fontsize=36:` +
        `x=(w-text_w)/2-105:` +
        `y=1420:` +
        `expansion=none` +
        `[text5]`
    );
  } else {
    filterParts.push(
      `[text4]null[text5]`
    );
  }

  /*
    DISCOUNT
  */

  if (discountText) {
    filterParts.push(
      `[text5]` +
        `drawtext=` +
        `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
        `textfile='${discountTextFile}':` +
        `fontcolor=111111:` +
        `fontsize=40:` +
        `x=(w-text_w)/2+105:` +
        `y=1417:` +
        `expansion=none` +
        `[text6]`
    );
  } else {
    filterParts.push(
      `[text5]null[text6]`
    );
  }

  /*
    FINAL VIDEO FORMAT
  */

  filterParts.push(
    `[text6]format=yuv420p[output]`
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

      videoPath
    ]
  );

  productVideoPaths.push(
    `product-video-${index + 1}.mp4`
  );
}

/*
  FINAL ZOVARO SCREEN

  The selected logo already contains the
  approved branding.

  No additional copyright is added.
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
    logoPath,

    "-vf",

    [
      "scale=720:720:force_original_aspect_ratio=decrease",

      "pad=1080:1920:(ow-iw)/2:420:white",

      "drawtext=" +
        "fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:" +
        "text='DISCOVER. SHARE. SHOP.':" +
        "fontcolor=111111:" +
        "fontsize=52:" +
        "x=(w-text_w)/2:" +
        "y=1210",

      "drawtext=" +
        "fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:" +
        "text='Products and deals through ZOVARO':" +
        "fontcolor=555555:" +
        "fontsize=32:" +
        "x=(w-text_w)/2:" +
        "y=1290"
    ].join(","),

    "-frames:v",
    "1",

    "-c:v",
    "png",

    finalScreenPath
  ]
);

const finalVideoPath =
  `${TEMP_DIR}/final-screen-video.mp4`;

await run(
  "ffmpeg",
  [
    "-y",

    "-loop",
    "1",

    "-i",
    finalScreenPath,

    "-t",
    FINAL_DURATION.toFixed(3),

    "-vf",
    "format=yuv420p",

    "-r",
    "30",

    "-an",

    "-c:v",
    "libx264",

    "-preset",
    "veryfast",

    "-crf",
    "23",

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

    "-c",
    "copy",

    silentVideoPath
  ]
);

/*
  ADD THE FIXED ZOVARO AFFILIATE MUSIC
*/

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
