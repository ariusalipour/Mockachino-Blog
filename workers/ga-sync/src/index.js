/**
 * mockachino-ga-sync
 *
 * Cron Worker: runs daily at 02:00 UTC.
 * Fetches lifetime page views from GA4 Data API,
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
// GA4 returns at most 250,000 rows per request. Page through the report so
// the KV snapshot represents the complete lifetime result set, not just the
// first page of the ranking.
const REPORT_PAGE_SIZE = 10000;
// GA4 rejects dates before 2015-08-14 for this property. This is the
// earliest valid date, so the report still covers the property's full life.
const GA_START_DATE = "2015-08-14";
const SYNC_RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "text/plain; charset=utf-8",
};

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
  const result = {};
  let offset = 0;
  let rowCount = 0;
  let rowsFetched = 0;

  while (true) {
    const body = {
      dateRanges: [{ startDate: GA_START_DATE, endDate: "today" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: {
            matchType: "BEGINS_WITH",
            value: "/wiki/",
            caseSensitive: false,
          },
        },
      },
      keepEmptyRows: true,
      limit: REPORT_PAGE_SIZE,
      ...(offset > 0 ? { offset } : {}),
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
    const rows = data.rows ?? [];
    rowCount = Number(data.rowCount ?? rowCount);
    rowsFetched += rows.length;

    // GA can report the same article as multiple pagePath variants. Add
    // those rows together rather than allowing the last variant to win.
    for (const row of rows) {
      const path = row.dimensionValues?.[0]?.value ?? "";
      const views = parseInt(row.metricValues?.[0]?.value ?? "0", 10);
      const slug = extractWikiSlug(path);

      if (slug) {
        result[slug] = (result[slug] ?? 0) + views;
      }
    }

    offset += rows.length;

    if (rows.length === 0 || offset >= rowCount || rows.length < REPORT_PAGE_SIZE) {
      break;
    }
  }

  return { pageviews: result, rowCount, rowsFetched };
}

function extractWikiSlug(path) {
  const cleanPath = path.split(/[?#]/, 1)[0].replace(/\/+$/, "");
  const match = cleanPath.match(/^\/wiki\/([^/]+)$/i);

  if (!match) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/*
 * The sync snapshot intentionally stores lifetime values. The API response
 * also includes report metadata so the endpoint can be compared directly
 * with the corresponding GA report.
 */
function snapshotMetadata(data) {
  return {
    dateRange: { startDate: GA_START_DATE, endDate: "today" },
    metric: "screenPageViews",
    gaRowCount: data?.gaRowCount ?? 0,
    rowsFetched: data?.rowsFetched ?? 0,
  };
}

/*
 * Legacy snapshots only contain `pageviews`, so keep this response compatible
 * while exposing the newer metadata when it is available.
 */
function responseMetadata(data) {
  return data?.metadata ?? snapshotMetadata(data);
}

/*
 * rows: [{ dimensionValues: [{ value: "/wiki/shot-show-2026-first-timer/" }], metricValues: [{ value: "1234" }] }]
 */
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

    if (pathname.startsWith("/views/")) {
      const slug = decodeURIComponent(pathname.slice("/views/".length));
      return await getViews(env, slug);
    }

    if (pathname !== "/sync") {
      return new Response("mockachino-ga-sync. GET /sync, /popular, or /views/{slug}.", { status: 200 });
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
    "Cache-Control": "no-store",
  };

  try {
    const data = await getStoredPageviews(env);
    if (!data) {
      return new Response(JSON.stringify({ popular: [], updatedAt: null, metadata: null }), { headers });
    }

    const { pageviews, updatedAt } = data;
    const popular = Object.entries(pageviews ?? {})
      .sort(([, a], [, b]) => b - a)
      .map(([slug, views]) => ({ slug, views }));

    return new Response(JSON.stringify({ popular, updatedAt, metadata: responseMetadata(data) }), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers,
    });
  }
}

async function getViews(env, slug) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  };

  try {
    const data = await getStoredPageviews(env);
    const views = data?.pageviews?.[slug] ?? 0;
    return new Response(JSON.stringify({
      slug,
      views,
      updatedAt: data?.updatedAt ?? null,
      metadata: responseMetadata(data),
    }), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers,
    });
  }
}

async function getStoredPageviews(env) {
  const raw = await env.MOCKACHINO_PAGEVIEWS.get(KV_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

async function runSync(env) {
  try {
    const serviceAccount = JSON.parse(env.GA_SERVICE_ACCOUNT_KEY);
    const accessToken = await getAccessToken(serviceAccount);
    const report = await fetchPageViews(accessToken);
    const metadata = {
      ...snapshotMetadata({ gaRowCount: report.rowCount, rowsFetched: report.rowsFetched }),
      syncedPageCount: Object.keys(report.pageviews).length,
    };

    const payload = JSON.stringify({
      updatedAt: new Date().toISOString(),
      pageviews: report.pageviews,
      metadata,
    });

    // Keep the last successful all-time snapshot available if a scheduled sync fails.
    await env.MOCKACHINO_PAGEVIEWS.put(KV_KEY, payload);

    console.log(JSON.stringify({ event: "pageviews.synced", ...metadata }));
    return new Response(`OK — synced ${metadata.syncedPageCount} pages from ${metadata.gaRowCount} GA rows`, {
      status: 200,
      headers: SYNC_RESPONSE_HEADERS,
    });
  } catch (err) {
    console.error("GA sync failed:", err);
    return new Response(`Error: ${err.message}`, {
      status: 500,
      headers: SYNC_RESPONSE_HEADERS,
    });
  }
}
