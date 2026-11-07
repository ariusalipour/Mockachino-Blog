import { documentBody, type RichTextContext } from './richtext'
export const collectionSlugs = ['topics', 'categories', 'tags', 'glossary', 'wiki', 'projects', 'project-updates', 'courses', 'course-lessons', 'quizzes'] as const
export const legacyCollectionSlugs = collectionSlugs.filter(slug => !['courses', 'course-lessons', 'quizzes'].includes(slug))
export type ContentSlug = typeof collectionSlugs[number]
export type SiteDocument = { sourcePath: string; body: string; data: Record<string, unknown> }
export const fieldNames: Record<ContentSlug, string[]> = {
  topics: ['name', 'shortName', 'strapline', 'accent', 'icon', 'homeStats'],
  categories: ['topic', 'name', 'description'],
  tags: ['label'],
  glossary: ['term', 'definition'],
  wiki: ['articleId', 'slug', 'title', 'summary', 'kind', 'topic', 'category', 'createdAt', 'updatedAt', 'tags', 'featuredImage'],
  projects: ['name', 'summary', 'status', 'updatedAt', 'repository', 'liveUrl', 'tags'],
  'project-updates': ['project', 'slug', 'title', 'summary', 'createdAt', 'updatedAt', 'tags'],
  courses: ['courseId', 'slug', 'title', 'summary', 'topic', 'category', 'tags', 'createdAt', 'updatedAt', 'featuredImage', 'lessons', 'finalQuiz'],
  'course-lessons': ['lessonId', 'slug', 'title', 'summary', 'createdAt', 'updatedAt', 'featuredImage'],
  quizzes: ['quizId', 'slug', 'title', 'createdAt', 'updatedAt', 'questions'],
}
const cmsField = (key: string) => key === 'createdAt' ? 'authoredAt' : key === 'updatedAt' ? 'revisedAt' : key
export function fromSiteDocument(collection: ContentSlug, entry: SiteDocument) {
  const data: Record<string, unknown> = { sourcePath: entry.sourcePath, body: entry.body }
  const extraFrontmatter: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(entry.data)) {
    if (fieldNames[collection].includes(key)) data[cmsField(key)] = value
    else extraFrontmatter[key] = value
  }
  return { ...data, extraFrontmatter }
}
export type SiteContentContext = RichTextContext & { lessonSlugsByID?: Map<string, string>; quizSlugsByID?: Map<string, string> }
const relationKey = (value: any) => String(value && typeof value === 'object' ? value.id : value)
export function toSiteDocument(collection: ContentSlug, doc: Record<string, unknown>, context: SiteContentContext = {}): SiteDocument {
  const data: Record<string, unknown> = { ...(doc.extraFrontmatter as Record<string, unknown> || {}) }
  if (['courses', 'course-lessons', 'quizzes'].includes(collection)) for (const key of fieldNames[collection]) delete data[key]
  for (const key of fieldNames[collection]) {
    const value = doc[cmsField(key)]
    if (value !== undefined && value !== null && !(['slug', 'repository', 'liveUrl'].includes(key) && value === '')) {
      // Payload adds its own internal id to group fields; never export that.
      if (collection === 'courses' && key === 'lessons') {
        data.lessons = (value as any[]).flatMap(row => {
          const lesson = context.lessonSlugsByID?.get(relationKey(row.lesson))
          if (!lesson) return []
          const quiz = row.quiz && context.quizSlugsByID?.get(relationKey(row.quiz))
          return [{lesson, ...(quiz ? {quiz} : {})}]
        })
      } else if (collection === 'courses' && key === 'finalQuiz') {
        const quiz = context.quizSlugsByID?.get(relationKey(value))
        if (quiz) data.finalQuiz = quiz
      } else if (collection === 'quizzes' && key === 'questions') {
        data.questions = (value as any[]).map(question => ({question:question.question,answers:(question.answers || []).map((answer:any)=>({text:answer.text,correct:Boolean(answer.correct)})),explanation:question.explanation}))
      } else if (key === 'featuredImage') {
        const image = value as Record<string, unknown>
        if (image.src) data[key] = { src: image.src, alt: image.alt ?? '' }
      } else if (key === 'homeStats') {
        const stats = value as Record<string, unknown>
        if (Object.values(stats).some((v) => typeof v === 'number')) {
          data[key] = { reviews: stats.reviews ?? 0, articles: stats.articles ?? 0, guides: stats.guides ?? 0 }
        }
      } else data[key] = value
    }
  }
  if (collection === 'courses') data.lessons ??= []
  return { sourcePath: String(doc.sourcePath), body: collection === 'quizzes' ? '' : documentBody(doc, context), data }
}
