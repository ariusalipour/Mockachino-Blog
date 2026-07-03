import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface GlossaryTerm {
  term: string;
  definition: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const GLOSSARY_DIR = join(__dirname, "..", "content", "glossary");

function parseFrontmatter(source: string) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const frontmatter: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const entry = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!entry) continue;
    const [, key, value] = entry;
    frontmatter[key] = value.replace(/^"|"$/g, "");
  }

  return frontmatter;
}

export function readGlossaryTermsFromContent() {
  return readdirSync(GLOSSARY_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const source = readFileSync(join(GLOSSARY_DIR, file), "utf8");
      const frontmatter = parseFrontmatter(source);
      return {
        term: frontmatter.term ?? file.replace(/\.md$/, ""),
        definition: frontmatter.definition ?? "",
      } satisfies GlossaryTerm;
    })
    .sort((left, right) => left.term.localeCompare(right.term));
}
