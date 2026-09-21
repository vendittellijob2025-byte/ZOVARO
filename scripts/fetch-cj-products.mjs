import fs from "node:fs/promises";

const API_URL = "https://link-search.api.cj.com/v2/link-search";
const WEBSITE_ID = "101881140";

const ADVERTISERS = [
  {
    id: "8022425",
    name: "Kaiya Baby"
  },
  {
    id: "7969352",
    name: "Padel Iberico ES"
  }
];

const token = process.env.CJ_API_TOKEN;

if (!token) {
  throw new Error("CJ_API_TOKEN is missing.");
}

function getTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? match[1].trim() : "";
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractLinks(xml) {
  const links = [];
  const matches = xml.match(/<link>[\s\S]*?<\/link>/g) || [];

  for (const block of matches) {
    const relationshipStatus = getTag(block, "relationship-status");

    if (relationshipStatus.toLowerCase() !== "joined") {
      continue;
    }

    const clickUrl = decodeXml(getTag(block, "clickUrl"));

    if (!clickUrl) {
      continue;
    }

    const advertiserId = getTag(block, "advertiser-id");
    const advertiserName = decodeXml(getTag(block, "advertiser-name"));
    const linkId = getTag(block, "link-id");
    const linkName = decodeXml(getTag(block, "link-name"));
    const description = decodeXml(getTag(block, "description"));
    const destination = decodeXml(getTag(block, "destination"));
    const category = decodeXml(getTag(block, "category"));
    const saleCommission = getTag(block, "sale-commission");
    const allowDeepLinking = getTag(block, "allow-deep-linking");

    links.push({
      id: linkId,
      title: linkName || description || advertiserName,
      description:
        description ||
        `Affiliate offer from ${advertiserName}.`,
      advertiserId,
      advertiserName,
      category,
      destination,
      clickUrl,
      saleCommission,
      allowDeepLinking
    });
  }

  return links;
}

async function fetchAdvertiser(advertiser) {
  const params = new URLSearchParams({
    "website-id": WEBSITE_ID,
    "advertiser-ids": advertiser.id,
    "link-type": "Banner",
    "records-per-page": "100"
  });

  const url = `${API_URL}?${params.toString()}`;

  console.log(`\nFetching ${advertiser.name} (${advertiser.id})`);
  console.log(url);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token
    }
  });

  const text = await response.text();

  console.log("CJ HTTP status:", response.status);

  if (!response.ok) {
    throw new Error(
      `CJ Link Search HTTP ${response.status}: ${text}`
    );
  }

  return extractLinks(text);
}

const allLinks = [];

for (const advertiser of ADVERTISERS) {
  const links = await fetchAdvertiser(advertiser);
  allLinks.push(...links);
}

const uniqueLinks = Array.from(
  new Map(allLinks.map(link => [link.id, link])).values()
);

const products = uniqueLinks.map((link, index) => ({
  id: Number(link.id) || 100000 + index,
  title: link.title,
  description: link.description,
  advertiserId: link.advertiserId,
  advertiserName: link.advertiserName,
  category: link.category || "Featured",
  destination: link.destination,
  clickUrl: link.clickUrl,
  saleCommission: link.saleCommission,
  allowDeepLinking: link.allowDeepLinking === "true"
}));

const catalog = {
  source: "CJ Affiliate",
  generatedAt: new Date().toISOString(),
  companyId: "8068799",
  promotionalPropertyId: WEBSITE_ID,
  advertisers: ADVERTISERS,
  rowsReceived: products.length,
  productCount: products.length,
  products
};

await fs.writeFile(
  "data/catalog.json",
  JSON.stringify(catalog, null, 2) + "\n",
  "utf8"
);

console.log("\nZOVARO CJ catalog generated.");
console.log(`Products: ${products.length}`);
console.log("File: data/catalog.json");
