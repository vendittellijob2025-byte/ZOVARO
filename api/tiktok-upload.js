import { get } from "@vercel/blob";

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = req.headers.authorization;

  if (!cronSecret || authorization !== "Bearer " + cronSecret) {
    return res.status(401).json({
      error: "Non autorizzato"
    });
  }

  if (req.method !== "POST") {
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

    const {
      video_size,
      chunk_size,
      total_chunk_count
    } = req.body || {};

    if (
      !Number.isInteger(video_size) ||
      video_size <= 0 ||
      !Number.isInteger(chunk_size) ||
      chunk_size <= 0 ||
      !Number.isInteger(total_chunk_count) ||
      total_chunk_count <= 0
    ) {
      return res.status(400).json({
        error:
          "video_size, chunk_size e total_chunk_count devono essere interi positivi"
      });
    }

    const response = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + tokens.access_token,
          "Content-Type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
          source_info: {
            source: "FILE_UPLOAD",
            video_size,
            chunk_size,
            total_chunk_count
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || {
          code: "tiktok_error",
          message: "Errore TikTok"
        }
      });
    }

    if (
      !data.data ||
      !data.data.publish_id ||
      !data.data.upload_url
    ) {
      return res.status(502).json({
        error: "Risposta TikTok incompleta"
      });
    }

    return res.status(200).json({
      success: true,
      publish_id: data.data.publish_id,
      upload_url: data.data.upload_url
    });
  } catch (error) {
    console.error(
      "TikTok upload initialization error:",
      error
    );

    return res.status(500).json({
      error:
        "Errore interno durante l'inizializzazione dell'upload TikTok"
    });
  }
}
