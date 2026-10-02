import { get } from "@vercel/blob";

export default async function handler(req, res) {
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
      "https://open.tiktokapis.com/v2/post/publish/creator_info/query/",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + tokens.access_token,
          "Content-Type": "application/json; charset=UTF-8",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({})
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        tiktok_error: data
      });
    }

    if (!data.data) {
      return res.status(502).json({
        success: false,
        error: "TikTok non ha restituito le informazioni del creator"
      });
    }

    return res.status(200).json({
      success: true,
      creator: {
        username: data.data.creator_username || "",
        nickname: data.data.creator_nickname || "",
        avatar_url: data.data.creator_avatar_url || "",
        privacy_level_options:
          data.data.privacy_level_options || [],
        comment_disabled:
          data.data.comment_disabled === true,
        duet_disabled:
          data.data.duet_disabled === true,
        stitch_disabled:
          data.data.stitch_disabled === true,
        max_video_post_duration_sec:
          data.data.max_video_post_duration_sec || null
      }
    });
  } catch (error) {
    console.error(
      "TikTok creator info error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Errore durante il recupero delle informazioni del creator TikTok"
    });
  }
}
