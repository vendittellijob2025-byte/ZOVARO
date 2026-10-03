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
  productCount <
  MIN_PRODUCTS
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

    Descriptions are intentionally removed.
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
      36
    ),
    "utf8"
  );

  await fs.writeFile(
    nameFile,
    wrapText(
      name,
      27
    ),
    "utf8"
  );

  await fs.writeFile(
    merchantFile,
    wrapText(
      merchant,
      36
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

    NO WHITE PANELS.

    The ZOVARO futuristic shop remains
    visible throughout the scene.

    Product is positioned in the upper
    portion.

    Text is distributed vertically
    through the lower portion with safe
    margins for smartphone viewing.
  */

  const filterParts = [
    /*
      BACKGROUND

      The futuristic ZOVARO shop is kept
      visible but softened with a light
      transparent white layer.
    */

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
      `color=white@0.32:` +
      `t=fill` +
      `[softbackground]`,

    /*
      PRODUCT

      No white panel and no white pad.
    */

    `[0:v]` +
      `scale=900:880:force_original_aspect_ratio=decrease` +
      `[product]`,

    `[softbackground][product]` +
      `overlay=(W-w)/2:55:format=auto` +
      `[scene1]`,

    /*
      CATEGORY

      Safe upper text position.
    */

    `[scene1]` +
      `drawtext=` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
      `textfile='${categoryText}':` +
      `fontcolor=444444:` +
      `fontsize=28:` +
      `x=(w-text_w)/2:` +
      `y=1030:` +
      `line_spacing=8:` +
      `expansion=none` +
      `[text1]`,

    /*
      PRODUCT TITLE

      Smaller width and larger vertical
      separation to avoid phone-edge crowding.
    */

    `[text1]` +
      `drawtext=` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
      `textfile='${nameText}':` +
      `fontcolor=111111:` +
      `fontsize=46:` +
      `x=(w-text_w)/2:` +
      `y=1095:` +
      `line_spacing=12:` +
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
      `fontsize=26:` +
      `x=(w-text_w)/2:` +
      `y=1280:` +
      `line_spacing=8:` +
      `expansion=none` +
      `[text3]`,

    /*
      CURRENT PRICE

      Strong visual separation.
    */

    `[text3]` +
      `drawtext=` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
      `textfile='${priceTextFile}':` +
      `fontcolor=111111:` +
      `fontsize=70:` +
      `x=(w-text_w)/2:` +
      `y=1360:` +
      `expansion=none` +
      `[text4]`
  ];

  /*
    OLD PRICE

    Positioned safely below the main price.
  */

  if (oldPriceText) {
    filterParts.push(
      `[text4]` +
        `drawtext=` +
        `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
        `textfile='${oldPriceTextFile}':` +
        `fontcolor=888888:` +
        `fontsize=34:` +
        `x=(w-text_w)/2-95:` +
        `y=1480:` +
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

    Kept beside the old price but with
    sufficient space from the screen edges.
  */

  if (discountText) {
    filterParts.push(
      `[text5]` +
        `drawtext=` +
        `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
        `textfile='${discountTextFile}':` +
        `fontcolor=111111:` +
        `fontsize=38:` +
        `x=(w-text_w)/2+95:` +
        `y=1477:` +
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

  The ZOVARO Shop background replaces
  the previous white background.

  The background remains softly visible
  and the logo is placed above it.
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
      /*
        Background.
      */

      `[0:v]` +
        `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,` +
        `crop=${WIDTH}:${HEIGHT}` +
        `[finalbg]`,

      /*
        Soft transparent white layer.
      */

      `[finalbg]` +
        `drawbox=` +
        `x=0:` +
        `y=0:` +
        `w=${WIDTH}:` +
        `h=${HEIGHT}:` +
        `color=white@0.32:` +
        `t=fill` +
        `[finalsoft]`,

      /*
        Logo.
      */

      `[1:v]` +
        `scale=720:720:force_original_aspect_ratio=decrease` +
        `[logo]`,

      `[finalsoft][logo]` +
        `overlay=(W-w)/2:420:format=auto` +
        `[finalscene]`,

      /*
        Final text.
      */

      `[finalscene]` +
        `drawtext=` +
        `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
        `text='DISCOVER. SHARE. SHOP.':` +
        `fontcolor=111111:` +
        `fontsize=52:` +
        `x=(w-text_w)/2:` +
        `y=1240` +
        `[finaltext1]`,

      `[finaltext1]` +
        `drawtext=` +
        `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
        `text='Products and deals through ZOVARO':` +
        `fontcolor=555555:` +
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
