import fs from "node:fs/promises";
import { categoryFor } from "../lib/product-category.js";

const CATALOG_PATH = "data/catalog.json";
const REPORT_PATH = "data/image-audit-report.json";
const MODEL_ID = process.env.IMAGE_AUDIT_MODEL || "Xenova/yolos-tiny";
const IMAGE_CLASSIFIER_ID = process.env.IMAGE_CLASSIFIER_MODEL || "Xenova/clip-vit-base-patch32";
const VISUAL_CANDIDATES = [
  { label: "lipstick, lip gloss, lip liner or lip balm makeup", category: "Beauty" },
  { label: "mascara, eyeliner, eyeshadow or eyebrow makeup", category: "Beauty" },
  { label: "foundation, concealer, blush or face powder makeup", category: "Beauty" },
  { label: "nail polish, manicure or nail art product", category: "Beauty" },
  { label: "makeup brushes, cosmetic sponges or beauty tools", category: "Beauty" },
  { label: "facial cleanser, toner or micellar water skincare", category: "Beauty" },
  { label: "face serum, moisturizer, eye cream or face mask skincare", category: "Beauty" },
  { label: "sunscreen, sun protection or tanning skincare", category: "Beauty" },
  { label: "shampoo, conditioner, hair mask or hair treatment", category: "Beauty" },
  { label: "hair dryer, curling iron, straightener or styling tool", category: "Beauty" },
  { label: "perfume, eau de parfum, cologne or body fragrance", category: "Beauty" },
  { label: "body wash, shower gel, body lotion or deodorant", category: "Beauty" },
  { label: "baby-specific lotion, baby oil, diaper cream or baby wash", category: "Babies" },
  { label: "baby bottle, feeding nipple, breast pump or high chair", category: "Babies" },
  { label: "baby stroller, infant car seat, baby carrier or baby monitor", category: "Babies" },
  { label: "newborn clothing, baby bodysuit or infant apparel", category: "Babies" },
  { label: "vitamins, minerals, multivitamins or dietary supplements", category: "Health & Wellness" },
  { label: "protein powder, creatine, electrolyte or sports nutrition supplement", category: "Health & Wellness" },
  { label: "blood pressure monitor, thermometer or pulse oximeter", category: "Health & Wellness" },
  { label: "first aid bandages, medical dressing or wound care supplies", category: "Health & Wellness" },
  { label: "dental care, toothbrush, toothpaste or oral hygiene product", category: "Health & Wellness" },
  { label: "mobility aid, orthopedic brace or medical support device", category: "Health & Wellness" },
  { label: "dumbbells, kettlebells, weights or strength training equipment", category: "Sports" },
  { label: "treadmill, exercise bike, rowing machine or cardio equipment", category: "Sports" },
  { label: "yoga mat, yoga block or pilates equipment", category: "Sports" },
  { label: "tennis racket, padel racket, badminton racket or sports balls", category: "Sports" },
  { label: "bicycle, cycling helmet, bike pump or cycling equipment", category: "Sports" },
  { label: "camping tent, hiking backpack or outdoor recreation gear", category: "Sports" },
  { label: "swimming, diving, surfing or water sports equipment", category: "Sports" },
  { label: "women's dress, blouse, jeans or clothing", category: "Fashion" },
  { label: "men's shirt, trousers, jacket or clothing", category: "Fashion" },
  { label: "sneakers, boots, sandals or fashion footwear", category: "Fashion" },
  { label: "handbag, wallet, backpack or fashion bag", category: "Fashion" },
  { label: "jewelry, necklace, bracelet, ring or earrings", category: "Fashion" },
  { label: "smartphone, tablet, laptop or computer", category: "Electronics" },
  { label: "digital camera, camera lens, webcam or photography equipment", category: "Electronics" },
  { label: "headphones, earbuds, speaker or microphone audio device", category: "Electronics" },
  { label: "television, projector, streaming device or home theater", category: "Electronics" },
  { label: "smartwatch, fitness tracker or wearable technology", category: "Electronics" },
  { label: "car tire, alloy wheel, automotive mirror or replacement car part", category: "Automotive" },
  { label: "car interior accessory, car seat cover, floor mat or roof rack", category: "Automotive" },
  { label: "car battery, brake pad, headlight or engine component", category: "Automotive" },
  { label: "car wash, automotive polish, engine oil or vehicle care product", category: "Automotive" },
  { label: "kitchen appliance, coffee machine, blender or air fryer", category: "Appliances" },
  { label: "vacuum cleaner, robot vacuum or floor cleaning appliance", category: "Appliances" },
  { label: "sofa, chair, table, bed or household furniture", category: "Home & Living" },
  { label: "cookware, kitchen utensils, plates, cups or tableware", category: "Home & Living" },
  { label: "bedding, pillows, towels or bathroom accessories", category: "Home & Living" },
  { label: "lamp, wall art, candle, vase or home decoration", category: "Home & Living" },
  { label: "dog food, dog harness, dog bed or dog toy", category: "Pets" },
  { label: "cat food, cat litter, cat bed or cat toy", category: "Pets" },
  { label: "bird cage, aquarium, fish tank or small animal habitat", category: "Pets" },
  { label: "building blocks, construction toy or model kit", category: "Toys & Games" },
  { label: "doll, action figure, board game or puzzle", category: "Toys & Games" },
  { label: "coffee, tea, snack, chocolate or packaged food", category: "Food & Grocery" },
  { label: "plant seeds, flower pot, fertilizer or garden tools", category: "Garden" },
  { label: "power drill, hand tools, screwdriver or workshop equipment", category: "Tools & DIY" },
  { label: "book, magazine, DVD or music record", category: "Books & Media" },
  { label: "office stationery, printer supplies or computer software", category: "Office & Technology" },
  { label: "suitcase, carry-on luggage, travel backpack or travel accessory", category: "Travel" }
];
const requestedBatchSize = Number(process.env.IMAGE_AUDIT_BATCH_SIZE || 250) || 250;
const BATCH_SIZE = Math.min(500, Math.max(1, requestedBatchSize));
const MIN_BYTES = 8 * 1024;
const MAX_BYTES = 12 * 1024 * 1024;
const MIN_EDGE = 240;
const OBJECT_THRESHOLD = 0.45;

