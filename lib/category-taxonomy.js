const key = value => String(value || "")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/, "")
  .toLowerCase()
  .replace(/&/g, "and")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

export function normalizeSubcategoryPath(category, candidate, taxonomy) {
  const root = (taxonomy?.categories || []).find(item => key(item?.name) === key(category));
  if (!root) return "Other";
  const parts = String(candidate || "").split(">").map(part => part.trim()).filter(Boolean);
  if (!parts.length || parts.length > 3) return "Other";

  let nodes = Array.isArray(root.children) ? root.children : [];
  const accepted = [];
  for (const part of parts) {
    const match = nodes.find(node => key(typeof node === "string" ? node : node?.name) === key(part));
    if (!match) break;
    const name = typeof match === "string" ? match : match.name;
    accepted.push(name);
    nodes = typeof match === "string" || !Array.isArray(match.children) ? [] : match.children;
  }

  // Keep only a real, verified path. If the classifier proposes an unknown
  // leaf, fall back to its deepest valid parent instead of inventing a branch.
  return accepted.length ? accepted.join(" > ") : "Other";
}

export function isValidSubcategoryPath(category, candidate, taxonomy) {
  const value = String(candidate || "").trim();
  if (!value || value === "Other") return true;
  return normalizeSubcategoryPath(category, value, taxonomy) === value;
}
