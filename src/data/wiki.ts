export type TopicId = "shoots" | "plays" | "codes";
export type EntryKind = "review" | "article" | "guide";
export type ShootsCategoryId = "practical-shooting" | "gear-and-firearms" | "field-notes" | "airsoft-and-tactical" | "law-and-safety";
export type PlaysCategoryId = "tactical-shooters" | "rts-strategy" | "indie-gaming" | "gear-and-hardware" | "software-tools";
export type CodesCategoryId = "career-tips" | "ai-coding" | "software-tools" | "human-programming" | "gear-and-hardware";
export type CategoryId = ShootsCategoryId | PlaysCategoryId | CodesCategoryId;

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
    reviews: number;
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
  category: CategoryId;
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

export const categories: Record<TopicId, Category[]> = {
  shoots: [
    { id: "practical-shooting",   name: "Practical Shooting",  description: "Competition structure, disciplines, events, and getting started in practical shooting." },
    { id: "gear-and-firearms",    name: "Gear and Firearms",   description: "Firearms, optics, and accessories — notes, comparisons, and hands-on impressions." },
    { id: "field-notes",          name: "Field Notes",         description: "Personal updates, reflections, and observations from the shooting world." },
    { id: "airsoft-and-tactical", name: "Airsoft and Tactical",description: "Airsoft as a training bridge, tactical gear, and crossover disciplines." },
    { id: "law-and-safety",       name: "Law and Safety",      description: "Firearms law, terminology, safety culture, and responsible ownership in the UK." },
  ],
  plays: [
    { id: "tactical-shooters",    name: "Tactical Shooters",   description: "FPS and tactical shooter games — coverage, impressions, and field notes." },
    { id: "rts-strategy",         name: "RTS Strategy",        description: "Real-time strategy and strategy games — coverage and analysis." },
    { id: "indie-gaming",         name: "Indie Gaming",        description: "Smaller and independent game releases — impressions and coverage." },
    { id: "gear-and-hardware",    name: "Gear and Hardware",   description: "Gaming peripherals, hardware setups, and equipment notes." },
    { id: "software-tools",       name: "Software Tools",      description: "Gaming-adjacent software, communication tools, overlays, and platform utilities." },
  ],
  codes: [
    { id: "career-tips",          name: "Career Tips",         description: "Advice on working in tech, engineering careers, and professional development." },
    { id: "ai-coding",            name: "AI Coding",           description: "AI-assisted development, tools, workflows, and observations on coding with AI." },
    { id: "software-tools",       name: "Software Tools",      description: "Platform tools, developer utilities, workflows, and practical software walkthroughs." },
    { id: "human-programming",    name: "Human Programming",   description: "The human side of engineering — mindset, habits, communication, and learning." },
    { id: "gear-and-hardware",    name: "Gear and Hardware",   description: "Cameras, peripherals, and physical kit used in development and content creation." },
  ],
};

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
      reviews: 3,
      articles: 14,
      guides: 14,
    },
    get categories() { return categories.shoots; },
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
      reviews: 1,
      articles: 6,
      guides: 3,
    },
    get categories() { return categories.plays; },
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
      reviews: 0,
      articles: 3,
      guides: 5,
    },
    get categories() { return categories.codes; },
  },
];