const OBJECT_GROUPS = {
  Automotive: new Set(["car", "motorcycle", "bus", "truck", "airplane", "boat"]),
  Electronics: new Set(["tv", "laptop", "mouse", "remote", "keyboard", "cell phone"]),
  Fashion: new Set(["backpack", "umbrella", "handbag", "tie", "suitcase"]),
  "Home & Living": new Set(["chair", "couch", "bed", "dining table", "vase", "clock"]),
  Pets: new Set(["bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe"]),
  Sports: new Set(["sports ball", "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket", "frisbee", "skis", "snowboard"]),
  "Books & Media": new Set(["book"]),
  "Food & Grocery": new Set(["banana", "apple", "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake"]),
  Appliances: new Set(["microwave", "oven", "toaster", "refrigerator"]),
  Garden: new Set(["potted plant", "vase"]),
  Beauty: new Set(["hair drier", "toothbrush"])
};
const OBJECT_TO_GROUP = new Map();
for (const [group, labels] of Object.entries(OBJECT_GROUPS)) {
  for (const label of labels) OBJECT_TO_GROUP.set(label, group);
}

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function imageMetrics(image) {
  const { data, width, height, channels } = image;
  if (!data || !width || !height || !channels || data.length < width * height * channels) {
    throw new Error("Decoded image has invalid pixel data.");
  }
  const histogram = new Uint32Array(16);
  let brightness = 0;
  let samples = 0;
  const gray = (x, y) => {
    const index = (Math.min(height - 1, y) * width + Math.min(width - 1, x)) * channels;
    const r = data[index] || 0;
    const g = data[index + Math.min(1, channels - 1)] || r;
    const b = data[index + Math.min(2, channels - 1)] || r;
    return luminance(r, g, b);
  };
  const sampleStep = Math.max(1, Math.floor(Math.sqrt((width * height) / 12000)));
  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const value = gray(x, y);
      brightness += value;
      histogram[Math.min(15, Math.floor(value / 16))] += 1;
      samples += 1;
    }
  }
  let entropy = 0;
  for (const count of histogram) {
    if (!count) continue;
    const probability = count / samples;
    entropy -= probability * Math.log2(probability);
  }
  let hash = 0n;
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const left = gray(Math.floor((x * (width - 1)) / 9), Math.floor((y * (height - 1)) / 8));
      const right = gray(Math.floor(((x + 1) * (width - 1)) / 9), Math.floor((y * (height - 1)) / 8));
      hash = (hash << 1n) | (left > right ? 1n : 0n);
    }
  }
  return {
    width,
    height,
    aspectRatio: Number((width / height).toFixed(3)),
    brightness: Number((brightness / samples).toFixed(1)),
    entropy: Number(entropy.toFixed(3)),
    perceptualHash: hash.toString(16).padStart(16, "0")
  };
}

