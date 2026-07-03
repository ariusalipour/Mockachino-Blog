import { getCollection, type CollectionEntry } from "astro:content";
import type { TopicId, WikiEntry } from "./wiki";
export {
  categories,
  glossaryTerms,
  headerNav,
  primaryNav,
  topics,
  getArticleView,
  getCategory,
  getTopic,
  formatCategoryLabel,
  formatTopicLabel,
} from "./wiki";
export type {
  ArticleComparisonRow,
  ArticleMetricCard,
  ArticleResource,
  ArticleSection,
  ArticleView,
  Category,
  CategoryId,
  EntryKind,
  Topic,
  TopicId,
  WikiEntry,
} from "./wiki";

type WikiContentEntry = CollectionEntry<"wiki">;

function canonicalSlug(entry: WikiContentEntry) {
  return entry.data.slug ?? entry.slug;
}

function normalizeWikiEntry(entry: WikiContentEntry): WikiEntry {
  return {
    slug: canonicalSlug(entry),
    title: entry.data.title,
    summary: entry.data.summary,
    kind: entry.data.kind,
    topic: entry.data.topic,
    category: entry.data.category as WikiEntry["category"],
    createdAt: entry.data.createdAt.toISOString(),
    updatedAt: entry.data.updatedAt.toISOString(),
    popularity: entry.data.popularity,
    tags: [...entry.data.tags],
  };
}

const wikiContentEntries = (await getCollection("wiki")).slice().sort((left, right) => {
  const updatedDiff = right.data.updatedAt.getTime() - left.data.updatedAt.getTime();
  if (updatedDiff !== 0) return updatedDiff;
  return canonicalSlug(left).localeCompare(canonicalSlug(right));
});

const wikiContentEntryBySlug = new Map<string, WikiContentEntry>(
  wikiContentEntries.map((entry) => [canonicalSlug(entry), entry]),
);

export const wikiEntries: WikiEntry[] = wikiContentEntries.map(normalizeWikiEntry);

export function getWikiContentEntry(slug: string) {
  return wikiContentEntryBySlug.get(slug);
}

export function getEntry(slug: string) {
  return wikiEntries.find((entry) => entry.slug === slug);
}

export function getEntriesByTopic(topicId: TopicId) {
  return wikiEntries.filter((entry) => entry.topic === topicId);
}

export function getEntriesByCategory(categoryId: string) {
  return wikiEntries.filter((entry) => entry.category === categoryId);
}

export function getEntriesByTag(tagName: string) {
  return wikiEntries.filter((entry) => entry.tags.includes(tagName));
}

export function getTopicStats(topicId: TopicId) {
  const entries = getEntriesByTopic(topicId);

  return {
    reviews: entries.filter((entry) => entry.kind === "review").length,
    articles: entries.filter((entry) => entry.kind === "article").length,
    guides: entries.filter((entry) => entry.kind === "guide").length,
    total: entries.length,
  };
}

export function getRecentEntries(limit = wikiEntries.length) {
  return [...wikiEntries]
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
    .slice(0, limit);
}

export function getPopularEntries(limit = wikiEntries.length) {
  return [...wikiEntries].sort((left, right) => right.popularity - left.popularity).slice(0, limit);
}

export function getTags() {
  const tags = new Map<string, number>();

  for (const entry of wikiEntries) {
    for (const tag of entry.tags) {
      tags.set(tag, (tags.get(tag) ?? 0) + 1);
    }
  }

  return [...tags.entries()]
    .map(([name, count]) => ({ name, count, slug: name.toLowerCase() }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getRelatedEntries(entry: WikiEntry, limit = 5) {
  return wikiEntries
    .filter((candidate) => candidate.slug !== entry.slug && candidate.topic === entry.topic)
    .map((candidate) => {
      const tagMatches = candidate.tags.filter((tag) => entry.tags.includes(tag)).length;
      const categoryMatch = candidate.category === entry.category ? 1 : 0;

      return {
        candidate,
        score: tagMatches * 3 + categoryMatch,
      };
    })
    .sort((left, right) => right.score - left.score || right.candidate.popularity - left.candidate.popularity)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
