import { randomBytes } from 'node:crypto'
import { ValidationError, type CollectionBeforeValidateHook, type PayloadRequest } from 'payload'
import { richTextToMarkdown, type MediaRecord } from './richtext'

export const topicOptions = [
  { label: 'Shoots', value: 'shoots' },
  { label: 'Plays', value: 'plays' },
  { label: 'Codes', value: 'codes' },
]
export const generatedArticlePattern = /^(?:SHO|PLA|COD)-\d{8}-[A-F0-9]{16}$/
const prefixes: Record<string, string> = { shoots: 'SHO', plays: 'PLA', codes: 'COD' }
type Data = Record<string, any>

export function catalogueStem(sourcePath: string): string {
  return sourcePath.split('/').at(-1)!.replace(/\.md$/i, '')
}
export function categoryIdentifier(doc: { sourcePath?: string; topic?: string }): string {
  const stem = catalogueStem(String(doc.sourcePath || ''))
  return stem.startsWith(`${doc.topic}-`) ? stem.slice(String(doc.topic).length + 1) : stem
}
export function titleSlug(title: string): string {
  return title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90).replace(/-$/, '')
}
function fail(req: PayloadRequest, path: string, message: string): never {
  throw new ValidationError({ collection: 'wiki', req, errors: [{ path, message }] })
}
function same(left: unknown, right: unknown) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null)
}
function normalizedDate(value: unknown) {
  if (!value) return null
  const timestamp = new Date(String(value)).getTime()
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : String(value)
}
async function uniqueSlug(req: PayloadRequest, title: string, articleId: string): Promise<string> {
  // An identity suffix also prevents two simultaneous same-title requests from
  // racing through an availability check and claiming the same public URL.
  for (let attempt = 0; attempt < 4; attempt++) {
    const suffix = attempt ? randomBytes(8).toString('hex') : articleId.split('-').at(-1)!.toLowerCase()
    const slug = `${titleSlug(title) || 'article'}-${suffix}`
    const [published, versions] = await Promise.all([
      req.payload.find({ collection: 'wiki', where: { slug: { equals: slug } }, draft: false, depth: 0, limit: 1, overrideAccess: true, req }),
      req.payload.findVersions({ collection: 'wiki', where: { and: [{ latest: { equals: true } }, { 'version.slug': { equals: slug } }] }, depth: 0, limit: 1, overrideAccess: true, req }),
    ])
    if (!published.docs.length && !versions.docs.length) return slug
  }
  return fail(req, 'title', 'A unique address could not be generated. Please save again.')
}

