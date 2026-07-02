/**
 * remap-categories.mjs
 *
 * Rewrites category: field in all src/content/wiki/**\/*.md files
 * from old granular values to the 3 unified categories.
 *
 * Run: node scripts/remap-categories.mjs
 */

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const WIKI = join(ROOT, "src/content/wiki");

const MAP = {
  // → news
  experiences:  "news",
  events:       "news",
  news:         "news",
  blog:         "news",
  // → guides
  tips:         "guides",
  guides:       "guides",
  training:     "guides",
  "how-tos":    "guides",
  // → reviews
  reviews:      "reviews",
  firearms:     "reviews",
  "indie-games":"reviews",
};

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

let patched = 0;

for (const file of walkMd(WIKI)) {
  const content = readFileSync(file, "utf-8");

  const updated = content.replace(
    /^(category: )(.+)$/m,
    (_, prefix, oldCat) => {
      const newCat = MAP[oldCat.trim()];
      if (!newCat) {
        console.warn(`  UNKNOWN category "${oldCat.trim()}" in ${file}`);
        return _;
      }
      if (newCat === oldCat.trim()) return _;
      return `${prefix}${newCat}`;
    }
  );

  if (updated !== content) {
    writeFileSync(file, updated, "utf-8");
    const oldMatch = content.match(/^category: (.+)$/m);
    const newMatch = updated.match(/^category: (.+)$/m);
    console.log(`  ${oldMatch?.[1].trim().padEnd(12)} → ${newMatch?.[1].trim()}  (${file.split("wiki\\")[1]})`);
    patched++;
  }
}

console.log(`\nPatched ${patched} files.`);
