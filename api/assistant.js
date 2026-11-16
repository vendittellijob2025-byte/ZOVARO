// Optional conversational assistant. Disabled until the owner enables it in Vercel.
const MAX_QUERY_LENGTH = 700;
const clean = value => String(value ?? "").replace(/[\\u0000-\\u001f\\u007f]/g, " ").trim().slice(0, MAX_QUERY_LENGTH);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (process.env.ZOVARO_AI_ENABLED !== "true" || !process.env.OPENAI_API_KEY) {
    return res.status(200).json({ enabled: false });
  }
  const body = typeof req.body === "string" ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
  const query = clean(body.query);
  if (!query) return res.status(400).json({ error: "A search description is required." });
  const languageNames = { en:"English", it:"Italian", es:"Spanish", fr:"French", de:"German", pt:"Portuguese", zh:"Chinese", ja:"Japanese", ar:"Arabic", hi:"Hindi" };
  const language = languageNames[String(body.language || "en")] || "English";
  const catalogue = Array.isArray(body.catalogue) ? body.catalogue.slice(0, 12) : [];
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + process.env.OPENAI_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.ZOVARO_AI_MODEL || "gpt-4.1-mini",
        temperature: 0.3,
        max_tokens: 450,
        messages: [
          { role: "system", content: "You are ISA, the multilingual discovery assistant for ZOVARO Worldwide. Reply in " + language + ". Understand intent, ask one concise clarification only if essential, and never invent stock, prices, availability, jobs, sellers or links. ZOVARO is an intermediary discovery/affiliate platform; merchants complete transactions. The catalogue context is the only verified product evidence supplied. If it is empty or unrelated, say so clearly and explain what detail would help. Be warm, practical and concise." },
          { role: "user", content: "User request: " + query + "\n\nVerified catalogue matches (may be empty): " + JSON.stringify(catalogue) }
        ]
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("ZOVARO assistant provider error:", response.status, data?.error?.type || "unknown");
      return res.status(200).json({ enabled: false });
    }
    const reply = String(data?.choices?.[0]?.message?.content || "").trim().slice(0, 2500);
    return res.status(200).json({ enabled: true, reply });
  } catch (error) {
    console.error("ZOVARO assistant request failed:", error?.message || "unknown");
    return res.status(200).json({ enabled: false });
  }
}
