export type TopicId = "shoots" | "plays" | "codes";
export type EntryKind = "review" | "article" | "guide";

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Topic {
  id: TopicId;
  name: string;
  shortName: string;
  strapline: string;
  description: string;
  accent: string;
  icon: string;
  categories: Category[];
}

export interface WikiEntry {
  slug: string;
  title: string;
  summary: string;
  kind: EntryKind;
  topic: TopicId;
  category: string;
  createdAt: string;
  updatedAt: string;
  popularity: number;
  tags: string[];
}

export const topics: Topic[] = [
  {
    id: "shoots",
    name: "MOCKA SHOOTS",
    shortName: "Shoots",
    strapline: "Camera, lens, and fieldcraft notes.",
    description:
      "Reviews, setup sheets, and shooting guides focused on image quality, ergonomics, and repeatable field workflows.",
    accent: "#f5c542",
    icon: "target",
    categories: [
      {
        id: "camera-reviews",
        name: "Camera Reviews",
        description: "Body reviews, benchmark notes, and setup observations.",
      },
      {
        id: "lens-guides",
        name: "Lens Guides",
        description: "Focal length choices, character notes, and pairings.",
      },
      {
        id: "field-notes",
        name: "Field Notes",
        description: "Practical lessons from travel, events, and street sessions.",
      },
    ],
  },
  {
    id: "plays",
    name: "MOCKA PLAYS",
    shortName: "Plays",
    strapline: "Reviews, tactics, and hardware diaries.",
    description:
      "Game impressions, build notes, and practical strategy guides for sessions worth documenting.",
    accent: "#9dc56f",
    icon: "controller",
    categories: [
      {
        id: "game-reviews",
        name: "Game Reviews",
        description: "Focused write-ups on feel, systems, and longevity.",
      },
      {
        id: "strategy-guides",
        name: "Strategy Guides",
        description: "Mission plans, loadouts, routes, and encounter notes.",
      },
      {
        id: "hardware-diaries",
        name: "Hardware Diaries",
        description: "Peripherals, handhelds, and desk setup experiments.",
      },
    ],
  },
  {
    id: "codes",
    name: "MOCKA CODES",
    shortName: "Codes",
    strapline: "Build logs, snippets, and tooling guides.",
    description:
      "Engineering notes for small systems, site tooling, and pragmatic implementation details.",
    accent: "#7cc0ff",
    icon: "chip",
    categories: [
      {
        id: "build-logs",
        name: "Build Logs",
        description: "Architecture notes, retrospectives, and project diaries.",
      },
      {
        id: "snippets",
        name: "Snippets",
        description: "Focused patterns, utilities, and quick references.",
      },
      {
        id: "tooling-guides",
        name: "Tooling Guides",
        description: "Dev environment setup and workflow automation notes.",
      },
    ],
  },
];

