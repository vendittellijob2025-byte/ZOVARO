const token = process.env.BUFFER_API_TOKEN;
if (!token) throw new Error("Missing BUFFER_API_TOKEN GitHub Actions secret.");

async function gql(query, label) {
  const response = await fetch("https://api.buffer.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(30000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${label}: Buffer HTTP ${response.status}`);
  if (body.errors?.length) throw new Error(`${label}: ${body.errors.map(e => e.message).join("; ")}`);
  return body.data;
}

const orgData = await gql(`
  query ZovaroOrganizations {
    account {
      organizations { id }
    }
  }
`, "Organization lookup");

const organizations = orgData?.account?.organizations ?? [];
if (!organizations.length) throw new Error("No Buffer organization is accessible to this API key.");
let found = [];
for (const org of organizations) {
  const data = await gql(`
    query ZovaroChannels {
      channels(input: { organizationId: "${org.id}" }) {
        id
        name
        displayName
        service
        isQueuePaused
      }
    }
  `, "Channel lookup");
  found.push(...(data?.channels ?? []).map(channel => ({ ...channel, organizationId: org.id })));
}

const instagram = found.filter(c => c.service?.toLowerCase() === "instagram");
const tiktok = found.filter(c => c.service?.toLowerCase() === "tiktok");
console.log(JSON.stringify({
  organizationsFound: organizations.length,
  channels: found.map(({id,name,displayName,service,isQueuePaused}) => ({id,name,displayName,service,isQueuePaused})),
  zovaroInstagramCandidates: instagram.length,
  zovaroTikTokCandidates: tiktok.length,
}, null, 2));

if (!instagram.length || !tiktok.length) {
  throw new Error("Both Instagram and TikTok channels must be connected before scheduling ZOVARO videos.");
}
