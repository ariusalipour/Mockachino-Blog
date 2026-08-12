import { defineCollection, z } from "astro:content";

const topics = defineCollection({
  type: "content",
  schema: z.object({
    name: z.string(),
    shortName: z.string(),
    strapline: z.string(),
    accent: z.string(),
    icon: z.string(),
    homeStats: z
      .object({
        reviews: z.number(),
        articles: z.number(),
        guides: z.number(),
      })
      .optional(),
  }),
});

const categories = defineCollection({
  type: "content",
  schema: z.object({
    topic: z.enum(["shoots", "plays", "codes"]),
    name: z.string(),
    description: z.string(),
  }),
});

const tags = defineCollection({
  type: "content",
  schema: z.object({
    label: z.string(),
  }),
});

const glossary = defineCollection({
  type: "content",
  schema: z.object({
    term: z.string(),
    definition: z.string(),
  }),
});

const projects = defineCollection({
  type: "content",
  schema: z.object({
    name: z.string(),
    summary: z.string(),
    status: z.string(),
    startedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    repository: z.string().url().optional(),
    repositoryPublic: z.boolean().default(false),
    liveUrl: z.string().url().optional(),
    platforms: z.array(z.string()).default([]),
    stack: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
  }),
});

const projectUpdates = defineCollection({
  type: "content",
  schema: z.object({
    project: z.string(),
    slug: z.string().optional(),
    title: z.string(),
    summary: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

const wiki = defineCollection({
  type: "content",
  schema: z.object({
    articleId: z.string(),
    slug: z.string().optional(),
    title: z.string(),
    summary: z.string(),
    kind: z.enum(["review", "article", "guide"]),
    topic: z.enum(["shoots", "plays", "codes"]),
    category: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    tags: z.array(z.string()),
    featuredImage: z
      .object({
        src: z.string(),
        alt: z.string().nullable().default(""),
      })
      .optional(),
  }),
});

export const collections = { topics, categories, tags, glossary, wiki, projects, "project-updates": projectUpdates };
