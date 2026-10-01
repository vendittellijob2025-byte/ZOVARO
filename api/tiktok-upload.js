Crea il file api/tiktok-upload.js per ZOVARO.

REQUISITI OBBLIGATORI:
- Usa ES Modules e `export default async function handler(req, res)`.
- Leggi il token TikTok dal file privato Vercel Blob `tiktok/tokens.json` usando `@vercel/blob`.
- Non mostrare, restituire, registrare nei log o esporre mai access_token o refresh_token.
- Accetta esclusivamente POST.
- Verifica che esista un access_token.
- Ricevi dal body JSON:
  - video_size
  - chunk_size
  - total_chunk_count
- Valida che siano numeri interi positivi.
- Chiama l'endpoint ufficiale TikTok:
  https://open.tiktokapis.com/v2/post/publish/inbox/video/init/
- Usa:
  Authorization: Bearer <access_token>
  Content-Type: application/json; charset=UTF-8
- Invia:
  {
    "source_info": {
      "source": "FILE_UPLOAD",
      "video_size": video_size,
      "chunk_size": chunk_size,
      "total_chunk_count": total_chunk_count
    }
  }
- Se TikTok restituisce un errore, restituisci lo stesso status HTTP e un JSON contenente l'errore TikTok, senza esporre il token.
- Se la richiesta riesce, restituisci esclusivamente:
  {
    "success": true,
    "publish_id": "...",
    "upload_url": "..."
  }
- Non implementare ancora il caricamento binario del video: questo endpoint deve soltanto inizializzare l'upload e ottenere `publish_id` e `upload_url`.
- Gestisci gli errori con try/catch e restituisci HTTP 500 in caso di errore interno.
- Scrivi codice semplice, compatibile con Vercel Serverless Functions e Node.js.
- NON modificare nessun altro file del progetto.
