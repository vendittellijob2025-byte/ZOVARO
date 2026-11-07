import crypto from "node:crypto";
import { del, get, list, put } from "@vercel/blob";

const rateLimits = new Map();
const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const FREE_EMAILS = new Set(["gmail.com","yahoo.com","outlook.com","hotmail.com","live.com","icloud.com","aol.com","proton.me","protonmail.com","yandex.com","mail.com","gmx.com"]);
const POLICY_VERSION = "2026-11-07.1";

function clean(value, max) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return null; } }
  return null;
}
function clientKey(req) {
  return String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim().slice(0, 80);
}
function rateLimit(req, bucket, max, windowMs) {
  const key = bucket + ":" + clientKey(req);
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || entry.until <= now) { rateLimits.set(key, { count: 1, until: now + windowMs }); return true; }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}
function normalise(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function includesAny(text, terms) {
  return terms.find(term => text.includes(term)) || "";
}
function emailDomain(email) { return String(email || "").split("@")[1]?.toLowerCase() || ""; }
function websiteDomain(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return "";
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch { return ""; }
}
function cookieValue(header, name) {
  const item = String(header || "").split(";").map(part => part.trim()).find(part => part.startsWith(name + "="));
  if (!item) return "";
  try { return decodeURIComponent(item.slice(name.length + 1)); } catch { return ""; }
}
function isAdmin(req) {
  const secret = process.env.ZOVARO_ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return false;
  const parts = cookieValue(req.headers.cookie, "zovaro_admin").split(".");
  if (parts.length !== 2) return false;
  const expected = crypto.createHmac("sha256", secret).update(parts[0]).digest();
  const supplied = Buffer.from(parts[1], "base64url");
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return payload.role === "admin" && Number(payload.exp) > Date.now();
  } catch { return false; }
}
async function readRecord(pathname) {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const bytes = await new Response(result.stream).arrayBuffer();
  return JSON.parse(Buffer.from(bytes).toString("utf8"));
}
async function latestRecords(prefix, limit = 200) {
  const page = await list({ prefix, limit });
  const records = await Promise.all(page.blobs.map(blob => readRecord(blob.pathname).catch(() => null)));
  return records.filter(Boolean);
}
function reverseTimestamp() { return String(9999999999999 - Date.now()).padStart(13,"0"); }
async function addPendingPointer(record) {
  const pathname = "marketplace/queue/pending/" + reverseTimestamp() + "_" + record.id + ".json";
  await put(pathname,JSON.stringify({id:record.id,type:record.type,pathname:"marketplace/"+record.type+"/"+record.id+".json"}),{access:"private",addRandomSuffix:false,allowOverwrite:false,contentType:"application/json"});
}
async function publishPublicRecord(record) {
  const pathname = "marketplace/public/" + record.type + "/" + reverseTimestamp() + "_" + record.id + ".json";
  await put(pathname,JSON.stringify(publicRecord(record)),{access:"private",addRandomSuffix:false,allowOverwrite:false,contentType:"application/json"});
  record.publicPath=pathname;
  return pathname;
}
async function listPublicRecords(type,cursor) {
  const options={prefix:"marketplace/public/"+type+"/",limit:40};
  if(cursor) options.cursor=cursor;
  const page=await list(options);
  const records=await Promise.all(page.blobs.map(blob=>readRecord(blob.pathname).catch(()=>null)));
  return {records:records.filter(Boolean),cursor:page.hasMore?page.cursor:null};
}
function publicRecord(record) {
  return {
    id: record.id, type: record.type, title: record.title, category: record.category || null,
    company: record.company || null, jobType: record.jobType || null, workplace: record.workplace || null,
    condition: record.condition || null, price: record.price ?? null, currency: record.currency || null,
    location: record.location, description: record.description,
    imageUrl: record.imageUrl || null,
    contactEmail: record.publicContact === true ? record.contactEmail : null,
    sellerDisplayName: record.sellerDisplayName || null,
    traderType: record.traderType || null,
    approvedAt: record.reviewedAt || record.createdAt,
    independentlyVerified: false
  };
}
function moderationDecision(record) {
  const combined = normalise([record.title,record.description,record.company,record.category,record.sellerDisplayName].join(" "));
  const prohibited = [
    "cocaine","heroin","fentanyl","methamphetamine","mdma","ecstasy","marijuana","cannabis","thc","cbd oil",
    "firearm","firearms","gun for sale","ammunition","ammo","explosive","grenade","taser","pepper spray",
    "counterfeit","replica rolex","fake designer","stolen goods","stolen phone","stolen car","fake passport",
    "forged document","human organ","ivory","endangered species","wildlife trafficking","child sexual","revenge porn",
    "sex toy","pornographic","vape","e-cigarette","cigarette","tobacco","alcohol","beer for sale","wine for sale",
    "prescription drug","opioid","anabolic steroid","dnp supplement","get rich quick","money mule","receive money transfer",
    "pay to apply","pay an application fee","pay recruitment fee","upfront recruitment fee","training fee required","deposit to get the job","buy our starter kit"
  ];
  const hit = includesAny(combined, prohibited);
  if (hit) return { status:"rejected", action:"auto_rejected", reasons:["Potentially prohibited or unsafe content: " + hit], score:100 };

  if (record.type === "job") {
    const scam = includesAny(combined, [
      "no experience earn","guaranteed income","earn $$$","work from home easy money","send your bank details",
      "use your bank account","receive packages and reship","crypto investment job","pay a deposit","whatsapp only job"
    ]);
    if (scam) return { status:"rejected", action:"auto_rejected", reasons:["Likely employment scam pattern: " + scam], score:95 };
    const discriminatory = includesAny(combined, [
      "only men","only women","male only","female only","no disabled","no foreigners","white applicants only",
      "must be christian","must be muslim","must be catholic","under 25 only","over 35 only"
    ]);
    if (discriminatory) return { status:"pending", action:"manual_review", reasons:["Potentially discriminatory hiring requirement; legal context requires review."], score:65 };
    const domain = emailDomain(record.contactEmail);
    const site = websiteDomain(record.companyWebsite);
    const domainMatches = domain && site && (domain === site || domain.endsWith("." + site));
    if (!record.companyWebsite || !domainMatches || FREE_EMAILS.has(domain)) {
      return { status:"pending", action:"manual_review", reasons:["Employer identity is not sufficiently corroborated by a matching company website and email domain."], score:45 };
    }
    if (record.salaryText && /\b(guaranteed|unlimited|\$[0-9]{4,}\s*(per|a)\s*day)\b/i.test(record.salaryText)) {
      return { status:"pending", action:"manual_review", reasons:["Unusually high or guaranteed compensation claim."], score:55 };
    }
    return { status:"approved", action:"auto_approved", reasons:["Required fields complete; no prohibited-content or common job-scam indicators; employer website and contact domain match. This is automated screening, not identity verification."], score:15 };
  }

  const highRisk = includesAny(combined, [
    "vehicle","car","automobile","motorcycle","motorbike","boat","yacht","aircraft","private jet","plane",
    "real estate","property","rent an apartment","medical device","medicine","supplement","cosmetic injection",
    "luxury watch","designer handbag","antique","collectible","ticket","gift card","financial","investment","crypto",
    "helmet","child seat","car seat","safety equipment","medical","battery pack","lithium battery","charger"
  ]);
  const lowRiskCategories=["Home","Furniture","Books & Media","Sports"];
  if (highRisk || !lowRiskCategories.includes(record.category)) {
    return { status:"pending", action:"manual_review", reasons:["This category or item type requires a human review for product safety, authenticity, regulation or seller-risk reasons."], score:60 };
  }
  if (!record.sellerDisplayName || !record.sellerCountry || !record.sellerDeclaration || !record.ownershipDeclaration) {
    return { status:"pending", action:"manual_review", reasons:["Seller identity and ownership declarations are incomplete."], score:50 };
  }
  if (record.traderType === "business") {
    return { status:"pending", action:"manual_review", reasons:["Business seller details require verification before publication."], score:55 };
  }
  if (record.imageUrl) {
    return { status:"pending", action:"manual_review", reasons:["External product images require a visual and rights review before publication."], score:50 };
  }
  return { status:"approved", action:"auto_approved", reasons:["Common low-risk second-hand category; required private-seller and ownership declarations supplied; no prohibited-content indicators. This is automated screening, not proof of legality or ownership."], score:10 };
}

