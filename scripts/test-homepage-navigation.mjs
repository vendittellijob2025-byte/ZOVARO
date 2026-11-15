import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync("index.html", "utf8");

assert.match(html, /function showView\(viewId, options = \{\}\)/, "view navigation must expose history options");
assert.match(html, /window\.history\.pushState\(\{ zovaroView: viewId \}/, "internal view changes must create browser history entries");
assert.match(html, /window\.addEventListener\("popstate"/, "browser back/forward must restore the prior internal view");
assert.match(html, /function goBackToPreviousView\(/, "internal back controls must use browser history");
assert.match(html, /initialUrl\.searchParams\.delete\("view"\)/, "legacy view=jobs must not select the initial view");
assert.match(html, /window\.history\.replaceState\(\{ zovaroView: "homeView" \}/, "a fresh page load must initialise to the main homepage");
assert.match(html, /showView\("homeView", \{ pushHistory: false \}\)/, "initial rendering must be the main homepage");
assert.doesNotMatch(html, /searchParams\.get\("view"\)/, "query parameters must not override the initial homepage");
assert.match(html, /getElementById\("openJobs"\)/, "JOBS must remain reachable through an explicit UI action");
assert.match(html, /go\("jobChoiceView"\)/, "the Jobs section must open only through explicit navigation");
assert.match(html, /backFromJobChoice[\s\S]*?goBackToPreviousView\("homeView"\)/, "the Jobs back control must return through history");

const inlineScripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .filter(script => script.trim());
for (const script of inlineScripts) {
  new vm.Script(script, { filename: "index.html" });
}

console.log("Homepage routing, default-view and inline-script checks passed.");
