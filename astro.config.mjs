import { defineConfig } from "astro/config";
import rehypeGlossaryTooltips from "./src/lib/rehype-glossary-tooltips";
import { glossaryTerms } from "./src/data/wiki";

export default defineConfig({
  output: "static",
  site: process.env.SITE_URL ?? "https://mockachino.app",
  markdown: {
    rehypePlugins: [
      [rehypeGlossaryTooltips, glossaryTerms],
    ],
  },
});
