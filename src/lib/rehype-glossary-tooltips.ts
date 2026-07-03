import { visit } from "unist-util-visit";
import type { Root, Element, Text } from "hast";

interface GlossaryTerm {
  term: string;
  definition: string;
}

const SKIPPED_TAGS = new Set(["a", "code", "pre", "script", "style", "textarea", "span"]);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function glossaryMarkup(label: string, term: GlossaryTerm) {
  return `<span class="tooltip-token glossary-term" tabindex="0" data-tooltip-kind="glossary"><span class="tooltip-token__label">${label}</span><span class="tooltip-popover" role="tooltip"><span class="tooltip-popover__eyebrow">Glossary</span><span class="tooltip-popover__title">${escapeHtml(term.term)}</span><span class="tooltip-popover__body">${escapeHtml(term.definition)}</span></span></span>`;
}

function buildTermPattern(terms: GlossaryTerm[]) {
  const alternates = terms
    .map((item) => item.term.trim())
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)
    .map(escapeRegExp);

  if (alternates.length === 0) return null;

  return new RegExp(`(^|[^A-Za-z0-9])(${alternates.join("|")})(?=$|[^A-Za-z0-9])`, "gi");
}

export default function rehypeGlossaryTooltips(terms: GlossaryTerm[]) {
  const pattern = buildTermPattern(terms);
  const lookup = new Map(terms.map((item) => [item.term.toLowerCase(), item]));

  return function plugin(tree: Root) {
    if (!pattern) return;

    visit(tree, "element", (node: Element) => {
      if (SKIPPED_TAGS.has(node.tagName)) return;

      const children = node.children;
      if (!children) return;

      let i = 0;
      while (i < children.length) {
        const child = children[i];
        if (child.type !== "text") {
          i++;
          continue;
        }

        const text = (child as Text).value;
        if (!pattern.test(text)) {
          i++;
          continue;
        }
        pattern.lastIndex = 0;

        const newNodes: (Text | Element)[] = [];
        let lastIndex = 0;

        for (const match of text.matchAll(pattern)) {
          const matchStart = match.index!;
          const prefix = match[1];
          const label = match[2];
          const matchEnd = matchStart + match[0].length;

          if (matchStart > lastIndex) {
            newNodes.push({ type: "text", value: text.slice(lastIndex, matchStart) });
          }

          if (prefix) {
            newNodes.push({ type: "text", value: prefix });
          }

          const term = lookup.get(label.toLowerCase());
          if (term) {
            const raw = glossaryMarkup(label, term);
            newNodes.push({ type: "raw", value: raw } as any);
          } else {
            newNodes.push({ type: "text", value: label });
          }

          lastIndex = matchEnd;
        }

        if (lastIndex < text.length) {
          newNodes.push({ type: "text", value: text.slice(lastIndex) });
        }

        children.splice(i, 1, ...newNodes);
        i += newNodes.length;
      }
    });
  };
}
