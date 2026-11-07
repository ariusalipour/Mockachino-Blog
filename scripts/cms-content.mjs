import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

export const legacyCollections = ['topics', 'categories', 'tags', 'glossary', 'wiki', 'projects', 'project-updates'];
export const newCollections = ['courses', 'course-lessons', 'quizzes'];
export const collections = [...legacyCollections, ...newCollections];
export function safeSourcePath(value, extension = '.md') {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.includes('\0') || value.includes(':') || value.startsWith('/') || value.split('/').some(part => !part || part === '.' || part === '..') || (extension && !value.endsWith(extension))) {
    throw new Error(`Unsafe content path: ${JSON.stringify(value)}`);
  }
  return value;
}

export function parseMarkdown(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error('Missing YAML frontmatter');
  const data = YAML.parse(match[1]);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid frontmatter');
  return { data, body: source.slice(match[0].length) };
}

export function serializeMarkdown({ data, body }) {
  // Payload exports the editor content as Markdown; preserve that body without a second conversion.
  return `---\n${YAML.stringify(data, { lineWidth: 0 })}---\n${body}`;
}

export async function walkFiles(root) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error(`Symlink not allowed in content: ${entry.name}`);
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...(await walkFiles(file)).map(name => `${entry.name}/${name}`));
    else if (entry.isFile()) result.push(entry.name);
  }
  return result.sort();
}

function requireString(data, key, collection) {
  if (typeof data[key] !== 'string') throw new Error(`${collection}: ${key} must be a string`);
}
function requireDate(data, key, collection) {
  if (typeof data[key] !== 'string' || Number.isNaN(Date.parse(data[key]))) throw new Error(`${collection}: ${key} must be an ISO date`);
}
export function validateDocument(collection, entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error(`${collection}: invalid document`);
  safeSourcePath(entry.sourcePath);
  if (typeof entry.body !== 'string') throw new Error(`${collection}: body must be Markdown text`);
  const data = entry.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(`${collection}: missing data`);
  const strings = {
    topics: ['name', 'shortName', 'strapline', 'accent', 'icon'],
    categories: ['name', 'description', 'topic'], tags: ['label'], glossary: ['term', 'definition'],
    wiki: ['articleId', 'title', 'summary', 'kind', 'topic', 'category'],
    projects: ['name', 'summary', 'status'], 'project-updates': ['project', 'title', 'summary'],
    courses: ['courseId', 'slug', 'title', 'summary', 'topic', 'category'],
    'course-lessons': ['lessonId', 'slug', 'title', 'summary'], quizzes: ['quizId', 'slug', 'title'],
  };
  for (const key of strings[collection]) requireString(data, key, collection);
  if (newCollections.includes(collection)) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) throw new Error(`${collection}: invalid slug`);
  }
  if (['wiki', 'categories'].includes(collection) && !['shoots', 'plays', 'codes'].includes(data.topic)) throw new Error(`${collection}: invalid topic`);
  if (collection === 'wiki' && !['article', 'review', 'guide'].includes(data.kind)) throw new Error('wiki: invalid kind');
  if (['wiki', 'projects', 'project-updates'].includes(collection)) {
    requireDate(data, 'updatedAt', collection);
    if (!Array.isArray(data.tags) || data.tags.some(tag => typeof tag !== 'string')) throw new Error(`${collection}: tags must be strings`);
  }
  if (['wiki', 'project-updates'].includes(collection)) requireDate(data, 'createdAt', collection);
  if (['courses', 'course-lessons', 'quizzes'].includes(collection)) requireDate(data, 'createdAt', collection);
  if (['courses', 'course-lessons', 'quizzes'].includes(collection)) requireDate(data, 'updatedAt', collection);
  if (['courses', 'course-lessons'].includes(collection) && data.featuredImage !== undefined && (!data.featuredImage || typeof data.featuredImage.src !== 'string' || (data.featuredImage.alt !== null && typeof data.featuredImage.alt !== 'string'))) throw new Error(`${collection}: invalid featured image`);
  if (collection === 'courses') {
    if (!['shoots', 'plays', 'codes'].includes(data.topic)) throw new Error('courses: invalid topic');
    if (!Array.isArray(data.tags) || data.tags.some(tag => typeof tag !== 'string')) throw new Error('courses: tags must be strings');
    if (!Array.isArray(data.lessons)) throw new Error('courses: lessons must be an array');
    const seen = new Set();
    for (const lesson of data.lessons) {
      if (!lesson || typeof lesson.lesson !== 'string' || (lesson.quiz !== undefined && typeof lesson.quiz !== 'string') || seen.has(lesson.lesson)) throw new Error('courses: invalid or duplicate lesson reference');
      seen.add(lesson.lesson);
    }
    if (data.finalQuiz !== undefined && typeof data.finalQuiz !== 'string') throw new Error('courses: invalid finalQuiz');
  }
  if (collection === 'quizzes') {
    if (!Array.isArray(data.questions) || data.questions.length < 1) throw new Error('quizzes: questions must be a nonempty array');
    if (entry.body !== '') throw new Error('quizzes: body must be empty');
    for (const q of data.questions) {
      if (!q || typeof q.question !== 'string' || !q.question.trim() || typeof q.explanation !== 'string' || !q.explanation.trim() || !Array.isArray(q.answers) || q.answers.length < 2 || q.answers.some(a => !a || typeof a.text !== 'string' || !a.text.trim() || typeof a.correct !== 'boolean') || q.answers.filter(a => a.correct).length !== 1) throw new Error('quizzes: invalid question or answers');
    }
  }
  if (data.slug !== undefined) requireString(data, 'slug', collection);
  if (collection === 'wiki' && data.featuredImage !== undefined) {
    if (!data.featuredImage || typeof data.featuredImage.src !== 'string' || (data.featuredImage.alt !== null && typeof data.featuredImage.alt !== 'string')) throw new Error('wiki: invalid featured image');
  }
  if (collection === 'topics' && data.homeStats !== undefined && ['reviews', 'articles', 'guides'].some(key => typeof data.homeStats?.[key] !== 'number')) throw new Error('topics: invalid homeStats');
  if (collection === 'projects') for (const key of ['repository', 'liveUrl']) {
    if (data[key] !== undefined) {
      const url = new URL(data[key]);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`projects: invalid ${key}`);
    }
  }
  return entry;
}

