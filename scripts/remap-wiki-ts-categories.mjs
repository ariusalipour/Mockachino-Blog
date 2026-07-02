/**
 * remap-wiki-ts-categories.mjs
 *
 * Rewrites category values in src/data/wiki.ts wikiEntries array
 * from old granular values to the 3 unified categories.
 *
 * Run: node scripts/remap-wiki-ts-categories.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TARGET = join(ROOT, "src/data/wiki.ts");

const MAP = {
  experiences: "news", events: "news", news: "news", blog: "news",
  tips: "guides", guides: "guides", training: "guides", "how-tos": "guides",
  reviews: "reviews", firearms: "reviews", "indie-games": "reviews",
};

let content = readFileSync(TARGET, "utf-8");
let count = 0;

// Match category lines inside wikiEntries: `    category: "old-value",`
content = content.replace(/(\s+category: ")([^"]+)(",)/g, (match, pre, cat, post) => {
  const mapped = MAP[cat];
  if (!mapped) { console.warn(`  UNKNOWN: "${cat}"`); return match; }
  if (mapped === cat) return match;
  count++;
  return `${pre}${mapped}${post}`;
});

writeFileSync(TARGET, content, "utf-8");
console.log(`Remapped ${count} category values in wiki.ts`);
