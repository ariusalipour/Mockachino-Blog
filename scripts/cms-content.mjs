import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

export const collections = ['topics', 'categories', 'tags', 'glossary', 'wiki', 'projects', 'project-updates'];
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
  };
  for (const key of strings[collection]) requireString(data, key, collection);
  if (['wiki', 'categories'].includes(collection) && !['shoots', 'plays', 'codes'].includes(data.topic)) throw new Error(`${collection}: invalid topic`);
  if (collection === 'wiki' && !['article', 'review', 'guide'].includes(data.kind)) throw new Error('wiki: invalid kind');
  if (['wiki', 'projects', 'project-updates'].includes(collection)) {
    requireDate(data, 'updatedAt', collection);
    if (!Array.isArray(data.tags) || data.tags.some(tag => typeof tag !== 'string')) throw new Error(`${collection}: tags must be strings`);
  }
  if (['wiki', 'project-updates'].includes(collection)) requireDate(data, 'createdAt', collection);
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
  if (snapshot?.version !== 1 || !snapshot.collections || typeof snapshot.collections !== 'object') throw new Error('Unsupported or incomplete CMS snapshot');
  for (const name of collections) {
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
  if (snapshot.complete !== true && (!snapshot.collections.topics.length || !snapshot.collections.wiki.length)) throw new Error('CMS has not confirmed its initial import is complete');
  return snapshot;
}

export async function readRepositoryContent(root) {
  const snapshot = { version: 1, collections: {} };
  for (const name of collections) {
    const directory = path.join(root, 'src/content', name);
    snapshot.collections[name] = [];
    for (const sourcePath of await walkFiles(directory)) {
      if (!sourcePath.endsWith('.md')) continue;
      const { data, body } = parseMarkdown(await readFile(path.join(directory, sourcePath), 'utf8'));
      snapshot.collections[name].push({ sourcePath, data, body });
    }
  }
  return validateSnapshot(snapshot);
}
