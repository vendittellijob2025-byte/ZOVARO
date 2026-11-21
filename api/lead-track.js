import crypto from "node:crypto";
import { d1Query } from "../lib/cj-d1.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse the request URL with the WHATWG URL API. Avoid the legacy
  // req.query parser so Node.js 24 does not emit DEP0169 on this route.
  let params;
  try {
    const requestUrl = new URL(req.url || "/", "https://zovaro.vercel.app");
    params = requestUrl.searchParams;
  } catch {
    return res.status(400).json({ error: "Invalid request URL" });
  }

  const partner = String(params.get("partner") || "").trim();
  const referral = String(params.get("ref") || "").trim();
  const item = String(params.get("item") || "").trim();
  const target = String(params.get("to") || "").trim();
  const source = String(params.get("source") || "website").slice(0, 80);
  const campaign = String(params.get("campaign") || "").slice(0, 120);

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

  // CJ returned this verified tracking host in valid joined-publisher
  // linkCode URLs. Keep it alongside the configurable partner allowlist.
  const trustedCjHosts = [
    "www.dpbolvw.net",
    "www.tkqlhce.com",
    "www.anrdoezrs.net",
    "www.jdoqocy.com",
    "www.kqzyfj.com"
  ];
  const allowedHosts = new Set([
    ...trustedCjHosts,
    ...(process.env.ZOVARO_PARTNER_DOMAINS || "")
      .split(",").map(value => value.trim().toLowerCase()).filter(Boolean)
  ]);

  if (!allowedHosts.has(destination.hostname.toLowerCase())) {
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

  // Persist the click in the private Cloudflare D1 ledger, not the suspended Blob store.
  // Redirect even if first-party analytics is temporarily unavailable: never block
  // a shopper from reaching the affiliate's own tracking URL.
  try {
    await d1Query(
      "INSERT INTO outbound_click_events(event_id,partner_id,referral_id,item_id,source,campaign,destination_host,occurred_at,record_json) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(event_id) DO NOTHING",
      [event.event_id,event.partner_id,event.referral_id,event.item_id,event.source,event.campaign,event.destination_host,event.occurred_at,JSON.stringify(event)]
    );
  } catch (error) {
    console.error("ZOVARO D1 outbound click storage error:", error);
  }

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Location", destination.toString());
  return res.status(302).end();
}
