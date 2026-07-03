/**
 * mockachino-ga-sync
 *
 * Cron Worker: runs daily at 02:00 UTC.
 * Fetches top pages by view count from GA4 Data API,
 * writes the result to KV as JSON.
 *
 * Secrets required (set via wrangler secret put):
 *   GA_SERVICE_ACCOUNT_KEY  — full JSON key file contents as a string
 *
 * Env vars (set in wrangler.json vars or dashboard):
 *   GA_PROPERTY_ID          — numeric GA4 property ID e.g. "544017668"
 */

const GA_PROPERTY_ID = "544017668";
const GA_SCOPES = "https://www.googleapis.com/auth/analytics.readonly";
const GA_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GA_DATA_API = `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport`;
const KV_KEY = "pageviews";
const TOP_N = 50;

// ---------------------------------------------------------------------------
// JWT / OAuth helpers (no external deps — pure Web Crypto)
// ---------------------------------------------------------------------------

function base64urlEncode(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlEncodeBuffer(buf) {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (const b of bytes) binary += String.fromCharCode(b);
  return base64urlEncode(binary);
}

async function makeJWT(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);

  const header = base64urlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64urlEncode(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: GA_SCOPES,
      aud: GA_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  );

  const signingInput = `${header}.${payload}`;

  // Import the RSA private key
  const pemBody = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");

  const keyBuffer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${base64urlEncodeBuffer(signature)}`;
}

async function getAccessToken(serviceAccount) {
  const jwt = await makeJWT(serviceAccount);

  const resp = await fetch(GA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token fetch failed: ${resp.status} ${text}`);
  }

  const { access_token } = await resp.json();
  return access_token;
}

// ---------------------------------------------------------------------------
// GA4 Data API
// ---------------------------------------------------------------------------

async function fetchPageViews(accessToken) {
  const body = {
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: TOP_N,
  };

  const resp = await fetch(GA_DATA_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GA API failed: ${resp.status} ${text}`);
  }

  const data = await resp.json();

  // rows: [{ dimensionValues: [{ value: "/wiki/shot-show-2026-first-timer/" }], metricValues: [{ value: "1234" }] }]
  const result = {};
  for (const row of data.rows ?? []) {
    const path = row.dimensionValues[0].value;
    const views = parseInt(row.metricValues[0].value, 10);

    // Extract slug from common wiki URL shapes.
    const match = path.match(/(?:https?:\/\/[^/]+)?\/wiki\/([^/?#]+)\/?(?:[?#].*)?$/);
    if (match) {
      result[match[1]] = views;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Worker entrypoint
// ---------------------------------------------------------------------------

export default {
  // Manual trigger via HTTP GET for testing
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/popular") {
      return await getPopular(env);
    }

    if (pathname !== "/sync") {
      return new Response("mockachino-ga-sync. GET /sync to trigger manually or /popular for current rankings.", { status: 200 });
    }

    return await runSync(env);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runSync(env));
  },
};

async function getPopular(env) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=3600",
  };

  try {
    const raw = await env.MOCKACHINO_PAGEVIEWS.get(KV_KEY);
    if (!raw) {
      return new Response(JSON.stringify({ popular: [], updatedAt: null }), { headers });
    }

    const { pageviews, updatedAt } = JSON.parse(raw);
    const popular = Object.entries(pageviews ?? {})
      .sort(([, a], [, b]) => b - a)
      .map(([slug, views]) => ({ slug, views }));

    return new Response(JSON.stringify({ popular, updatedAt }), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers,
    });
  }
}

async function runSync(env) {
  try {
    const serviceAccount = JSON.parse(env.GA_SERVICE_ACCOUNT_KEY);
    const accessToken = await getAccessToken(serviceAccount);
    const pageviews = await fetchPageViews(accessToken);

    const payload = JSON.stringify({
      updatedAt: new Date().toISOString(),
      pageviews,
    });

    await env.MOCKACHINO_PAGEVIEWS.put(KV_KEY, payload, {
      expirationTtl: 60 * 60 * 48, // 48h TTL — cron runs daily so always fresh
    });

    console.log(`Synced ${Object.keys(pageviews).length} pages to KV`);
    return new Response(`OK — synced ${Object.keys(pageviews).length} pages`, { status: 200 });
  } catch (err) {
    console.error("GA sync failed:", err);
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}