export function hashDistance(a, b) {
  let value = BigInt("0x" + a) ^ BigInt("0x" + b);
  let count = 0;
  while (value) {
    value &= value - 1n;
    count += 1;
  }
  return count;
}

export function qualityFlags(metrics, byteLength) {
  const flags = [];
  if (byteLength < MIN_BYTES) flags.push("image_file_too_small");
  if (metrics.width < MIN_EDGE || metrics.height < MIN_EDGE) flags.push("low_resolution");
  if (metrics.aspectRatio < 0.25 || metrics.aspectRatio > 4) flags.push("extreme_aspect_ratio");
  if (metrics.entropy < 1.35) flags.push("low_visual_information");
  if (metrics.brightness < 18) flags.push("image_too_dark");
  if (metrics.brightness > 245) flags.push("image_too_bright");
  return flags;
}

export function compareVisualCategory(expectedCategory, predictions) {
  const bestByCategory = new Map();
  for (const item of Array.isArray(predictions) ? predictions : []) {
    const candidate = VISUAL_CANDIDATES.find(entry => entry.label === item.label);
    if (!candidate) continue;
    const score = Number(item.score || 0);
    const previous = bestByCategory.get(candidate.category);
    if (!previous || score > previous.score) {
      bestByCategory.set(candidate.category, { category: candidate.category, label: item.label, score });
    }
  }
  const ranked = [...bestByCategory.values()].sort((a, b) => b.score - a.score);
  const first = ranked[0];
  const second = ranked[1];
  if (!first) return { expectedCategory, status: "not_assessable" };
  const margin = first.score - (second?.score || 0);
  if (first.score < 0.28 || margin < 0.045) {
    return {
      expectedCategory,
      detectedCategory: first.category,
      status: "ambiguous",
      confidence: Number(first.score.toFixed(3)),
      margin: Number(margin.toFixed(3))
    };
  }
  return {
    expectedCategory,
    detectedCategory: first.category,
    status: first.category === expectedCategory ? "consistent" : "possible_mismatch",
    visualLabel: first.label,
    confidence: Number(first.score.toFixed(3)),
    margin: Number(margin.toFixed(3)),
    alternatives: ranked.slice(0, 3).map(item => ({
      category: item.category,
      label: item.label,
      score: Number(item.score.toFixed(3))
    }))
  };
}

function categoryMismatch(product, detections) {
  const expected = categoryFor({ name: product.advertiserName || "" }, product);
  const relevant = detections
    .filter(item => item.score >= 0.7 && OBJECT_TO_GROUP.has(item.label))
    .sort((a, b) => b.score - a.score);
  const primary = relevant[0];
  if (!primary) return { expectedCategory: expected, status: "not_assessable" };
  const detectedCategory = OBJECT_TO_GROUP.get(primary.label);
  const compatible = detectedCategory === expected ||
    (expected === "Travel" && ["Fashion", "Automotive"].includes(detectedCategory)) ||
    (expected === "Sports" && detectedCategory === "Automotive") ||
    (expected === "Home & Living" && detectedCategory === "Garden");
  const box = primary.box || {};
  const area = Math.max(0, (box.xmax - box.xmin) * (box.ymax - box.ymin));
  const imageArea = Math.max(1, product.__imageWidth * product.__imageHeight);
  if (compatible || area / imageArea < 0.12) {
    return { expectedCategory: expected, detectedCategory, status: "consistent", primaryObject: primary.label };
  }
  return {
    expectedCategory: expected,
    detectedCategory,
    status: "possible_mismatch",
    primaryObject: primary.label,
    confidence: Number(primary.score.toFixed(3))
  };
}

