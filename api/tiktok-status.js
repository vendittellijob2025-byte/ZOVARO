import crypto from "node:crypto";
import { get } from "@vercel/blob";

export default async function handler(req, res) {
  const allowedOrigin = "https://vendittellijob2025-byte.github.io";

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
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
    const sessionToken = req.headers["x-zovaro-session"];

    if (!sessionToken || typeof sessionToken !== "string") {
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

    const sessionBuffer = await new Response(
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

    const tokenBuffer = await new Response(
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

    const { publish_id } = req.body || {};

    if (
      typeof publish_id !== "string" ||
      !publish_id.trim()
    ) {
      return res.status(400).json({
        error: "publish_id obbligatorio"
      });
    }

    if (publish_id.length > 64) {
      return res.status(400).json({
        error: "publish_id supera il limite di 64 caratteri"
      });
    }

    const response = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/status/fetch/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
          publish_id: publish_id.trim()
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data.error || {
            code: "tiktok_status_error",
            message:
              "Errore TikTok durante il controllo dello stato"
          }
      });
    }

    return res.status(200).json({
      success: true,
      publish_id: publish_id.trim(),
      status: data.data?.status || null,
      fail_reason: data.data?.fail_reason || null,
      publicaly_available_post_id:
        data.data?.publicaly_available_post_id || [],
      uploaded_bytes:
        data.data?.uploaded_bytes ?? null,
      downloaded_bytes:
        data.data?.downloaded_bytes ?? null,
      tiktok_error: data.error || null
    });
  } catch (error) {
    console.error("TikTok status error:", error);

    return res.status(500).json({
      error:
        "Errore interno durante il controllo dello stato TikTok"
    });
  }
}
