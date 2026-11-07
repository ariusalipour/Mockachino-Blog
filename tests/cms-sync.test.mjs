import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { collections, parseMarkdown, readRepositoryContent, safeSourcePath, serializeMarkdown, validateSnapshot } from '../scripts/cms-content.mjs';
import { syncSnapshot } from '../scripts/cms-sync.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const initial = await readRepositoryContent(root);

test('all existing content round-trips without changing metadata or a Markdown byte', () => {
  let count = 0;
  for (const name of collections) for (const document of initial.collections[name]) {
    assert.deepEqual(parseMarkdown(serializeMarkdown(document)), { data: document.data, body: document.body });
    count++;
  }
  assert.equal(count, 173);
});

test('rejects incomplete snapshots, unpublished documents and duplicate paths', () => {
  for (const mutation of [
    value => { delete value.collections.tags; },
    value => { value.collections.wiki[0]._status = 'draft'; },
    value => { value.collections.wiki.push(value.collections.wiki[0]); },
    value => { value.counts = { wiki: 999 }; },
    value => { value.collections.wiki[0].data.updatedAt = 'not-a-date'; },
  ]) {
    const snapshot = structuredClone(initial);
    mutation(snapshot);
    assert.throws(() => validateSnapshot(snapshot));
  }
});

test('rejects traversal and paths unsafe on Windows or a NAS', () => {
  for (const sourcePath of ['../x.md', 'wiki/../../x.md', '/tmp/x.md', 'a\\b.md', 'a/./b.md', 'C:/x.md', 'a//b.md', 'x.md\0', '']) {
    assert.throws(() => safeSourcePath(sourcePath));
  }
});

test('allows intentionally unpublishing every article only after completed import', () => {
  const snapshot = structuredClone(initial);
  snapshot.collections.wiki = [];
  assert.throws(() => validateSnapshot(snapshot));
  snapshot.complete = true;
  assert.doesNotThrow(() => validateSnapshot(snapshot));
});

test('syncs complete snapshots, removes unpublished managed content, preserves unrelated files', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mockachino-cms-test-'));
  try {
    await mkdir(path.join(directory, 'src'), { recursive: true });
    await cp(path.join(root, 'src/content'), path.join(directory, 'src/content'), { recursive: true });
    await writeFile(path.join(directory, 'src/content/wiki/local-only.md'), 'unmanaged');
    await syncSnapshot(initial, directory);
    const initialMarker = JSON.parse(await readFile(path.join(directory, 'public/cms-revision.json'), 'utf8'));
    assert.deepEqual(initialMarker, { version: 1, digest: createHash('sha256').update(JSON.stringify(initial.collections)).digest('hex') });
    const snapshot = structuredClone(initial);
    const removed = snapshot.collections.wiki.shift();
    const edited = snapshot.collections.wiki[0];
    edited.body += '\n\nCMS edited content.\n';
    await syncSnapshot(snapshot, directory);
    const nextMarker = JSON.parse(await readFile(path.join(directory, 'public/cms-revision.json'), 'utf8'));
    assert.equal(nextMarker.digest, createHash('sha256').update(JSON.stringify(snapshot.collections)).digest('hex'));
    assert.notEqual(nextMarker.digest, initialMarker.digest);
    await assert.rejects(readFile(path.join(directory, 'src/content/wiki', removed.sourcePath)), { code: 'ENOENT' });
    assert.equal((await readFile(path.join(directory, 'src/content/wiki/local-only.md'), 'utf8')), 'unmanaged');
    assert.equal(parseMarkdown(await readFile(path.join(directory, 'src/content/wiki', edited.sourcePath), 'utf8')).body, edited.body);
    assert.match(await readFile(path.join(directory, 'src/content/config.ts'), 'utf8'), /defineCollection/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('invalid snapshot leaves the checkout unchanged', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mockachino-cms-failure-'));
  try {
    await mkdir(path.join(directory, 'src/content'), { recursive: true });
    await writeFile(path.join(directory, 'src/content/sentinel'), 'unchanged');
    const snapshot = structuredClone(initial);
    snapshot.collections.wiki[0].sourcePath = '../../sentinel.md';
    await assert.rejects(syncSnapshot(snapshot, directory));
    assert.equal(await readFile(path.join(directory, 'src/content/sentinel'), 'utf8'), 'unchanged');
    await assert.rejects(readFile(path.join(directory, 'public/cms-revision.json')), { code: 'ENOENT' });
  } finally { await rm(directory, { recursive: true, force: true }); }
});
