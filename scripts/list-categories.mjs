import { build } from "esbuild";
import { mkdtempSync } from "fs";
import { join } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { tmpdir } from "os";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const tmp = mkdtempSync(join(tmpdir(), "mocka-cat-"));

await build({
  entryPoints: [join(ROOT, "src/data/wiki.ts")],
  bundle: true, platform: "node", format: "esm",
  outfile: join(tmp, "wiki.mjs"), logLevel: "silent",
});

const { wikiEntries } = await import(pathToFileURL(join(tmp, "wiki.mjs")).href);

const tree = {};
for (const e of wikiEntries) {
  if (!tree[e.topic]) tree[e.topic] = {};
  if (!tree[e.topic][e.category]) tree[e.topic][e.category] = {};
  tree[e.topic][e.category][e.kind] = (tree[e.topic][e.category][e.kind] || 0) + 1;
}

for (const [topic, cats] of Object.entries(tree)) {
  console.log(`\n${topic.toUpperCase()}`);
  for (const [cat, kinds] of Object.entries(cats)) {
    const breakdown = Object.entries(kinds).map(([k,v]) => `${k}:${v}`).join(", ");
    const total = Object.values(kinds).reduce((a,b)=>a+b,0);
    console.log(`  ${cat.padEnd(16)} ${String(total).padStart(2)} entries  [${breakdown}]`);
  }
}