export const wikiEntries: WikiEntry[] = [
  {
    slug: "sony-a6700-two-week-review",
    title: "Sony A6700 Two Week Review",
    summary: "A practical review of autofocus, battery life, and travel handling after daily use.",
    kind: "review",
    topic: "shoots",
    category: "camera-reviews",
    createdAt: "2026-06-10T09:00:00.000Z",
    updatedAt: "2026-06-28T19:10:00.000Z",
    popularity: 94,
    tags: ["sony", "aps-c", "travel"],
  },
  {
    slug: "building-a-three-lens-travel-kit",
    title: "Building a Three Lens Travel Kit",
    summary: "How to balance weight, focal range, and lens character for a compact city kit.",
    kind: "guide",
    topic: "shoots",
    category: "lens-guides",
    createdAt: "2026-05-21T15:20:00.000Z",
    updatedAt: "2026-06-23T12:30:00.000Z",
    popularity: 81,
    tags: ["travel", "kit", "lenses"],
  },
  {
    slug: "rainy-night-street-photo-notes",
    title: "Rainy Night Street Photo Notes",
    summary: "Exposure choices, shutter limits, and white balance notes from a wet city walk.",
    kind: "article",
    topic: "shoots",
    category: "field-notes",
    createdAt: "2026-06-14T21:45:00.000Z",
    updatedAt: "2026-06-30T07:40:00.000Z",
    popularity: 66,
    tags: ["street", "night", "field-notes"],
  },
  {
    slug: "monster-hunter-wilds-review-in-progress",
    title: "Monster Hunter Wilds Review In Progress",
    summary: "Early impressions covering pacing, weapon feel, and co-op friction.",
    kind: "review",
    topic: "plays",
    category: "game-reviews",
    createdAt: "2026-06-04T17:00:00.000Z",
    updatedAt: "2026-06-29T22:00:00.000Z",
    popularity: 107,
    tags: ["monster-hunter", "co-op", "review"],
  },
  {
    slug: "elden-ring-bow-only-route",
    title: "Elden Ring Bow Only Route",
    summary: "A route plan for early progression, arrow economy, and high-value pickups.",
    kind: "guide",
    topic: "plays",
    category: "strategy-guides",
    createdAt: "2026-05-05T08:30:00.000Z",
    updatedAt: "2026-06-18T16:15:00.000Z",
    popularity: 121,
    tags: ["elden-ring", "build", "route"],
  },
  {
    slug: "handheld-desk-dock-setup-log",
    title: "Handheld Desk Dock Setup Log",
    summary: "Docking, controller latency, and audio switching notes for a compact gaming desk.",
    kind: "article",
    topic: "plays",
    category: "hardware-diaries",
    createdAt: "2026-06-01T12:00:00.000Z",
    updatedAt: "2026-06-25T09:50:00.000Z",
    popularity: 58,
    tags: ["hardware", "desk-setup", "handheld"],
  },
  {
    slug: "astro-wiki-architecture-notes",
    title: "Astro Wiki Architecture Notes",
    summary: "The content model, route map, and styling decisions behind the current site structure.",
    kind: "article",
    topic: "codes",
    category: "build-logs",
    createdAt: "2026-06-27T10:00:00.000Z",
    updatedAt: "2026-07-01T18:30:00.000Z",
    popularity: 76,
    tags: ["astro", "architecture", "wiki"],
  },
  {
    slug: "copy-button-component-pattern",
    title: "Copy Button Component Pattern",
    summary: "A small accessible pattern for code copy actions with status feedback and no library overhead.",
    kind: "article",
    topic: "codes",
    category: "snippets",
    createdAt: "2026-06-20T08:00:00.000Z",
    updatedAt: "2026-06-26T11:45:00.000Z",
    popularity: 63,
    tags: ["ui", "snippet", "accessibility"],
  },
  {
    slug: "speeding-up-local-preview-builds",
    title: "Speeding Up Local Preview Builds",
    summary: "Build cache habits, image handling, and route design choices that keep Astro feedback loops short.",
    kind: "guide",
    topic: "codes",
    category: "tooling-guides",
    createdAt: "2026-05-30T14:00:00.000Z",
    updatedAt: "2026-06-24T13:10:00.000Z",
    popularity: 87,
    tags: ["astro", "tooling", "performance"],
  },
  {
    slug: "prime-lens-character-sheet",
    title: "Prime Lens Character Sheet",
    summary: "A compact comparison method for contrast, flare, focus feel, and minimum distance.",
    kind: "guide",
    topic: "shoots",
    category: "lens-guides",
    createdAt: "2026-04-18T11:00:00.000Z",
    updatedAt: "2026-06-17T09:00:00.000Z",
    popularity: 72,
    tags: ["lenses", "comparison", "guide"],
  },
  {
    slug: "roguelike-session-review-format",
    title: "Roguelike Session Review Format",
    summary: "A repeatable template for documenting systems, run friction, and why a game keeps you playing.",
    kind: "article",
    topic: "plays",
    category: "game-reviews",
    createdAt: "2026-04-11T10:15:00.000Z",
    updatedAt: "2026-06-22T18:00:00.000Z",
    popularity: 54,
    tags: ["roguelike", "review", "template"],
  },
  {
    slug: "terminal-audit-checklist-for-small-sites",
    title: "Terminal Audit Checklist For Small Sites",
    summary: "A practical command-line checklist for checking content freshness, broken links, and deploy readiness.",
    kind: "guide",
    topic: "codes",
    category: "tooling-guides",
    createdAt: "2026-06-08T07:45:00.000Z",
    updatedAt: "2026-06-30T06:10:00.000Z",
    popularity: 69,
    tags: ["terminal", "workflow", "audit"],
  },
];

