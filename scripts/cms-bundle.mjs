import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readRepositoryContent, walkFiles } from './cms-content.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = path.resolve(process.argv[2] || path.join(root, 'work/cms-seed'));
const content = await readRepositoryContent(root);
const media = [];
for (const file of await walkFiles(path.join(root, 'public/images'))) {
  const data = await readFile(path.join(root, 'public/images', file));
  media.push({ sourcePath: `images/${file}`, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') });
}
await mkdir(destination, { recursive: true });
await writeFile(path.join(destination, 'content.json'), JSON.stringify({ ...content, media }, null, 2) + '\n');
console.log(`Seed manifest: ${path.join(destination, 'content.json')}`);
console.log('Content counts:', Object.fromEntries(Object.entries(content.collections).map(([name, docs]) => [name, docs.length])));
console.log(`Media: ${media.length} files; importer reads originals from the repository public/ directory.`);
