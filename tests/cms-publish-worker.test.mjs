import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createHash } from 'node:crypto';

const repo = fileURLToPath(new URL('../', import.meta.url));
const worker = path.join(repo, 'deploy/cms/cms-publish-worker.mjs');
const collections = {
  topics: [{ sourcePath: 'shoots.md', data: { name: 'Shoots' }, body: '' }],
  categories: [], tags: [], glossary: [],
  wiki: [{ sourcePath: 'shoots/one.md', data: { title: 'One' }, body: 'text' }],
  projects: [], 'project-updates': [],
};
const v2Collections = { ...collections, courses: [], 'course-lessons': [], quizzes: [] };
const digestOf = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

async function runWorker({ cycles = 1, snapshotStatus = 200, version = 1, collections: content = collections, counts, liveStatus = 404, liveDigest, hookStatuses = [200], initialState } = {}) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'cms-poller-test-'));
  const statePath = path.join(dir, 'state.json');
  const callsPath = path.join(dir, 'calls.json');
  const configPath = path.join(dir, 'mock.json');
  const preloadPath = path.join(dir, 'preload.mjs');
  const timersPath = path.join(dir, 'fake-timers.mjs');
  const computedDigest = digestOf(content);
  const snapshotCounts = counts ?? Object.fromEntries(Object.entries(content).map(([name, docs]) => [name, docs?.length ?? 0]));
  const config = { cycles, snapshotStatus, version, collections: content, counts: snapshotCounts, liveStatus, liveDigest: liveDigest ?? computedDigest, hookStatuses, callsPath };
  await writeFile(configPath, JSON.stringify(config));
  if (initialState !== undefined) await writeFile(statePath, initialState);
  await writeFile(timersPath, `
    let calls = 0;
    export async function setTimeout(_ms, value) {
      if (++calls >= Number(process.env.TEST_CYCLES)) process.exit(0);
      return value;
    }
  `);
  await writeFile(preloadPath, `
    import { registerHooks } from 'node:module';
    import { readFileSync, writeFileSync, existsSync } from 'node:fs';
    const timers = new URL('./fake-timers.mjs', import.meta.url).href;
    registerHooks({ resolve(specifier, context, nextResolve) {
      if (specifier === 'node:timers/promises') return { url: timers, shortCircuit: true };
      return nextResolve(specifier, context);
    }});
    const cfg = JSON.parse(readFileSync(process.env.TEST_CONFIG, 'utf8'));
    const calls = [];
    globalThis.fetch = async input => {
      const url = String(input);
      if (url.endsWith('/api/site-content')) {
        calls.push({ kind: 'snapshot' });
        return Response.json({ version: cfg.version, complete: true, collections: cfg.collections, counts: cfg.version === 2 ? cfg.counts : undefined, draftRevision: calls.length }, { status: cfg.snapshotStatus });
      }
      if (url.includes('/cms-revision.json')) {
        calls.push({ kind: 'marker' });
        return Response.json({ digest: cfg.liveDigest }, { status: cfg.liveStatus });
      }
      calls.push({ kind: 'hook' });
      const status = cfg.hookStatuses.shift() ?? 200;
      return new Response('', { status });
    };
    process.on('exit', () => writeFileSync(cfg.callsPath, JSON.stringify(calls)));
  `);
  try {
    const child = spawn(process.execPath, ['--import', preloadPath, worker], {
      cwd: repo,
      env: {
        ...process.env,
        CMS_INTERNAL_URL: 'http://cms:3000',
        SITE_PUBLIC_URL: 'https://mockachino.app',
        CLOUDFLARE_PAGES_DEPLOY_HOOK: 'https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/test',
        PUBLISH_STATE_PATH: statePath,
        TEST_CONFIG: configPath,
        TEST_CYCLES: String(cycles),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });
    const exitCode = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`worker timed out\n${stdout}\n${stderr}`)); }, 5000);
      child.on('error', error => { clearTimeout(timer); reject(error); });
      child.on('exit', code => { clearTimeout(timer); resolve(code); });
    });
    const calls = JSON.parse(await readFile(callsPath, 'utf8'));
    let state;
    try { state = JSON.parse(await readFile(statePath, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    return { calls, state, computedDigest, stdout, stderr, exitCode, statePath, dir };
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
}

test('a successful hook request stays pending until the live marker matches', async () => {
  const oldDigest = 'previous-release';
  const result = await runWorker({ cycles: 2, liveStatus: 404, initialState: JSON.stringify({ acknowledged: oldDigest }) });
  try {
    assert.equal(result.exitCode, 0);
    assert.equal(result.calls.filter(call => call.kind === 'hook').length, 1);
    assert.equal(result.state.acknowledged, oldDigest);
    assert.equal(result.state.pending, result.computedDigest);
    assert.equal(typeof result.state.requestedAt, 'number');
  } finally { await rm(result.dir, { recursive: true, force: true }); }
});

test('a matching live revision is acknowledged without triggering a build', async () => {
  const result = await runWorker({ cycles: 1, liveStatus: 200 });
  try {
    assert.equal(result.state.acknowledged, result.computedDigest);
    assert.equal(result.calls.filter(call => call.kind === 'hook').length, 0);
  } finally { await rm(result.dir, { recursive: true, force: true }); }
});

test('failed hook POST is retried and only the accepted request becomes pending', async () => {
  const result = await runWorker({
    cycles: 3,
    liveStatus: 404,
    hookStatuses: [503, 200],
    initialState: JSON.stringify({ acknowledged: 'previous-release' }),
  });
  try {
    assert.equal(result.calls.filter(call => call.kind === 'hook').length, 2);
    assert.equal(result.state.acknowledged, 'previous-release');
    assert.equal(result.state.pending, result.computedDigest);
  } finally { await rm(result.dir, { recursive: true, force: true }); }
});

test('a new published digest deploys immediately while an older digest is pending', async () => {
  const result = await runWorker({
    cycles: 2,
    liveStatus: 404,
    initialState: JSON.stringify({
      acknowledged: 'previous-release',
      pending: 'older-pending-digest',
      requestedAt: Date.now(),
    }),
  });
  try {
    assert.equal(result.calls.filter(call => call.kind === 'hook').length, 1);
    assert.equal(result.state.acknowledged, 'previous-release');
    assert.equal(result.state.pending, result.computedDigest);
    assert.notEqual(result.state.pending, 'older-pending-digest');
  } finally { await rm(result.dir, { recursive: true, force: true }); }
});

test('draft-only changes omitted from the published snapshot do not trigger a build', async () => {
  // The endpoint returns only published collections; an unrelated draft count is outside the digest.
  const result = await runWorker({ cycles: 2, liveStatus: 200 });
  try {
    assert.equal(result.calls.filter(call => call.kind === 'hook').length, 0);
    assert.equal(result.state.acknowledged, result.computedDigest);
  } finally { await rm(result.dir, { recursive: true, force: true }); }
});

test('an unavailable initial CMS endpoint does not request a build', async () => {
  const result = await runWorker({ cycles: 1, snapshotStatus: 503 });
  try {
    assert.equal(result.calls.filter(call => call.kind === 'snapshot').length, 1);
    assert.equal(result.calls.filter(call => call.kind === 'marker' || call.kind === 'hook').length, 0);
    assert.equal(result.state, undefined);
  } finally { await rm(result.dir, { recursive: true, force: true }); }
});

test('accepts a complete v2 snapshot and hashes its raw ten-collection object', async () => {
  const result = await runWorker({ version: 2, collections: v2Collections, liveStatus: 200 });
  try {
    assert.equal(result.state.acknowledged, digestOf(v2Collections));
    assert.equal(result.calls.filter(call => call.kind === 'hook').length, 0);
  } finally { await rm(result.dir, { recursive: true, force: true }); }
});

test('rejects v2 snapshots missing a collection or with inconsistent counts', async () => {
  for (const options of [
    { version: 2, collections: { ...v2Collections, quizzes: undefined } },
    { version: 2, collections: v2Collections, counts: { ...Object.fromEntries(Object.entries(v2Collections).map(([name, docs]) => [name, docs.length])), courses: 1 } },
  ]) {
    const result = await runWorker({ ...options, cycles: 1, liveStatus: 404 });
    try {
      assert.equal(result.calls.filter(call => call.kind === 'marker' || call.kind === 'hook').length, 0);
      assert.match(result.stderr, /Incomplete CMS snapshot/);
      assert.equal(result.state, undefined);
    } finally { await rm(result.dir, { recursive: true, force: true }); }
  }
});
