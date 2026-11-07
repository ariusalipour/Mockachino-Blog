import { existsSync } from 'node:fs'
import path from 'node:path'
import config from '@payload-config'
import { getPayload, createLocalReq, initTransaction, commitTransaction, killTransaction } from 'payload'
import { collectionSlugs, toSiteDocument } from '../../../../site-content'
export const dynamic = 'force-dynamic'
export async function GET() {
  if (process.env.CMS_REQUIRE_IMPORT_COMPLETE === '1' && !existsSync(path.resolve(process.env.CMS_DATA_DIR || './data', 'import-complete'))) {
    return Response.json({ error: 'Initial content import is not complete.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
  const payload = await getPayload({ config })
  const req = await createLocalReq({}, payload)
  const startedTransaction = await initTransaction(req)
  try {
  const media = await payload.find({collection:'media',pagination:false,depth:0,overrideAccess:false,req})
  const mediaByID = new Map(media.docs.map(doc => [String(doc.id),doc]))
  const published = await Promise.all(collectionSlugs.map(async collection => {
    const result = await payload.find({ collection, where: { _status: { equals: 'published' } }, draft: false, overrideAccess: false, pagination: false, depth: 0, sort: 'sourcePath', req })
    return [collection, result.docs] as const
  }))
  const byCollection = new Map<string, readonly any[]>(published)
  const lessonSlugsByID = new Map((byCollection.get('course-lessons') || []).map(doc => [String(doc.id), String(doc.slug)]))
  const quizSlugsByID = new Map((byCollection.get('quizzes') || []).map(doc => [String(doc.id), String(doc.slug)]))
  const collections = Object.fromEntries(published.map(([collection, docs]) => [collection, docs.map(doc => toSiteDocument(collection, doc as unknown as Record<string, unknown>, {mediaByID, lessonSlugsByID, quizSlugsByID}))]))
  if (startedTransaction) await commitTransaction(req)
  const counts = Object.fromEntries(Object.entries(collections).map(([slug, docs]) => [slug, (docs as unknown[]).length]))
  return Response.json({ version: 2, complete: true, collections, counts }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (startedTransaction) await killTransaction(req)
    throw error
  }
}
