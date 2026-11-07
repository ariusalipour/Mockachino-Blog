import { cp, mkdir, mkdtemp, readFile, rename, rm, writeFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import baseline from './cms-baseline.mjs';
import { collections, safeSourcePath, serializeMarkdown, validateSnapshot } from './cms-content.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

export async function fetchSnapshot(cmsUrl, token) {
  const url = new URL(cmsUrl);
  if (url.username || url.password || !['http:', 'https:'].includes(url.protocol)) throw new Error('CMS_URL must be an HTTP(S) URL without embedded credentials');
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('CMS_URL must use HTTPS outside localhost');
  const endpoint = new URL('/api/site-content', url);
  const response = await fetch(endpoint, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal: AbortSignal.timeout(30_000), redirect: 'error',
  });
  if (!response.ok) throw new Error(`CMS snapshot failed: HTTP ${response.status}`);
  const text = await response.text();
  if (Buffer.byteLength(text) > 50 * 1024 * 1024) throw new Error('CMS snapshot exceeds 50 MB');
  return validateSnapshot(JSON.parse(text));
}

export async function syncSnapshot(snapshot, root = projectRoot) {
  validateSnapshot(snapshot);
  const content = path.join(root, 'src/content');
  const stateFile = path.join(root, '.cms-sync-state.json');
  let managed = baseline;
  try { managed = JSON.parse(await readFile(stateFile, 'utf8')).managed; }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!managed || typeof managed !== 'object') throw new Error('Invalid CMS sync state');
  for (const name of collections) {
    if (!Array.isArray(managed[name])) throw new Error('Invalid CMS sync state');
    managed[name].forEach(sourcePath => safeSourcePath(sourcePath));
  }
  const transaction = await mkdtemp(path.join(root, '.cms-sync-'));
  const staged = path.join(transaction, 'content');
  const previous = path.join(transaction, 'previous');
  let swapped = false;
  try {
    await cp(content, staged, { recursive: true, dereference: false });
    // Refuse links anywhere under content before writes: copied links must not escape staging.
    const noLinks = async directory => {
      const { readdir } = await import('node:fs/promises');
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isSymbolicLink()) throw new Error('Symlinks are not supported in CMS content');
        if (entry.isDirectory()) await noLinks(file);
      }
    };
    await noLinks(staged);
    const nextManaged = {};
    for (const name of collections) {
      for (const sourcePath of managed[name]) await rm(path.join(staged, name, sourcePath), { force: true });
      nextManaged[name] = [];
      for (const entry of snapshot.collections[name]) {
        const target = path.join(staged, name, entry.sourcePath);
        try {
          await lstat(target);
          throw new Error(`CMS path would overwrite unmanaged local content: ${name}/${entry.sourcePath}`);
        } catch (error) { if (error.code !== 'ENOENT') throw error; }
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, serializeMarkdown(entry));
        nextManaged[name].push(entry.sourcePath);
      }
    }
    await writeFile(path.join(transaction, 'state.json'), JSON.stringify({ version: 1, managed: nextManaged }, null, 2) + '\n');
    await rename(content, previous);
    try {
      await rename(staged, content);
      swapped = true;
      await rename(path.join(transaction, 'state.json'), stateFile);
    } catch (error) {
      if (swapped) await rm(content, { recursive: true, force: true });
      await rename(previous, content);
      throw error;
    }
    // Cloudflare's published artifact proves this exact CMS snapshot was built.
    // The publisher acknowledges a revision only when this marker is visible live.
    const digest = createHash('sha256').update(JSON.stringify(snapshot.collections)).digest('hex');
    await mkdir(path.join(root, 'public'), { recursive: true });
    await writeFile(path.join(transaction, 'revision.json'), JSON.stringify({ version: 1, digest }) + '\n');
    await rename(path.join(transaction, 'revision.json'), path.join(root, 'public/cms-revision.json'));
    return Object.fromEntries(collections.map(name => [name, snapshot.collections[name].length]));
  } finally { await rm(transaction, { recursive: true, force: true }); }
}

export async function main() {
  try { process.loadEnvFile(path.join(projectRoot, '.env')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!process.env.CMS_URL) {
    console.log('CMS_URL unset; using checked-in Astro content.');
    return;
  }
  const snapshot = await fetchSnapshot(process.env.CMS_URL, process.env.CMS_API_TOKEN);
  const counts = await syncSnapshot(snapshot);
  console.log('Synced published CMS content:', counts);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`CMS sync stopped: ${error.message}`); process.exitCode = 1; });
}
