import crypto from "node:crypto";
import { put } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://vendittellijob2025-byte.github.io"
  );

  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).json({
      error: "Code o state mancanti"
    });
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    return res.status(500).json({
      error: "Credenziali TikTok non configurate"
    });
  }

  const [encoded, signature] = String(state).split(".");

  if (!encoded || !signature) {
    return res.status(400).json({
      error: "State non valido"
    });
  }

  const expectedSignature = crypto
    .createHmac("sha256", clientSecret)
    .update(encoded)
    .digest("base64url");

  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  ) {
    return res.status(400).json({
      error: "State non valido"
    });
  }

  let stateData;

  try {
    stateData = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    );
  } catch {
    return res.status(400).json({
      error: "State non valido"
    });
  }

  if (!stateData.t || Date.now() - stateData.t > 10 * 60 * 1000) {
    return res.status(400).json({
      error: "State scaduto"
    });
  }

  const redirectUri =
    "https://vendittellijob2025-byte.github.io/ZOVARO/tiktok-callback.html";

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri
  });

  try {
    const response = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    await put(
      "tiktok/tokens.json",
      JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        open_id: data.open_id,
        scope: data.scope,
        saved_at: Date.now()
      }),
      {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true
      }
    );

    return res.status(200).json({
      success: true,
      message: "Autorizzazione TikTok completata"
    });
  } catch (error) {
    console.error("TikTok callback error:", error);

    return res.status(500).json({
      error: "Errore durante l'autorizzazione TikTok"
    });
  }
}
