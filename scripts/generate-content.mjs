/**
 * generate-content.mjs
 *
 * Generates src/content/{topics,categories,wiki} from the existing
 * wiki.ts and migratedArticleContent.ts data files.
 *
 * Run: node scripts/generate-content.mjs
 */

import { createRequire } from "module";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { register } from "node:module";

// ---------------------------------------------------------------------------
// Bootstrap TypeScript support so we can import the TS source files directly
// ---------------------------------------------------------------------------
import { createRequire as cr } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---------------------------------------------------------------------------
// We need to load the TS files. Use tsx/ts-node if available, otherwise
// we'll do a quick inline approach: strip types with a regex transform.
// Since the project already depends on Astro (which ships Vite + esbuild),
// we'll use esbuild to bundle the TS to a temp JS file.
// ---------------------------------------------------------------------------
import { build } from "esbuild";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";

const tmp = mkdtempSync(join(tmpdir(), "mocka-migrate-"));

// Bundle wiki.ts → tmp/wiki.mjs
await build({
  entryPoints: [join(ROOT, "src/data/wiki.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: join(tmp, "wiki.mjs"),
  logLevel: "silent",
});

// Bundle migratedArticleContent.ts → tmp/migrated.mjs
await build({
  entryPoints: [join(ROOT, "src/data/migratedArticleContent.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: join(tmp, "migrated.mjs"),
  logLevel: "silent",
});

const { topics, wikiEntries } = await import(pathToFileURL(join(tmp, "wiki.mjs")).href);
const { migratedArticleContent } = await import(pathToFileURL(join(tmp, "migrated.mjs")).href);

// ---------------------------------------------------------------------------
// Turndown: HTML → Markdown
// ---------------------------------------------------------------------------
const require = createRequire(import.meta.url);
const TurndownService = require("turndown");

const td = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// Preserve iframes (YouTube embeds etc) as raw HTML comments so content
// is not lost; editors can replace with proper MDX components later.
td.addRule("iframe", {
  filter: "iframe",
  replacement: (content, node) => {
    const src = node.getAttribute("src") || "";
    const title = node.getAttribute("title") || "Embedded video";
    return `\n\n<!-- VIDEO: ${title} | ${src} -->\n\n`;
  },
});

// Figures: keep as-is (images inside figures render fine in Markdown)
td.addRule("figure", {
  filter: "figure",
  replacement: (content) => `\n\n${content.trim()}\n\n`,
});

function htmlToMarkdown(html) {
  if (!html) return "";
  return td.turndown(html).trim();
}

// ---------------------------------------------------------------------------
// Article ID derivation — mirrors the logic in wiki.ts getArticleView()
// plus the explicit specialArticleViews IDs.
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

// Track used IDs so we can extend the slug suffix on collision
const _idRegistry = new Map(); // id → entry slug

function deriveArticleId(entry) {
  if (specialIds[entry.slug]) return specialIds[entry.slug];
  const t = entry.topic.toUpperCase().slice(0, 3);
  const c = entry.category.slice(0, 3).toUpperCase();

  // Try increasing suffix lengths until unique
  for (let len = 3; len <= entry.slug.length; len++) {
    const s = entry.slug.slice(0, len).replace(/-/g, "").toUpperCase().slice(0, len);
    const candidate = `${t}-${c}-${s}`;
    if (!_idRegistry.has(candidate)) {
      _idRegistry.set(candidate, entry.slug);
      return candidate;
    }
    // If this candidate already belongs to THIS entry (re-entry scenario), return it
    if (_idRegistry.get(candidate) === entry.slug) {
      return candidate;
    }
  }

  // Absolute fallback: use full slug (sanitised)
  const fallback = `${t}-${c}-${entry.slug.replace(/-/g, "").toUpperCase().slice(0, 20)}`;
  _idRegistry.set(fallback, entry.slug);
  return fallback;
}

// ---------------------------------------------------------------------------
// YAML-safe string: quote if contains special chars
// ---------------------------------------------------------------------------
function yamlStr(value) {
  if (value === null || value === undefined) return '""';
  const s = String(value);
  // Quote if contains colon, hash, quote, newline, leading/trailing space,
  // or starts with a special YAML indicator character.
  if (/[:#"'\n\r]/.test(s) || /^[\s\-?|>!%@`]/.test(s) || /\s$/.test(s)) {
    return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return s;
}

function buildFrontmatter(entry, migratedKey) {
  const migrated = migratedArticleContent[migratedKey];
  const featuredImage = migrated?.featuredImage;

  const lines = [
    "---",
    `slug: ${yamlStr(entry.slug)}`,
    `title: ${yamlStr(entry.title)}`,
    `summary: ${yamlStr(entry.summary)}`,
    `kind: ${entry.kind}`,
    `topic: ${entry.topic}`,
    `category: ${categoryRemap[entry.category] ?? entry.category}`,
    `createdAt: ${entry.createdAt}`,
    `updatedAt: ${entry.updatedAt}`,
    `popularity: ${entry.popularity}`,
    `tags:`,
    ...entry.tags.map((t) => `  - ${t}`),
  ];

  if (featuredImage) {
    lines.push(`featuredImage:`);
    lines.push(`  src: ${yamlStr(featuredImage.src)}`);
    lines.push(`  alt: ${yamlStr(featuredImage.alt)}`);
  }

  lines.push("---");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Structured-article fallback body (for entries with no migrated HTML)
// Generates readable Markdown from the ArticleSection[] data.
// ---------------------------------------------------------------------------
function sectionsToMarkdown(sections) {
  if (!sections || sections.length === 0) return "";
  const parts = [];
  for (const section of sections) {
    parts.push(`## ${section.title}\n`);
    for (const p of section.paragraphs) {
      parts.push(p + "\n");
    }
    if (section.takeaway) {
      parts.push(`> **Key Takeaway:** ${section.takeaway}\n`);
    }
    if (section.comparisonRows && section.comparisonRows.length > 0) {
      parts.push("| Model | Best Used For | Speed Range | Notes |");
      parts.push("| --- | --- | --- | --- |");
      for (const row of section.comparisonRows) {
        parts.push(`| ${row.model} | ${row.bestUsedFor} | ${row.speedRange} | ${row.notes} |`);
      }
      parts.push("");
    }
    if (section.metricCards && section.metricCards.length > 0) {
      for (const card of section.metricCards) {
        parts.push(`**${card.title}:** ${card.body}\n`);
      }
    }
    parts.push("");
  }
  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function ensure(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function write(filePath, content) {
  ensure(dirname(filePath));
  writeFileSync(filePath, content, "utf-8");
}

const CONTENT = join(ROOT, "src/content");

// ---------------------------------------------------------------------------
// 1. Topics
// ---------------------------------------------------------------------------
console.log("Generating topics...");
ensure(join(CONTENT, "topics"));

for (const topic of topics) {
  const lines = [
    "---",
    `name: ${yamlStr(topic.name)}`,
    `shortName: ${yamlStr(topic.shortName)}`,
    `strapline: ${yamlStr(topic.strapline)}`,
    `accent: ${yamlStr(topic.accent)}`,
    `icon: ${topic.icon}`,
  ];
  if (topic.homeStats) {
    lines.push(`homeStats:`);
    lines.push(`  reviews: ${topic.homeStats.reviews}`);
    lines.push(`  articles: ${topic.homeStats.articles}`);
    lines.push(`  guides: ${topic.homeStats.guides}`);
  }
  lines.push("---");
  lines.push("");
  lines.push(topic.description);

  write(join(CONTENT, "topics", `${topic.id}.md`), lines.join("\n"));
  console.log(`  topics/${topic.id}.md`);
}

// ---------------------------------------------------------------------------
// 2. Categories
// ---------------------------------------------------------------------------
console.log("Generating categories...");
ensure(join(CONTENT, "categories"));

const sharedCategories = [
  { id: "news",    name: "News",    description: "Events, coverage, personal updates, and opinions." },
  { id: "guides",  name: "Guides",  description: "How-tos, tips, training, and technique." },
  { id: "reviews", name: "Reviews", description: "Product, game, and gear reviews." },
];

const categoryRemap = {
  experiences: "news", events: "news", news: "news", blog: "news",
  tips: "guides", guides: "guides", training: "guides", "how-tos": "guides",
  reviews: "reviews", firearms: "reviews", "indie-games": "reviews",
};

for (const cat of sharedCategories) {
  const lines = [
    "---",
    `name: ${yamlStr(cat.name)}`,
    `description: ${yamlStr(cat.description)}`,
    "---",
  ];
  write(join(CONTENT, "categories", `${cat.id}.md`), lines.join("\n"));
  console.log(`  categories/${cat.id}.md`);
}

// ---------------------------------------------------------------------------
// 3. Wiki entries
// ---------------------------------------------------------------------------
console.log("Generating wiki entries...");

const collisions = [];

for (const entry of wikiEntries) {
  const articleId = deriveArticleId(entry);

  // The migratedArticleContent key is the entry slug for most entries,
  // but for codes/plays cross-posted entries the key uses the full slug
  // with prefix (e.g. "codes-discord-stream-overlay-hack").
  // We try the entry slug first, then topic-prefixed variants.
  const migratedKey =
    migratedArticleContent[entry.slug] !== undefined
      ? entry.slug
      : migratedArticleContent[`${entry.topic}-${entry.slug}`] !== undefined
        ? `${entry.topic}-${entry.slug}`
        : null;

  const migrated = migratedKey ? migratedArticleContent[migratedKey] : null;

  // Build body
  let body = "";
  if (migrated?.html) {
    body = htmlToMarkdown(migrated.html);
  } else {
    // No migrated HTML — generate stub from summary.
    // (Structured section data from wiki.ts is TS-only; the full
    //  getArticleView() sections are placeholder prose, not real content.)
    body = `${entry.summary}\n`;
  }

  const frontmatter = buildFrontmatter(entry, migratedKey);
  const fileContent = `${frontmatter}\n\n${body}\n`;

  const dir = join(CONTENT, "wiki", entry.topic);
  const filename = `${articleId}.md`;
  write(join(dir, filename), fileContent);
  console.log(`  wiki/${entry.topic}/${filename}  (${entry.slug})`);
}

// ---------------------------------------------------------------------------
// 4. Report
// ---------------------------------------------------------------------------
console.log(`\nDone. ${wikiEntries.length} wiki entries written.`);

if (collisions.length > 0) {
  console.warn("\nWARNING: Article ID collisions detected:");
  for (const c of collisions) {
    console.warn(`  ${c.id}  →  "${c.slug1}"  vs  "${c.slug2}"`);
  }
} else {
  console.log("No ID collisions.");
}
