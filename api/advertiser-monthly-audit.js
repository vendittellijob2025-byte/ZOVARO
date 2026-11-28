import crypto from "node:crypto";
import { get, list, put } from "@vercel/blob";

async function readJson(pathname) {
  const blob = await get(pathname, { access: "private", useCache: false });
  if (!blob || blob.statusCode !== 200 || !blob.stream) return null;
  return JSON.parse(Buffer.from(await new Response(blob.stream).arrayBuffer()).toString("utf8"));
}
function addDays(dateString, count) {
  const date = new Date(dateString + "T12:00:00.000Z");
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const secret = process.env.CRON_SECRET;
  const authorization = String(req.headers.authorization || "");
  if (!secret || secret.length < 16 || authorization !== "Bearer " + secret) {
    return res.status(401).json({ error: "Unauthorized cron request" });
  }
  if (!process.env.BLOB_STORE_ID) return res.status(503).json({ error: "Private Blob store not configured" });
  try {
    const existing = await list({ prefix: "advertiser-management/clients.json", limit: 1 });\n    const store = existing.blobs.length ? await readJson("advertiser-management/clients.json") : { clients: [] };
    const today = new Date().toISOString().slice(0, 10);
    const horizon = addDays(today, 31);
    const due = (store.clients || []).filter(client =>
      client.plan === "monthly" &&
      ["active", "payment_pending"].includes(client.status) &&
      client.next_payment_due &&
      client.next_payment_due <= horizon
    ).map(client => ({
      client_id: client.id,
      business_name: client.name,
      contact_email: client.email,
      next_payment_due: client.next_payment_due,
      status: client.status,
      payment_status: !client.first_payment_verified ? "initial_payment_unverified" :
        client.next_payment_due < today ? "overdue" :
        client.next_payment_due === today ? "due_today" : "due_within_31_days",
      last_recorded_payment: client.payments?.at(-1)?.paid_at || null
    }));
    const report = {
      schema: "zovaro.advertiser.monthly-audit.v1",
      audit_id: crypto.randomUUID(),
      generated_at: new Date().toISOString(),
      audit_month: today.slice(0, 7),
      due_window_days: 31,
      total_monthly_clients: (store.clients || []).filter(c => c.plan === "monthly" && c.status !== "cancelled").length,
      due_or_upcoming_count: due.length,
      bank_credit_verification: "manual_required",
      due_clients: due
    };
    await put("advertiser-management/monthly-audits/" + today.slice(0, 7) + ".json", JSON.stringify(report), {
      access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json"
    });
    return res.status(200).json({ ok: true, report });
  } catch (error) {
    console.error("Advertiser monthly audit failed:", error);
    return res.status(503).json({ error: "Monthly advertiser audit failed" });
  }
}
