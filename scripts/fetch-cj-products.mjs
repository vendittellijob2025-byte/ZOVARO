const API_URL = "https://ads.api.cj.com/query";

const token = process.env.CJ_API_TOKEN;

if (!token) {
  throw new Error("CJ_API_TOKEN is missing.");
}

const query = `
query {
  __type(name: "Products") {
    fields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
        }
      }
    }
  }
}
`;

console.log("Inspecting CJ Products fields...");
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
