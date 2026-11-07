import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchSnapshot } from './cms-sync.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
try { process.loadEnvFile(path.join(root, '.env')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (!process.env.CMS_URL) throw new Error('Set CMS_URL to verify the initial content migration.');
const expected = JSON.parse(await readFile(path.resolve(process.argv[2] || path.join(root, 'work/cms-seed/content.json')), 'utf8'));
const actual = await fetchSnapshot(process.env.CMS_URL, process.env.CMS_API_TOKEN);
let count = 0;
for (const [name, docs] of Object.entries(expected.collections)) {
  assert.equal(actual.collections[name].length, docs.length, `${name}: imported count differs`);
  for (const original of docs) {
    const exported = actual.collections[name].find(doc => doc.sourcePath === original.sourcePath);
    assert.ok(exported, `${name}/${original.sourcePath}: missing document`);
    assert.equal(exported.body, original.body, `${name}/${original.sourcePath}: Markdown changed`);
    const data = structuredClone(original.data);
    for (const key of ['createdAt', 'updatedAt']) if (data[key]) {
      assert.equal(Date.parse(exported.data[key]), Date.parse(data[key]), `${name}/${original.sourcePath}: ${key} changed`);
      data[key] = exported.data[key];
    }
    assert.deepEqual(exported.data, data, `${name}/${original.sourcePath}: metadata changed`);
    count++;
  }
}
console.log(`Verified ${count} imported documents: exact Markdown and metadata, equivalent date timezones.`);
console.log('This compares the initial seed; later intentional CMS edits will correctly differ.');
