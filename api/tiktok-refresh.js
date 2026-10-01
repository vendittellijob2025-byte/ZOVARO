import { get, put } from "@vercel/blob";

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = req.headers.authorization;

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({
      error: "Non autorizzato"
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Metodo non consentito"
    });
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    return res.status(500).json({
      error: "Credenziali TikTok non configurate"
    });
  }

  try {
    const result = await get("tiktok/tokens.json", {
      access: "private",
      useCache: false
    });

    if (!result) {
      return res.status(404).json({
        error: "Token TikTok non trovato"
      });
    }

    const buffer = await new Response(result.stream).arrayBuffer();
    const tokens = JSON.parse(Buffer.from(buffer).toString("utf8"));

    if (!tokens.refresh_token) {
      return res.status(400).json({
        error: "Refresh token mancante"
      });
    }

    const body = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token
    });

    const response = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Cache-Control": "no-cache"
        },
        body
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    if (!data.access_token || !data.refresh_token) {
      return res.status(502).json({
        error: "Risposta TikTok incompleta"
      });
    }

    await put(
      "tiktok/tokens.json",
      JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        refresh_expires_in: data.refresh_expires_in,
        open_id: data.open_id || tokens.open_id,
        scope: data.scope || tokens.scope,
        token_type: data.token_type || tokens.token_type || "Bearer",
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
      message: "Token TikTok rinnovato correttamente"
    });
  } catch (error) {
    console.error("TikTok refresh error:", error);

    return res.status(500).json({
      error: "Errore durante il rinnovo del token TikTok"
    });
  }
}
