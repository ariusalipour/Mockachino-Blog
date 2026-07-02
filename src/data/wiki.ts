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
  homeStats?: {
    categories: number;
    articles: number;
    guides: number;
  };
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

export interface ArticleMetricCard {
  icon: string;
  title: string;
  body: string;
}

export interface ArticleComparisonRow {
  model: string;
  bestUsedFor: string;
  speedRange: string;
  notes: string;
}

export interface ArticleResource {
  title: string;
  meta: string;
  type: string;
}

export interface ArticleSection {
  id: string;
  number: string;
  title: string;
  paragraphs: string[];
  takeaway?: string;
  comparisonRows?: ArticleComparisonRow[];
  metricCards?: ArticleMetricCard[];
}

export interface ArticleView {
  articleId: string;
  readMinutes: number;
  version: string;
  difficulty: number;
  heroAsset: string;
  schematicAsset: string;
  schematicLabel: string;
  schematicRef: string;
  toc: string[];
  sections: ArticleSection[];
  resources: ArticleResource[];
}

export const topics: Topic[] = [
  {
    id: "shoots",
    name: "MOCKA SHOOTS",
    shortName: "Shoots",
    strapline: "Everything about firearms, shooting sports, gear, training and competition.",
    description: "Everything about firearms, shooting sports, gear, training and competition.",
    accent: "#f5c542",
    icon: "target",
    homeStats: {
      categories: 6,
      articles: 127,
      guides: 24,
    },
    categories: [
      {
        id: "firearms",
        name: "Firearms",
        description: "Firearm overviews, breakdowns, and beginner references.",
      },
      {
        id: "shooting-sports",
        name: "Shooting Sports",
        description: "Competitive formats, scoring systems, and match primers.",
      },
      {
        id: "gear-equipment",
        name: "Gear & Equipment",
        description: "Optics, accessories, and range gear recommendations.",
      },
      {
        id: "training-skills",
        name: "Training & Skills",
        description: "Practice routines, drills, and repeatable fundamentals.",
      },
      {
        id: "competitions",
        name: "Competitions",
        description: "Event prep, divisions, and match-day tactics.",
      },
      {
        id: "safety-law",
        name: "Safety & Law",
        description: "Foundational safety principles and compliance notes.",
      },
    ],
  },
  {
    id: "plays",
    name: "MOCKA PLAYS",
    shortName: "Plays",
    strapline: "Game guides, reviews, walkthroughs and everything in between.",
    description: "Game guides, reviews, walkthroughs and everything in between.",
    accent: "#9cd45a",
    icon: "controller",
    homeStats: {
      categories: 5,
      articles: 89,
      guides: 16,
    },
    categories: [
      {
        id: "video-games",
        name: "Video Games",
        description: "General game notes, rankings, and recommendations.",
      },
      {
        id: "game-guides",
        name: "Game Guides",
        description: "Walkthroughs, route notes, and mission help.",
      },
      {
        id: "reviews",
        name: "Reviews",
        description: "Practical reviews covering feel, depth, and value.",
      },
      {
        id: "hardware",
        name: "Hardware",
        description: "PC parts, handhelds, displays, and peripherals.",
      },
      {
        id: "entertainment",
        name: "Entertainment",
        description: "Broader culture, adaptation, and franchise notes.",
      },
    ],
  },
  {
    id: "codes",
    name: "MOCKA CODES",
    shortName: "Codes",
    strapline: "Development tutorials, technical notes, tools and engineering insights.",
    description: "Development tutorials, technical notes, tools and engineering insights.",
    accent: "#5f87ff",
    icon: "chip",
    homeStats: {
      categories: 6,
      articles: 143,
      guides: 32,
    },
    categories: [
      {
        id: "development",
        name: "Development",
        description: "Framework setup, patterns, and implementation notes.",
      },
      {
        id: "tech-guides",
        name: "Tech Guides",
        description: "How-tos for infrastructure, runtimes, and workflows.",
      },
      {
        id: "tools-devops",
        name: "Tools & DevOps",
        description: "Toolchains, automation, and deployment notes.",
      },
      {
        id: "programming",
        name: "Programming",
        description: "Language references, snippets, and applied patterns.",
      },
      {
        id: "ai-automation",
        name: "AI & Automation",
        description: "Agent tooling, prompts, and workflow augmentation.",
      },
    ],
  },
];

