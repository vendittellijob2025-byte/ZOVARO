import crypto from "node:crypto";

const failures = new Map();

function safeEqual(left, right) {
  const a = crypto.createHash("sha256").update(String(left)).digest();
  const b = crypto.createHash("sha256").update(String(right)).digest();
  return crypto.timingSafeEqual(a, b);
}

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", "zovaro_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
    return res.status(200).json({ logged_out: true });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const password = process.env.ZOVARO_ADMIN_PASSWORD;
  const secret = process.env.ZOVARO_ADMIN_SESSION_SECRET;
  if (!password || password.length < 16 || !secret || secret.length < 32) {
    return res.status(503).json({ error: "Admin access is not configured on the server." });
  }

  const ip = String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const now = Date.now();
  const record = failures.get(ip);
  if (record && record.until > now && record.count >= 8) {
    return res.status(429).json({ error: "Troppi tentativi. Riprova più tardi." });
  }

  const supplied = String((req.body || {}).password || "");
  if (!safeEqual(supplied, password)) {
    const current = record && record.until > now ? record : { count: 0, until: now + 15 * 60 * 1000 };
    current.count += 1;
    failures.set(ip, current);
    return res.status(401).json({ error: "Password non valida." });
  }

  failures.delete(ip);
  const payload = Buffer.from(JSON.stringify({ role: "admin", exp: now + 8 * 60 * 60 * 1000 })).toString("base64url");
  const token = payload + "." + sign(payload, secret);
  res.setHeader("Set-Cookie", "zovaro_admin=" + token + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800");
  return res.status(200).json({ authenticated: true, expires_in: 28800 });
}
