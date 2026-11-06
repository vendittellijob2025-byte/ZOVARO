import crypto from "node:crypto";
import { put } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const partner = String(req.query.partner || "").trim();
  const referral = String(req.query.ref || "").trim();
  const item = String(req.query.item || "").trim();
  const target = String(req.query.to || "").trim();
  const source = String(req.query.source || "website").slice(0, 80);
  const campaign = String(req.query.campaign || "").slice(0, 120);

  if (!/^[a-z0-9_-]{2,60}$/i.test(partner) ||
      !/^[a-z0-9_-]{4,100}$/i.test(referral) ||
      !/^[a-z0-9_-]{1,100}$/i.test(item) ||
      !target || target.length > 2048) {
    return res.status(400).json({ error: "Invalid referral parameters" });
  }

  let destination;
  try {
    destination = new URL(target);
  } catch {
    return res.status(400).json({ error: "Invalid destination URL" });
  }

  if (destination.protocol !== "https:") {
    return res.status(400).json({ error: "HTTPS destination required" });
  }

  const allowedHosts = (process.env.ZOVARO_PARTNER_DOMAINS || "")
    .split(",").map(value => value.trim().toLowerCase()).filter(Boolean);

  if (!allowedHosts.includes(destination.hostname.toLowerCase())) {
    return res.status(403).json({ error: "Partner domain is not allowlisted" });
  }

  const eventId = crypto.randomUUID();
  const event = {
    schema: "zovaro.lead-sales.v1",
    event_id: eventId,
    event_type: "outbound_click",
    partner_id: partner,
    referral_id: referral,
    item_id: item,
    source,
    campaign: campaign || null,
    destination_host: destination.hostname.toLowerCase(),
    occurred_at: new Date().toISOString()
  };

  try {
    await put(
      `lead-sales/events/clicks/${eventId}.json`,
      JSON.stringify(event),
      { access: "private", addRandomSuffix: false, contentType: "application/json" }
    );
  } catch (error) {
    console.error("ZOVARO click tracking storage error:", error);
    return res.status(503).json({ error: "Tracking unavailable; redirect cancelled" });
  }

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Location", destination.toString());
  return res.status(302).end();
}
