const API_URL = "https://ads.api.cj.com/query";

const token = process.env.CJ_API_TOKEN;

if (!token) {
  throw new Error("CJ_API_TOKEN is missing.");
}

const query = `
query {
  products(
    companyId: "8068799"
    partnerIds: ["8022425", "7969352"]
    partnerStatus: JOINED
    limit: 100
  ) {
    resultList {
      id
      adId
      advertiserId
      advertiserName
      title
      description
      brand
      imageLink
      additionalImageLink
      link
      mobileLink
      price {
        amount
        currency
      }
      salePrice {
        amount
        currency
      }
      discountPercentage
      joinedStatus
    }
    totalCount
    count
  }
}
`;

console.log("Fetching real CJ products...");

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

if (!response.ok) {
  throw new Error(`CJ API failed with HTTP ${response.status}`);
}
