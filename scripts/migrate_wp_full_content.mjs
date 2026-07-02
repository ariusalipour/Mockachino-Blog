import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { wikiEntries } from "../src/data/wiki.ts";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(rootDir, "src", "data", "migratedArticleContent.ts");
const publicDir = path.join(rootDir, "public");
const migratedAssetDir = path.join(publicDir, "migrated");

const topicSites = {
  shoots: "https://mockachino.co.uk/shoots",
  plays: "https://mockachino.co.uk/plays",
  codes: "https://mockachino.co.uk/codes",
};

function sourceSlugFor(entry) {
  if (entry.topic === "shoots" && entry.slug === "shoots-new-year-new-feat") {
    return "new-year-new-feat";
  }

  if (entry.topic === "codes") {
    if (entry.slug === "codes-the-spiritual-successor-to-teamspeak") return "the-spiritual-successor-to-teamspeak";
    if (entry.slug === "codes-discord-stream-overlay-hack-for-pop-out") return "discord-stream-overlay-hack-for-pop-out";
    if (entry.slug === "codes-discord-stream-overlay-hack") return "discord-stream-overlay-hack";
  }

  return entry.slug;
}

function decodeHtml(text) {
  return text
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "-")
    .replace(/&#038;/g, "&")
    .replace(/&#215;/g, "x")
    .replace(/&#8230;/g, "...")
    .replace(/&hellip;/g, "...")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanText(html) {
  return decodeHtml(html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "section";
}

function safeFilename(url) {
  const parsed = new URL(url);
  const basename = decodeURIComponent(path.posix.basename(parsed.pathname));
  const fallback = basename || "asset";
  const safe = fallback.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return safe || "asset";
}

function normalizeAssetUrl(url, topic) {
  const parsed = new URL(url);

  if (parsed.hostname === "themockachino.local") {
    parsed.protocol = "https:";
    parsed.hostname = "mockachino.co.uk";
  }

  if (parsed.hostname === "mockachino.co.uk" && parsed.pathname.startsWith("/wp-content/")) {
    parsed.pathname = `/${topic}${parsed.pathname}`;
  }

  return parsed.toString();
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function fetchBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function unsizedImageUrl(url) {
  const parsed = new URL(url);
  parsed.pathname = parsed.pathname.replace(/-\d+x\d+(\.[a-zA-Z0-9]+)$/i, "$1");
  return parsed.toString();
}

function uniqueName(filename, usedNames) {
  const extension = path.extname(filename);
  const stem = path.basename(filename, extension);
  let candidate = filename;
  let index = 2;

  while (usedNames.has(candidate)) {
    candidate = `${stem}-${index}${extension}`;
    index += 1;
  }

  usedNames.add(candidate);
  return candidate;
}

async function downloadAsset(url, topic, sourceSlug, usedNames, cache) {
  if (!url || !/^https?:\/\//i.test(url)) return undefined;

  const normalizedUrl = normalizeAssetUrl(url, topic);

  if (cache.has(normalizedUrl)) return cache.get(normalizedUrl);

  const assetDir = path.join(migratedAssetDir, topic, sourceSlug);
  await mkdir(assetDir, { recursive: true });

  const filename = uniqueName(safeFilename(normalizedUrl), usedNames);
  const filePath = path.join(assetDir, filename);
  const publicPath = `/migrated/${topic}/${sourceSlug}/${filename}`;

  if (!existsSync(filePath)) {
    let buffer;
    try {
      buffer = await fetchBuffer(normalizedUrl);
    } catch (error) {
      const fallbackUrl = unsizedImageUrl(normalizedUrl);
      if (fallbackUrl === normalizedUrl) {
        console.warn(`Missing image: ${normalizedUrl}`);
        return undefined;
      }

      try {
        buffer = await fetchBuffer(fallbackUrl);
      } catch {
        console.warn(`Missing image: ${normalizedUrl}`);
        return undefined;
      }
    }
    await writeFile(filePath, buffer);
  }

  cache.set(normalizedUrl, publicPath);
  return publicPath;
}

function collectImageUrls(html) {
  const urls = new Set();
  const srcPattern = /\s(?:src|href)=["'](https?:\/\/[^"']+\.(?:png|jpe?g|gif|webp|avif|svg)(?:\?[^"']*)?)["']/gi;
  let match;

  while ((match = srcPattern.exec(html)) !== null) {
    urls.add(match[1]);
  }

  return urls;
}

async function transformHtml(rawHtml, topic, sourceSlug, cache) {
  const usedNames = new Set();
  const replacements = new Map();
  const missingImages = [];
  const imageUrls = collectImageUrls(rawHtml);

  for (const url of imageUrls) {
    const localPath = await downloadAsset(url, topic, sourceSlug, usedNames, cache);
    if (localPath) {
      replacements.set(url, localPath);
    } else {
      missingImages.push(url);
    }
  }

  let html = rawHtml.trim();

  for (const [remote, local] of replacements.entries()) {
    html = html.split(remote).join(local);
  }

  for (const missing of missingImages) {
    const escaped = escapeRegExp(missing);
    html = html
      .replace(new RegExp(`<figure\\b[^>]*>\\s*<img\\b[^>]*\\s(?:src|href)=["']${escaped}["'][^>]*>\\s*</figure>`, "gi"), "")
      .replace(new RegExp(`<img\\b[^>]*\\s(?:src|href)=["']${escaped}["'][^>]*>`, "gi"), "");
    html = html.replace(new RegExp(`<a\\b[^>]*\\shref=["']${escaped}["'][^>]*>\\s*</a>`, "gi"), "");
  }

  html = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, "")
    .replace(/\s(?:srcset|sizes)=["'][^"']*["']/gi, "")
    .replace(/\s(?:class|style|data-[a-z0-9_-]+|aria-label|role|tabindex)=["'][^"']*["']/gi, "")
    .replace(/\sloading=["'][^"']*["']/gi, ' loading="lazy"')
    .replace(/\sdecoding=["'][^"']*["']/gi, ' decoding="async"')
    .replace(/<br\s*\/?>/gi, "<br />")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const headingIds = new Set();
  const toc = [];

  html = html.replace(/<h([2-3])([^>]*)>([\s\S]*?)<\/h\1>/gi, (full, level, attrs, inner) => {
    const title = cleanText(inner);
    if (!title) return full;

    const existingId = attrs.match(/\sid=["']([^"']+)["']/i)?.[1];
    const baseId = existingId || slugify(title);
    let id = baseId;
    let index = 2;

    while (headingIds.has(id)) {
      id = `${baseId}-${index}`;
      index += 1;
    }

    headingIds.add(id);
    toc.push({ id, title });

    const cleanedAttrs = attrs.replace(/\sid=["'][^"']+["']/i, "").trim();
    const attrSuffix = cleanedAttrs ? ` ${cleanedAttrs}` : "";
    return `<h${level} id="${id}"${attrSuffix}>${inner}</h${level}>`;
  });

  const wordCount = cleanText(html).split(/\s+/).filter(Boolean).length;

  return {
    html,
    toc,
    imageCount: replacements.size,
    missingImages,
    wordCount,
  };
}

async function loadPostsForTopic(topic, baseUrl) {
  const posts = await fetchJson(
    `${baseUrl}/wp-json/wp/v2/posts?per_page=100&_fields=slug,link,content,featured_media`,
  );
  return new Map(posts.map((post) => [post.slug, post]));
}

async function loadFeaturedImage(topic, sourceSlug, post, baseUrl, cache) {
  if (!post.featured_media) return undefined;

  const media = await fetchJson(`${baseUrl}/wp-json/wp/v2/media/${post.featured_media}?_fields=source_url,alt_text`);
  if (!media?.source_url) return undefined;

  const usedNames = new Set();
  const src = await downloadAsset(media.source_url, topic, sourceSlug, usedNames, cache);
  if (!src) return undefined;

  return {
    src,
    alt: cleanText(media.alt_text || ""),
  };
}

function asTsString(value) {
  return JSON.stringify(value);
}

async function main() {
  await mkdir(migratedAssetDir, { recursive: true });

  const postsByTopic = {};
  for (const [topic, baseUrl] of Object.entries(topicSites)) {
    postsByTopic[topic] = await loadPostsForTopic(topic, baseUrl);
  }

  const contentEntries = [];
  const cache = new Map();

  for (const entry of wikiEntries) {
    const baseUrl = topicSites[entry.topic];
    if (!baseUrl) continue;

    const sourceSlug = sourceSlugFor(entry);
    const post = postsByTopic[entry.topic].get(sourceSlug);

    if (!post) {
      throw new Error(`No WordPress post found for ${entry.topic}/${sourceSlug} (${entry.slug})`);
    }

    const transformed = await transformHtml(post.content.rendered, entry.topic, sourceSlug, cache);
    const featuredImage = await loadFeaturedImage(entry.topic, sourceSlug, post, baseUrl, cache);

    contentEntries.push({
      slug: entry.slug,
      sourceUrl: post.link,
      sourceSlug,
      ...transformed,
      featuredImage,
    });
  }

  const lines = [
    "export interface MigratedArticleContent {",
    "  sourceUrl: string;",
    "  sourceSlug: string;",
    "  html: string;",
    "  toc: { id: string; title: string }[];",
    "  imageCount: number;",
    "  missingImages: string[];",
    "  wordCount: number;",
    "  featuredImage?: { src: string; alt: string };",
    "}",
    "",
    "export const migratedArticleContent: Record<string, MigratedArticleContent> = {",
  ];

  for (const entry of contentEntries) {
    lines.push(`  ${asTsString(entry.slug)}: {`);
    lines.push(`    sourceUrl: ${asTsString(entry.sourceUrl)},`);
    lines.push(`    sourceSlug: ${asTsString(entry.sourceSlug)},`);
    lines.push(`    html: ${asTsString(entry.html)},`);
    lines.push(`    toc: ${JSON.stringify(entry.toc)},`);
    lines.push(`    imageCount: ${entry.imageCount},`);
    lines.push(`    missingImages: ${JSON.stringify(entry.missingImages)},`);
    lines.push(`    wordCount: ${entry.wordCount},`);
    if (entry.featuredImage) {
      lines.push(`    featuredImage: ${JSON.stringify(entry.featuredImage)},`);
    }
    lines.push("  },");
  }

  lines.push("};", "");

  await writeFile(outputPath, lines.join("\n"), "utf8");

  const totalImages = contentEntries.reduce((sum, entry) => sum + entry.imageCount + (entry.featuredImage ? 1 : 0), 0);
  console.log(`Wrote ${contentEntries.length} migrated article bodies to ${outputPath}`);
  console.log(`Downloaded/referenced ${totalImages} local article images`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
