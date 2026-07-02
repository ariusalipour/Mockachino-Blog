/**
 * Pages Function: /api/popular.json
 *
 * Reads pageview data from KV and returns the top N slugs
 * sorted by view count, for use by the client-side popular list.
 *
 * KV binding MOCKACHINO_PAGEVIEWS must be added in the Cloudflare
 * Pages project settings → Functions → KV namespace bindings.
 */

export async function onRequest(context) {
  const { env } = context;

  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=3600", // cache for 1h at edge
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const raw = await env.MOCKACHINO_PAGEVIEWS.get("pageviews");

    if (!raw) {
      return new Response(JSON.stringify({ popular: [], updatedAt: null }), { headers });
    }

    const { pageviews, updatedAt } = JSON.parse(raw);

    // Sort slugs by view count descending
    const popular = Object.entries(pageviews)
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