export function validateSnapshot(snapshot) {
  if (![1, 2].includes(snapshot?.version) || !snapshot.collections || typeof snapshot.collections !== 'object') throw new Error('Unsupported or incomplete CMS snapshot');
  for (const name of collections) {
    if (snapshot.version === 1 && newCollections.includes(name) && snapshot.collections[name] === undefined) continue;
    if (!Array.isArray(snapshot.collections[name])) throw new Error(`Missing CMS collection: ${name}`);
    const paths = new Set();
    for (const entry of snapshot.collections[name]) {
      validateDocument(name, entry);
      if (entry._status !== undefined && entry._status !== 'published') throw new Error(`CMS returned a draft in ${name}`);
      const normalized = entry.sourcePath.toLowerCase();
      if (paths.has(normalized)) throw new Error(`Duplicate CMS path in ${name}: ${entry.sourcePath}`);
      paths.add(normalized);
    }
    if (snapshot.counts && snapshot.counts[name] !== snapshot.collections[name].length) throw new Error(`Incomplete CMS collection: ${name}`);
  }
  for (const name of newCollections) if (snapshot.collections[name] !== undefined && !Array.isArray(snapshot.collections[name])) throw new Error(`Missing CMS collection: ${name}`);
  const bySlug = Object.fromEntries(['courses', 'course-lessons', 'quizzes'].map(name => [name, new Map()]));
  for (const name of Object.keys(bySlug)) for (const entry of snapshot.collections[name] ?? []) {
    const slug = entry.data.slug;
    if (bySlug[name].has(slug)) throw new Error(`${name}: duplicate slug ${slug}`);
    bySlug[name].set(slug, entry);
  }
  for (const course of snapshot.collections.courses ?? []) {
    for (const item of course.data.lessons) {
      if (!bySlug['course-lessons'].has(item.lesson)) throw new Error(`courses: unknown lesson ${item.lesson}`);
      if (item.quiz && !bySlug.quizzes.has(item.quiz)) throw new Error(`courses: unknown quiz ${item.quiz}`);
    }
    if (course.data.finalQuiz && !bySlug.quizzes.has(course.data.finalQuiz)) throw new Error(`courses: unknown final quiz ${course.data.finalQuiz}`);
  }
  if (snapshot.version === 2 && collections.some(name => !Array.isArray(snapshot.collections[name]))) throw new Error('CMS v2 requires all collections');
  if (snapshot.complete !== true && (!snapshot.collections.topics.length || !snapshot.collections.wiki.length)) throw new Error('CMS has not confirmed its initial import is complete');
  return snapshot;
}

export async function readRepositoryContent(root) {
  const snapshot = { version: 2, collections: {} };
  for (const name of collections) {
    const directory = path.join(root, 'src/content', name);
    snapshot.collections[name] = [];
    let files;
    try { files = await walkFiles(directory); }
    catch (error) { if (error.code === 'ENOENT' && newCollections.includes(name)) files = []; else throw error; }
    for (const sourcePath of files) {
      if (!sourcePath.endsWith('.md')) continue;
      const { data, body } = parseMarkdown(await readFile(path.join(directory, sourcePath), 'utf8'));
      snapshot.collections[name].push({ sourcePath, data, body });
    }
  }
  return validateSnapshot(snapshot);
}
