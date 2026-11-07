import { defineConfig } from "astro/config";
import remarkVideoEmbeds from "./src/lib/remark-video-embeds.mjs";
import rehypeCodeShell from "./src/lib/rehype-code-shell";
import rehypeGlossaryTooltips from "./src/lib/rehype-glossary-tooltips";
import { readGlossaryTermsFromContent } from "./src/data/glossary-files";

const glossaryTerms = readGlossaryTermsFromContent();

export default defineConfig({
  output: "static",
  site: process.env.SITE_URL ?? "https://mockachino.app",
  markdown: {
    remarkPlugins: [remarkVideoEmbeds],
    rehypePlugins: [
      [rehypeGlossaryTooltips, glossaryTerms],
      rehypeCodeShell,
    ],
  },
});
