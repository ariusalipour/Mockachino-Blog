/**
 * remap-categories-final.mjs
 *
 * Applies the final slug→category mapping to both:
 *   - src/content/wiki/**\/*.md  (category: field)
 *   - src/data/wiki.ts           (category: "..." in wikiEntries)
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// slug → new category id
const SLUG_MAP = {
  // SHOOTS — practical-shooting
  "shot-show-2026-first-timer":                                             "practical-shooting",
  "lynx-brutality-2025-commentator-to-competitor":                         "practical-shooting",
  "iwa-outdoor-classics-what-is-it":                                       "practical-shooting",
  "why-practical-shooting-is-a-great-shooting-discipline":                 "practical-shooting",
  "from-air-to-fire-how-ipsc-action-air-training-prepares-you-for-the-real-deal": "practical-shooting",
  "tactical-vs-practical-shooting":                                        "practical-shooting",
  "how-to-start-ipsc-mini-rifle-on-a-budget":                              "practical-shooting",
  "how-to-start-ipsc-action-air-on-a-budget":                              "practical-shooting",
  "how-to-get-into-sports-shooting-in-the-uk":                             "practical-shooting",
  "how-to-start-shooting-ipsc-action-air":                                 "practical-shooting",
  "what-optic-setup-is-best-for-practical-mini-rifle":                     "practical-shooting",
  "you-have-an-astigmatism-and-its-ok":                                    "practical-shooting",
  "understanding-hold-overs-and-hold-unders":                              "practical-shooting",
  "what-is-a-true-1x-magnification":                                       "practical-shooting",
  "what-is-sight-over-bore":                                               "practical-shooting",
  "what-i-focus-on-when-reviewing-optics":                                 "practical-shooting",
  "why-i-chose-an-hhs-setup-over-an-lpvo-setup-for-practical-mini-rifle":  "practical-shooting",
  "balancing-the-trigger-time-management-and-avoiding-burnout":            "practical-shooting",
  "the-difference-between-instructing-and-coaching":                       "practical-shooting",
  // SHOOTS — gear-and-firearms
  "cz-scorpion-evo-coming-to-the-uk":                                      "gear-and-firearms",
  "top-5-handguns-id-like-to-shoot-ipsc-handgun":                          "gear-and-firearms",
  "the-mp-15-22-is-your-best-and-worst-practical-mini-rifle":              "gear-and-firearms",
  "recover-tactical-20-20-stabiliser-kit":                                 "gear-and-firearms",
  "vortex-razor-hd-gen-iii-1-10x24":                                       "gear-and-firearms",
  "window-size-doesnt-really-matter":                                      "gear-and-firearms",
  "shoot-a-handgun-in-10-minutes-or-less":                                 "gear-and-firearms",
  // SHOOTS — field-notes
  "shoots-new-year-new-feat":                                              "field-notes",
  // SHOOTS — airsoft-and-tactical
  "this-trigger-will-make-your-airsoft-gun-realistic":                     "airsoft-and-tactical",
  // SHOOTS — law-and-safety
  "stop-referring-to-firearms-as-weapons":                                 "law-and-safety",
  "its-a-moderator-not-a-silencer":                                        "law-and-safety",
  // PLAYS — tactical-shooters
  "sp-tarkov-the-forbidden-fruit":                                         "tactical-shooters",
  "5-basic-skills-to-learn-for-escape-from-tarkov":                        "tactical-shooters",
  "escape-from-tarkov-bugs":                                               "tactical-shooters",
  "why-is-escape-from-tarkov-so-immersive":                                "tactical-shooters",
  "this-game-will-wreck-your-world-the-finals":                            "tactical-shooters",
  // PLAYS — indie-gaming
  "slay-the-spire":                                                        "indie-gaming",
  // PLAYS — software-tools
  "the-spiritual-successor-to-teamspeak":                                  "software-tools",
  "discord-stream-overlay-hack":                                           "software-tools",
  "discord-stream-overlay-hack-for-pop-out":                               "software-tools",
  "new-year-new-feat":                                                     "software-tools",
  // CODES — software-tools
  "codes-the-spiritual-successor-to-teamspeak":                            "software-tools",
  "swapping-over-to-windows-11":                                           "software-tools",
  "the-death-of-xamarin-forms-net-maui":                                   "software-tools",
  "codes-discord-stream-overlay-hack":                                     "software-tools",
  "codes-discord-stream-overlay-hack-for-pop-out":                         "software-tools",
  "migrating-wordpress-sites-without-plugins":                             "software-tools",
  "create-your-first-discord-bot":                                         "software-tools",
  // CODES — gear-and-hardware
  "how-to-film-in-s-log-3":                                               "gear-and-hardware",
};

// ---------------------------------------------------------------------------
// 1. Patch markdown files
// ---------------------------------------------------------------------------
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

let mdPatched = 0;

for (const file of walkMd(join(ROOT, "src/content/wiki"))) {
  let content = readFileSync(file, "utf-8");

  // Extract slug from frontmatter
  const slugMatch = content.match(/^slug: (.+)$/m);
  if (!slugMatch) continue;
  const slug = slugMatch[1].trim();
  const newCat = SLUG_MAP[slug];
  if (!newCat) continue;

  const updated = content.replace(/^(category: )(.+)$/m, (_, pre, old) => {
    if (old.trim() === newCat) return _;
    return `${pre}${newCat}`;
  });

  if (updated !== content) {
    writeFileSync(file, updated, "utf-8");
    mdPatched++;
    const oldCat = content.match(/^category: (.+)$/m)?.[1].trim();
    console.log(`  MD  ${oldCat?.padEnd(20)} → ${newCat}  (${slug})`);
  }
}

console.log(`\nPatched ${mdPatched} markdown files.`);

// ---------------------------------------------------------------------------
// 2. Patch wiki.ts entries
// ---------------------------------------------------------------------------
const WIKI_TS = join(ROOT, "src/data/wiki.ts");
let tsContent = readFileSync(WIKI_TS, "utf-8");
let tsPatched = 0;

// Match each wikiEntry block and replace its category
for (const [slug, newCat] of Object.entries(SLUG_MAP)) {
  // Find slug line, then the category line within the next ~10 lines
  const slugPattern = new RegExp(
    `(slug: "${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[\\s\\S]{0,300}?category: ")([^"]+)(")`,
    "m"
  );
  tsContent = tsContent.replace(slugPattern, (match, pre, oldCat, post) => {
    if (oldCat === newCat) return match;
    tsPatched++;
    console.log(`  TS  ${oldCat.padEnd(20)} → ${newCat}  (${slug})`);
    return `${pre}${newCat}${post}`;
  });
}

writeFileSync(WIKI_TS, tsContent, "utf-8");
console.log(`\nPatched ${tsPatched} entries in wiki.ts`);