export const wikiEntries: WikiEntry[] = [
  {
    slug: "understanding-ballistic-coefficients",
    title: "Understanding Ballistic Coefficients",
    summary: "An introduction to ballistic coefficient, drag models, and what the number actually helps you predict.",
    kind: "article",
    topic: "shoots",
    category: "training-skills",
    createdAt: "2026-06-14T09:00:00.000Z",
    updatedAt: "2026-07-01T22:20:00.000Z",
    popularity: 118,
    tags: ["ballistics", "training", "fundamentals"],
  },
  {
    slug: "beginners-guide-to-ipsc",
    title: "Beginner's Guide to IPSC",
    summary: "A concise starting point for divisions, scoring, safety flow, and what to expect at your first IPSC match.",
    kind: "guide",
    topic: "shoots",
    category: "shooting-sports",
    createdAt: "2026-06-20T15:20:00.000Z",
    updatedAt: "2026-07-01T19:20:00.000Z",
    popularity: 121,
    tags: ["ipsc", "competition", "guide"],
  },
  {
    slug: "elden-ring-shadow-of-the-erdtree-walkthrough",
    title: "Elden Ring: Shadow of the Erdtree Walkthrough",
    summary: "A route-focused walkthrough for key progression beats, boss order, and high-value pickups.",
    kind: "guide",
    topic: "plays",
    category: "game-guides",
    createdAt: "2026-06-12T21:45:00.000Z",
    updatedAt: "2026-07-01T16:20:00.000Z",
    popularity: 132,
    tags: ["elden-ring", "walkthrough", "guide"],
  },
  {
    slug: "setting-up-a-next-js-project",
    title: "Setting Up a Next.js Project",
    summary: "A practical setup flow for routing, linting, layout structure, and production-minded defaults.",
    kind: "article",
    topic: "codes",
    category: "development",
    createdAt: "2026-06-09T10:00:00.000Z",
    updatedAt: "2026-06-30T23:20:00.000Z",
    popularity: 115,
    tags: ["nextjs", "setup", "development"],
  },
  {
    slug: "starfield-review-the-good-the-bad-the-void",
    title: "Starfield Review - The Good, The Bad & The Void",
    summary: "A long-form review of pacing, discovery, combat friction, and where the game lands after the honeymoon.",
    kind: "review",
    topic: "plays",
    category: "reviews",
    createdAt: "2026-06-04T17:00:00.000Z",
    updatedAt: "2026-06-30T20:20:00.000Z",
    popularity: 112,
    tags: ["starfield", "review", "rpg"],
  },
  {
    slug: "ar-15-complete-beginner-guide",
    title: "AR-15 Complete Beginner Guide",
    summary: "A practical beginner overview of parts, terminology, setup choices, and what actually matters first.",
    kind: "guide",
    topic: "shoots",
    category: "firearms",
    createdAt: "2026-05-05T08:30:00.000Z",
    updatedAt: "2026-06-24T16:15:00.000Z",
    popularity: 155,
    tags: ["ar-15", "beginner", "guide"],
  },
  {
    slug: "how-red-dot-sights-work",
    title: "How Red Dot Sights Work",
    summary: "A plain-English explanation of emitter systems, dot size, parallax, and zeroing expectations.",
    kind: "article",
    topic: "shoots",
    category: "gear-equipment",
    createdAt: "2026-05-11T12:00:00.000Z",
    updatedAt: "2026-06-21T09:50:00.000Z",
    popularity: 149,
    tags: ["optics", "red-dot", "gear"],
  },
  {
    slug: "best-pc-settings-for-tarkov",
    title: "Best PC Settings for Tarkov",
    summary: "Performance-minded graphics and input settings that improve clarity without gutting frame time.",
    kind: "guide",
    topic: "plays",
    category: "video-games",
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-30T18:30:00.000Z",
    popularity: 143,
    tags: ["tarkov", "settings", "pc"],
  },
  {
    slug: "python-cheatsheet",
    title: "Python Cheatsheet",
    summary: "A compact reference covering syntax, common data operations, and standard library essentials.",
    kind: "article",
    topic: "codes",
    category: "programming",
    createdAt: "2026-06-20T08:00:00.000Z",
    updatedAt: "2026-06-27T11:45:00.000Z",
    popularity: 138,
    tags: ["python", "reference", "programming"],
  },
  {
    slug: "firearm-safety-fundamentals",
    title: "Firearm Safety Fundamentals",
    summary: "The core safety rules, range etiquette, and handling patterns that should be automatic before anything else.",
    kind: "guide",
    topic: "shoots",
    category: "safety-law",
    createdAt: "2026-05-30T14:00:00.000Z",
    updatedAt: "2026-06-23T13:10:00.000Z",
    popularity: 134,
    tags: ["safety", "fundamentals", "guide"],
  },
  {
    slug: "monster-hunter-wilds-review-in-progress",
    title: "Monster Hunter Wilds Review In Progress",
    summary: "Early impressions on combat pace, weapon identity, and how the loop feels before release settles.",
    kind: "review",
    topic: "plays",
    category: "reviews",
    createdAt: "2026-04-18T11:00:00.000Z",
    updatedAt: "2026-06-29T09:00:00.000Z",
    popularity: 111,
    tags: ["monster-hunter", "review", "co-op"],
  },
  {
    slug: "terminal-audit-checklist-for-small-sites",
    title: "Terminal Audit Checklist for Small Sites",
    summary: "A pragmatic command-line checklist for content freshness, deploy readiness, and static site hygiene.",
    kind: "guide",
    topic: "codes",
    category: "tools-devops",
    createdAt: "2026-06-08T07:45:00.000Z",
    updatedAt: "2026-06-30T06:10:00.000Z",
    popularity: 109,
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
  { href: "/about/", label: "Help", icon: "help" },
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

function topicHeroAsset(topicId: TopicId) {
  if (topicId === "shoots") return "/brand/topic-shoots-panel.png";
  if (topicId === "plays") return "/brand/topic-plays-panel.png";
  return "/brand/topic-codes-panel.png";
}

function topicSchematicAsset(topicId: TopicId) {
  if (topicId === "shoots") return "/brand/article-ballistics-schematic.svg";
  if (topicId === "plays") return "/brand/mockachino-blueprint.svg";
  return "/brand/mockachino-hero.svg";
}

function defaultResources(entry: WikiEntry): ArticleResource[] {
  if (entry.topic === "shoots") {
    return [
      { title: "Range Note Checklist", meta: "FIELD REFERENCE", type: "REFERENCE" },
      { title: "Zeroing Worksheet", meta: "PRINTABLE", type: "GUIDE" },
      { title: "Applied Ballistics Library", meta: "EXTERNAL TOOL", type: "TOOL" },
    ];
  }

  if (entry.topic === "plays") {
    return [
      { title: "Build Comparison Sheet", meta: "SESSION NOTE", type: "REFERENCE" },
      { title: "Route Planner", meta: "WORKFLOW TOOL", type: "TOOL" },
      { title: "Patch Notes Archive", meta: "EXTERNAL SOURCE", type: "REFERENCE" },
    ];
  }

  return [
    { title: "Implementation Checklist", meta: "PROJECT NOTE", type: "REFERENCE" },
    { title: "Command Reference", meta: "UTILITY SHEET", type: "GUIDE" },
    { title: "Official Docs", meta: "EXTERNAL SOURCE", type: "REFERENCE" },
  ];
}

const specialArticleViews: Record<string, ArticleView> = {
  "understanding-ballistic-coefficients": {
    articleId: "SHO-TRN-023",
    readMinutes: 8,
    version: "1.0",
    difficulty: 3,
    heroAsset: "/brand/article-ballistics-hero.svg",
    schematicAsset: "/brand/article-ballistics-schematic.svg",
    schematicLabel: "CALIBER: 6.5MM",
    schematicRef: "REF-DWG-023",
    toc: [
      "What is Ballistic Coefficient?",
      "BC Models: G1 vs G7",
      "How BC Affects Performance",
      "Interpreting BC Values",
      "Practical Applications",
      "Final Thoughts",
    ],
    sections: [
      {
        id: "what-is-ballistic-coefficient",
        number: "01",
        title: "What Is Ballistic Coefficient?",
        paragraphs: [
          "Ballistic Coefficient (BC) is a measure of a bullet's ability to overcome air resistance. A higher BC means the bullet retains velocity and energy better, drifts less in the wind and drops less over distance.",
          "BC is a dimensionless number that relates the bullet's mass, diameter, form factor and drag. While it might sound complex, understanding BC is essential for long range accuracy.",
        ],
        takeaway: "The higher the BC, the better the bullet cuts through the air.",
      },
      {
        id: "bc-models-g1-vs-g7",
        number: "02",
        title: "BC Models: G1 vs G7",
        paragraphs: [
          "There are multiple drag models, but the two most common are G1 and G7. They represent how the bullet interacts with the air at different speeds.",
          "Most manufacturers now provide G7 BC as it better represents modern bullet designs.",
        ],
        comparisonRows: [
          {
            model: "G1",
            bestUsedFor: "Standard bullets",
            speedRange: "Subsonic to ~1,200 FPS",
            notes: "Older model, less accurate for modern bullets",
          },
          {
            model: "G7",
            bestUsedFor: "Modern, long range projectiles",
            speedRange: "~1,200 FPS and above",
            notes: "More accurate for sleek, high BC bullets",
          },
        ],
      },
      {
        id: "how-bc-affects-performance",
        number: "03",
        title: "How BC Affects Performance",
        paragraphs: [
          "Understanding BC helps you make smarter decisions about bullet selection, zeroing and long range performance.",
        ],
        metricCards: [
          {
            icon: "pulse",
            title: "Velocity Retention",
            body: "Higher BC retains velocity downrange.",
          },
          {
            icon: "shuffle",
            title: "Wind Drift",
            body: "Higher BC means less wind deflection.",
          },
          {
            icon: "arrow",
            title: "Trajectory",
            body: "Higher BC results in a flatter trajectory.",
          },
          {
            icon: "target",
            title: "Energy On Target",
            body: "More energy retained at distance.",
          },
        ],
      },
    ],
    resources: [
      { title: "G1 vs G7 Drag Models", meta: "PDF GUIDE", type: "GUIDE" },
      { title: "Ballistics Calculator", meta: "EXTERNAL TOOL", type: "TOOL" },
      { title: "Applied Ballistics Library", meta: "REFERENCE", type: "REFERENCE" },
    ],
  },
};

export function getArticleView(entry: WikiEntry): ArticleView {
  const special = specialArticleViews[entry.slug];
  if (special) return special;

  const topic = getTopic(entry.topic);
  const category = getCategory(entry.topic, entry.category);

  return {
    articleId: `${entry.topic.toUpperCase().slice(0, 3)}-${entry.category.slice(0, 3).toUpperCase()}-${entry.slug.slice(0, 3).toUpperCase()}`,
    readMinutes: entry.kind === "guide" ? 7 : entry.kind === "review" ? 9 : 6,
    version: "1.0",
    difficulty: entry.kind === "guide" ? 3 : entry.kind === "review" ? 2 : 2,
    heroAsset: topicHeroAsset(entry.topic),
    schematicAsset: topicSchematicAsset(entry.topic),
    schematicLabel: category ? `${category.name.toUpperCase()}` : "REFERENCE PANEL",
    schematicRef: `REF-${entry.topic.toUpperCase()}-${entry.slug.slice(0, 3).toUpperCase()}`,
    toc: ["Overview", "Core Notes", "Practical Use", "Related Context"],
    sections: [
      {
        id: "overview",
        number: "01",
        title: "Overview",
        paragraphs: [
          entry.summary,
          `${entry.title} sits inside ${topic?.name ?? entry.topic} under ${category?.name ?? entry.category}. This page is written as a technical field note: concise, reusable and cross-linked to the rest of the wiki.`,
        ],
        takeaway: `Primary focus: ${entry.kind === "review" ? "evaluation" : entry.kind === "guide" ? "repeatable process" : "documented context"}.`,
      },
      {
        id: "core-notes",
        number: "02",
        title: "Core Notes",
        paragraphs: [
          `The main benefit of this note is that it compresses the important tradeoffs into one place instead of scattering them across setup steps, trial-and-error, and memory.`,
          `Use the topic, category and tags as the routing system for adjacent pages when you need deeper supporting detail.`,
        ],
      },
      {
        id: "practical-use",
        number: "03",
        title: "Practical Use",
        paragraphs: [
          `Treat this page as an operational reference: pull the key idea, apply it in context, then move to the related articles for implementation or comparison.`,
        ],
        metricCards: [
          { icon: "pulse", title: "Signal", body: "Condenses the high-value takeaway fast." },
          { icon: "book", title: "Context", body: "Keeps topic and category links close at hand." },
          { icon: "tag", title: "Tags", body: "Surfaces adjacent notes and shared patterns." },
          { icon: "target", title: "Use Case", body: "Optimized for fast lookup, not long-form prose." },
        ],
      },
    ],
    resources: defaultResources(entry),
  };
}
