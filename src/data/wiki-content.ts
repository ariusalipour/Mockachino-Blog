import { getCollection, type CollectionEntry } from "astro:content";
import type { Category, CategoryId, EntryKind, Topic, TopicId, WikiEntry } from "./wiki";

export type { Category, CategoryId, EntryKind, Topic, TopicId, WikiEntry } from "./wiki";

export interface TagEntry {
  slug: string;
  label: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

type TopicContentEntry = CollectionEntry<"topics">;
type CategoryContentEntry = CollectionEntry<"categories">;
type WikiContentEntry = CollectionEntry<"wiki">;
type TagContentEntry = CollectionEntry<"tags">;
type GlossaryContentEntry = CollectionEntry<"glossary">;

function canonicalSlug(entry: WikiContentEntry) {
  return entry.data.slug ?? entry.slug;
}

function normalizeTopicEntry(entry: TopicContentEntry): Topic {
  return {
    id: entry.slug as TopicId,
    name: entry.data.name,
    shortName: entry.data.shortName,
    strapline: entry.data.strapline,
    description: entry.body?.trim() ?? "",
    accent: entry.data.accent,
    icon: entry.data.icon,
    homeStats: entry.data.homeStats,
    categories: [],
  };
}

function normalizeCategoryEntry(entry: CategoryContentEntry) {
  return {
    id: entry.slug.includes("-") ? entry.slug.slice(entry.slug.indexOf("-") + 1) : entry.slug,
    topic: entry.data.topic as TopicId,
    name: entry.data.name,
    description: entry.data.description,
  } satisfies Category & { topic: TopicId };
}

function normalizeWikiEntry(entry: WikiContentEntry): WikiEntry {
  return {
    slug: canonicalSlug(entry),
    title: entry.data.title,
    summary: entry.data.summary,
    kind: entry.data.kind,
    topic: entry.data.topic,
    category: entry.data.category as CategoryId,
    createdAt: entry.data.createdAt.toISOString(),
    updatedAt: entry.data.updatedAt.toISOString(),
    tags: [...entry.data.tags],
  };
}

function normalizeTagEntry(entry: TagContentEntry): TagEntry {
  return {
    slug: entry.slug,
    label: entry.data.label,
  };
}

function normalizeGlossaryEntry(entry: GlossaryContentEntry): GlossaryTerm {
  return {
    term: entry.data.term,
    definition: entry.data.definition,
  };
}

const [topicContentEntries, categoryContentEntries, wikiContentEntries, tagContentEntries, glossaryContentEntries] = await Promise.all([
  getCollection("topics"),
  getCollection("categories"),
  getCollection("wiki"),
  getCollection("tags"),
  getCollection("glossary"),
]);

const sortedTopicEntries = topicContentEntries.slice().sort((left, right) => left.slug.localeCompare(right.slug));
const sortedCategoryEntries = categoryContentEntries.slice().sort((left, right) => left.slug.localeCompare(right.slug));
const sortedWikiEntries = wikiContentEntries.slice().sort((left, right) => {
  const updatedDiff = right.data.updatedAt.getTime() - left.data.updatedAt.getTime();
  if (updatedDiff !== 0) return updatedDiff;
  return canonicalSlug(left).localeCompare(canonicalSlug(right));
});
const sortedTagEntries = tagContentEntries.slice().sort((left, right) => left.slug.localeCompare(right.slug));
const sortedGlossaryEntries = glossaryContentEntries.slice().sort((left, right) => left.slug.localeCompare(right.slug));

const topicById = new Map<TopicId, Topic>(sortedTopicEntries.map((entry) => [entry.slug as TopicId, normalizeTopicEntry(entry)]));
const categoryEntries = sortedCategoryEntries.map(normalizeCategoryEntry);
const categoryLookup = new Map<string, { topic: TopicId; name: string; description: string }>(
  categoryEntries.map((entry) => [`${entry.topic}:${entry.id}`, entry]),
);
const wikiEntryBySlug = new Map<string, WikiContentEntry>(sortedWikiEntries.map((entry) => [canonicalSlug(entry), entry]));
const tagBySlug = new Map<string, TagEntry>(sortedTagEntries.map((entry) => [entry.slug, normalizeTagEntry(entry)]));

export const topics: Topic[] = sortedTopicEntries.map(normalizeTopicEntry).map((topic) => ({
  ...topic,
  categories: categoryEntries
    .filter((category) => category.topic === topic.id)
    .map(({ topic: _topic, ...category }) => category),
}));

export const categories: Record<TopicId, Category[]> = {
  shoots: topics.find((topic) => topic.id === "shoots")?.categories ?? [],
  plays: topics.find((topic) => topic.id === "plays")?.categories ?? [],
  codes: topics.find((topic) => topic.id === "codes")?.categories ?? [],
};

export const wikiEntries: WikiEntry[] = sortedWikiEntries.map(normalizeWikiEntry);
export const glossaryTerms: GlossaryTerm[] = sortedGlossaryEntries.map(normalizeGlossaryEntry);
export const tags: TagEntry[] = sortedTagEntries.map(normalizeTagEntry);
export const primaryNav = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/browse/", label: "Browse All", icon: "grid" },
  { href: "/recent/", label: "Recent Changes", icon: "pulse" },
  { href: "/random/", label: "Random Page", icon: "shuffle" },
  { href: "/glossary/", label: "Glossary", icon: "book" },
  { href: "/tags/", label: "Tags", icon: "tag" },
  { href: "/about/", label: "Help", icon: "help" },
] as const;

export const headerNav = [
  { href: "/", label: "Home" },
  { href: "/browse/", label: "Browse" },
  { href: "/recent/", label: "Recent" },
  { href: "/about/", label: "About" },
] as const;

export function getWikiContentEntry(slug: string) {
  return wikiEntryBySlug.get(slug);
}

export function getTopic(topicId: TopicId) {
  return topicById.get(topicId);
}

export function getCategory(topicId: TopicId, categoryId: string) {
  return categoryLookup.get(`${topicId}:${categoryId}`);
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

export function getEntriesByTag(tagSlug: string) {
  return wikiEntries.filter((entry) => entry.tags.some((candidate) => candidate.toLowerCase() === tagSlug.toLowerCase()));
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

export function getTags() {
  const counts = new Map<string, number>();

  for (const entry of wikiEntries) {
    for (const tag of entry.tags) {
      const key = tag.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([slug, count]) => ({
      slug,
      label: tagBySlug.get(slug)?.label ?? slug.replace(/-/g, " "),
      count,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function formatTopicLabel(topicId: TopicId) {
  return getTopic(topicId)?.name ?? topicId;
}

export function formatCategoryLabel(topicId: TopicId, categoryId: string) {
  return getCategory(topicId, categoryId)?.name ?? categoryId;
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
    .sort((left, right) => right.score - left.score || Date.parse(right.candidate.updatedAt) - Date.parse(left.candidate.updatedAt))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