async function loadReport() {
  try {
    const raw = await fs.readFile(REPORT_PATH, "utf8");
    if (!raw.trim()) return { schemaVersion: 2, model: MODEL_ID, generatedAt: null, results: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.results)) throw new Error("Invalid image audit report.");
    return parsed;
  } catch (error) {
    if (error.code === "ENOENT") return { schemaVersion: 2, model: MODEL_ID, generatedAt: null, results: [] };
    throw error;
  }
}

async function analyseProduct(product, detector, classifier, RawImage) {
  const imageUrl = String(product.imageLink || "");
  const base = {
    key: [product.source || "", product.advertiserId || "", product.id || ""].join("|"),
    id: String(product.id || ""),
    title: String(product.englishTitle || product.title || "").slice(0, 180),
    category: String(product.englishCategory || product.category || ""),
    imageUrl,
    auditedAt: new Date().toISOString()
  };
  try {
    if (!/^https:\/\//i.test(imageUrl)) throw new Error("invalid_image_url");
    const response = await fetch(imageUrl, { signal: AbortSignal.timeout(20000), headers: { "user-agent": "ZOVARO-ImageAudit/1.0" } });
    if (!response.ok) throw new Error("image_http_" + response.status);
    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    if (!contentType.startsWith("image/")) throw new Error("response_not_image");
    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > MAX_BYTES) throw new Error("image_too_large");
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) throw new Error("image_too_large");
    if (buffer.byteLength < MIN_BYTES) throw new Error("image_file_too_small");
    const image = await RawImage.fromBlob(new Blob([buffer], { type: contentType }));
    const metrics = imageMetrics(image);
    const flags = qualityFlags(metrics, buffer.byteLength);
    const detections = (await detector(image, { threshold: OBJECT_THRESHOLD }))
      .slice(0, 12)
      .map(item => ({
        label: String(item.label || ""),
        score: Number(item.score || 0),
        box: item.box || null
      }));
    const expectedCategory = categoryFor({ name: product.advertiserName || "" }, product);
    const visualPredictions = await classifier(image, VISUAL_CANDIDATES.map(item => item.label));
    const visualCheck = compareVisualCategory(expectedCategory, visualPredictions);
    const objectCheck = categoryMismatch({ ...product, __imageWidth: metrics.width, __imageHeight: metrics.height }, detections);
    const mismatch = visualCheck.status === "not_assessable" ? objectCheck : visualCheck;
    if (mismatch.status === "possible_mismatch") flags.push("possible_category_mismatch");
    // A category disagreement, ambiguous visual result, or unassessable image
    // is never treated as an automatic pass. It remains explicitly review-required.
    const decision = flags.length || mismatch.status !== "consistent"
      ? "review_required"
      : "pass";
    return { ...base, decision, flags, metrics: { ...metrics, bytes: buffer.byteLength }, detections, categoryCheck: mismatch };
  } catch (error) {
    const reason = String(error.message || error).slice(0, 120);
    const hardFailure = [
      "invalid_image_url",
      "response_not_image",
      "image_too_large",
      "image_file_too_small",
      "image_http_404",
      "image_http_410"
    ].includes(reason);
    return {
      ...base,
      // If the image cannot be inspected, the visual classification is unverified.
      // Keep the item explicitly review-required; retry it after the recheck interval.
      decision: "review_required",
      flags: [reason],
      metrics: null,
      detections: [],
      categoryCheck: { status: "not_assessable" }
    };
  }
}

