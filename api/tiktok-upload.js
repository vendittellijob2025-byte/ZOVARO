import crypto from "node:crypto";
import { get } from "@vercel/blob";

export default async function handler(req, res) {
  const allowedOrigin =
    "https://vendittellijob2025-byte.github.io";

  res.setHeader(
    "Access-Control-Allow-Origin",
    allowedOrigin
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-ZOVARO-SESSION"
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Metodo non consentito"
    });
  }

  try {
    const sessionToken =
      req.headers["x-zovaro-session"];

    if (
      !sessionToken ||
      typeof sessionToken !== "string"
    ) {
      return res.status(401).json({
        error: "Sessione ZOVARO mancante"
      });
    }

    const sessionHash = crypto
      .createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    const sessionResult = await get(
      `tiktok/sessions/${sessionHash}.json`,
      {
        access: "private",
        useCache: false
      }
    );

    if (!sessionResult) {
      return res.status(401).json({
        error: "Sessione ZOVARO non valida"
      });
    }

    const sessionBuffer =
      await new Response(
        sessionResult.stream
      ).arrayBuffer();

    const session = JSON.parse(
      Buffer.from(sessionBuffer).toString("utf8")
    );

    if (
      !session.expires_at ||
      Date.now() >= session.expires_at
    ) {
      return res.status(401).json({
        error: "Sessione ZOVARO scaduta"
      });
    }

    const tokenResult = await get(
      "tiktok/tokens.json",
      {
        access: "private",
        useCache: false
      }
    );

    if (!tokenResult) {
      return res.status(404).json({
        error: "Token TikTok non trovato"
      });
    }

    const tokenBuffer =
      await new Response(
        tokenResult.stream
      ).arrayBuffer();

    const tokens = JSON.parse(
      Buffer.from(tokenBuffer).toString("utf8")
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
          Authorization:
            "Bearer " + tokens.access_token,
          "Content-Type":
            "application/json; charset=UTF-8"
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
        error:
          data.error || {
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
