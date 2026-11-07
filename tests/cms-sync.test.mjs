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

test('accepts raw v1 snapshots without adding optional arrays or changing their revision digest', async () => {
  const legacy = structuredClone(initial);
  legacy.version = 1;
  for (const name of ['courses', 'course-lessons', 'quizzes']) delete legacy.collections[name];
  const digest = createHash('sha256').update(JSON.stringify(legacy.collections)).digest('hex');
  assert.doesNotThrow(() => validateSnapshot(legacy));
  assert.deepEqual(Object.keys(legacy.collections).sort(), [...collections.slice(0, 7)].sort());
  assert.equal(createHash('sha256').update(JSON.stringify(legacy.collections)).digest('hex'), digest);
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mockachino-cms-v1-'));
  try {
    await mkdir(path.join(directory, 'src/content'), { recursive: true });
    await cp(path.join(root, 'src/content'), path.join(directory, 'src/content'), { recursive: true });
    await syncSnapshot(legacy, directory);
    assert.deepEqual(JSON.parse(await readFile(path.join(directory, 'public/cms-revision.json'), 'utf8')), { version: 1, digest });
  } finally { await rm(directory, { recursive: true, force: true }); }
});

function courseFixture() {
  const snapshot = { version: 2, complete: true, collections: Object.fromEntries(collections.map(name => [name, structuredClone(initial.collections[name])])) };
  snapshot.collections.courses = [{ sourcePath: 'intro.md', body: '# Intro', data: { courseId: 'c1', slug: 'intro', title: 'Intro', summary: 'Start', topic: 'shoots', category: 'basics', tags: [], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', lessons: [{ lesson: 'first' }], finalQuiz: 'final' } }];
  snapshot.collections['course-lessons'] = [{ sourcePath: 'first.md', body: '# First', data: { lessonId: 'l1', slug: 'first', title: 'First', summary: 'One', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' } }];
  snapshot.collections.quizzes = [{ sourcePath: 'final.md', body: '', data: { quizId: 'q1', slug: 'final', title: 'Final', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', questions: [{ question: 'Q?', answers: [{ text: 'Yes', correct: true }, { text: 'No', correct: false }], explanation: 'Because.' }] } }];
  return snapshot;
}

test('validates v2 collections, quizzes, references and requires all v2 arrays', () => {
  const snapshot = courseFixture();
  assert.doesNotThrow(() => validateSnapshot(snapshot));
  for (const mutate of [
    s => { delete s.collections.quizzes; },
    s => { s.collections.courses[0].data.lessons[0].lesson = 'missing'; },
    s => { s.collections.quizzes[0].data.questions[0].answers[1].correct = true; },
    s => { s.collections.quizzes[0].data.questions[0].explanation = 4; },
    s => { s.collections.quizzes[0].data.questions = []; },
    s => { s.collections.courses[0].data.topic = 'unknown'; },
    s => { s.collections.courses[0].data.slug = '../unsafe'; },
  ]) { const invalid = courseFixture(); mutate(invalid); assert.throws(() => validateSnapshot(invalid)); }
  const draft = courseFixture(); draft.collections.courses[0]._status = 'draft'; assert.throws(() => validateSnapshot(draft));
});

test('validates optional new collections when they appear in a v1 payload', () => {
  const snapshot = courseFixture(); snapshot.version = 1;
  snapshot.collections.courses[0]._status = 'draft';
  assert.throws(() => validateSnapshot(snapshot), /draft/);
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

test('syncs course content and removals, then refuses a v1 downgrade that would delete it', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mockachino-cms-courses-'));
  try {
    await mkdir(path.join(directory, 'src/content'), { recursive: true });
    await cp(path.join(root, 'src/content'), path.join(directory, 'src/content'), { recursive: true });
    const snapshot = courseFixture();
    await syncSnapshot(snapshot, directory);
    assert.match(await readFile(path.join(directory, 'src/content/courses/intro.md'), 'utf8'), /courseId: c1/);
    snapshot.collections.courses = [];
    snapshot.collections['course-lessons'] = [];
    snapshot.collections.quizzes = [];
    await syncSnapshot(snapshot, directory);
    await assert.rejects(readFile(path.join(directory, 'src/content/courses/intro.md')), { code: 'ENOENT' });
    // Re-add content so the downgrade guard covers nonempty managed paths.
    snapshot.collections.courses = courseFixture().collections.courses;
    snapshot.collections['course-lessons'] = courseFixture().collections['course-lessons'];
    snapshot.collections.quizzes = courseFixture().collections.quizzes;
    await syncSnapshot(snapshot, directory);
    const legacy = structuredClone(initial); legacy.version = 1;
    for (const name of ['courses', 'course-lessons', 'quizzes']) delete legacy.collections[name];
    await assert.rejects(syncSnapshot(legacy, directory), /Refusing CMS v1 downgrade/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
