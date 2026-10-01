import { get } from "@vercel/blob";

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = req.headers.authorization;

  if (!cronSecret || authorization !== "Bearer " + cronSecret) {
    return res.status(401).json({
      error: "Non autorizzato"
    });
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Metodo non consentito"
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

    const tokens = JSON.parse(
      Buffer.from(buffer).toString("utf8")
    );

    if (!tokens.access_token) {
      return res.status(400).json({
        error: "Access token TikTok mancante"
      });
    }

    const response = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + tokens.access_token,
          "Cache-Control": "no-cache"
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        tiktok_error: data
      });
    }

    if (!data.data || !data.data.user || !data.data.user.open_id) {
      return res.status(502).json({
        success: false,
        error: "TikTok non ha restituito un open_id valido"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Access token TikTok verificato correttamente"
    });
  } catch (error) {
    console.error("TikTok verify error:", error);

    return res.status(500).json({
      success: false,
      error: "Errore durante la verifica del token TikTok"
    });
  }
}
