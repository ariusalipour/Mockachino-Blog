import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import remarkVideoEmbeds from '../src/lib/remark-video-embeds.mjs';
import rehypeCodeShell from '../src/lib/rehype-code-shell.ts';
import rehypeGlossaryTooltips from '../src/lib/rehype-glossary-tooltips.ts';
import { validateSnapshot } from './cms-content.mjs';
import { fetchSnapshot } from './cms-sync.mjs';

const htmlParser = unified().use(rehypeParse, { fragment: true });
const attrNames = ['id', 'href', 'src', 'alt', 'title', 'start', 'type', 'checked', 'width', 'height', 'colSpan', 'rowSpan', 'align', 'style'];
function textContent(node) {
  return node.type === 'text' ? node.value : (node.children || []).map(textContent).join('');
}
function classes(node) { return String((node.properties?.className || []).join?.(' ') || node.properties?.className || '').split(/\s+/); }
function find(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.children || []) { const found = find(child, predicate); if (found) return found; }
}

/** Ignore generated toolbar/tooltip chrome, but preserve visible content and semantics. */
export function htmlSemantics(html) {
  const tree = htmlParser.parse(html);
  function canonical(node, inCode = false, parentTag = '') {
    if (node.type === 'comment') return [];
    if (node.type === 'text') {
      const text = inCode ? node.value : node.value.replace(/[\t\r\n ]+/g, ' ');
      const inlineParent = ['p', 'a', 'span', 'strong', 'em', 'u', 's', 'del', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figcaption', 'td', 'th'].includes(parentTag);
      return text.trim() || inCode || inlineParent ? [text] : [];
    }
    if (node.type === 'root') return (node.children || []).flatMap(child => canonical(child));
    if (node.type !== 'element') return [];
    if (classes(node).includes('code-shell')) {
      const pre = find(node, child => child.type === 'element' && child.tagName === 'pre');
      return [{ tag: 'code-block', value: String(node.properties?.dataCodeText ?? textContent(pre)), language: pre?.properties?.dataLanguage ?? '' }];
    }
    if (classes(node).includes('glossary-term')) {
      const label = find(node, child => child.type === 'element' && classes(child).includes('tooltip-token__label'));
      return [{ tag: 'glossary-term', value: textContent(label || node) }];
    }
    const tag = ({ b: 'strong', i: 'em' })[node.tagName] || node.tagName;
    if (tag === 'code') return [{ tag, value: textContent(node) }];
    const children = (node.children || []).flatMap(child => canonical(child, inCode || tag === 'pre', tag));
    if (tag === 'p' && (children.length === 0 || children.every(child => typeof child === 'string' && !child.trim()))) return [];
    const attrs = Object.fromEntries(attrNames.filter(key => node.properties?.[key] !== undefined && !(key === 'start' && Number(node.properties[key]) === 1)).map(key => [key, node.properties[key]]));
    return [{ tag, ...(Object.keys(attrs).length ? { attrs } : {}), ...(children.length ? { children } : {}) }];
  }
  return canonical(tree);
}

export async function createSiteMarkdownProcessor(snapshot) {
  const terms = snapshot.collections.glossary.map(doc => ({ term: doc.data.term, definition: doc.data.definition }));
  return createMarkdownProcessor({
    remarkPlugins: [remarkVideoEmbeds],
    rehypePlugins: [[rehypeGlossaryTooltips, terms], rehypeCodeShell],
  });
}

function normalizeMetadata(data) {
  const result = structuredClone(data);
  for (const field of ['createdAt', 'updatedAt']) if (result[field]) result[field] = new Date(result[field]).toISOString();
  return result;
}
function countElements(html, tag) {
  let count = 0;
  const visit = node => { if (node.type === 'element' && node.tagName === tag) count++; for (const child of node.children || []) visit(child); };
  visit(htmlParser.parse(html));
  return count;
}

export async function compareSnapshots(before, after) {
  validateSnapshot(before); validateSnapshot(after);
  const processor = await createSiteMarkdownProcessor(before);
  const report = { documents: 0, bodyImages: 0, videos: 0, headings: 0, codeBlocks: 0, formattedSpans: 0, links: 0, glossaryTerms: 0 };
  for (const [collection, originalDocuments] of Object.entries(before.collections)) {
    const actual = new Map(after.collections[collection].map(doc => [doc.sourcePath, doc]));
    assert.equal(actual.size, originalDocuments.length, `${collection}: document count changed`);
    for (const original of originalDocuments) {
      const label = `${collection}/${original.sourcePath}`;
      const converted = actual.get(original.sourcePath);
      assert.ok(converted, `${label}: missing document`);
      assert.deepEqual(normalizeMetadata(converted.data), normalizeMetadata(original.data), `${label}: metadata changed`);
      const [expectedRender, actualRender] = await Promise.all([processor.render(original.body), processor.render(converted.body)]);
      assert.deepEqual(actualRender.metadata.headings, expectedRender.metadata.headings, `${label}: heading text, hierarchy, IDs, or table of contents changed`);
      assert.deepEqual(htmlSemantics(actualRender.code), htmlSemantics(expectedRender.code), `${label}: rendered text, formatting, lists, links, images, embeds, or code changed`);
      report.documents++;
      report.bodyImages += countElements(expectedRender.code, 'img');
      report.videos += countElements(expectedRender.code, 'iframe');
      report.headings += expectedRender.metadata.headings.length;
      report.codeBlocks += countElements(expectedRender.code, 'pre');
      report.formattedSpans += countElements(expectedRender.code, 'strong') + countElements(expectedRender.code, 'em');
      report.links += countElements(expectedRender.code, 'a');
      report.glossaryTerms += (expectedRender.code.match(/class="tooltip-token glossary-term"/g) || []).length;
    }
  }
  return report;
}

async function main() {
  if (!process.argv[2]) throw new Error('Pass the saved pre-migration snapshot, then an after-snapshot file or CMS URL.');
  const beforeFile = path.resolve(process.argv[2]);
  const before = JSON.parse(await readFile(beforeFile, 'utf8'));
  const afterArg = process.argv[3] || process.env.CMS_URL;
  if (!afterArg) throw new Error('Pass the exported after-snapshot file or set CMS_URL.');
  const after = /^https?:/.test(afterArg) ? await fetchSnapshot(afterArg) : JSON.parse(await readFile(path.resolve(afterArg), 'utf8'));
  const report = await compareSnapshots(before, after);
  console.log('Rich text migration semantic verification passed:', JSON.stringify(report));
  if (process.env.CMS_VERIFY_REPORT) await writeFile(process.env.CMS_VERIFY_REPORT, JSON.stringify({ verifiedAt: new Date().toISOString(), ...report }, null, 2) + '\n');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error); process.exitCode = 1; });
