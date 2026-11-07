const FREE_EMAILS = new Set(["gmail.com","yahoo.com","outlook.com","hotmail.com","live.com","icloud.com","aol.com","proton.me","protonmail.com","yandex.com","mail.com","gmx.com"]);
function normalise(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function includesAny(text, terms) {
  return terms.find(term => text.includes(term)) || "";
}
function emailDomain(email) { return String(email || "").split("@")[1]?.toLowerCase() || ""; }
export function websiteDomain(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return "";
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch { return ""; }
}
export function moderationDecision(record) {
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

