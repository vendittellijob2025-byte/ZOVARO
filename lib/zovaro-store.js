import { d1Query } from "./cj-d1.js";

let schemaReady;

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = d1Query(`CREATE TABLE IF NOT EXISTS app_records (
      pathname TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      content_type TEXT NOT NULL DEFAULT 'application/json',
      uploaded_at TEXT NOT NULL
    )`).then(() => d1Query(
      "CREATE INDEX IF NOT EXISTS idx_app_records_uploaded_at ON app_records(uploaded_at)"
    )).catch(error => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

function normalizePath(pathname) {
  const path = String(pathname || "").replace(/^\/+/, "");
  if (!path || path.length > 512 || path.split("/").some(part => part === "." || part === "..")) {
    throw new Error("Invalid private record path.");
  }
  return path;
}

export async function put(pathname, value, options = {}) {
  await ensureSchema();
  const path = normalizePath(pathname);
  const body = typeof value === "string" ? value : Buffer.from(value).toString("utf8");
  const contentType = String(options.contentType || "application/json").slice(0, 100);
  const uploadedAt = new Date().toISOString();
  if (options.allowOverwrite === true) {
    await d1Query(
      "INSERT INTO app_records(pathname,value,content_type,uploaded_at) VALUES(?,?,?,?) ON CONFLICT(pathname) DO UPDATE SET value=excluded.value,content_type=excluded.content_type,uploaded_at=excluded.uploaded_at",
      [path, body, contentType, uploadedAt]
    );
  } else {
    await d1Query(
      "INSERT INTO app_records(pathname,value,content_type,uploaded_at) VALUES(?,?,?,?)",
      [path, body, contentType, uploadedAt]
    );
  }
  return { pathname: path, uploadedAt, contentType };
}

export async function get(pathname) {
  await ensureSchema();
  const path = normalizePath(pathname);
  const result = await d1Query(
    "SELECT value,content_type,uploaded_at FROM app_records WHERE pathname=? LIMIT 1",
    [path]
  );
  const row = result.results?.[0];
  if (!row) return null;
  return {
    statusCode: 200,
    pathname: path,
    contentType: row.content_type,
    uploadedAt: row.uploaded_at,
    stream: new Response(row.value).body
  };
}

export async function del(pathnames) {
  await ensureSchema();
  const paths = (Array.isArray(pathnames) ? pathnames : [pathnames]).map(normalizePath);
  for (const path of paths) {
    await d1Query("DELETE FROM app_records WHERE pathname=?", [path]);
  }
  return { deleted: paths.length };
}

export async function list(options = {}) {
  await ensureSchema();
  const prefix = String(options.prefix || "");
  if (prefix.length > 512) throw new Error("Invalid private record prefix.");
  const limit = Math.max(1, Math.min(1000, Number(options.limit) || 100));
  const cursor = options.cursor ? normalizePath(options.cursor) : null;
  const result = await d1Query(
    "SELECT pathname,uploaded_at FROM app_records WHERE substr(pathname,1,?)=? AND (? IS NULL OR pathname>?) ORDER BY pathname ASC LIMIT ?",
    [prefix.length, prefix, cursor, cursor, limit + 1]
  );
  const rows = result.results || [];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return {
    blobs: page.map(row => ({ pathname: row.pathname, uploadedAt: row.uploaded_at })),
    cursor: hasMore && page.length ? page[page.length - 1].pathname : null,
    hasMore
  };
}