export const wikiEntries: WikiEntry[] = [
  {
    slug: "window-size-doesnt-really-matter",
    title: "Window Size Doesn't Really Matter",
    summary: "A field note on pistol optic window size, dot tracking, and why practical use matters more than spec-sheet assumptions.",
    kind: "article",
    topic: "shoots",
    category: "gear-and-firearms",
    createdAt: "2026-03-23T09:02:28.000Z",
    updatedAt: "2026-03-23T09:02:29.000Z",
    popularity: 160,
    tags: ["optics", "pistol-optics"],
  },
  {
    slug: "shot-show-2026-first-timer",
    title: "Shot Show 2026: A First-Timer's Guide to the World's Biggest Firearms Trade Show",
    summary: "A first-timer's account of Shot Show 2026, covering the scale, pace, exhibitors, fatigue, and what to expect.",
    kind: "article",
    topic: "shoots",
    category: "practical-shooting",
    createdAt: "2026-02-13T10:00:00.000Z",
    updatedAt: "2026-03-06T22:30:47.000Z",
    popularity: 159,
    tags: ["optics", "practical-shooting", "target-shooting"],
  },
  {
    slug: "lynx-brutality-2025-commentator-to-competitor",
    title: "Lynx Brutality 2025: From Commentator to Competitor",
    summary: "A match report about moving from commentary to competing at Lynx Brutality after two years behind the microphone.",
    kind: "article",
    topic: "shoots",
    category: "practical-shooting",
    createdAt: "2026-02-06T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:07.000Z",
    popularity: 158,
    tags: ["optics", "practical-shooting", "rifle", "target-shooting", "uk-shooting"],
  },
  {
    slug: "balancing-the-trigger-time-management-and-avoiding-burnout",
    title: "Balancing the Trigger: Time Management and Avoiding Burnout",
    summary: "A practical reflection on balancing shooting, tech work, content, and rest without turning every hobby into pressure.",
    kind: "guide",
    topic: "shoots",
    category: "practical-shooting",
    createdAt: "2025-12-15T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:08.000Z",
    popularity: 157,
    tags: ["burnout", "time-management"],
  },
  {
    slug: "top-5-handguns-id-like-to-shoot-ipsc-handgun",
    title: "Top 5 Handguns I'd like to shoot IPSC Handgun",
    summary: "A personal wishlist of handguns to try in IPSC Handgun, written from the perspective of an active competition shooter.",
    kind: "article",
    topic: "shoots",
    category: "gear-and-firearms",
    createdAt: "2025-11-20T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:08.000Z",
    popularity: 156,
    tags: ["handgun", "practical-shooting"],
  },
  {
    slug: "from-air-to-fire-how-ipsc-action-air-training-prepares-you-for-the-real-deal",
    title: "From Air to Fire: How IPSC Action Air Training Prepares You for the Real Deal",
    summary: "A look at how IPSC Action Air can build transferable habits for live-fire handgun competition.",
    kind: "article",
    topic: "shoots",
    category: "practical-shooting",
    createdAt: "2025-10-25T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:08.000Z",
    popularity: 155,
    tags: ["action-air", "handgun", "ipsc", "practical-shooting"],
  },
  {
    slug: "the-difference-between-instructing-and-coaching",
    title: "The Difference between Instructing and Coaching",
    summary: "A training note separating instruction from coaching, with lessons carried between shooting practice and software mentoring.",
    kind: "guide",
    topic: "shoots",
    category: "practical-shooting",
    createdAt: "2025-09-18T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:09.000Z",
    popularity: 154,
    tags: ["coaching", "instructing"],
  },
  {
    slug: "this-trigger-will-make-your-airsoft-gun-realistic",
    title: "This Trigger Will Make Your Airsoft Gun, Realistic!",
    summary: "A shooting-adjacent product note on using airsoft trigger realism as a bridge into more useful dry training.",
    kind: "article",
    topic: "shoots",
    category: "airsoft-and-tactical",
    createdAt: "2025-08-12T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:09.000Z",
    popularity: 153,
    tags: ["airsoft", "realism", "triggers"],
  },
  {
    slug: "what-i-focus-on-when-reviewing-optics",
    title: "What I Focus on when Reviewing Optics",
    summary: "A reviewer checklist for evaluating shooting optics through use, clarity, controls, mounting, and practical performance.",
    kind: "guide",
    topic: "shoots",
    category: "practical-shooting",
    createdAt: "2025-07-08T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:09.000Z",
    popularity: 152,
    tags: ["optics"],
  },
  {
    slug: "cz-scorpion-evo-coming-to-the-uk",
    title: "CZ Scorpion Evo Coming to the UK",
    summary: "A news-style note on the CZ Scorpion Evo's appeal for UK shooters and practical mini rifle competitors.",
    kind: "article",
    topic: "shoots",
    category: "gear-and-firearms",
    createdAt: "2025-06-03T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:09.000Z",
    popularity: 151,
    tags: ["22lr", "cz", "iwa", "mini-rifle"],
  },
  {
    slug: "why-practical-shooting-is-a-great-shooting-discipline",
    title: "Why Practical Shooting is a Great Shooting Discipline",
    summary: "A primer on practical shooting as a dynamic discipline built around movement, problem solving, and measurable performance.",
    kind: "article",
    topic: "shoots",
    category: "practical-shooting",
    createdAt: "2025-05-14T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:10.000Z",
    popularity: 150,
    tags: ["ipsc", "practical-shooting"],
  },
  {
    slug: "you-have-an-astigmatism-and-its-ok",
    title: "You have an Astigmatism and it's OK",
    summary: "A reassuring optics guide for shooters who see distortion, blur, or unusual reticle shapes through red dots.",
    kind: "guide",
    topic: "shoots",
    category: "practical-shooting",
    createdAt: "2025-04-22T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:10.000Z",
    popularity: 149,
    tags: ["optics", "practical-shooting", "target-shooting"],
  },
  {
    slug: "iwa-outdoor-classics-what-is-it",
    title: "IWA Outdoor Classics, What is it?",
    summary: "A short explainer on IWA Outdoor Classics as a trade fair for shooting sports, hunting, outdoor equipment, and industry networking.",
    kind: "article",
    topic: "shoots",
    category: "practical-shooting",
    createdAt: "2023-03-02T23:39:13.000Z",
    updatedAt: "2026-03-06T13:47:12.000Z",
    popularity: 148,
    tags: ["iwa", "trade-shows"],
  },
  {
    slug: "tactical-vs-practical-shooting",
    title: "Tactical vs Practical Shooting",
    summary: "A comparison of tactical and practical shooting, clarifying how goals, context, and training assumptions differ.",
    kind: "guide",
    topic: "shoots",
    category: "practical-shooting",
    createdAt: "2023-03-01T23:45:05.000Z",
    updatedAt: "2026-03-06T13:47:19.000Z",
    popularity: 147,
    tags: ["practical-shooting", "tactical-shooting"],
  },
  {
    slug: "understanding-hold-overs-and-hold-unders",
    title: "Understanding Hold Overs... and Hold Unders",
    summary: "A shooting technique guide on compensating for trajectory with hold overs and hold unders at different distances.",
    kind: "guide",
    topic: "shoots",
    category: "practical-shooting",
    createdAt: "2023-02-28T23:47:01.000Z",
    updatedAt: "2026-03-06T13:47:28.000Z",
    popularity: 146,
    tags: ["optics", "practical-shooting", "target-shooting"],
  },
  {
    slug: "why-i-chose-an-hhs-setup-over-an-lpvo-setup-for-practical-mini-rifle",
    title: "Why I Chose an HHS Setup over an LPVO Setup for Practical Mini Rifle",
    summary: "A practical mini rifle optics note explaining the tradeoffs behind choosing a hybrid sight setup over an LPVO.",
    kind: "article",
    topic: "shoots",
    category: "practical-shooting",
    createdAt: "2023-02-27T23:51:28.000Z",
    updatedAt: "2026-03-06T13:47:35.000Z",
    popularity: 145,
    tags: ["hhs", "optics", "practical-shooting", "target-shooting"],
  },
  {
    slug: "the-mp-15-22-is-your-best-and-worst-practical-mini-rifle",
    title: "The M&P 15-22 is your Best and Worst Practical Mini Rifle",
    summary: "A review-style look at the Smith & Wesson M&P 15-22 as both a strong and compromised practical mini rifle choice.",
    kind: "review",
    topic: "shoots",
    category: "gear-and-firearms",
    createdAt: "2023-02-26T23:54:57.000Z",
    updatedAt: "2026-03-06T13:47:47.000Z",
    popularity: 144,
    tags: ["mp-15-22", "practical-shooting", "smith-wesson", "target-shooting"],
  },
  {
    slug: "what-optic-setup-is-best-for-practical-mini-rifle",
    title: "What Optic Setup is Best for Practical Mini Rifle?",
    summary: "A practical guide to choosing mini rifle optics based on target distance, stage design, shooter preference, and tradeoffs.",
    kind: "guide",
    topic: "shoots",
    category: "practical-shooting",
    createdAt: "2023-02-05T00:01:09.000Z",
    updatedAt: "2026-03-06T13:47:57.000Z",
    popularity: 143,
    tags: ["optics", "practical-shooting"],
  },
  {
    slug: "what-is-sight-over-bore",
    title: "What is Sight Over Bore?",
    summary: "A foundational explanation of sight height, offset, and why close-range point of impact changes relative to the optic.",
    kind: "guide",
    topic: "shoots",
    category: "practical-shooting",
    createdAt: "2023-02-01T00:09:00.000Z",
    updatedAt: "2026-03-06T13:48:09.000Z",
    popularity: 142,
    tags: ["optics", "practical-shooting", "target-shooting"],
  },
  {
    slug: "stop-referring-to-firearms-as-weapons",
    title: "Stop referring to Firearms as Weapons!",
    summary: "An opinion piece about language around firearms, sporting use, and why terminology matters in shooting culture.",
    kind: "article",
    topic: "shoots",
    category: "law-and-safety",
    createdAt: "2023-01-19T12:08:00.000Z",
    updatedAt: "2026-03-06T13:48:21.000Z",
    popularity: 141,
    tags: ["practical-shooting", "target-shooting", "uk-shooting"],
  },
  {
    slug: "how-to-get-into-sports-shooting-in-the-uk",
    title: "How to get into Sports Shooting in the United Kingdom",
    summary: "A UK-focused starter guide covering the practical first steps for getting involved in sports shooting.",
    kind: "guide",
    topic: "shoots",
    category: "practical-shooting",
    createdAt: "2023-01-17T11:50:45.000Z",
    updatedAt: "2026-03-06T13:48:31.000Z",
    popularity: 140,
    tags: ["practical-shooting", "target-shooting", "uk-shooting"],
  },
  {
    slug: "what-is-a-true-1x-magnification",
    title: "What is a True 1x Magnification?",
    summary: "An optics guide explaining true 1x magnification, why it matters, and how LPVOs and red dots compare at close range.",
    kind: "guide",
    topic: "shoots",
    category: "practical-shooting",
    createdAt: "2023-01-07T00:17:00.000Z",
    updatedAt: "2026-03-06T13:48:37.000Z",
    popularity: 139,
    tags: ["lpvo", "optics", "red-dots"],
  },
  {
    slug: "shoots-new-year-new-feat",
    title: "New Year, New Feat!",
    summary: "A Shoots-side personal update about shifting priorities, reviving Mockachino, and moving creative effort into a more personal outlet.",
    kind: "article",
    topic: "shoots",
    category: "field-notes",
    createdAt: "2023-01-01T00:21:00.000Z",
    updatedAt: "2026-03-06T13:48:42.000Z",
    popularity: 138,
    tags: ["mockachino", "projects", "creative-work"],
  },
  {
    slug: "its-a-moderator-not-a-silencer",
    title: "It's a Moderator! Not a Silencer!",
    summary: "A terminology note on why UK shooters usually call the muzzle device a moderator rather than a silencer.",
    kind: "article",
    topic: "shoots",
    category: "law-and-safety",
    createdAt: "2022-12-01T15:15:22.000Z",
    updatedAt: "2023-03-14T15:17:49.000Z",
    popularity: 137,
    tags: ["moderators", "target-shooting"],
  },
  {
    slug: "vortex-razor-hd-gen-iii-1-10x24",
    title: "Vortex Razor HD Gen III 1-10x24",
    summary: "A review entry for the Vortex Razor HD Gen III 1-10x24 LPVO and its role in practical shooting setups.",
    kind: "review",
    topic: "shoots",
    category: "gear-and-firearms",
    createdAt: "2022-09-01T00:24:00.000Z",
    updatedAt: "2023-03-12T00:27:28.000Z",
    popularity: 136,
    tags: ["lpvo", "optics", "vortex"],
  },
  {
    slug: "how-to-start-ipsc-mini-rifle-on-a-budget",
    title: "How to start IPSC Mini Rifle on a Budget",
    summary: "A budget-minded starter guide for IPSC Mini Rifle, following on from the Action Air entry point.",
    kind: "guide",
    topic: "shoots",
    category: "practical-shooting",
    createdAt: "2022-08-12T00:28:00.000Z",
    updatedAt: "2023-03-12T01:06:55.000Z",
    popularity: 135,
    tags: ["ipsc", "mini-rifle", "practical-shooting"],
  },
  {
    slug: "how-to-start-ipsc-action-air-on-a-budget",
    title: "How to Start IPSC Action Air on a Budget",
    summary: "A budget starter guide for IPSC Action Air, focused on avoiding overwhelm while choosing workable entry equipment.",
    kind: "guide",
    topic: "shoots",
    category: "practical-shooting",
    createdAt: "2022-07-10T00:31:00.000Z",
    updatedAt: "2023-03-12T00:33:25.000Z",
    popularity: 134,
    tags: ["action-air", "ipsc", "practical-shooting"],
  },
  {
    slug: "recover-tactical-20-20-stabiliser-kit",
    title: "Recover Tactical 20/20 Stabiliser Kit",
    summary: "A review of the Recover Tactical 20/20 stabiliser kit and the practical appeal of handgun carbine conversions.",
    kind: "review",
    topic: "shoots",
    category: "gear-and-firearms",
    createdAt: "2021-07-12T00:41:00.000Z",
    updatedAt: "2023-03-12T00:44:46.000Z",
    popularity: 133,
    tags: ["carbine-kit", "handgun"],
  },
  {
    slug: "how-to-start-shooting-ipsc-action-air",
    title: "How to Start Shooting IPSC Action Air",
    summary: "A beginner guide to getting involved in IPSC Action Air, emphasizing accessibility and the low barrier to starting.",
    kind: "guide",
    topic: "shoots",
    category: "practical-shooting",
    createdAt: "2021-02-15T00:45:00.000Z",
    updatedAt: "2023-03-12T00:47:34.000Z",
    popularity: 132,
    tags: ["action-air", "ipsc", "practical-shooting"],
  },
  {
    slug: "what-is-the-36-yard-zero",
    title: "What is the 36 Yard Zero?",
    summary: "A guide to the 36-yard zero concept and how trajectory choices affect practical rifle holds at different ranges.",
    kind: "guide",
    topic: "shoots",
    category: "guides",
    createdAt: "2020-06-16T00:47:00.000Z",
    updatedAt: "2023-03-12T00:49:40.000Z",
    popularity: 131,
    tags: ["optics", "practical-shooting", "rifle", "tactical-shooting", "target-shooting"],
  },
  {
    slug: "shoot-a-handgun-in-10-minutes-or-less",
    title: "Shoot a Handgun in 10 Minutes or Less",
    summary: "A quick handgun fundamentals note inspired by a training video, focused on whether basic pistol concepts can be learned fast.",
    kind: "article",
    topic: "shoots",
    category: "gear-and-firearms",
    createdAt: "2020-06-10T00:50:00.000Z",
    updatedAt: "2023-03-12T00:52:15.000Z",
    popularity: 130,
    tags: ["handgun", "ipsc", "practical-shooting", "tactical-shooting", "target-shooting"],
  },
  {
    slug: "sp-tarkov-the-forbidden-fruit",
    title: "SP Tarkov: The Forbidden Fruit",
    summary: "A look at the single-player Tarkov mod scene, how local-server play works, and why it sits outside official support.",
    kind: "article",
    topic: "plays",
    category: "tactical-shooters",
    createdAt: "2025-11-15T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:13.000Z",
    popularity: 130,
    tags: ["escape-from-tarkov", "singleplayer"],
  },
  {
    slug: "5-basic-skills-to-learn-for-escape-from-tarkov",
    title: "5 Basic Skills to Learn for Escape From Tarkov",
    summary: "A beginner-focused Tarkov primer covering map knowledge, weapon handling, communication, resource discipline, and patience.",
    kind: "guide",
    topic: "plays",
    category: "tactical-shooters",
    createdAt: "2025-10-10T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:13.000Z",
    popularity: 129,
    tags: ["escape-from-tarkov", "skills"],
  },
  {
    slug: "this-game-will-wreck-your-world-the-finals",
    title: "This Game Will Wreck Your World | The Finals",
    summary: "A short introduction to The Finals, centered on destructible arenas, loadout choice, and competitive shooter momentum.",
    kind: "article",
    topic: "plays",
    category: "tactical-shooters",
    createdAt: "2025-09-05T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:13.000Z",
    popularity: 128,
    tags: ["battle-royale", "fps", "the-finals"],
  },
  {
    slug: "escape-from-tarkov-bugs",
    title: "Escape From Tarkov > Bugs",
    summary: "A practical overview of Tarkov bug categories, from server instability and desync to audio, visual, and quest issues.",
    kind: "article",
    topic: "plays",
    category: "tactical-shooters",
    createdAt: "2025-08-01T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:13.000Z",
    popularity: 127,
    tags: ["bugs", "escape-from-tarkov"],
  },
  {
    slug: "the-spiritual-successor-to-teamspeak",
    title: "The Spiritual Successor to Teamspeak",
    summary: "A comparison of Discord and Teamspeak through usability, social features, integrations, and cross-platform access.",
    kind: "article",
    topic: "plays",
    category: "software-tools",
    createdAt: "2025-07-15T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:14.000Z",
    popularity: 126,
    tags: ["discord", "teamspeak", "voip"],
  },
  {
    slug: "why-is-escape-from-tarkov-so-immersive",
    title: "Why is Escape From Tarkov so Immersive",
    summary: "A breakdown of the mechanics that make Tarkov feel tense and grounded, including risk, audio, economy, and map complexity.",
    kind: "article",
    topic: "plays",
    category: "tactical-shooters",
    createdAt: "2025-06-20T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:14.000Z",
    popularity: 125,
    tags: ["escape-from-tarkov", "fps"],
  },
  {
    slug: "discord-stream-overlay-hack-for-pop-out",
    title: "Discord Stream Overlay Hack (For Pop Out)",
    summary: "A follow-up workaround for keeping Discord stream name tags visible when video streams are opened in pop-out windows.",
    kind: "guide",
    topic: "plays",
    category: "software-tools",
    createdAt: "2025-05-25T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:14.000Z",
    popularity: 124,
    tags: ["discord", "hacks", "voip"],
  },
  {
    slug: "discord-stream-overlay-hack",
    title: "Discord Stream Overlay Hack",
    summary: "A BetterDiscord CSS workaround for keeping stream overlay names visible while gaming or tabbed away from Discord.",
    kind: "guide",
    topic: "plays",
    category: "software-tools",
    createdAt: "2025-04-30T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:15.000Z",
    popularity: 123,
    tags: ["discord", "hacks", "voip"],
  },
  {
    slug: "new-year-new-feat",
    title: "New Year, New Feat!",
    summary: "A personal update on shifting creative priorities, simplifying Outdoor Technica, and reviving Mockachino projects.",
    kind: "article",
    topic: "plays",
    category: "software-tools",
    createdAt: "2025-03-15T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:15.000Z",
    popularity: 122,
    tags: ["mockachino", "projects", "creative-work"],
  },
  {
    slug: "slay-the-spire",
    title: "Slay The Spire: Deck Building for Survival",
    summary: "A review of Slay the Spire's deck-building loop, relic choices, run structure, replayability, and strategic challenge.",
    kind: "review",
    topic: "plays",
    category: "indie-gaming",
    createdAt: "2022-12-24T11:36:00.000Z",
    updatedAt: "2026-03-06T14:10:52.000Z",
    popularity: 121,
    tags: ["deck-building", "roguelike", "slay-the-spire"],
  },
  {
    slug: "codes-the-spiritual-successor-to-teamspeak",
    title: "The Spiritual Successor to Teamspeak",
    summary: "A Codes-side comparison of Discord and Teamspeak through usability, integrations, social features, and cross-platform access.",
    kind: "article",
    topic: "codes",
    category: "software-tools",
    createdAt: "2025-12-10T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:10.000Z",
    popularity: 120,
    tags: ["discord", "teamspeak", "voip"],
  },
  {
    slug: "swapping-over-to-windows-11",
    title: "Swapping over to Windows 11",
    summary: "A clean-install diary about moving to Windows 11, refreshing the operating system, and rebuilding a working setup.",
    kind: "article",
    topic: "codes",
    category: "software-tools",
    createdAt: "2025-11-05T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:10.000Z",
    popularity: 119,
    tags: ["operating-system", "windows"],
  },
  {
    slug: "codes-discord-stream-overlay-hack-for-pop-out",
    title: "Discord Stream Overlay Hack (For Pop Out)",
    summary: "A Codes-side workaround for keeping Discord stream name tags visible when streams are opened in pop-out windows.",
    kind: "guide",
    topic: "codes",
    category: "software-tools",
    createdAt: "2025-10-01T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:11.000Z",
    popularity: 118,
    tags: ["discord", "hacks", "voip"],
  },
  {
    slug: "codes-discord-stream-overlay-hack",
    title: "Discord Stream Overlay Hack",
    summary: "A BetterDiscord CSS guide for keeping stream overlay names visible while gaming or tabbed away from Discord.",
    kind: "guide",
    topic: "codes",
    category: "software-tools",
    createdAt: "2025-09-15T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:11.000Z",
    popularity: 117,
    tags: ["discord", "hacks", "voip"],
  },
  {
    slug: "the-death-of-xamarin-forms-net-maui",
    title: "The Death of Xamarin Forms | .NET MAUI",
    summary: "A mobile development note on Xamarin Forms, .NET MAUI, and Microsoft's cross-platform application direction.",
    kind: "article",
    topic: "codes",
    category: "software-tools",
    createdAt: "2025-08-20T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:11.000Z",
    popularity: 116,
    tags: ["net-maui", "mobile-apps", "xamarin-forms"],
  },
  {
    slug: "how-to-film-in-s-log-3",
    title: "How to Film in S-Log 3",
    summary: "A camera workflow guide for filming in S-Log 3 on Sony cameras to preserve dynamic range and grading flexibility.",
    kind: "guide",
    topic: "codes",
    category: "gear-and-hardware",
    createdAt: "2025-07-10T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:12.000Z",
    popularity: 115,
    tags: ["dslr", "filming", "slog-3", "sony"],
  },
  {
    slug: "create-your-first-discord-bot",
    title: "Create your first Discord Bot",
    summary: "A starter guide for creating a Discord bot and introducing basic bot concepts for communities and gaming servers.",
    kind: "guide",
    topic: "codes",
    category: "software-tools",
    createdAt: "2025-06-05T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:12.000Z",
    popularity: 114,
    tags: ["bot", "discord", "programming"],
  },
  {
    slug: "migrating-wordpress-sites-without-plugins",
    title: "Migrating WordPress Sites (Without Plugins)",
    summary: "A WordPress migration guide for moving a site manually without relying on migration plugins.",
    kind: "guide",
    topic: "codes",
    category: "software-tools",
    createdAt: "2025-05-01T10:00:00.000Z",
    updatedAt: "2026-03-06T21:40:12.000Z",
    popularity: 113,
    tags: ["hosting", "web", "wordpress"],
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
  return categories[topicId].find((c) => c.id === categoryId);
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

const migratedPlaysResources: ArticleResource[] = [
  { title: "Original Plays Archive", meta: "MIGRATED SOURCE", type: "REFERENCE" },
  { title: "Session Notes", meta: "GAMEPLAY CONTEXT", type: "NOTE" },
  { title: "Related Tags", meta: "CROSS-REFERENCE", type: "INDEX" },
];

const migratedPlaysSections: Record<string, ArticleSection[]> = {
  "sp-tarkov-the-forbidden-fruit": [
    {
      id: "single-player-context",
      number: "01",
      title: "Single-Player Context",
      paragraphs: [
        "This note introduces SP Tarkov as a fan-made route into Escape from Tarkov's systems without live-player pressure.",
        "The appeal is control: players can practice raids, test gear, and explore mechanics in a more predictable setting.",
      ],
      takeaway: "The article frames SP Tarkov as a practice sandbox, not an officially supported Tarkov mode.",
    },
    {
      id: "how-it-works",
      number: "02",
      title: "How It Works",
      paragraphs: [
        "The setup is described as a local-server approach that simulates the normal game loop on the player's machine.",
        "From there, players can tune maps, enemy counts, starting equipment, and other conditions to match what they want to rehearse.",
      ],
    },
    {
      id: "official-risk",
      number: "03",
      title: "Official Risk",
      paragraphs: [
        "The piece is clear that the mod exists outside Battlestate's endorsement, which makes it technically unsupported.",
        "Its usefulness comes from controlled experimentation, but that value has to be weighed against the lack of official approval.",
      ],
    },
  ],
  "5-basic-skills-to-learn-for-escape-from-tarkov": [
    {
      id: "survival-basics",
      number: "01",
      title: "Survival Basics",
      paragraphs: [
        "The guide condenses Tarkov improvement into a handful of fundamentals that new players can actually practice.",
        "It starts with map knowledge because route confidence, landmark recognition, and danger awareness drive almost every raid decision.",
      ],
      takeaway: "Learn the environment before trying to win every fight.",
    },
    {
      id: "mechanics-and-teamwork",
      number: "02",
      title: "Mechanics And Teamwork",
      paragraphs: [
        "Weapon handling covers recoil, aiming, bullet behavior, and staying composed when the situation changes quickly.",
        "Communication is treated as a survival skill: callouts, movement clarity, and resource sharing reduce avoidable losses.",
      ],
    },
    {
      id: "resource-discipline",
      number: "03",
      title: "Resource Discipline",
      paragraphs: [
        "The final skills are resource management and patience, both of which keep a raid from collapsing through panic or waste.",
        "The guide positions Tarkov as a persistence game where steady repetition matters more than one perfect run.",
      ],
      metricCards: [
        { icon: "book", title: "Maps", body: "Know routes, exits, landmarks, and chokepoints." },
        { icon: "target", title: "Weapons", body: "Understand recoil and effective ranges." },
        { icon: "pulse", title: "Resources", body: "Protect ammunition, meds, food, and water." },
        { icon: "shuffle", title: "Patience", body: "Slow decisions often survive longer." },
      ],
    },
  ],
  "this-game-will-wreck-your-world-the-finals": [
    {
      id: "destructible-arena",
      number: "01",
      title: "Destructible Arena",
      paragraphs: [
        "The Finals is presented as a competitive shooter where the environment is part of the fight instead of static scenery.",
        "Walls, cover, and routes can change mid-match, forcing players to think about the arena as a tactical tool.",
      ],
      takeaway: "The hook is environmental disruption: positioning can be created, removed, or punished.",
    },
    {
      id: "loadout-pressure",
      number: "02",
      title: "Loadout Pressure",
      paragraphs: [
        "The article highlights weapons and equipment as playstyle choices, with each setup shaping how aggressive or careful a player can be.",
        "That customization gives the game its immediate shooter identity while the arena destruction creates the broader strategic layer.",
      ],
    },
    {
      id: "competitive-pitch",
      number: "03",
      title: "Competitive Pitch",
      paragraphs: [
        "The piece closes on the competitive promise: active servers, a player base to challenge, and enough structure for ranked or tournament play.",
        "Its recommendation is driven by pace, spectacle, and the chance to outthink opponents through terrain as much as aim.",
      ],
    },
  ],
  "escape-from-tarkov-bugs": [
    {
      id: "bug-categories",
      number: "01",
      title: "Bug Categories",
      paragraphs: [
        "This article groups Tarkov friction into recognizable categories instead of treating every issue as the same kind of failure.",
        "Server instability, long waits, desync, audio problems, visual issues, and quest glitches are all called out as common pain points.",
      ],
      takeaway: "The note is a quick taxonomy of things that can make a raid feel unfair or inconsistent.",
    },
    {
      id: "impact-on-play",
      number: "02",
      title: "Impact On Play",
      paragraphs: [
        "The severity depends on player tolerance and timing: a minor issue in one raid can become a lost kit in another.",
        "Desync and audio bugs matter especially because Tarkov asks players to trust information under high pressure.",
      ],
    },
    {
      id: "living-with-friction",
      number: "03",
      title: "Living With Friction",
      paragraphs: [
        "The original post balances criticism with the point that the developers continue to address problems over time.",
        "It keeps the larger appeal intact: Tarkov's complexity and realism can still be compelling even when rough edges show up.",
      ],
    },
  ],
  "the-spiritual-successor-to-teamspeak": [
    {
      id: "why-discord-won",
      number: "01",
      title: "Why Discord Won",
      paragraphs: [
        "The comparison argues that Discord became the natural Teamspeak successor by being easier to use and easier to join.",
        "Its interface, server model, voice channels, chat, and screen sharing made it more approachable for gaming communities.",
      ],
      takeaway: "The shift is less about voice quality alone and more about community convenience.",
    },
    {
      id: "social-layer",
      number: "02",
      title: "Social Layer",
      paragraphs: [
        "Discord's social features are treated as the major separator: friends, direct messages, invites, and community discovery are part of the same tool.",
        "Teamspeak is framed as narrower, while Discord wraps communication, community, and casual coordination into one place.",
      ],
    },
    {
      id: "integrations-and-platforms",
      number: "03",
      title: "Integrations And Platforms",
      paragraphs: [
        "The post also points to third-party integrations and cross-platform access as reasons Discord became the default.",
        "The result is a tool that follows users across devices and plugs into the broader gaming and streaming ecosystem.",
      ],
    },
  ],
  "why-is-escape-from-tarkov-so-immersive": [
    {
      id: "systems-that-sell-risk",
      number: "01",
      title: "Systems That Sell Risk",
      paragraphs: [
        "The article explains Tarkov's immersion through systems that make each raid feel expensive and uncertain.",
        "Weapon handling, ammo behavior, health, movement, and gear loss all reinforce the sense that mistakes have consequences.",
      ],
      takeaway: "Tarkov feels immersive because its systems make risk visible and personal.",
    },
    {
      id: "economy-and-audio",
      number: "02",
      title: "Economy And Audio",
      paragraphs: [
        "The in-game economy adds pressure by making players think about what to buy, sell, bring, and protect.",
        "Sound design is another pillar: footsteps, gunfire, and ambient noise turn listening into active decision-making.",
      ],
    },
    {
      id: "maps-and-permadeath",
      number: "03",
      title: "Maps And Loss",
      paragraphs: [
        "Complex map layouts keep navigation tense and reward repeat learning over time.",
        "The threat of losing equipment gives the world weight, making extraction feel like a meaningful outcome rather than a menu transition.",
      ],
    },
  ],
  "discord-stream-overlay-hack-for-pop-out": [
    {
      id: "pop-out-problem",
      number: "01",
      title: "Pop-Out Problem",
      paragraphs: [
        "This follow-up covers the case where the original Discord overlay CSS fix does not carry into popped-out video streams.",
        "The goal is the same: keep participant name tags visible so players can identify streams while focused on a game.",
      ],
      takeaway: "The workaround is temporary and has to be repeated for each new pop-out window.",
    },
    {
      id: "devtools-workflow",
      number: "02",
      title: "DevTools Workflow",
      paragraphs: [
        "The article walks through enabling Discord DevTools, opening the pop-out, inspecting the stream UI, and finding the relevant name-tag element.",
        "It treats the workflow like browser inspection: locate the right element, check the styling, and change the visibility behavior.",
      ],
    },
    {
      id: "result-and-limits",
      number: "03",
      title: "Result And Limits",
      paragraphs: [
        "Once the opacity is changed, the name tags remain visible after the inspector is closed.",
        "The limitation is durability: the tweak solves the immediate session, but it is not a permanent plugin-level fix.",
      ],
    },
  ],
  "discord-stream-overlay-hack": [
    {
      id: "overlay-use-case",
      number: "01",
      title: "Overlay Use Case",
      paragraphs: [
        "The original Discord overlay note starts from a practical gaming problem: stream viewers needed clearer names while several friends were sharing screens.",
        "Rather than building a full plugin immediately, the article uses BetterDiscord's custom CSS support as a quick workaround.",
      ],
      takeaway: "The fix is a CSS visibility tweak, useful as a bridge before a proper plugin exists.",
    },
    {
      id: "betterdiscord-setup",
      number: "02",
      title: "BetterDiscord Setup",
      paragraphs: [
        "The workflow depends on installing BetterDiscord and using its CSS settings to target Discord's stream overlay title class.",
        "The rule forces the overlay title to remain visible instead of fading when the app is idle or out of focus.",
      ],
    },
    {
      id: "practical-result",
      number: "03",
      title: "Practical Result",
      paragraphs: [
        "After saving the CSS, stream labels continue to show while the user is in-game or tabbed away.",
        "The article leaves room for a future plugin but captures the quick fix as a usable field note.",
      ],
    },
  ],
  "new-year-new-feat": [
    {
      id: "priority-shift",
      number: "01",
      title: "Priority Shift",
      paragraphs: [
        "This personal update explains a reset in creative and business priorities around the start of 2023.",
        "Outdoor Technica is repositioned toward business-to-business services while public content work takes a back seat.",
      ],
      takeaway: "The post marks a move from obligation-heavy publishing toward a more personal creative outlet.",
    },
    {
      id: "project-context",
      number: "02",
      title: "Project Context",
      paragraphs: [
        "The article also references Barney Mcgrew projects in the shooting community, including competition timing and IPSC education work.",
        "Those projects are presented as active but not urgent, leaving room to refocus creative energy elsewhere.",
      ],
    },
    {
      id: "mockachino-direction",
      number: "03",
      title: "Mockachino Direction",
      paragraphs: [
        "The intended direction is to revive Mockachino with a more personal tone and fewer external expectations.",
        "It acts as a bridge post between older Outdoor Technica work and the broader Mockachino site structure.",
      ],
    },
  ],
  "slay-the-spire": [
    {
      id: "core-loop",
      number: "01",
      title: "Core Loop",
      paragraphs: [
        "The review frames Slay the Spire around climbing a tower through fights, rewards, bosses, and card choices.",
        "Each run starts small and asks the player to build a deck that can survive increasingly awkward encounters.",
      ],
      takeaway: "The strength of the game is how quickly simple card choices become long-term strategic commitments.",
    },
    {
      id: "cards-and-relics",
      number: "02",
      title: "Cards And Relics",
      paragraphs: [
        "Deck-building is the main engine: adding, removing, and combining cards determines whether the run becomes focused or bloated.",
        "Relics add passive effects that can reshape a strategy, making boss rewards and route decisions feel important.",
      ],
    },
    {
      id: "replay-value",
      number: "03",
      title: "Replay Value",
      paragraphs: [
        "The article praises the game for challenge, readable art, atmosphere, and the way each run creates a new puzzle.",
        "It also notes that repetition can be felt after enough play, but argues that the variety and difficulty settings keep the loop worthwhile.",
      ],
      metricCards: [
        { icon: "shuffle", title: "Runs", body: "Each climb asks for a different plan." },
        { icon: "book", title: "Decks", body: "Card choices define the build." },
        { icon: "pulse", title: "Relics", body: "Passive bonuses change priorities." },
        { icon: "target", title: "Challenge", body: "Tactical decisions matter every floor." },
      ],
    },
  ],
};

function migratedPlaysView(slug: string, articleId: string, readMinutes: number, difficulty: number): ArticleView {
  const sections = migratedPlaysSections[slug] ?? [];

  return {
    articleId,
    readMinutes,
    version: "1.0",
    difficulty,
    heroAsset: "/brand/topic-plays-panel.png",
    schematicAsset: "/brand/mockachino-blueprint.svg",
    schematicLabel: "MIGRATED PLAYS",
    schematicRef: `REF-PLAYS-${articleId.split("-").at(-1)}`,
    sections,
    toc: sections.map((section) => section.title),
    resources: migratedPlaysResources,
  };
}

const specialArticleViews: Record<string, ArticleView> = {
  "sp-tarkov-the-forbidden-fruit": migratedPlaysView("sp-tarkov-the-forbidden-fruit", "PLA-NEW-001", 2, 2),
  "5-basic-skills-to-learn-for-escape-from-tarkov": migratedPlaysView(
    "5-basic-skills-to-learn-for-escape-from-tarkov",
    "PLA-TIP-002",
    2,
    3,
  ),
  "this-game-will-wreck-your-world-the-finals": migratedPlaysView(
    "this-game-will-wreck-your-world-the-finals",
    "PLA-NEW-003",
    2,
    2,
  ),
  "escape-from-tarkov-bugs": migratedPlaysView("escape-from-tarkov-bugs", "PLA-NEW-004", 2, 2),
  "the-spiritual-successor-to-teamspeak": migratedPlaysView(
    "the-spiritual-successor-to-teamspeak",
    "PLA-NEW-005",
    2,
    2,
  ),
  "why-is-escape-from-tarkov-so-immersive": migratedPlaysView(
    "why-is-escape-from-tarkov-so-immersive",
    "PLA-NEW-006",
    2,
    2,
  ),
  "discord-stream-overlay-hack-for-pop-out": migratedPlaysView(
    "discord-stream-overlay-hack-for-pop-out",
    "PLA-HOW-007",
    1,
    3,
  ),
  "discord-stream-overlay-hack": migratedPlaysView("discord-stream-overlay-hack", "PLA-HOW-008", 2, 3),
  "new-year-new-feat": migratedPlaysView("new-year-new-feat", "PLA-EXP-009", 3, 1),
  "slay-the-spire": migratedPlaysView("slay-the-spire", "PLA-IND-010", 5, 2),
};

export function getArticleView(entry: WikiEntry): ArticleView {
  const special = specialArticleViews[entry.slug];
  if (special) return special;

  const topic = getTopic(entry.topic);
  const category = getCategory(entry.topic, entry.category);

  const sections: ArticleSection[] = [
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
  ];

  return {
    articleId: `${entry.topic.toUpperCase().slice(0, 3)}-${entry.category.slice(0, 3).toUpperCase()}-${entry.slug.slice(0, 3).toUpperCase()}`,
    readMinutes: entry.kind === "guide" ? 7 : entry.kind === "review" ? 9 : 6,
    version: "1.0",
    difficulty: entry.kind === "guide" ? 3 : entry.kind === "review" ? 2 : 2,
    heroAsset: topicHeroAsset(entry.topic),
    schematicAsset: topicSchematicAsset(entry.topic),
    schematicLabel: category ? `${category.name.toUpperCase()}` : "REFERENCE PANEL",
    schematicRef: `REF-${entry.topic.toUpperCase()}-${entry.slug.slice(0, 3).toUpperCase()}`,
    toc: sections.map((s) => s.title),
    sections,
    resources: defaultResources(entry),
  };
}
