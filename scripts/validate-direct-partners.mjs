import fs from "node:fs/promises";

const data = JSON.parse(await fs.readFile("data/direct-partners.json", "utf8"));
const errors = [];
if (data.schemaVersion !== 1) errors.push("schemaVersion must be 1.");
for (const key of ["partners", "prospects", "products"]) {
  if (!Array.isArray(data[key])) errors.push(key + " must be an array.");
}
const partnerIds = new Set();
for (const p of [...(data.partners || []), ...(data.prospects || [])]) {
  const id = String(p.id || "").trim();
  if (!id) errors.push("Every partner/prospect needs an id.");
  if (partnerIds.has(id)) errors.push("Duplicate partner/prospect id: " + id);
  partnerIds.add(id);
}
const partners = new Map((data.partners || []).map(p => [String(p.id), p]));
const seen = new Set();
for (const p of data.products || []) {
  const id = String(p.id || "").trim();
  if (!id) errors.push("Every product needs an id.");
  if (seen.has(id)) errors.push("Duplicate product id: " + id);
  seen.add(id);
  const partner = partners.get(String(p.partnerId || ""));
  if (!partner) errors.push("Product " + id + " references an unknown active partner.");
  if (p.publicationStatus === "published") {
    if (partner?.status !== "active") errors.push("Published product " + id + " has no active partner.");
    if (partner?.writtenApproval !== true) errors.push("Published product " + id + " lacks written partner approval.");
    if (p.tracking?.status !== "verified") errors.push("Published product " + id + " has no verified tracking status.");
    if (p.assets?.imagePermission !== true) errors.push("Published product " + id + " lacks image permission.");
    if (!/^https:\/\//i.test(String(p.tracking?.clickUrl || ""))) errors.push("Published product " + id + " needs an HTTPS tracking URL.");
    if (!p.title || !p.imageUrl || !(Number(p.price) > 0) || !p.currency) errors.push("Published product " + id + " has incomplete display data.");
    if (!p.tracking?.conversionMethod) errors.push("Published product " + id + " needs a documented conversion method.");
  }
}
if (errors.length) {
  console.error("DIRECT PARTNERS VALIDATION FAILED");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}
console.log("ZOVARO DIRECT PARTNERS registry valid. " +
  (data.prospects || []).length + " prospects; " +
  (data.partners || []).length + " active partners; " +
  (data.products || []).filter(p => p.publicationStatus === "published").length +
  " publishable products.");
