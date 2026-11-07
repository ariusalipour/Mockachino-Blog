export const collectionSlugs = ['topics', 'categories', 'tags', 'glossary', 'wiki', 'projects', 'project-updates'] as const
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
export function toSiteDocument(collection: ContentSlug, doc: Record<string, unknown>): SiteDocument {
  const data: Record<string, unknown> = { ...(doc.extraFrontmatter as Record<string, unknown> || {}) }
  for (const key of fieldNames[collection]) {
    const value = doc[cmsField(key)]
    if (value !== undefined && value !== null && !(['slug', 'repository', 'liveUrl'].includes(key) && value === '')) {
      // Payload adds its own internal id to group fields; never export that.
      if (key === 'featuredImage') {
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
  return { sourcePath: String(doc.sourcePath), body: String(doc.body ?? ''), data }
}
