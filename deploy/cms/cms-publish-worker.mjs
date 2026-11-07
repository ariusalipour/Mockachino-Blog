import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Observe committed snapshots. A hook 2xx means queued, not deployed: acknowledge
// only the revision marker served by the live Astro release, retry stalled builds.
const origin = process.env.CMS_INTERNAL_URL || 'http://cms:3000';
const site = process.env.SITE_PUBLIC_URL || 'https://mockachino.app';
const statePath = process.env.PUBLISH_STATE_PATH || '/state/publish-state.json';
const hook = process.env.CLOUDFLARE_PAGES_DEPLOY_HOOK;
const interval = Math.max(10, Number(process.env.PUBLISH_POLL_SECONDS) || 30) * 1000;
const retryAfter = Math.max(120, Number(process.env.PUBLISH_RETRY_SECONDS) || 600) * 1000;
const collections = ['topics','categories','tags','glossary','wiki','projects','project-updates'];
let state = {};
try { state = JSON.parse(await readFile(statePath, 'utf8')); }
catch (error) {
  if (error.code !== 'ENOENT') {
    console.error('Invalid publication state; quarantining and verifying live revision.');
    await rename(statePath, `${statePath}.invalid-${Date.now()}`);
  }
}
let candidate;
async function save(next) {
  await mkdir(dirname(statePath), { recursive: true });
  await writeFile(`${statePath}.tmp`, JSON.stringify(next), {mode:0o600});
  await rename(`${statePath}.tmp`, statePath);
  state = next;
}
while (true) {
  try {
    if (!hook) throw new Error('Waiting for CLOUDFLARE_PAGES_DEPLOY_HOOK configuration');
    const hookURL = new URL(hook);
    if (hookURL.protocol !== 'https:' || hookURL.hostname !== 'api.cloudflare.com') throw new Error('Invalid Cloudflare deploy hook origin');
    const response = await fetch(`${origin}/api/site-content`, {signal:AbortSignal.timeout(30000), cache:'no-store'});
    if (!response.ok) throw new Error(`CMS snapshot returned HTTP ${response.status}`);
    const snapshot = await response.json();
    if (snapshot.version !== 1 || snapshot.complete !== true || !collections.every(key=>Array.isArray(snapshot.collections?.[key]))) throw new Error('Incomplete CMS snapshot');
    const digest = createHash('sha256').update(JSON.stringify(snapshot.collections)).digest('hex');
    const markerURL = new URL('/cms-revision.json', site);
    markerURL.searchParams.set('check', String(Date.now()));
    let live;
    try {
      const deployed = await fetch(markerURL, {signal:AbortSignal.timeout(20000), cache:'no-store'});
      if (deployed.ok) live = (await deployed.json()).digest;
      else if (deployed.status !== 404) throw new Error(`Live revision returned HTTP ${deployed.status}`);
    } catch (error) {
      // Network failures should not repeatedly enqueue builds.
      console.error('Cannot verify live publication:', error.message);
      await delay(interval);
      continue;
    }
    if (live === digest) {
      if (state.acknowledged !== digest) {
        await save({acknowledged:digest, deployedAt:new Date().toISOString()});
        console.log('Verified published revision on the live website.');
      }
    } else if (candidate === digest && (!state.requestedAt || Date.now() - state.requestedAt >= retryAfter)) {
      const deploy = await fetch(hook, {method:'POST', signal:AbortSignal.timeout(30000)});
      if (!deploy.ok) throw new Error(`Deploy hook returned HTTP ${deploy.status}`);
      await save({...state, pending:digest, requestedAt:Date.now()});
      console.log('Cloudflare build requested; waiting for live revision confirmation.');
    }
    candidate = digest;
  } catch (error) { console.error(new Date().toISOString(), error.message); }
  await delay(interval);
}