export const primaryNav = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/browse/", label: "Browse All", icon: "grid" },
  { href: "/recent/", label: "Recent Changes", icon: "pulse" },
  { href: "/random/", label: "Random Page", icon: "shuffle" },
  { href: "/glossary/", label: "Glossary", icon: "book" },
  { href: "/tags/", label: "Tags", icon: "tag" },
] as const;

export const headerNav = [
  { href: "/", label: "Home" },
  { href: "/browse/", label: "Browse" },
  { href: "/recent/", label: "Recent" },
  { href: "/about/", label: "About" },
] as const;

export const glossaryTerms = [
  {
    term: "Field Notes",
    definition: "Short operational observations captured during real-world use rather than controlled tests.",
  },
  {
    term: "Loadout",
    definition: "The selected gear, items, or build components used for a game session or challenge route.",
  },
  {
    term: "Build Log",
    definition: "A running implementation record that captures decisions, tradeoffs, and revisions over time.",
  },
  {
    term: "Character Sheet",
    definition: "A compact comparison reference that reduces a product or setup into consistent evaluation traits.",
  },
  {
    term: "Operational",
    definition: "The system state used when site content, routing, and deploy metadata are all healthy.",
  },
];

export function getTopic(topicId: TopicId) {
  return topics.find((topic) => topic.id === topicId);
}

export function getCategory(topicId: TopicId, categoryId: string) {
  return getTopic(topicId)?.categories.find((category) => category.id === categoryId);
}

export function getEntry(slug: string) {
  return wikiEntries.find((entry) => entry.slug === slug);
}

export function getEntriesByTopic(topicId: TopicId) {
  return wikiEntries.filter((entry) => entry.topic === topicId);
}

export function getEntriesByCategory(topicId: TopicId, categoryId: string) {
  return wikiEntries.filter((entry) => entry.topic === topicId && entry.category === categoryId);
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
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getRelatedEntries(entry: WikiEntry, limit = 3) {
  return wikiEntries
    .filter((candidate) => candidate.slug !== entry.slug)
    .map((candidate) => {
      const tagMatches = candidate.tags.filter((tag) => entry.tags.includes(tag)).length;
      const topicMatch = candidate.topic === entry.topic ? 1 : 0;
      const categoryMatch = candidate.category === entry.category ? 1 : 0;

      return {
        candidate,
        score: tagMatches * 3 + topicMatch * 2 + categoryMatch,
      };
    })
    .sort((left, right) => right.score - left.score || right.candidate.popularity - left.candidate.popularity)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

export function formatTopicLabel(topicId: TopicId) {
  return getTopic(topicId)?.name ?? topicId;
}

export function formatCategoryLabel(topicId: TopicId, categoryId: string) {
  return getCategory(topicId, categoryId)?.name ?? categoryId;
}

export function getEntryNarrative(entry: WikiEntry) {
  const topic = getTopic(entry.topic);
  const category = getCategory(entry.topic, entry.category);

  return [
    `${entry.title} sits inside ${topic?.name ?? entry.topic} under ${category?.name ?? entry.category}. This page captures the practical decisions, tradeoffs, and reference points that make the note reusable instead of disposable.`,
    `The focus here is ${entry.kind === "review" ? "evaluation" : entry.kind === "guide" ? "repeatable process" : "documented context"}. The summary is deliberately compact so the page reads like an operational briefing, with tags and related pages acting as the cross-reference system for the wider wiki.`,
  ];
}
