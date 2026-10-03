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

/*
  TRANSITION SETTINGS

  Each product keeps the ZOVARO shop visible.
  The product/text layer fades between products,
  allowing the background to remain visible.
*/

const TRANSITION_DURATION = 0.75;

/*
  PRODUCT IMAGE OPACITY

  The white background of the product image
  is now MORE OPAQUE.

  This matches the visual quality of the
  white text mini-panels.
*/

const PRODUCT_OPACITY = 0.82;

/*
  BACKGROUND VISIBILITY

  Higher opacity means the futuristic ZOVARO
  shop remains much more visible.
*/

const BACKGROUND_WHITE_OVERLAY = 0.10;

/*
  TEXT MINI PANELS

  Each text element gets its own independent
  WHITE MINI-PANEL.

  The panels are intentionally LESS TRANSPARENT
  so the text remains clearly separated from the
  futuristic ZOVARO shop background.
*/

const TEXT_BOX_COLOR = "white@0.82";
const TEXT_BOX_BORDER = 18;

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
    PRODUCT VIDEO SCENE

    The futuristic ZOVARO shop remains
    strongly visible.

    The product image now uses the same
    opacity level as the text mini-panels.

    This makes the white product background
    clearly separated from the shop background.

    Every text line has its OWN white mini-panel.
  */

  const filterParts = [
    /*
      ZOVARO BACKGROUND
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
      `color=white@${BACKGROUND_WHITE_OVERLAY}:` +
      `t=fill` +
      `[softbackground]`,

    /*
      PRODUCT IMAGE

      Product image opacity is now 0.82,
      matching the white text panels.
    */

    `[0:v]` +
      `scale=900:880:force_original_aspect_ratio=decrease,` +
      `format=rgba,` +
      `colorchannelmixer=aa=${PRODUCT_OPACITY}` +
      `[product]`,

    `[softbackground][product]` +
      `overlay=(W-w)/2:55:format=auto` +
      `[scene1]`,

    /*
      CATEGORY
    */

    `[scene1]` +
      `drawtext=` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
      `textfile='${categoryText}':` +
      `fontcolor=444444:` +
      `fontsize=28:` +
      `x=(w-text_w)/2:` +
      `y=1015:` +
      `line_spacing=8:` +
      `expansion=none:` +
      `box=1:` +
      `boxcolor=${TEXT_BOX_COLOR}:` +
      `boxborderw=${TEXT_BOX_BORDER}` +
      `[text1]`,

    /*
      PRODUCT TITLE
    */

    `[text1]` +
      `drawtext=` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
      `textfile='${nameText}':` +
      `fontcolor=111111:` +
      `fontsize=46:` +
      `x=(w-text_w)/2:` +
      `y=1090:` +
      `line_spacing=12:` +
      `expansion=none:` +
      `box=1:` +
      `boxcolor=${TEXT_BOX_COLOR}:` +
      `boxborderw=${TEXT_BOX_BORDER}` +
      `[text2]`,

    /*
      MERCHANT / AFFILIATE
    */

    `[text2]` +
      `drawtext=` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
      `textfile='${merchantText}':` +
      `fontcolor=555555:` +
      `fontsize=26:` +
      `x=(w-text_w)/2:` +
      `y=1270:` +
      `line_spacing=8:` +
      `expansion=none:` +
      `box=1:` +
      `boxcolor=${TEXT_BOX_COLOR}:` +
      `boxborderw=${TEXT_BOX_BORDER}` +
      `[text3]`,

    /*
      CURRENT PRICE
    */

    `[text3]` +
      `drawtext=` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
      `textfile='${priceTextFile}':` +
      `fontcolor=111111:` +
      `fontsize=70:` +
      `x=(w-text_w)/2:` +
      `y=1350:` +
      `expansion=none:` +
      `box=1:` +
      `boxcolor=${TEXT_BOX_COLOR}:` +
      `boxborderw=${TEXT_BOX_BORDER}` +
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
        `fontcolor=777777:` +
        `fontsize=34:` +
        `x=(w-text_w)/2-105:` +
        `y=1470:` +
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
  */

  if (discountText) {
    filterParts.push(
      `[text5]` +
        `drawtext=` +
        `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
        `textfile='${discountTextFile}':` +
        `fontcolor=111111:` +
        `fontsize=38:` +
        `x=(w-text_w)/2+105:` +
        `y=1467:` +
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

  /*
    PRODUCT SCENE FADE

    Only the product/text layer fades.

    The ZOVARO shop background remains visible.
  */

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
  FINAL ZOVARO SCREEN

  The futuristic shop starts visible.

  The logo and white text remain visible.

  The shop background then rapidly fades
  toward BLACK.

  The final screen is rendered at a fixed
  30 FPS so there are no frozen frames.
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
        Slightly stronger shop visibility.
      */

      `[finalbg]` +
        `drawbox=` +
        `x=0:` +
        `y=0:` +
        `w=${WIDTH}:` +
        `h=${HEIGHT}:` +
        `color=white@0.10:` +
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
        FINAL TEXT — WHITE
      */

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
  FINAL ANIMATION

  The background fades toward BLACK.

  The logo and white text are rendered over
  the background AFTER the fade operation,
  so they remain visible throughout the ending.

  The logo input is looped as well, preventing
  the last frame from freezing because of a
  single-frame input.
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
      /*
        BACKGROUND

        Shop fades smoothly to black.
      */

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
        `fade=t=out:st=1.0:d=1.4:color=black` +
        `[endingbg]`,

      /*
        LOGO

        Looping the logo input guarantees that
        the logo is available for every frame.
      */

      `[1:v]` +
        `scale=720:720:force_original_aspect_ratio=decrease` +
        `[endinglogo]`,

      `[endingbg][endinglogo]` +
        `overlay=(W-w)/2:420:format=auto` +
        `[endingscene]`,

      /*
        WHITE FINAL TEXT
      */

      `[endingscene]` +
        `drawtext=` +
        `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
        `text='DISCOVER. SHARE. SHOP.':` +
        `fontcolor=white:` +
        `fontsize=52:` +
        `x=(w-text_w)/2:` +
        `y=1240` +
        `[endingtext1]`,

      `[endingtext1]` +
        `drawtext=` +
        `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
        `text='Products and deals through ZOVARO':` +
        `fontcolor=white:` +
        `fontsize=32:` +
        `x=(w-text_w)/2:` +
        `y=1325` +
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

/*
  IMPORTANT FINAL CONCAT FIX

  The previous version used:

    -c copy

  That can preserve incompatible timestamps/timebases
  between separately generated segments and can cause
  the final section to appear frozen.

  The complete video is now re-encoded at a fixed
  30 FPS during concatenation.
*/

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
  `Final video FPS: 30`
);

console.log(
  `Final concat: re-encoded to prevent frozen ending`
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
