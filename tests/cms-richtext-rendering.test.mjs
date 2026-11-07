import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { readRepositoryContent } from '../scripts/cms-content.mjs';
import { compareSnapshots, htmlSemantics } from '../scripts/cms-richtext-verify.mjs';
import remarkVideoEmbeds, { parseVideoComment } from '../src/lib/remark-video-embeds.mjs';

const root = new URL('../', import.meta.url).pathname;

test('legacy video comments become responsive embeds without losing pipe-containing titles or URLs', async () => {
  const markdown = '<!-- VIDEO: A title | including a pipe | https://www.youtube.com/embed/abc_123?feature=oembed -->';
  assert.deepEqual(parseVideoComment(markdown), { title: 'A title | including a pipe', src: 'https://www.youtube.com/embed/abc_123?feature=oembed', provider: 'youtube' });
  const p = await createMarkdownProcessor({ remarkPlugins: [remarkVideoEmbeds] });
  const rendered = await p.render(markdown);
  assert.match(rendered.code, /<iframe src="https:\/\/www\.youtube\.com\/embed\/abc_123\?feature=oembed"/);
  assert.match(rendered.code, /title="A title \| including a pipe"/);
  assert.match(rendered.code, /loading="lazy"/);
  assert.match(rendered.code, /<figcaption>A title \| including a pipe<\/figcaption>/);
  assert.equal((rendered.code.match(/<iframe/g) || []).length, 1);
});

test('video conversion rejects untrusted sources and escapes all attribute and caption text', async () => {
  for (const url of ['javascript:alert(1)', 'http://www.youtube.com/embed/x', 'https://youtube.com.evil.test/embed/x', 'https://evil.test/embed/x', 'https://youtube.com/watch?v=x', 'https://user:pass@youtube.com/embed/x', 'https://youtube.com:444/embed/x']) {
    assert.equal(parseVideoComment(`<!-- VIDEO: test | ${url} -->`), null);
  }
  const p = await createMarkdownProcessor({ remarkPlugins: [remarkVideoEmbeds] });
  const rendered = await p.render('<!-- VIDEO: <script> & "quotes" | https://giphy.com/embed/abc -->');
  const semantic = htmlSemantics(rendered.code);
  assert.equal(JSON.stringify(semantic).includes('"tag":"script"'), false);
  assert.equal(semantic[0].children[0].attrs.title, '<script> & "quotes"');
});

test('all current content renders with preserved headings, code shells, glossary terms and all eight embeds', async () => {
  const snapshot = await readRepositoryContent(root);
  const report = await compareSnapshots(snapshot, structuredClone(snapshot));
  assert.equal(report.documents, 173);
  assert.equal(report.bodyImages, 45);
  assert.equal(report.videos, 8);
  assert.equal(report.headings, 171);
  assert.equal(report.codeBlocks, 7);
  assert.ok(report.glossaryTerms > 0);
});

test('semantic comparison detects formatting, heading ID, image, embed, and code loss', () => {
  for (const [before, after] of [
    ['<p><strong>bold</strong></p>', '<p>bold</p>'],
    ['<h2 id="one">One</h2>', '<h2 id="changed">One</h2>'],
    ['<img src="/images/a.png" alt="Original">', '<img src="/images/b.png" alt="Original">'],
    ['<iframe src="https://youtube.com/embed/a" title="A"></iframe>', '<iframe src="https://youtube.com/embed/b" title="A"></iframe>'],
    ['<pre><code>x  y</code></pre>', '<pre><code>x y</code></pre>'],
  ]) assert.notDeepEqual(htmlSemantics(before), htmlSemantics(after));
});
