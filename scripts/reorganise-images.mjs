/**
 * reorganise-images.mjs
 *
 * Moves public/migrated/{topic}/{slug}/ → public/images/{articleId}/
 * and rewrites all image src paths in src/content/wiki/**\/*.md
 *
 * Run: node scripts/reorganise-images.mjs
 */

import { build } from "esbuild";
import { mkdtempSync, readdirSync, existsSync, renameSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { tmpdir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---------------------------------------------------------------------------
// Load wiki data via esbuild (same pattern as generate-content.mjs)
// ---------------------------------------------------------------------------
const tmp = mkdtempSync(join(tmpdir(), "mocka-images-"));

await build({
  entryPoints: [join(ROOT, "src/data/wiki.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: join(tmp, "wiki.mjs"),
  logLevel: "silent",
});

const { wikiEntries } = await import(pathToFileURL(join(tmp, "wiki.mjs")).href);

// ---------------------------------------------------------------------------
// Article ID derivation — identical to generate-content.mjs
// ---------------------------------------------------------------------------
const specialIds = {
  "sp-tarkov-the-forbidden-fruit": "PLA-NEW-001",
  "5-basic-skills-to-learn-for-escape-from-tarkov": "PLA-TIP-002",
  "this-game-will-wreck-your-world-the-finals": "PLA-NEW-003",
  "escape-from-tarkov-bugs": "PLA-NEW-004",
  "the-spiritual-successor-to-teamspeak": "PLA-NEW-005",
  "why-is-escape-from-tarkov-so-immersive": "PLA-NEW-006",
  "discord-stream-overlay-hack-for-pop-out": "PLA-HOW-007",
  "discord-stream-overlay-hack": "PLA-HOW-008",
  "new-year-new-feat": "PLA-EXP-009",
  "slay-the-spire": "PLA-IND-010",
};

const _idRegistry = new Map();

function deriveArticleId(entry) {
  if (specialIds[entry.slug]) return specialIds[entry.slug];
  const t = entry.topic.toUpperCase().slice(0, 3);
  const c = entry.category.slice(0, 3).toUpperCase();

  for (let len = 3; len <= entry.slug.length; len++) {
    const s = entry.slug.slice(0, len).replace(/-/g, "").toUpperCase().slice(0, len);
    const candidate = `${t}-${c}-${s}`;
    if (!_idRegistry.has(candidate)) {
      _idRegistry.set(candidate, entry.slug);
      return candidate;
    }
    if (_idRegistry.get(candidate) === entry.slug) return candidate;
  }

  const fallback = `${t}-${c}-${entry.slug.replace(/-/g, "").toUpperCase().slice(0, 20)}`;
  _idRegistry.set(fallback, entry.slug);
  return fallback;
}

// ---------------------------------------------------------------------------
// Build slug → { articleId, topic, imageFolder } mapping
// The image folder key in public/migrated is:
//   - for most entries: the entry slug
//   - for codes/plays cross-posts (e.g. codes-discord-stream-overlay-hack):
//     the slug WITHOUT the topic prefix, under the topic folder
// ---------------------------------------------------------------------------
const MIGRATED = join(ROOT, "public/migrated");
const IMAGES  = join(ROOT, "public/images");

// slug → articleId
const slugToId = new Map();
for (const entry of wikiEntries) {
  slugToId.set(entry.slug, { articleId: deriveArticleId(entry), topic: entry.topic });
}

// ---------------------------------------------------------------------------
// Build a map: old public path → new public path
// e.g. /migrated/shoots/shot-show-2026-first-timer/foo.jpg
//    → /images/SHO-EVE-SHO/foo.jpg
// ---------------------------------------------------------------------------
const pathMap = new Map(); // old URL path → new URL path

function ensure(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

ensure(IMAGES);

let moved = 0;
let skipped = 0;

for (const entry of wikiEntries) {
  const { articleId, topic } = slugToId.get(entry.slug);

  // The slug used as the folder name in public/migrated may differ from
  // entry.slug for cross-posted codes entries whose slug starts with the
  // topic prefix (e.g. "codes-discord-stream-overlay-hack" → folder name
  // is "discord-stream-overlay-hack" under codes/).
  // We'll try entry.slug first, then strip the topic prefix.
  const candidateSlugs = [entry.slug];
  if (entry.slug.startsWith(`${topic}-`)) {
    candidateSlugs.push(entry.slug.slice(topic.length + 1));
  }

  let srcDir = null;
  for (const s of candidateSlugs) {
    const candidate = join(MIGRATED, topic, s);
    if (existsSync(candidate)) {
      srcDir = candidate;
      break;
    }
  }

  const destDir = join(IMAGES, articleId);

  if (!srcDir) {
    console.log(`  SKIP (no folder): ${topic}/${entry.slug} → ${articleId}`);
    skipped++;
    continue;
  }

  // Record path mappings for every file inside this folder
  const files = readdirSync(srcDir);
  for (const file of files) {
    // old: /migrated/{topic}/{slug-variant}/{file}
    // We record both possible old paths (with and without topic prefix)
    for (const s of candidateSlugs) {
      const oldPath = `/migrated/${topic}/${s}/${file}`;
      const newPath = `/images/${articleId}/${file}`;
      pathMap.set(oldPath, newPath);
    }
  }

  // Move the folder
  ensure(destDir);
  for (const file of files) {
    const src = join(srcDir, file);
    const dest = join(destDir, file);
    if (!existsSync(dest)) {
      renameSync(src, dest);
    }
  }

  console.log(`  MOVED: ${topic}/${entry.slug} → images/${articleId}/  (${files.length} files)`);
  moved++;
}

console.log(`\nMoved ${moved} folders, skipped ${skipped}.`);

// ---------------------------------------------------------------------------
// Rewrite image paths in all generated markdown files
// ---------------------------------------------------------------------------
console.log("\nPatching image paths in markdown...");

const WIKI_CONTENT = join(ROOT, "src/content/wiki");
let patchedFiles = 0;
let patchedPaths = 0;

function walkMd(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) files.push(...walkMd(full));
    else if (e.name.endsWith(".md")) files.push(full);
  }
  return files;
}

for (const mdFile of walkMd(WIKI_CONTENT)) {
  let content = readFileSync(mdFile, "utf-8");
  let changed = false;

  for (const [oldPath, newPath] of pathMap) {
    if (content.includes(oldPath)) {
      content = content.split(oldPath).join(newPath);
      changed = true;
      patchedPaths++;
    }
  }

  if (changed) {
    writeFileSync(mdFile, content, "utf-8");
    patchedFiles++;
    console.log(`  PATCHED: ${mdFile.replace(ROOT, "")}`);
  }
}

console.log(`\nPatched ${patchedPaths} paths across ${patchedFiles} markdown files.`);
console.log("Done.");
