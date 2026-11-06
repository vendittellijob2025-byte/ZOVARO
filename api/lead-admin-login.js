import crypto from "node:crypto";

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
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const password = process.env.ZOVARO_ADMIN_PASSWORD;
  const secret = process.env.ZOVARO_ADMIN_SESSION_SECRET;
  if (!password || password.length < 16 || !secret || secret.length < 32) {
    return res.status(503).json({ error: "Admin access is not configured on the server." });
  }

  const supplied = String((req.body || {}).password || "");
  if (!safeEqual(supplied, password)) {
    return res.status(401).json({ error: "Password non valida." });
  }

  const now = Date.now();
  const payload = Buffer.from(JSON.stringify({ role: "admin", exp: now + 8 * 60 * 60 * 1000 })).toString("base64url");
  const token = payload + "." + sign(payload, secret);
  res.setHeader("Set-Cookie", "zovaro_admin=" + token + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800");
  return res.status(200).json({ authenticated: true, expires_in: 28800 });
}
