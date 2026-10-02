import crypto from "node:crypto";

export default function handler(req, res) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    return res.status(500).json({
      error: "Credenziali TikTok non configurate"
    });
  }

  const redirectUri =
    "https://vendittellijob2025-byte.github.io/ZOVARO/tiktok-callback.html";

  const payload = JSON.stringify({
    n: crypto.randomUUID(),
    t: Date.now()
  });

  const encoded = Buffer.from(payload).toString("base64url");

  const signature = crypto
    .createHmac("sha256", clientSecret)
    .update(encoded)
    .digest("base64url");

  const state = `${encoded}.${signature}`;

  const params = new URLSearchParams({
    client_key: clientKey,
    response_type: "code",
    scope: "user.info.basic,video.publish",
    redirect_uri: redirectUri,
    state
  });

  return res.redirect(
    `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`
  );
}
