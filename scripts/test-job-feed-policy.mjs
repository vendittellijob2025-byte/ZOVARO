import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  JOBICY_MIN_REQUEST_INTERVAL_MS,
  JOBICY_MIN_SYNC_INTERVAL_MS,
  shouldSkipSync,
  getJobicyWaitMs
} from "../lib/job-feed-policy.js";

const now = Date.parse("2026-11-27T00:00:00.000Z");
assert.equal(JOBICY_MIN_SYNC_INTERVAL_MS, 60 * 60 * 1000);
assert.equal(JOBICY_MIN_REQUEST_INTERVAL_MS, 1000);
assert.equal(shouldSkipSync(new Date(now - 59 * 60 * 1000).toISOString(), now), true);
assert.equal(shouldSkipSync(new Date(now - 60 * 60 * 1000).toISOString(), now), false);
assert.equal(shouldSkipSync("", now), false);
assert.equal(shouldSkipSync(new Date(now + 1000).toISOString(), now), true);
assert.equal(getJobicyWaitMs(now - 250, now), 750);
assert.equal(getJobicyWaitMs(now - 1000, now), 0);
assert.equal(getJobicyWaitMs(0, now), 0);
execFileSync(process.execPath, ["--check", "scripts/sync-global-remote-jobs.mjs"], { stdio: "inherit" });
console.log("Job feed policy tests passed: hourly sync guard and 1 request/second Jobicy rate limit.");
