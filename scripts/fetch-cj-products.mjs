const API_URL = "https://ads.api.cj.com/query";

const token = process.env.CJ_API_TOKEN;

if (!token) {
  throw new Error("CJ_API_TOKEN is missing.");
}

const query = `
query {
  products(
    companyId: "8068799"
    publisherId: "101881140"
    limit: 10
  ) {
    id
    title
    description
    price
    currency
    imageUrl
    buyUrl
    advertiser {
      id
      name
    }
  }
}
`;

console.log("Testing CJ Product Feed API...");
console.log("Endpoint:", API_URL);

const response = await fetch(API_URL, {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + token,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ query })
});

const text = await response.text();

console.log("CJ HTTP status:", response.status);
console.log("CJ response:");
console.log(text);
