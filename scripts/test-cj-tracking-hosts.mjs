import fs from "node:fs/promises";

const [frontend, server] = await Promise.all([
  fs.readFile("app.js", "utf8"),
  fs.readFile("api/lead-track.js", "utf8")
]);

function extractArray(source, pattern, label) {
  const match = source.match(pattern);
  if (!match) throw new Error(label + " allowlist not found.");
  return [...match[1].matchAll(/"([a-z0-9.-]+)"/gi)].map(item => item[1].toLowerCase()).sort();
}

const frontendHosts = extractArray(
  frontend,
  /const CJ_TRACKING_HOSTS = new Set\\(\\[([\\s\\S]*?)\\]\\);/,
  "Frontend CJ tracking"
);
const serverHosts = extractArray(
  server,
  /const trustedCjHosts = \\[([\\s\\S]*?)\\];/,
  "Server CJ tracking"
);

if (!frontendHosts.length || !serverHosts.length) {
  throw new Error("CJ tracking host allowlists must not be empty.");
}
if (new Set(frontendHosts).size !== frontendHosts.length) {
  throw new Error("Frontend CJ tracking allowlist contains duplicates.");
}
if (new Set(serverHosts).size !== serverHosts.length) {
  throw new Error("Server CJ tracking allowlist contains duplicates.");
}
if (JSON.stringify(frontendHosts) !== JSON.stringify(serverHosts)) {
  throw new Error(
    "Frontend/server CJ tracking allowlists differ. Frontend: " +
    frontendHosts.join(", ") + ". Server: " + serverHosts.join(", ")
  );
}

console.log("CJ tracking host allowlists match: " + frontendHosts.join(", "));
