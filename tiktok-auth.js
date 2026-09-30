export default function handler(req, res) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;

  if (!clientKey) {
    return res.status(500).json({
      error: "TIKTOK_CLIENT_KEY non configurata"
    });
  }

  const redirectUri =
    "https://vendittellijob2025-byte.github.io/ZOVARO/tiktok-callback.html";

  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_key: clientKey,
    response_type: "code",
    scope: "user.info.basic,video.upload",
    redirect_uri: redirectUri,
    state
  });

  res.redirect(
    `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`
  );
}
