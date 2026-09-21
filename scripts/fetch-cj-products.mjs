const API_URL = "https://link-search.api.cj.com/v2/link-search";
const WEBSITE_ID = "101881140";

const token = process.env.CJ_API_TOKEN;

if (!token) {
  throw new Error("CJ_API_TOKEN is missing.");
}

const params = new URLSearchParams({
  "website-id": WEBSITE_ID,
  "advertiser-ids": "7969352",
  "link-type": "Content Link",
  "records-per-page": "100"
});

const url = `${API_URL}?${params.toString()}`;

console.log("CJ Link Search URL:");
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
  throw new Error("CJ Link Search HTTP " + response.status + ": " + text);
}

console.log("CJ Link Search raw response:");
console.log(text);
