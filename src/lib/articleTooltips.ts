import type { WikiEntry } from "../data/wiki-content";

interface GlossaryTerm {
  term: string;
  definition: string;
}

const SKIPPED_HTML_TAGS = new Set(["a", "code", "pre", "script", "style", "textarea"]);

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

function buildTermPattern(terms: GlossaryTerm[]) {
  const alternates = terms
    .map((item) => item.term.trim())
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)
    .map(escapeRegExp);

  if (alternates.length === 0) return null;

  return new RegExp(`(^|[^A-Za-z0-9])(${alternates.join("|")})(?=$|[^A-Za-z0-9])`, "gi");
}

function glossaryMarkup(label: string, term: GlossaryTerm) {
  return `<span class="tooltip-token glossary-term" tabindex="0" data-tooltip-kind="glossary"><span class="tooltip-token__label">${label}</span><span class="tooltip-popover" role="tooltip"><span class="tooltip-popover__eyebrow">Glossary</span><span class="tooltip-popover__title">${escapeHtml(term.term)}</span><span class="tooltip-popover__body">${escapeHtml(term.definition)}</span></span></span>`;
}

export function annotateGlossaryHtml(html: string, terms: GlossaryTerm[]) {
  const pattern = buildTermPattern(terms);
  if (!pattern) return html;

  const lookup = new Map(terms.map((item) => [item.term.toLowerCase(), item]));
  const parts = html.split(/(<[^>]+>)/g);
  const openSkippedTags: string[] = [];

  return parts
    .map((part) => {
      if (!part) return part;

      if (part.startsWith("<")) {
        const tagMatch = part.match(/^<\/?\s*([a-z0-9-]+)/i);
        const tagName = tagMatch?.[1]?.toLowerCase();

        if (tagName && SKIPPED_HTML_TAGS.has(tagName)) {
          const isClosing = /^<\//.test(part);
          const isSelfClosing = /\/\s*>$/.test(part);

          if (isClosing) {
            const lastIndex = openSkippedTags.lastIndexOf(tagName);
            if (lastIndex >= 0) openSkippedTags.splice(lastIndex, 1);
          } else if (!isSelfClosing) {
            openSkippedTags.push(tagName);
          }
        }

        return part;
      }

      if (openSkippedTags.length > 0) return part;

      return part.replace(pattern, (match, prefix, label) => {
        const term = lookup.get(String(label).toLowerCase());
        return term ? `${prefix}${glossaryMarkup(label, term)}` : match;
      });
    })
    .join("");
}

export function annotateGlossaryText(text: string, terms: GlossaryTerm[]) {
  return annotateGlossaryHtml(escapeHtml(text), terms);
}

export function getTagTooltip(tag: string, entries: WikiEntry[]) {
  const count = entries.filter((entry) => entry.tags.some((candidate) => candidate.toLowerCase() === tag.toLowerCase())).length;
  const entryLabel = count === 1 ? "entry" : "entries";

  return {
    eyebrow: "Tag",
    title: tag,
    body: `${count} ${entryLabel} use this tag across the wiki.`,
  };
}
