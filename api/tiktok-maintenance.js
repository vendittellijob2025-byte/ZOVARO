import { get, put } from "@vercel/blob";

async function readTokens() {
  const result = await get("tiktok/tokens.json", {
    access: "private",
    useCache: false
  });
  if (!result) throw Object.assign(new Error("Token TikTok non trovato"), { status: 404 });
  const buffer = await new Response(result.stream).arrayBuffer();
  const tokens = JSON.parse(Buffer.from(buffer).toString("utf8"));
  if (!tokens.refresh_token) throw Object.assign(new Error("Refresh token TikTok mancante"), { status: 400 });
  return tokens;
}

async function refreshTokens(tokens) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) {
    throw Object.assign(new Error("Credenziali TikTok non configurate"), { status: 500 });
  }

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: tokens.refresh_token
  });

  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache"
    },
    body,
    signal: AbortSignal.timeout(30000)
  });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error("TikTok token refresh failed");
    error.status = response.status;
    error.details = data;
    throw error;
  }
  if (!data.access_token || !data.refresh_token) {
    throw Object.assign(new Error("Risposta TikTok di rinnovo incompleta"), { status: 502 });
  }

  const updated = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    refresh_expires_in: data.refresh_expires_in,
    open_id: data.open_id || tokens.open_id,
    scope: data.scope || tokens.scope,
    token_type: data.token_type || tokens.token_type || "Bearer",
    saved_at: Date.now()
  };

  await put("tiktok/tokens.json", JSON.stringify(updated), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json"
  });
  return updated;
}

async function verifyAccessToken(accessToken) {
  const response = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=open_id",
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Cache-Control": "no-cache"
      },
      signal: AbortSignal.timeout(20000)
    }
  );
  const data = await response.json();
  if (!response.ok) {
    const error = new Error("TikTok access-token verification failed");
    error.status = response.status;
    error.details = data;
    throw error;
  }
  if (!data.data?.user?.open_id) {
    throw Object.assign(new Error("TikTok non ha restituito un open_id valido"), { status: 502 });
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.authorization !== "Bearer " + cronSecret) {
    return res.status(401).json({ error: "Non autorizzato" });
  }

  if (!process.env.BLOB_STORE_ID) {
    return res.status(503).json({ error: "Archivio privato TikTok non configurato" });
  }

  try {
    const previousTokens = await readTokens();
    const refreshedTokens = await refreshTokens(previousTokens);
    await verifyAccessToken(refreshedTokens.access_token);

    return res.status(200).json({
      success: true,
      refreshed: true,
      verified: true,
      message: "Token TikTok rinnovato e verificato correttamente",
      verified_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("ZOVARO TikTok maintenance error:", error);
    return res.status(error.status || 500).json({
      success: false,
      refreshed: false,
      verified: false,
      error: error.message || "Manutenzione TikTok non riuscita",
      ...(error.details ? { tiktok_error: error.details } : {})
    });
  }
}
