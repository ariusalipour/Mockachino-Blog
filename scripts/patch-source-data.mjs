/**
 * patch-source-data.mjs
 *
 * Updates all /migrated/... image paths in src/data/migratedArticleContent.ts
 * to the new /images/{articleId}/... paths.
 *
 * Run: node scripts/patch-source-data.mjs
 */

import { build } from "esbuild";
import { mkdtempSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { tmpdir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---------------------------------------------------------------------------
// Load wiki entries
// ---------------------------------------------------------------------------
const tmp = mkdtempSync(join(tmpdir(), "mocka-patch-"));

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
// Reproduce ID derivation
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
    if (!_idRegistry.has(candidate)) { _idRegistry.set(candidate, entry.slug); return candidate; }
    if (_idRegistry.get(candidate) === entry.slug) return candidate;
  }
  const fallback = `${t}-${c}-${entry.slug.replace(/-/g, "").toUpperCase().slice(0, 20)}`;
  _idRegistry.set(fallback, entry.slug);
  return fallback;
}

// ---------------------------------------------------------------------------
// Build replacement map: old path segment → new path segment
// Covers both slug variants (raw + topic-prefixed)
// ---------------------------------------------------------------------------
const replacements = new Map(); // /migrated/{topic}/{slug-variant}/ → /images/{articleId}/

for (const entry of wikiEntries) {
  const articleId = deriveArticleId(entry);
  const { topic, slug } = entry;

  const slugVariants = [slug];
  if (slug.startsWith(`${topic}-`)) slugVariants.push(slug.slice(topic.length + 1));

  for (const s of slugVariants) {
    replacements.set(`/migrated/${topic}/${s}/`, `/images/${articleId}/`);
  }
}

// ---------------------------------------------------------------------------
// Patch migratedArticleContent.ts
// ---------------------------------------------------------------------------
const TARGET = join(ROOT, "src/data/migratedArticleContent.ts");
let content = readFileSync(TARGET, "utf-8");
let totalReplaced = 0;

for (const [oldPath, newPath] of replacements) {
  const count = (content.match(new RegExp(oldPath.replace(/\//g, "\\/"), "g")) || []).length;
  if (count > 0) {
    content = content.split(oldPath).join(newPath);
    console.log(`  ${count}x  ${oldPath} → ${newPath}`);
    totalReplaced += count;
  }
}

writeFileSync(TARGET, content, "utf-8");
console.log(`\nReplaced ${totalReplaced} paths in migratedArticleContent.ts`);