async function validateTaxonomy(req: PayloadRequest, data: Data, original: Data | undefined, publishing: boolean) {
  const topic = data.topic ?? original?.topic
  const category = data.category ?? original?.category
  const tags = data.tags ?? original?.tags ?? []
  if (!prefixes[topic]) fail(req, 'topic', 'Choose a topic before saving this post.')
  const categoryChanged = !original || topic !== original.topic || !same(category, original.category)
  const tagsChanged = !original || !same(tags, original.tags)
  const firstPublication = publishing && original?._status !== 'published'
  if ((categoryChanged || firstPublication) && category) {
    const choices = await req.payload.find({ collection: 'categories', where: { and: [{ topic: { equals: topic } }, { _status: { equals: 'published' } }] }, pagination: false, depth: 0, draft: false, overrideAccess: true, req })
    if (!choices.docs.some(doc => categoryIdentifier(doc) === category)) fail(req, 'category', 'Choose a category from the selected topic.')
  } else if (publishing && !category) fail(req, 'category', 'Choose a category before publishing.')
  if (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string')) fail(req, 'tags', 'Choose tags from the list.')
  if ((tagsChanged || firstPublication) && tags.length) {
    const catalogue = await req.payload.find({ collection: 'tags', where: { _status: { equals: 'published' } }, pagination: false, depth: 0, draft: false, overrideAccess: true, req })
    const known = new Set(catalogue.docs.map(doc => catalogueStem(doc.sourcePath).toLowerCase()))
    if (tags.some(tag => !known.has(tag.toLowerCase()))) fail(req, 'tags', 'Choose existing tags. Create new tags in the Tags collection first.')
  }
}

async function meaningfulContent(doc: Data, req: PayloadRequest): Promise<Record<string, unknown>> {
  let body = String(doc.body || '')
  if (doc.content) {
    const records = await req.payload.find({ collection: 'media', pagination: false, depth: 0, overrideAccess: true, req })
    body = richTextToMarkdown(doc.content, { mediaByID: new Map(records.docs.map(media => [String(media.id), media as MediaRecord])) })
  } else if (doc.contentMigration) body = ''
  return {
    title: doc.title ?? '', summary: doc.summary ?? '', kind: doc.kind ?? 'article',
    topic: doc.topic, category: doc.category ?? '', tags: doc.tags ?? [],
    featuredImage: doc.featuredImage?.src ? { src: doc.featuredImage.src, alt: doc.featuredImage.alt ?? '' } : null,
    authoredAt: normalizedDate(doc.authoredAt),
    extraFrontmatter: doc.extraFrontmatter ?? null, body,
  }
}

export const automateWiki: CollectionBeforeValidateHook = async ({ data, originalDoc, operation, req }) => {
  if (!data) return data
  const original = originalDoc as Data | undefined
  const preserve = req.context.preserveWikiMetadata || req.context.richTextMigration || req.context.isRestoringVersion
  const merged = { ...original, ...data }
  const topic = String(merged.topic || '')
  if (preserve) return data
  if (!prefixes[topic]) fail(req, 'topic', 'Choose a topic before saving this post.')
  const now = new Date().toISOString()
  if (operation === 'create') {
    if (!data.articleId) data.articleId = `${prefixes[topic]}-${now.slice(0, 10).replaceAll('-', '')}-${randomBytes(8).toString('hex').toUpperCase()}`
    if (!data.sourcePath) data.sourcePath = `${topic}/${data.articleId}.md`
    data.kind ??= 'article'
    data.tags ??= []
    data.authoredAt ||= now
    data.revisedAt ||= data.authoredAt
    if (!data.slug && generatedArticlePattern.test(String(data.articleId)) && titleSlug(String(data.title || ''))) data.slug = await uniqueSlug(req, String(data.title), String(data.articleId))
  } else if (original) {
    // Stable identities survive title/topic edits and preserve old URL fallback
    // behavior even for imported documents that never had an explicit slug.
    data.articleId = original.articleId
    data.sourcePath = original.sourcePath
    data.slug = original.slug
    data.revisedAt = original.revisedAt
    if (!original.slug && generatedArticlePattern.test(String(original.articleId)) && titleSlug(String(merged.title || ''))) {
      const history = await req.payload.findVersions({ collection: 'wiki', where: { and: [{ parent: { equals: original.id } }, { 'version._status': { equals: 'published' } }] }, limit: 1, depth: 0, overrideAccess: true, req })
      if (!history.docs.length) data.slug = await uniqueSlug(req, String(merged.title), String(original.articleId))
    }
  }
  const publishing = (data._status ?? original?._status) === 'published'
  if (operation === 'update' && original && (data.authoredAt == null || data.authoredAt === '')) data.authoredAt = original.authoredAt
  const finalOutgoing = { ...original, ...data }
  await validateTaxonomy(req, finalOutgoing, original, publishing)
  if (operation === 'update' && original && publishing) {
    const live = await req.payload.findByID({ collection: 'wiki', id: original.id, draft: false, depth: 0, overrideAccess: true, req }) as unknown as Data
    if (live._status !== 'published' || !same(await meaningfulContent(live, req), await meaningfulContent(finalOutgoing, req))) data.revisedAt = now
  }
  return data
}
