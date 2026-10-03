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

const WIDTH = 1080;
const HEIGHT = 1920;

const PRODUCT_DURATION = 4;
const FINAL_DURATION = 6;

const TOTAL_PRODUCTS = 6;

async function run(command, args) {
  console.log(
    `Running: ${command} ${args.join(" ")}`
  );

  const result =
    await execFileAsync(
      command,
      args,
      {
        maxBuffer:
          10 * 1024 * 1024
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

async function downloadFile(
  url,
  outputPath
) {
  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Unable to download ${url}: HTTP ${response.status}`
    );
  }

  const buffer =
    Buffer.from(
      await response.arrayBuffer()
    );

  await fs.writeFile(
    outputPath,
    buffer
  );
}

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

const selectedText =
  await fs.readFile(
    SELECTED_PRODUCTS_PATH,
    "utf8"
  );

const selectedData =
  JSON.parse(selectedText);

const products =
  Array.isArray(
    selectedData.products
  )
    ? selectedData.products
    : [];

if (
  products.length <
  TOTAL_PRODUCTS
) {
  throw new Error(
    `ZOVARO requires ${TOTAL_PRODUCTS} products for the automatic TikTok video, but only ${products.length} were selected.`
  );
}

const selectedProducts =
  products.slice(
    0,
    TOTAL_PRODUCTS
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

const productImages = [];

for (
  let index = 0;
  index < selectedProducts.length;
  index++
) {
  const product =
    selectedProducts[index];

  if (
    !product.imageLink ||
    typeof product.imageLink !==
      "string"
  ) {
    throw new Error(
      `Product ${index + 1} is missing imageLink.`
    );
  }

  const outputPath =
    `${TEMP_DIR}/product-${index + 1}.jpg`;

  console.log(
    `Downloading product ${index + 1}: ${product.title}`
  );

  await downloadFile(
    product.imageLink,
    outputPath
  );

  productImages.push(
    outputPath
  );
}

const logoCandidates = [
  "assets/zovaro-logo.png",
  "Logo ZOVARO con globo orbitante al neon.png"
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

const finalScreenPath =
  `${TEMP_DIR}/final-screen.png`;

/*
  Create the final ZOVARO screen using
  a single FFmpeg input.

  This avoids the previous filter graph
  parsing problem.
*/

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

      "drawtext="
        + "fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:"
        + "text='DISCOVER. SHARE. SHOP.':"
        + "fontcolor=111111:"
        + "fontsize=52:"
        + "x=(w-text_w)/2:"
        + "y=1210",

      "drawtext="
        + "fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:"
        + "text='Products and deals through ZOVARO':"
        + "fontcolor=555555:"
        + "fontsize=32:"
        + "x=(w-text_w)/2:"
        + "y=1290",

      "drawtext="
        + "fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:"
        + "text='Copyright 2026 ZOVARO. All rights reserved.':"
        + "fontcolor=777777:"
        + "fontsize=24:"
        + "x=(w-text_w)/2:"
        + "y=1810"

    ].join(","),

    "-frames:v",
    "1",

    "-c:v",
    "png",

    finalScreenPath
  ]
);

const productVideoPaths = [];

for (
  let index = 0;
  index < productImages.length;
  index++
) {
  const imagePath =
    productImages[index];

  const outputPath =
    `${TEMP_DIR}/product-video-${index + 1}.mp4`;

  await run(
    "ffmpeg",
    [
      "-y",

      "-loop",
      "1",

      "-i",
      imagePath,

      "-t",
      String(PRODUCT_DURATION),

      "-vf",

      [
        `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease`,
        `pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2:white`,
        "format=yuv420p"
      ].join(","),

      "-r",
      "30",

      "-an",

      "-c:v",
      "libx264",

      "-preset",
      "veryfast",

      "-crf",
      "23",

      outputPath
    ]
  );

  /*
    IMPORTANT:
    concat.txt is inside TEMP_DIR,
    therefore it must contain only the
    filenames relative to that directory.
  */

  productVideoPaths.push(
    `product-video-${index + 1}.mp4`
  );
}

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
    String(FINAL_DURATION),

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

const musicPath =
  `${TEMP_DIR}/zovaro-music.wav`;

const totalDuration =
  TOTAL_PRODUCTS *
    PRODUCT_DURATION +
  FINAL_DURATION;

await run(
  "ffmpeg",
  [
    "-y",

    "-f",
    "lavfi",

    "-i",
    `sine=frequency=261.63:sample_rate=44100:duration=${totalDuration}`,

    "-f",
    "lavfi",

    "-i",
    `sine=frequency=329.63:sample_rate=44100:duration=${totalDuration}`,

    "-f",
    "lavfi",

    "-i",
    `sine=frequency=392.00:sample_rate=44100:duration=${totalDuration}`,

    "-filter_complex",

    "[0:a][1:a][2:a]"
      + "amix=inputs=3:duration=longest:weights=0.18 0.12 0.10,"
      + "volume=1.5",

    "-c:a",
    "pcm_s16le",

    musicPath
  ]
);

await run(
  "ffmpeg",
  [
    "-y",

    "-i",
    silentVideoPath,

    "-i",
    musicPath,

    "-map",
    "0:v:0",

    "-map",
    "1:a:0",

    "-c:v",
    "copy",

    "-c:a",
    "aac",

    "-b:a",
    "128k",

    "-shortest",

    "-movflags",
    "+faststart",

    VIDEO_OUTPUT_PATH
  ]
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
  `Products: ${TOTAL_PRODUCTS}`
);

console.log(
  `Product duration: ${PRODUCT_DURATION}s`
);

console.log(
  `Final screen duration: ${FINAL_DURATION}s`
);

console.log(
  `Total duration: ${totalDuration}s`
);

console.log(
  `Output: ${VIDEO_OUTPUT_PATH}`
);
