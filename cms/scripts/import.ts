import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload, type CollectionSlug, type RequiredDataFromCollectionSlug } from 'payload'
import { collectionSlugs, fromSiteDocument, type SiteDocument } from '../src/site-content'

// Run with `npm exec -- tsx scripts/import.ts ../work/cms-seed/content.json ../public`.
// No network API credential is required: this is an explicit server-side Local API operation.
// Existing documents/media are never overwritten; reruns resume a partial import safely.
const cmsRoot = fileURLToPath(new URL('../', import.meta.url))
try { process.loadEnvFile(path.join(cmsRoot, '.env')) }
catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }

const manifestPath = path.resolve(process.argv[2] || path.join(cmsRoot, '../work/cms-seed/content.json'))
const publicRoot = path.resolve(process.argv[3] || path.join(cmsRoot, '../public'))
type MediaEntry = { sourcePath: string; bytes: number; sha256: string }
type Manifest = { version: number; collections: Record<string, SiteDocument[]>; media: MediaEntry[] }
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Manifest
function safePath(value: string, extension?: string) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.includes('\0') || value.includes(':') || value.startsWith('/') || value.split('/').some(part => !part || part === '.' || part === '..') || (extension && !value.endsWith(extension))) throw new Error(`Unsafe sourcePath: ${value}`)
  return value
}
if (![1, 2].includes(manifest.version) || !manifest.collections || !Array.isArray(manifest.media)) throw new Error('Invalid seed manifest')
for (const slug of collectionSlugs) {
  if (manifest.version === 1 && ['courses', 'course-lessons', 'quizzes'].includes(slug) && manifest.collections[slug] === undefined) manifest.collections[slug] = []
  if (!Array.isArray(manifest.collections[slug])) throw new Error(`Missing seed collection: ${slug}`)
  const keys = new Set<string>()
  for (const doc of manifest.collections[slug]) {
    safePath(doc.sourcePath, '.md')
    if (typeof doc.body !== 'string' || !doc.data || typeof doc.data !== 'object') throw new Error(`Invalid seed document: ${doc.sourcePath}`)
    if (keys.has(doc.sourcePath.toLowerCase())) throw new Error(`Duplicate sourcePath: ${doc.sourcePath}`)
    keys.add(doc.sourcePath.toLowerCase())
  }
}
// Check all input files and hashes before modifying the database.
for (const media of manifest.media) {
  safePath(media.sourcePath)
  const content = await readFile(path.join(publicRoot, media.sourcePath))
  if (content.length !== media.bytes || createHash('sha256').update(content).digest('hex') !== media.sha256) throw new Error(`Seed media checksum mismatch: ${media.sourcePath}`)
}
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
const report: Record<string, { created: number; skipped: number }> = {}
try {
  for (const slug of [...collectionSlugs.filter(slug => slug !== 'courses'), 'courses'] as typeof collectionSlugs[number][]) {
    report[slug] = { created: 0, skipped: 0 }
    for (const entry of manifest.collections[slug]) {
      const existing = await payload.find({ collection: slug as CollectionSlug, where: { sourcePath: { equals: entry.sourcePath } }, limit: 1, depth: 0, overrideAccess: true, draft: true })
      if (existing.docs.length) { report[slug].skipped++; continue }
      const imported: Record<string, unknown> = fromSiteDocument(slug, entry)
      if (slug === 'courses') {
        const resolve = async (collection: 'course-lessons' | 'quizzes', key: string) => {
          const found = await payload.find({collection, where:{slug:{equals:key}},limit:1,depth:0,overrideAccess:true})
          if (!found.docs.length) throw new Error(`Missing ${collection} item ${key}`)
          return found.docs[0].id
        }
        imported.lessons = await Promise.all(((entry.data.lessons || []) as any[]).map(async row => ({lesson:await resolve('course-lessons',row.lesson),...(row.quiz ? {quiz:await resolve('quizzes',row.quiz)} : {})})))
        if (entry.data.finalQuiz) imported.finalQuiz = await resolve('quizzes',String(entry.data.finalQuiz))
      }
      const data = { ...imported, _status: 'published' } as RequiredDataFromCollectionSlug<typeof slug>
      await payload.create({ collection: slug, data, overrideAccess: true, context: { skipRebuild: true }, draft: false })
      report[slug].created++
    }
  }
  report.media = { created: 0, skipped: 0 }
  for (const media of manifest.media) {
    const existing = await payload.find({ collection: 'media', where: { sourcePath: { equals: media.sourcePath } }, limit: 1, depth: 0, overrideAccess: true })
    if (existing.docs.length) { report.media.skipped++; continue }
    await payload.create({ collection: 'media', data: { sourcePath: media.sourcePath, alt: path.basename(media.sourcePath, path.extname(media.sourcePath)).replace(/[-_]+/g, ' ') }, filePath: path.join(publicRoot, media.sourcePath), overrideAccess: true, context: { skipRebuild: true } })
    report.media.created++
  }
  const dataRoot = path.resolve(process.env.CMS_DATA_DIR || './data')
  await mkdir(dataRoot, { recursive: true })
  const marker = path.join(dataRoot, 'import-complete')
  await writeFile(`${marker}.tmp`, JSON.stringify({ completedAt: new Date().toISOString(), manifestHash: createHash('sha256').update(await readFile(manifestPath)).digest('hex'), report }) + '\n')
  await rename(`${marker}.tmp`, marker)
  console.log(JSON.stringify({ imported: true, report }, null, 2))
} finally {
  await payload.destroy()
}
