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

const wiki = defineCollection({
  type: "content",
  schema: z.object({
    slug: z.string().optional(),
    title: z.string(),
    summary: z.string(),
    kind: z.enum(["review", "article", "guide"]),
    topic: z.enum(["shoots", "plays", "codes"]),
    category: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    popularity: z.number(),
    tags: z.array(z.string()),
    featuredImage: z
      .object({
        src: z.string(),
        alt: z.string().nullable().default(""),
      })
      .optional(),
  }),
});

export const collections = { topics, categories, wiki };
