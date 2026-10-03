import crypto from "node:crypto";
import { get } from "@vercel/blob";

const VERIFIED_VIDEO_PREFIX =
  "https://vendittellijob2025-byte.github.io/ZOVARO/";

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
    /*
     * 1. Verifica sessione ZOVARO
     */

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

    /*
     * 2. Recupera il token TikTok privato
     */

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

    /*
     * 3. Legge i dati inviati dal frontend
     */

    const body = req.body || {};

    const {
      privacy_level,
      title,
      video_url,
      video_size,
      chunk_size,
      total_chunk_count,
      disable_comment,
      disable_duet,
      disable_stitch,
      video_cover_timestamp_ms,
      brand_content_toggle,
      brand_organic_toggle,
      is_aigc,
      consent
    } = body;

    /*
     * 4. Richiede consenso esplicito
     */

    if (consent !== true) {
      return res.status(400).json({
        error:
          "Consenso esplicito richiesto prima dell'invio a TikTok"
      });
    }

    /*
     * 5. Verifica privacy level
     */

    if (
      typeof privacy_level !== "string" ||
      !privacy_level
    ) {
      return res.status(400).json({
        error:
          "privacy_level obbligatorio"
      });
    }

    /*
     * 6. Determina il metodo di trasferimento
     *
     * Se il video è già presente su un server ZOVARO
     * verificato, viene utilizzato PULL_FROM_URL.
     *
     * FILE_UPLOAD rimane supportato come compatibilità
     * per eventuali utilizzi futuri.
     */

    let sourceInfo;

    if (
      typeof video_url === "string" &&
      video_url.trim()
    ) {
      const cleanVideoUrl =
        video_url.trim();

      if (cleanVideoUrl.length > 2048) {
        return res.status(400).json({
          error:
            "video_url supera il limite consentito"
        });
      }

      let parsedVideoUrl;

      try {
        parsedVideoUrl =
          new URL(cleanVideoUrl);
      } catch {
        return res.status(400).json({
          error:
            "video_url non è un URL valido"
        });
      }

      if (
        parsedVideoUrl.protocol !==
        "https:"
      ) {
        return res.status(400).json({
          error:
            "video_url deve utilizzare HTTPS"
        });
      }

      if (
        !cleanVideoUrl.startsWith(
          VERIFIED_VIDEO_PREFIX
        )
      ) {
        return res.status(400).json({
          error:
            "video_url deve appartenere al percorso ZOVARO verificato da TikTok"
        });
      }

      sourceInfo = {
        source: "PULL_FROM_URL",
        video_url: cleanVideoUrl
      };
    } else {
      /*
       * FILE_UPLOAD fallback
       */

      if (
        !Number.isInteger(video_size) ||
        video_size <= 0
      ) {
        return res.status(400).json({
          error:
            "video_size deve essere un intero positivo"
        });
      }

      if (
        !Number.isInteger(chunk_size) ||
        chunk_size <= 0
      ) {
        return res.status(400).json({
          error:
            "chunk_size deve essere un intero positivo"
        });
      }

      if (
        !Number.isInteger(total_chunk_count) ||
        total_chunk_count <= 0
      ) {
        return res.status(400).json({
          error:
            "total_chunk_count deve essere un intero positivo"
        });
      }

      const MAX_VIDEO_SIZE =
        4 * 1024 * 1024 * 1024;

      if (video_size > MAX_VIDEO_SIZE) {
        return res.status(400).json({
          error:
            "Il video supera il limite massimo di 4 GB"
        });
      }

      const MIN_CHUNK_SIZE =
        5 * 1024 * 1024;

      const MAX_CHUNK_SIZE =
        64 * 1024 * 1024;

      if (video_size < MIN_CHUNK_SIZE) {
        if (
          total_chunk_count !== 1 ||
          chunk_size !== video_size
        ) {
          return res.status(400).json({
            error:
              "Per video inferiori a 5 MB è richiesto un unico chunk uguale alla dimensione del video"
          });
        }
      } else {
        if (
          chunk_size < MIN_CHUNK_SIZE ||
          chunk_size > MAX_CHUNK_SIZE
        ) {
          return res.status(400).json({
            error:
              "chunk_size deve essere compreso tra 5 MB e 64 MB"
          });
        }

        if (total_chunk_count > 1000) {
          return res.status(400).json({
            error:
              "Il numero massimo di chunk è 1000"
          });
        }

        const expectedChunkCount =
          Math.ceil(
            video_size / chunk_size
          );

        if (
          total_chunk_count !==
          expectedChunkCount
        ) {
          return res.status(400).json({
            error:
              "total_chunk_count non corrisponde alla dimensione del video e al chunk_size"
          });
        }
      }

      sourceInfo = {
        source: "FILE_UPLOAD",
        video_size,
        chunk_size,
        total_chunk_count
      };
    }

    /*
     * 7. Verifica titolo
     */

    let safeTitle = "";

    if (
      title !== undefined &&
      title !== null
    ) {
      if (
        typeof title !== "string"
      ) {
        return res.status(400).json({
          error:
            "title deve essere una stringa"
        });
      }

      if (title.length > 2200) {
        return res.status(400).json({
          error:
            "title supera il limite di 2200 caratteri UTF-16"
        });
      }

      safeTitle = title;
    }

    /*
     * 8. Recupera le informazioni aggiornate
     *    del creator TikTok
     */

    const creatorResponse =
      await fetch(
        "https://open.tiktokapis.com/v2/post/publish/creator_info/query/",
        {
          method: "POST",
          headers: {
            Authorization:
              "Bearer " +
              tokens.access_token,
            "Content-Type":
              "application/json; charset=UTF-8",
            "Cache-Control":
              "no-cache"
          },
          body: JSON.stringify({})
        }
      );

    const creatorData =
      await creatorResponse.json();

    if (!creatorResponse.ok) {
      return res.status(
        creatorResponse.status
      ).json({
        error:
          creatorData.error || {
            code:
              "creator_info_error",
            message:
              "Impossibile recuperare le informazioni del creator TikTok"
          }
      });
    }

    if (
      !creatorData.data ||
      !Array.isArray(
        creatorData.data
          .privacy_level_options
      )
    ) {
      return res.status(502).json({
        error:
          "TikTok non ha restituito le opzioni privacy del creator"
      });
    }

    const privacyOptions =
      creatorData.data
        .privacy_level_options;

    /*
     * 9. La privacy scelta deve essere disponibile
     */

    if (
      !privacyOptions.includes(
        privacy_level
      )
    ) {
      return res.status(400).json({
        error:
          "privacy_level non disponibile per questo account TikTok",
        available_privacy_levels:
          privacyOptions
      });
    }

    /*
     * 10. Rispetta le impostazioni correnti
     *     del creator
     */

    const finalDisableComment =
      disable_comment === true ||
      creatorData.data
        .comment_disabled === true;

    const finalDisableDuet =
      disable_duet === true ||
      creatorData.data
        .duet_disabled === true;

    const finalDisableStitch =
      disable_stitch === true ||
      creatorData.data
        .stitch_disabled === true;

    /*
     * 11. Costruisce post_info
     */

    const postInfo = {
      privacy_level,

      disable_comment:
        finalDisableComment,

      disable_duet:
        finalDisableDuet,

      disable_stitch:
        finalDisableStitch,

      brand_content_toggle:
        brand_content_toggle === true,

      brand_organic_toggle:
        brand_organic_toggle === true,

      is_aigc:
        is_aigc === true
    };

    if (safeTitle) {
      postInfo.title =
        safeTitle;
    }

    if (
      Number.isInteger(
        video_cover_timestamp_ms
      ) &&
      video_cover_timestamp_ms >= 0
    ) {
      postInfo.video_cover_timestamp_ms =
        video_cover_timestamp_ms;
    }

    /*
     * 12. Inizializza il Direct Post TikTok
     */

    const response =
      await fetch(
        "https://open.tiktokapis.com/v2/post/publish/video/init/",
        {
          method: "POST",
          headers: {
            Authorization:
              "Bearer " +
              tokens.access_token,

            "Content-Type":
              "application/json; charset=UTF-8"
          },

          body: JSON.stringify({
            post_info: postInfo,
            source_info: sourceInfo
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      return res.status(
        response.status
      ).json({
        error:
          data.error || {
            code:
              "tiktok_error",
            message:
              "Errore TikTok durante l'inizializzazione del Direct Post"
          }
      });
    }

    if (
      !data.data ||
      !data.data.publish_id
    ) {
      return res.status(502).json({
        error:
          "Risposta TikTok incompleta"
      });
    }

    /*
     * 13. Restituisce il risultato
     */

    return res.status(200).json({
      success: true,

      publish_id:
        data.data.publish_id,

      upload_url:
        data.data.upload_url ||
        null,

      transfer_method:
        sourceInfo.source,

      privacy_level,

      creator_username:
        creatorData.data
          .creator_username ||
        "",

      creator_nickname:
        creatorData.data
          .creator_nickname ||
        "",

      max_video_post_duration_sec:
        creatorData.data
          .max_video_post_duration_sec ||
        null,

      status:
        "initialized"
    });
  } catch (error) {
    console.error(
      "TikTok Direct Post error:",
      error
    );

    return res.status(500).json({
      error:
        "Errore interno durante l'inizializzazione del TikTok Direct Post"
    });
  }
}
