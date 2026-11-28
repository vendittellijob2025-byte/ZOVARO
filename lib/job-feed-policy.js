export const JOBICY_MIN_REQUEST_INTERVAL_MS = 1000;
export const JOBICY_MIN_SYNC_INTERVAL_MS = 60 * 60 * 1000;

export function shouldSkipSync(lastSyncAt, now = Date.now(), minIntervalMs = JOBICY_MIN_SYNC_INTERVAL_MS) {
  const last = Date.parse(String(lastSyncAt || ""));
  return Number.isFinite(last) && now - last < minIntervalMs;
}

export function getJobicyWaitMs(lastRequestAt, now = Date.now(), minIntervalMs = JOBICY_MIN_REQUEST_INTERVAL_MS) {
  if (!Number.isFinite(lastRequestAt) || lastRequestAt <= 0) return 0;
  return Math.max(0, minIntervalMs - (now - lastRequestAt));
}
