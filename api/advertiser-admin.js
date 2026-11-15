import crypto from "node:crypto";
import { get, put } from "@vercel/blob";

function readCookie(header, name) {
  const entry = String(header || "").split(";").map(part => part.trim()).find(part => part.startsWith(name + "="));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : "";
}
function verifySession(token, secret) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return false;
  const expected = crypto.createHmac("sha256", secret).update(parts[0]).digest();
  let received;
  try { received = Buffer.from(parts[1], "base64url"); } catch { return false; }
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return payload.role === "admin" && Number(payload.exp) > Date.now();
  } catch { return false; }
}
async function readStore() {
  try {
    const blob = await get("advertiser-management/clients.json", { access: "private", useCache: false });
    if (!blob || blob.statusCode !== 200 || !blob.stream) return { schema: "zovaro.advertisers.v1", clients: [], updated_at: null };
    return JSON.parse(Buffer.from(await new Response(blob.stream).arrayBuffer()).toString("utf8"));
  } catch {
    return { schema: "zovaro.advertisers.v1", clients: [], updated_at: null };
  }
}
async function writeStore(store) {
  store.updated_at = new Date().toISOString();
  await put("advertiser-management/clients.json", JSON.stringify(store), {
    access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json"
  });
}
function addMonths(dateString, count) {
  const date = new Date(dateString + "T12:00:00.000Z");
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + count);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}
function paymentStatus(client, today) {
  if (client.status !== "active") return client.status;
  if (client.plan !== "monthly") return "active";
  const due = client.next_payment_due;
  if (!due) return "payment_schedule_missing";
  if (due < today) return "overdue";
  if (due <= addMonths(today, 0)) return "due_today";
  if (due <= addMonths(today, 0).slice(0, 7) + "-10") return "due_soon";
  return "active";
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const secret = process.env.ZOVARO_ADMIN_SESSION_SECRET;
  const token = readCookie(req.headers.cookie, "zovaro_admin");
  if (!secret || secret.length < 32 || !verifySession(token, secret)) {
    return res.status(401).json({ error: "Sessione amministratore assente o scaduta." });
  }
  if (!process.env.BLOB_STORE_ID) return res.status(503).json({ error: "Archivio privato Blob non configurato." });
  if (req.method === "GET") {
    try {
      const store = await readStore();
      const today = new Date().toISOString().slice(0, 10);
      const clients = store.clients.map(client => ({ ...client, payment_status: paymentStatus(client, today) }));
      return res.status(200).json({ updated_at: store.updated_at, clients, generated_at: new Date().toISOString() });
    } catch (error) {
      console.error("Advertiser store read failed:", error);
      return res.status(503).json({ error: "Impossibile leggere il registro inserzionisti." });
    }
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const body = req.body || {};
  const store = await readStore();
  if (body.action === "create_client") {
    const name = String(body.name || "").trim().slice(0, 160);
    const email = String(body.email || "").trim().slice(0, 254);
    const plan = body.plan === "annual" ? "annual" : body.plan === "monthly" ? "monthly" : "";
    const contractSigned = body.contract_signed === true;
    const startDate = String(body.start_date || "").slice(0, 10);
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !plan || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !contractSigned) {
      return res.status(400).json({ error: "Nome, email valida, piano, data di inizio e contratto firmato sono obbligatori." });
    }
    const client = {
      id: crypto.randomUUID(), name, email, plan,
      monthly_amount_usd: plan === "monthly" ? 9.99 : null,
      annual_amount_usd: plan === "annual" ? 99 : null,
      term_months: 12, start_date: startDate,
      next_payment_due: plan === "monthly" ? startDate : null,
      contract_signed: true, first_payment_verified: false,
      status: "payment_pending", payments: [], publications: [],
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    };
    store.clients.push(client);
    await writeStore(store);
    return res.status(201).json({ client });
  }
  if (body.action === "record_payment") {
    const client = store.clients.find(item => item.id === body.client_id);
    if (!client) return res.status(404).json({ error: "Inserzionista non trovato." });
    if (body.bank_credit_verified !== true) return res.status(400).json({ error: "Il pagamento può essere registrato solo dopo verifica dell'effettivo accredito bancario." });
    const amount = Number(body.amount);
    const expected = client.plan === "monthly" ? 9.99 : 99;
    if (!Number.isFinite(amount) || amount < expected - 0.01) return res.status(400).json({ error: "Importo inferiore alla quota prevista." });
    const paidAt = String(body.paid_at || new Date().toISOString()).slice(0, 30);
    const period = String(body.period || client.next_payment_due || client.start_date).slice(0, 10);
    client.payments.push({
      id: crypto.randomUUID(), amount_usd: Number(amount.toFixed(2)),
      paid_at: paidAt, period, method: "bank_transfer",
      bank_credit_verified: true, verified_by_admin: true,
      reference_last4: String(body.reference_last4 || "").replace(/\D/g, "").slice(-4) || null
    });
    client.first_payment_verified = true;
    client.status = "active";
    client.updated_at = new Date().toISOString();
    if (client.plan === "monthly") client.next_payment_due = addMonths(period, 1);
    else client.next_payment_due = null;
    await writeStore(store);
    return res.status(200).json({ client });
  }
  if (body.action === "set_status") {
    const client = store.clients.find(item => item.id === body.client_id);
    if (!client) return res.status(404).json({ error: "Inserzionista non trovato." });
    const allowed = ["active", "paused", "cancelled", "completed", "payment_pending"];
    if (!allowed.includes(body.status)) return res.status(400).json({ error: "Stato non valido." });
    client.status = body.status;
    client.updated_at = new Date().toISOString();
    await writeStore(store);
    return res.status(200).json({ client });
  }
  return res.status(400).json({ error: "Azione non riconosciuta." });
}
