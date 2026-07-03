import { visit } from "unist-util-visit";
import type { Element, Root, Text } from "hast";

const LANGUAGE_LABELS: Record<string, string> = {
  bash: "Bash",
  c: "C",
  csharp: "C#",
  css: "CSS",
  html: "HTML",
  ini: "INI",
  javascript: "JavaScript",
  js: "JavaScript",
  json: "JSON",
  md: "Markdown",
  markdown: "Markdown",
  powershell: "PowerShell",
  py: "Python",
  python: "Python",
  sh: "Shell",
  shell: "Shell",
  ts: "TypeScript",
  tsx: "TSX",
  typescript: "TypeScript",
  txt: "Text",
  yaml: "YAML",
  yml: "YAML",
};

function getClassList(node: Element) {
  const className = node.properties?.className;

  if (Array.isArray(className)) return className.map((value) => String(value));
  if (typeof className === "string") return className.split(/\s+/).filter(Boolean);

  return [];
}

function getNodeText(node: Element | Text | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.value;
  if (!("children" in node) || !node.children) return "";

  return node.children.map((child) => getNodeText(child as Element | Text)).join("");
}

function getLanguageLabel(codeNode: Element) {
  const classList = getClassList(codeNode);
  const languageClass = classList.find((className) => className.startsWith("language-") || className.startsWith("lang-"));
  if (!languageClass) return null;

  const language = languageClass.replace(/^language-/, "").replace(/^lang-/, "").toLowerCase();
  return LANGUAGE_LABELS[language] ?? language.toUpperCase();
}

function getPreLanguageLabel(preNode: Element) {
  const rawLanguage = preNode.properties?.["data-language"];
  if (typeof rawLanguage !== "string" || !rawLanguage.trim()) return null;

  const language = rawLanguage.trim().toLowerCase();
  if (language === "plaintext" || language === "text") return null;

  return LANGUAGE_LABELS[language] ?? language.toUpperCase();
}

function createElement(tagName: string, properties: Record<string, unknown> = {}, children: Array<Element | Text> = []): Element {
  return {
    type: "element",
    tagName,
    properties,
    children,
  };
}

function appendClassName(properties: Record<string, unknown> | undefined, className: string) {
  const existing = properties?.className;
  if (Array.isArray(existing)) return [...existing.map((value) => String(value)), className];
  if (typeof existing === "string" && existing.trim()) return [...existing.split(/\s+/).filter(Boolean), className];
  return [className];
}

export default function rehypeCodeShell() {
  return function plugin(tree: Root) {
    visit(tree, "element", (node: Element, index, parent) => {
      if (!parent || typeof index !== "number" || node.tagName !== "pre") return;
      if (node.properties && Object.prototype.hasOwnProperty.call(node.properties, "data-code-shell-pre")) return;

      const codeNode = node.children.find((child) => child.type === "element" && child.tagName === "code") as Element | undefined;
      if (!codeNode) return;

      const codeLanguage = getLanguageLabel(codeNode) ?? getPreLanguageLabel(node);
      const codeText = getNodeText(codeNode);

      node.properties = {
        ...(node.properties ?? {}),
        "data-code-shell-pre": "true",
        className: appendClassName(node.properties, "code-shell__pre--wrapped"),
      };

      const shell = createElement(
        "div",
        {
          className: ["code-shell", "code-shell--wrapped"],
          "data-code-language": codeLanguage ?? "",
          "data-code-text": codeText,
          "data-wrap-enabled": "true",
        },
        [
          createElement(
            "div",
            { className: ["code-shell__toolbar"] },
            [
              createElement(
                "span",
                { className: ["code-shell__language-badge"] },
                [{ type: "text", value: (codeLanguage ?? "text").toLowerCase() }],
              ),
              createElement(
                "div",
                { className: ["code-shell__actions"] },
                [
                  createElement(
                    "button",
                    {
                      type: "button",
                      className: ["code-shell__action", "code-shell__action--wrap"],
                      "data-code-block-wrap": "true",
                      "aria-label": "Enable line wrap",
                      "aria-pressed": "false",
                      title: "Unwrap code",
                    },
                    [{ type: "element", tagName: "svg", properties: { viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false" }, children: [
                      { type: "element", tagName: "path", properties: { d: "M2 4.5h7.3", fill: "none", stroke: "currentColor", "stroke-width": "1.25", "stroke-linecap": "round" }, children: [] },
                      { type: "element", tagName: "path", properties: { d: "M2 8h5.4", fill: "none", stroke: "currentColor", "stroke-width": "1.25", "stroke-linecap": "round" }, children: [] },
                      { type: "element", tagName: "path", properties: { d: "M2 11.5h8.1", fill: "none", stroke: "currentColor", "stroke-width": "1.25", "stroke-linecap": "round" }, children: [] },
                      { type: "element", tagName: "path", properties: { d: "M10.6 12.2 12.8 10l2.2 2.2", fill: "none", stroke: "currentColor", "stroke-width": "1.25", "stroke-linecap": "round", "stroke-linejoin": "round" }, children: [] },
                      { type: "element", tagName: "path", properties: { d: "M12.8 10V3.8", fill: "none", stroke: "currentColor", "stroke-width": "1.25", "stroke-linecap": "round" }, children: [] },
                    ]},
                      { type: "element", tagName: "span", properties: { className: ["sr-only"] }, children: [{ type: "text", value: "Unwrap code" }] }
                    ],
                  ),
                  createElement(
                    "button",
                    {
                      type: "button",
                      className: ["code-shell__action", "code-shell__action--copy"],
                      "data-code-block-copy": "true",
                      "aria-label": codeLanguage ? `Copy ${codeLanguage} code to clipboard` : "Copy code to clipboard",
                      title: "Copy code",
                    },
                    [{ type: "element", tagName: "span", properties: { className: ["sr-only"] }, children: [{ type: "text", value: "Copy code" }] }],
                  ),
                  createElement(
                    "button",
                    {
                      type: "button",
                      className: ["code-shell__action", "code-shell__action--download"],
                      "data-code-block-download": "true",
                      "aria-label": codeLanguage ? `Download ${codeLanguage} code` : "Download code",
                      title: "Download code",
                    },
                    [{ type: "element", tagName: "span", properties: { className: ["sr-only"] }, children: [{ type: "text", value: "Download code" }] }],
                  ),
                ],
              ),
            ],
          ),
          node,
        ],
      );

      parent.children.splice(index, 1, shell);
      return index + 1;
    });
  };
}
