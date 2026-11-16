import fs from "node:fs/promises";
import path from "node:path";

const SELECTED_PATH = "data/selected-products.json";
const CACHE_DIR = ".zovaro-image-cache";
const REQUIRED = 24;
const MAX_BYTES = 15 * 1024 * 1024;
const headers = {
  "User-Agent": "Mozilla/5.0 (compatible; ZOVARO-AffiliatePublisher/1.0)",
  "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
};

const data = JSON.parse(await fs.readFile(SELECTED_PATH, "utf8"));
const candidates = Array.isArray(data.products) ? data.products : [];
await fs.mkdir(CACHE_DIR, { recursive: true });

function safeId(value) {
  return String(value || "product").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
}

function looksLikeImage(buffer, contentType) {
  const type = String(contentType || "").toLowerCase();
  const b = buffer;
  const signatures =
    (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) ||
    (b[0] === 0x89 && b.subarray(1, 4).toString() === "PNG") ||
    (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") ||
    (b.subarray(0, 3).toString() === "GIF");
  return signatures || type.startsWith("image/");
}

async function probeAndCache(product) {
  if (!product.imageLink || !/^https?:\/\//i.test(product.imageLink)) {
    return { ok: false, reason: "missing_or_invalid_image_url" };
  }
  let lastReason = "unknown";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(product.imageLink, {
        headers,
        redirect: "follow",
        signal: AbortSignal.timeout(20000)
      });
      if (!response.ok) {
        lastReason = "HTTP_" + response.status;
        if ([401, 403, 404, 410].includes(response.status)) break;
      } else {
        const contentType = response.headers.get("content-type") || "";
        const declaredLength = Number(response.headers.get("content-length") || 0);
        if (declaredLength > MAX_BYTES) return { ok: false, reason: "image_too_large" };
        const buffer = Buffer.from(await response.arrayBuffer());
        if (!buffer.length || buffer.length > MAX_BYTES) return { ok: false, reason: "invalid_image_size" };
        if (!looksLikeImage(buffer, contentType)) return { ok: false, reason: "response_not_an_image" };
        const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : contentType.includes("gif") ? "gif" : "jpg";
        const cachePath = path.join(CACHE_DIR, safeId(product.id) + "." + ext);
        await fs.writeFile(cachePath, buffer);
        return { ok: true, cachePath, bytes: buffer.length, contentType };
      }
    } catch (error) {
      lastReason = String(error?.name === "TimeoutError" ? "timeout" : error?.message || error).slice(0, 180);
    }
    if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 1200 * attempt));
  }
  return { ok: false, reason: lastReason };
}

const eligible = candidates.filter(p =>
  p && p.id && p.joinedStatus === true &&
  typeof p.clickUrl === "string" && p.clickUrl.startsWith("https://") &&
  typeof p.imageLink === "string"
);

const approved = [];
const rejected = [];
for (const product of eligible) {
  const result = await probeAndCache(product);
  if (result.ok) {
    approved.push({ ...product, preflightImagePath: result.cachePath });
    console.log("IMAGE_PREFLIGHT_OK", product.id, result.bytes, result.contentType);
  } else {
    rejected.push({ id: product.id, title: product.englishTitle || product.title, reason: result.reason });
    console.warn("IMAGE_PREFLIGHT_REJECTED", product.id, result.reason);
  }
  if (approved.length >= REQUIRED) break;
}

if (approved.length < REQUIRED) {
  console.error(JSON.stringify({
    required: REQUIRED,
    accessible: approved.length,
    rejectedCount: rejected.length,
    rejected: rejected.slice(0, 40)
  }, null, 2));
  throw new Error("Image preflight blocked video generation: only " + approved.length + " of " + REQUIRED + " required affiliate product images are accessible. No SHOP videos will be generated or published.");
}

data.products = approved;
data.productCount = approved.length;
data.imagePreflight = {
  checkedAt: new Date().toISOString(),
  required: REQUIRED,
  accessible: approved.length,
  rejectedCount: rejected.length,
  rejected: rejected.slice(0, 100)
};
await fs.writeFile(SELECTED_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log("IMAGE_PREFLIGHT_PASSED", approved.length, "official affiliate images cached locally. Video generation may start.");