function validateSubmission(body) {
  const type = clean(body.type,20).toLowerCase();
  if (!["job","product"].includes(type)) return { error:"Invalid listing type." };
  const record = {
    schema:"zovaro.marketplace.v2", id:crypto.randomUUID(), type,
    title:clean(body.title,100), description:clean(body.description,type==="job"?3000:2000),
    location:clean(body.location,100), contactEmail:clean(body.contactEmail,254).toLowerCase(),
    publicContact:body.publicContact===true, status:"pending", createdAt:new Date().toISOString()
  };
  if (record.title.length<4 || record.description.length<20 || !record.location || !EMAIL_RE.test(record.contactEmail)) return { error:"Please complete all required fields with valid information." };
  if (!record.publicContact) return { error:"Explicit consent to display the contact email is required." };
  if (type==="job") {
    record.company=clean(body.company,100);
    record.companyWebsite=clean(body.companyWebsite,200);
    record.jobType=clean(body.jobType,30);
    record.workplace=clean(body.workplace,20);
    record.salaryText=clean(body.salaryText,100);
    const validTypes=["Full-time","Part-time","Contract","Freelance","Temporary","Internship"];
    const validWorkplaces=["On-site","Hybrid","Remote"];
    if (record.company.length<2 || !websiteDomain(record.companyWebsite) || !validTypes.includes(record.jobType) || !validWorkplaces.includes(record.workplace)) return { error:"Please provide a company website, valid employer, employment type and workplace details." };
    record.employerDeclaration=body.employerDeclaration===true;
    if (!record.employerDeclaration) return { error:"Please confirm that you are authorized to publish this genuine job opportunity." };
  } else {
    record.category=clean(body.category,40);
    record.condition=clean(body.condition,20);
    record.currency=clean(body.currency,3).toUpperCase();
    record.price=Number(body.price);
    record.sellerDisplayName=clean(body.sellerDisplayName,100);
    record.sellerCountry=clean(body.sellerCountry,80);
    record.traderType=clean(body.traderType,20);
    record.sellerDeclaration=body.sellerDeclaration===true;
    record.ownershipDeclaration=body.ownershipDeclaration===true;
    record.imageUrl=clean(body.imageUrl,500);
    const categories=["Electronics","Phones & Tablets","Computers","Gaming","Sports","Fashion","Kids & Babies","Home","Furniture","Beauty","Automotive","Tools & DIY","Books & Media","Collectibles","Appliances","Other"];
    const conditions=["New","Like new","Very good","Good","Fair"];
    if (!categories.includes(record.category)||!conditions.includes(record.condition)||!["USD","EUR","COP","GBP"].includes(record.currency)||!Number.isFinite(record.price)||record.price<=0||record.price>100000000) return { error:"Please provide valid category, condition, price and currency." };
    if (!record.sellerDisplayName||!record.sellerCountry||!["private","business"].includes(record.traderType)||!record.sellerDeclaration||!record.ownershipDeclaration) return { error:"Seller details and declarations are required." };
    if (record.imageUrl && !/^https:\/\//i.test(record.imageUrl)) return { error:"Product image must use a secure HTTPS address." };
  }
  return { record };
}

async function handleSubmit(req,res,body) {
  if (!rateLimit(req,"submit",5,30*60*1000)) return res.status(429).json({error:"Too many submissions. Please try again later."});
  if (clean(body.website,200)) return res.status(200).json({received:true});
  const checked=validateSubmission(body);
  if (checked.error) return res.status(400).json({error:checked.error});
  const record=checked.record;
  const decision=moderationDecision(record);
  record.status=decision.status;
  record.moderation={...decision,policyVersion:POLICY_VERSION,decidedAt:new Date().toISOString(),mode:"automated"};
  if (record.status==="approved") record.reviewedAt=record.moderation.decidedAt;
  try {
    await put(`marketplace/${record.type}/${record.id}.json`,JSON.stringify(record),{access:"private",addRandomSuffix:false,allowOverwrite:false,contentType:"application/json"});
    if(record.status==="pending") await addPendingPointer(record);
    if(record.status==="approved") {
      await publishPublicRecord(record);
      await put(`marketplace/${record.type}/${record.id}.json`,JSON.stringify(record),{access:"private",addRandomSuffix:false,allowOverwrite:true,contentType:"application/json"});
    }
    const messages={
      auto_approved:"Your listing passed ZOVARO's automated checks and is now published. Automated screening is not a guarantee of legality, authenticity or seller identity.",
      auto_rejected:"Your listing was not published because it triggered a prohibited-content or safety rule. You may appeal if you believe this was a mistake.",
      manual_review:"Your listing is safely stored and awaiting additional review. It will not appear publicly until approved."
    };
    return res.status(201).json({received:true,id:record.id,status:record.status,decision:decision.action,message:messages[decision.action],reasons:decision.reasons});
  } catch(error) {
    console.error("ZOVARO marketplace submission storage error:",error);
    return res.status(503).json({error:"We could not save your listing. Please try again later."});
  }
}

async function handleAdminGet(req,res) {
  if (!isAdmin(req)) return res.status(401).json({error:"Admin session missing or expired."});
  const requestUrl=new URL(req.url||"/","https://zovaro.vercel.app");
  const queueOptions={prefix:"marketplace/queue/pending/",limit:100};
  const queueCursor=requestUrl.searchParams.get("cursor");
  if(queueCursor) queueOptions.cursor=queueCursor;
  const [queue,reports,appeals]=await Promise.all([
    list(queueOptions),
    latestRecords("marketplace/reports/",100),
    latestRecords("marketplace/appeals/",100)
  ]);
  const pointers=await Promise.all(queue.blobs.map(blob=>readRecord(blob.pathname).catch(()=>null)));
  const pending=await Promise.all(pointers.filter(Boolean).map(pointer=>readRecord(pointer.pathname).catch(()=>null)));
  return res.status(200).json({
    pending:pending.filter(x=>x&&x.status==="pending"),
    pendingCursor:queue.hasMore?queue.cursor:null,
    reports:reports.filter(x=>x.status==="open"),
    appeals:appeals.filter(x=>x.status==="open")
  });
}

async function handleAdminPost(req,res,body) {
  if (!isAdmin(req)) return res.status(401).json({error:"Admin session missing or expired."});
  if (!rateLimit(req,"admin",100,60*60*1000)) return res.status(429).json({error:"Too many admin actions."});
  const action=clean(body.action,20);
  if (action==="moderate") {
    const type=clean(body.type,20),id=clean(body.id,50),decision=clean(body.decision,20);
    if (!["job","product"].includes(type)||!/^[0-9a-f-]{36}$/i.test(id)||!["approve","reject"].includes(decision)) return res.status(400).json({error:"Invalid moderation request."});
    const pathname=`marketplace/${type}/${id}.json`;
    const record=await readRecord(pathname);
    if (!record||record.id!==id||record.type!==type) return res.status(404).json({error:"Listing not found."});
    if (record.status!=="pending"&&record.status!=="rejected") return res.status(409).json({error:"Listing has already been reviewed."});
    record.status=decision==="approve"?"approved":"rejected";
    record.reviewedAt=new Date().toISOString();
    record.moderation={...(record.moderation||{}),action:"manual_"+decision,mode:"human",decidedAt:record.reviewedAt,policyVersion:POLICY_VERSION};
    await put(pathname,JSON.stringify(record),{access:"private",addRandomSuffix:false,allowOverwrite:true,contentType:"application/json"});
    const queuePage=await list({prefix:"marketplace/queue/pending/",limit:1000});
    const pointers=await Promise.all(queuePage.blobs.map(async blob=>({blob,record:await readRecord(blob.pathname).catch(()=>null)})));
    const found=pointers.find(item=>item.record?.id===id);
    if(found) await del(found.blob.pathname);
    if(record.status==="approved") {
      await publishPublicRecord(record);
      await put(pathname,JSON.stringify(record),{access:"private",addRandomSuffix:false,allowOverwrite:true,contentType:"application/json"});
    }
    return res.status(200).json({id,status:record.status});
  }
  if (action==="unpublish") {
    const type=clean(body.type,20),id=clean(body.id,50);
    if(!["job","product"].includes(type)||!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({error:"Invalid listing."});
    const pathname="marketplace/"+type+"/"+id+".json";
    const record=await readRecord(pathname);
    if(!record) return res.status(404).json({error:"Listing not found."});
    if(record.publicPath) await del(record.publicPath);
    record.status="rejected";
    record.reviewedAt=new Date().toISOString();
    record.moderation={...(record.moderation||{}),action:"manual_unpublished",mode:"human",decidedAt:record.reviewedAt,policyVersion:POLICY_VERSION};
    await put(pathname,JSON.stringify(record),{access:"private",addRandomSuffix:false,allowOverwrite:true,contentType:"application/json"});
    return res.status(200).json({id,status:"rejected"});
  }
  if (action==="close_case") {
    const kind=clean(body.kind,20),id=clean(body.id,50);
    if (!["reports","appeals"].includes(kind)||!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({error:"Invalid case."});
    const pathname=`marketplace/${kind}/${id}.json`;
    const item=await readRecord(pathname);
    if (!item) return res.status(404).json({error:"Case not found."});
    item.status="closed";item.closedAt=new Date().toISOString();
    await put(pathname,JSON.stringify(item),{access:"private",addRandomSuffix:false,allowOverwrite:true,contentType:"application/json"});
    return res.status(200).json({id,status:"closed"});
  }
  return res.status(400).json({error:"Unknown admin action."});
}

async function handlePublicCase(req,res,body,kind) {
  if (!rateLimit(req,kind,3,60*60*1000)) return res.status(429).json({error:"Too many requests. Please try later."});
  const id=clean(body.id,50),email=clean(body.email,254).toLowerCase(),reason=clean(body.reason,80),details=clean(body.details,1500);
  if (!/^[0-9a-f-]{36}$/i.test(id)||!EMAIL_RE.test(email)||details.length<15) return res.status(400).json({error:"Please provide a valid listing ID, contact email and details."});
  const job=await readRecord("marketplace/job/"+id+".json");
  const record=job || await readRecord("marketplace/product/"+id+".json");
  if (!record) return res.status(404).json({error:"Listing not found."});
  if (kind==="appeals" && !["rejected","pending"].includes(record.status)) return res.status(409).json({error:"Only pending or rejected listings can be appealed."});
  const item={schema:"zovaro.marketplace.case.v1",id:crypto.randomUUID(),listingId:id,listingType:record.type,kind,email,reason,details,status:"open",createdAt:new Date().toISOString()};
  await put("marketplace/"+kind+"/"+item.id+".json",JSON.stringify(item),{access:"private",addRandomSuffix:false,allowOverwrite:false,contentType:"application/json"});
  return res.status(201).json({received:true,message:kind==="reports"?"Thank you. Your report has been sent for review.":"Your appeal has been received for review."});
}

export default async function handler(req,res) {
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Content-Type-Options","nosniff");
  if (!process.env.BLOB_STORE_ID) return res.status(503).json({error:"Marketplace storage is not connected in this environment."});
  const url=new URL(req.url||"/","https://zovaro.vercel.app");
  if (req.method==="GET") {
    if (url.searchParams.get("admin")==="1") {
      try { return await handleAdminGet(req,res); }
      catch(error){console.error("ZOVARO admin queue error:",error);return res.status(503).json({error:"Unable to load moderation queue."});}
    }
    const type=url.searchParams.get("type");
    if (type&&!["job","product"].includes(type)) return res.status(400).json({error:"Invalid listing type."});
    if (!type) return res.status(400).json({error:"A listing type is required."});
    try {
      const result=await listPublicRecords(type,url.searchParams.get("cursor")||"");
      res.setHeader("X-Zovaro-Next-Cursor",result.cursor||"");
      return res.status(200).json(result.records);
    } catch(error){console.error("ZOVARO marketplace read error:",error);return res.status(503).json({error:"Marketplace listings are temporarily unavailable."});}
  }
  if (req.method!=="POST"){res.setHeader("Allow","GET, POST");return res.status(405).json({error:"Method not allowed."});}
  const contentLength=Number(req.headers["content-length"]||0);
  if (contentLength>12000) return res.status(413).json({error:"Submission is too large."});
  const body=readBody(req);
  if (!body||typeof body!=="object") return res.status(400).json({error:"Invalid submission."});
  try {
    if (body.action==="moderate"||body.action==="close_case") return await handleAdminPost(req,res,body);
    if (body.action==="report") return await handlePublicCase(req,res,body,"reports");
    if (body.action==="appeal") return await handlePublicCase(req,res,body,"appeals");
    return await handleSubmit(req,res,body);
  } catch(error){console.error("ZOVARO marketplace request error:",error);return res.status(503).json({error:"Marketplace request could not be completed."});}
}
