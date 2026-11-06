import crypto from "node:crypto";
import { put } from "@vercel/blob";

function canonical(value) {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(key =>
      JSON.stringify(key) + ":" + canonical(value[key])
    ).join(",") + "}";
  }
  return JSON.stringify(value);
}

function validSignature(received, expected) {
  if (typeof received !== "string" || !/^[a-f0-9]{64}$/i.test(received)) return false;
  const a = Buffer.from(received, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const partner = String(body.partner_id || "").trim();
  const eventId = String(body.event_id || "").trim();
  const referral = String(body.referral_id || "").trim();
  const status = String(body.status || "").trim().toLowerCase();
  const statuses = ["lead", "contacted", "appointment", "visited", "offer", "closed_won", "closed_lost", "cancelled"];

  if (!/^[a-z0-9_-]{2,60}$/i.test(partner) ||
      !/^[a-z0-9_-]{6,120}$/i.test(eventId) ||
      !/^[a-z0-9_-]{4,100}$/i.test(referral) ||
      !statuses.includes(status)) {
    return res.status(400).json({ error: "Invalid event fields" });
  }

  let partnerSecrets;
  try {
    partnerSecrets = JSON.parse(process.env.ZOVARO_PARTNER_SECRETS || "{}");
  } catch {
    return res.status(500).json({ error: "Partner configuration is invalid" });
  }

  const partnerKey = partnerSecrets[partner];
  if (typeof partnerKey !== "string" || partnerKey.length < 32) {
    return res.status(401).json({ error: "Partner is not enabled for signed events" });
  }

  const received = String(req.headers["x-zovaro-signature"] || "").replace(/^sha256=/i, "");
  const expected = crypto.createHmac("sha256", partnerKey).update(canonical(body)).digest("hex");
  if (!validSignature(received, expected)) {
    return res.status(401).json({ error: "Invalid event signature" });
  }

  const amount = body.amount == null ? null : Number(body.amount);
  const currency = body.currency == null ? null : String(body.currency).toUpperCase();
  if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
    return res.status(400).json({ error: "Invalid amount" });
  }
  if (currency !== null && !/^[A-Z]{3}$/.test(currency)) {
    return res.status(400).json({ error: "Invalid currency" });
  }

  const event = {
    schema: "zovaro.lead-sales.v1",
    event_id: eventId,
    event_type: "partner_conversion_update",
    partner_id: partner,
    referral_id: referral,
    status,
    amount,
    currency,
    partner_order_reference: body.order_reference == null ? null : String(body.order_reference).slice(0, 120),
    occurred_at: body.occurred_at && !Number.isNaN(Date.parse(body.occurred_at))
      ? new Date(body.occurred_at).toISOString() : new Date().toISOString(),
    received_at: new Date().toISOString(),
    verification: "partner_signature_valid"
  };

  try {
    const storageId = crypto.randomUUID();
    await put(
      `lead-sales/events/partner-updates/${partner}/${storageId}.json`,
      JSON.stringify(event),
      { access: "private", addRandomSuffix: false, contentType: "application/json" }
    );
  } catch (error) {
    console.error("ZOVARO partner event storage error:", error);
    return res.status(503).json({ error: "Event storage unavailable" });
  }

  return res.status(202).json({
    accepted: true,
    event_id: eventId,
    verification: "partner_signature_valid",
    note: "Signature authenticates the partner source; it is not independent proof of a sale."
  });
}
