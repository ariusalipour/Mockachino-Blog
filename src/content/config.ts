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
    updatedAt: z.coerce.date(),
    repository: z.string().url().optional(),
    liveUrl: z.string().url().optional(),
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

const routeSlug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const courseImage = z.object({ src: z.string(), alt: z.string().nullable().default("") }).optional();
const courses = defineCollection({
  type: "content",
  schema: z.object({
    courseId: z.string(), slug: routeSlug, title: z.string(), summary: z.string(),
    topic: z.enum(["shoots", "plays", "codes"]), category: z.string(), tags: z.array(z.string()).default([]),
    createdAt: z.coerce.date(), updatedAt: z.coerce.date(), featuredImage: courseImage,
    lessons: z.array(z.object({ lesson: routeSlug, quiz: routeSlug.optional() })).default([]),
    finalQuiz: routeSlug.optional(),
  }),
});
const courseLessons = defineCollection({
  type: "content",
  schema: z.object({
    lessonId: z.string(), slug: routeSlug, title: z.string(), summary: z.string(),
    createdAt: z.coerce.date(), updatedAt: z.coerce.date(), featuredImage: courseImage,
  }),
});
const quizzes = defineCollection({
  type: "content",
  schema: z.object({
    quizId: z.string(), slug: routeSlug, title: z.string(), createdAt: z.coerce.date(), updatedAt: z.coerce.date(),
    questions: z.array(z.object({
      question: z.string().min(1), explanation: z.string().min(1),
      answers: z.array(z.object({ text: z.string().min(1), correct: z.boolean() })).min(2)
        .refine(answers => answers.filter(answer => answer.correct).length === 1, "Each question needs exactly one correct answer"),
    })).min(1),
  }),
});

export const collections = { topics, categories, tags, glossary, wiki, projects, "project-updates": projectUpdates, courses, "course-lessons": courseLessons, quizzes };