async function main() {
  if (process.argv.includes("--self-test")) {
    const sample = { data: new Uint8Array(64 * 64 * 3).fill(120), width: 64, height: 64, channels: 3 };
    const metrics = imageMetrics(sample);
    if (metrics.width !== 64 || !/^[0-9a-f]{16}$/.test(metrics.perceptualHash)) throw new Error("Image metrics self-test failed.");
    if (hashDistance("0000000000000000", "000000000000000f") !== 4) throw new Error("Perceptual hash self-test failed.");
    if (!qualityFlags(metrics, 1024).includes("image_file_too_small")) throw new Error("Quality flags self-test failed.");
    const mismatch = compareVisualCategory("Babies", [
      { label: "lipstick, lip gloss, lip liner or lip balm makeup", score: 0.72 },
      { label: "baby-specific lotion, baby oil, diaper cream or baby wash", score: 0.11 }
    ]);
    if (mismatch.status !== "possible_mismatch" || mismatch.detectedCategory !== "Beauty") throw new Error("Visual category self-test failed.");
    const ambiguous = compareVisualCategory("Babies", [
      { label: "lipstick, lip gloss, lip liner or lip balm makeup", score: 0.29 },
      { label: "baby-specific lotion, baby oil, diaper cream or baby wash", score: 0.27 }
    ]);
    if (ambiguous.status !== "ambiguous") throw new Error("Visual ambiguity self-test failed.");
    console.log("Image audit self-tests passed.");
    return;
  }

  const catalog = JSON.parse(await fs.readFile(CATALOG_PATH, "utf8"));
  if (!Array.isArray(catalog.products)) throw new Error("Catalog products array is missing.");
  const report = await loadReport();
  const existing = new Map(report.results.map(item => [item.key, item]));
  const recheckDays = Math.max(1, Number(process.env.IMAGE_AUDIT_RECHECK_DAYS || 30) || 30);
  const recheckBefore = Date.now() - recheckDays * 24 * 60 * 60 * 1000;
  const pending = catalog.products.filter(product => {
    const key = [product.source || "", product.advertiserId || "", product.id || ""].join("|");
    const previous = existing.get(key);
    const auditedAt = Date.parse(previous?.auditedAt || "");
    return product.imageLink && (
      !previous ||
      previous.imageUrl !== product.imageLink ||
      !Number.isFinite(auditedAt) ||
      auditedAt < recheckBefore
    );
  }).sort((a, b) => {
    const keyA = [a.source || "", a.advertiserId || "", a.id || ""].join("|");
    const keyB = [b.source || "", b.advertiserId || "", b.id || ""].join("|");
    const timeA = Date.parse(existing.get(keyA)?.auditedAt || "") || 0;
    const timeB = Date.parse(existing.get(keyB)?.auditedAt || "") || 0;
    return timeA - timeB;
  });
  const batch = pending.slice(0, BATCH_SIZE);
  console.log("Full-catalog image audit queue: " + pending.length + " products due for first/30-day recheck; processing " + batch.length + "; model " + MODEL_ID);
  if (!batch.length) {
    report.generatedAt = new Date().toISOString();
    await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2) + "\n");
    console.log("No new or changed product images require auditing.");
    return;
  }

  const { pipeline, RawImage, env } = await import("@huggingface/transformers");
  env.allowRemoteModels = true;
  const [detector, classifier] = await Promise.all([
    pipeline("object-detection", MODEL_ID, { device: "cpu" }),
    pipeline("zero-shot-image-classification", IMAGE_CLASSIFIER_ID, { device: "cpu" })
  ]);
  let passed = 0;
  let review = 0;
  for (let index = 0; index < batch.length; index += 1) {
    const result = await analyseProduct(batch[index], detector, classifier, RawImage);
    const previous = [...existing.values()].filter(item => item.metrics?.perceptualHash);
    const duplicate = result.metrics?.perceptualHash
      ? previous.find(item => item.key !== result.key &&
          item.metrics?.perceptualHash &&
          hashDistance(result.metrics.perceptualHash, item.metrics.perceptualHash) <= 4)
      : null;
    if (duplicate) {
      result.flags.push("possible_duplicate_image");
      result.duplicateOf = duplicate.key;
      if (result.decision === "pass") result.decision = "review";
    }
    if (result.decision === "pass") passed += 1;
    else review += 1;
    existing.set(result.key, result);
    if ((index + 1) % 25 === 0 || index === batch.length - 1) {
      console.log("Image audit progress: " + (index + 1) + "/" + batch.length);
    }
  }
  report.model = MODEL_ID;
  report.imageClassifier = IMAGE_CLASSIFIER_ID;
  report.generatedAt = new Date().toISOString();
  report.totalAudited = existing.size;
  report.results = [...existing.values()];
  report.lastBatch = { processed: batch.length, passed, review, remaining: Math.max(0, pending.length - batch.length) };
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2) + "\n");
  console.log("Image audit batch result: " + JSON.stringify(report.lastBatch));
}

main().catch(error => {
  console.error("Product image audit failed:", error);
  process.exitCode = 1;
});
