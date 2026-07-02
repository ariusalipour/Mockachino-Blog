import { build } from "esbuild";
import { mkdtempSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { tmpdir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const tmp = mkdtempSync(join(tmpdir(), "mocka-titles-"));

await build({
  entryPoints: [join(ROOT, "src/data/wiki.ts")],
  bundle: true, platform: "node", format: "esm",
  outfile: join(tmp, "wiki.mjs"), logLevel: "silent",
});

const { wikiEntries } = await import(pathToFileURL(join(tmp, "wiki.mjs")).href);

for (const topic of ["shoots", "plays", "codes"]) {
  console.log(`\n=== ${topic.toUpperCase()} ===`);
  for (const cat of ["news", "guides", "reviews"]) {
    const entries = wikiEntries.filter(e => e.topic === topic && e.category === cat);
    if (!entries.length) continue;
    console.log(`\n  [${cat}]`);
    for (const e of entries) {
      console.log(`    ${e.kind.padEnd(7)} ${e.slug}`);
    }
  }
}
