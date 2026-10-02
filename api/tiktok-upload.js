import crypto from "node:crypto";
import { get } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://vendittellijob2025-byte.github.io"
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

    const result = await get(
      "tiktok/tokens.json",
      {
        access: "private",
        useCache: false
      }
    );

    if (!result) {
      return res.status(404).json({
        error: "Token TikTok non trovato"
      });
    }

    const buffer =
      await new Response(
        result.stream
      ).arrayBuffer();

    const tokens = JSON.parse(
      Buffer.from(buffer).toString("utf8")
    );

    if (!tokens.access_token) {
      return res.status(400).json({
        error: "Access token TikTok mancante"
      });
    }

    const body = req.body || {};

    const videoSize = Number(
      body.video_size
    );

    const chunkSize = Number(
      body.chunk_size
    );

    const totalChunkCount = Number(
      body.total_chunk_count
    );

    const privacyLevel =
      typeof body.privacy_level === "string"
        ? body.privacy_level
        : "SELF_ONLY";

    const title =
      typeof body.title === "string"
        ? body.title
        : "";

    const isAigc =
      body.is_aigc === true;

    const allowedPrivacyLevels = [
      "PUBLIC_TO_EVERYONE",
      "MUTUAL_FOLLOW_FRIENDS",
      "FOLLOWER_OF_CREATOR",
      "SELF_ONLY"
    ];

    if (
      !Number.isInteger(videoSize) ||
      videoSize <= 0
    ) {
      return res.status(400).json({
        error:
          "video_size deve essere un intero positivo"
      });
    }

    if (
      !Number.isInteger(chunkSize) ||
      chunkSize <= 0
    ) {
      return res.status(400).json({
        error:
          "chunk_size deve essere un intero positivo"
      });
    }

    if (
      !Number.isInteger(totalChunkCount) ||
      totalChunkCount <= 0
    ) {
      return res.status(400).json({
        error:
          "total_chunk_count deve essere un intero positivo"
      });
    }

    if (
      !allowedPrivacyLevels.includes(
        privacyLevel
      )
    ) {
      return res.status(400).json({
        error:
          "privacy_level non valido"
      });
    }

    if (title.length > 2200) {
      return res.status(400).json({
        error:
          "Il titolo supera il limite TikTok di 2200 caratteri"
      });
    }

    const calculatedChunkCount =
      Math.ceil(videoSize / chunkSize);

    if (
      calculatedChunkCount !==
      totalChunkCount
    ) {
      return res.status(400).json({
        error:
          "total_chunk_count non corrisponde a video_size e chunk_size"
      });
    }

    const response = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/video/init/",
      {
        method: "POST",
        headers: {
          Authorization:
            "Bearer " + tokens.access_token,
          "Content-Type":
            "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
          post_info: {
            privacy_level: privacyLevel,
            ...(title
              ? { title }
              : {}),
            is_aigc: isAigc
          },
          source_info: {
            source: "FILE_UPLOAD",
            video_size: videoSize,
            chunk_size: chunkSize,
            total_chunk_count:
              totalChunkCount
          }
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        tiktok_error:
          data.error || data
      });
    }

    if (
      !data.data ||
      !data.data.publish_id ||
      !data.data.upload_url
    ) {
      return res.status(502).json({
        success: false,
        error:
          "Risposta TikTok incompleta"
      });
    }

    return res.status(200).json({
      success: true,
      publish_id:
        data.data.publish_id,
      upload_url:
        data.data.upload_url
    });
  } catch (error) {
    console.error(
      "TikTok Direct Post FILE_UPLOAD initialization error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Errore durante l'inizializzazione del Direct Post TikTok"
    });
  }
}
