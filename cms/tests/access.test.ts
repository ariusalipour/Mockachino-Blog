import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { getPayload, type Payload, type RequiredDataFromCollectionSlug } from 'payload'
import { fromSiteDocument, toSiteDocument } from '../src/site-content'

let payload: Payload
let dir: string
before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'mockachino-cms-test-'))
  process.env.PAYLOAD_SECRET = randomBytes(32).toString('hex')
  process.env.CMS_DATA_DIR = dir
  process.env.DATABASE_URL = `file:${path.join(dir, 'payload.db')}`
  Object.assign(process.env, { NODE_ENV: 'production' })
  delete process.env.CMS_ADMIN_EMAIL
  delete process.env.CMS_ADMIN_PASSWORD
  // Exercise the same migration path used on the NAS, against an isolated DB.
  execFileSync(process.execPath, ['node_modules/payload/bin.js', 'migrate'], { env: process.env, stdio: 'pipe' })
  const { default: config } = await import('../src/payload.config')
  payload = await getPayload({ config })
})
after(async () => {
  if (payload) await payload.destroy()
  if (dir) await rm(dir, { recursive: true, force: true })
})
test('anonymous users cannot register or mutate content', async () => {
  await assert.rejects(payload.create({ collection: 'users', data: { email: 'visitor@example.invalid', password: randomBytes(24).toString('hex') }, overrideAccess: false }))
  await assert.rejects(payload.create({ collection: 'tags', data: { sourcePath: 'unauthorized.md', label: 'Unauthorized' }, overrideAccess: false }))
})
test('anonymous reads return published content and never drafts, including draft queries', async () => {
  const published = await payload.create({ collection: 'tags', data: { sourcePath: 'published.md', label: 'Public', body: 'Published body', _status: 'published' }, overrideAccess: true })
  const draft = await payload.create({ collection: 'tags', data: { sourcePath: 'draft.md', label: 'Secret draft', _status: 'draft' }, draft: true, overrideAccess: true })
  await payload.update({ collection: 'tags', id: published.id, data: { label: 'DRAFT SECRET MARKER', _status: 'draft' }, draft: true, overrideAccess: true })
  for (const draftOption of [false, true]) {
    const result = await payload.find({ collection: 'tags', overrideAccess: false, draft: draftOption })
    assert.ok(result.docs.every(doc => doc.label !== 'DRAFT SECRET MARKER'))
    if (!draftOption) assert.deepEqual(result.docs.map(doc => doc.id), [published.id])
    const versions = await payload.findVersions({ collection: 'tags', where: { parent: { equals: published.id } }, overrideAccess: false }).catch(() => ({ docs: [] }))
    assert.ok(versions.docs.every(doc => doc.version.label !== 'DRAFT SECRET MARKER'))
  }
  await assert.rejects(payload.findByID({ collection: 'tags', id: draft.id, overrideAccess: false, draft: true }))
  await assert.rejects(payload.update({ collection: 'tags', id: published.id, data: {label: 'Changed'}, overrideAccess: false }))
  await assert.rejects(payload.delete({ collection: 'tags', id: published.id, overrideAccess: false }))
})
test('editorial dates, Markdown and additional frontmatter survive database storage', async () => {
  await payload.create({ collection: 'categories', data: { sourcePath: 'shoots-experiences.md', topic: 'shoots', name: 'Experiences', description: 'Test category', _status: 'published' }, overrideAccess: true })
  await payload.create({ collection: 'tags', data: { sourcePath: 'ipsc.md', label: 'IPSC', _status: 'published' }, overrideAccess: true })
  const entry = { sourcePath: 'shoots/round-trip.md', body: '\n# Unchanged\n\n![Image](/images/example.png)\n', data: { articleId: 'TEST-001', slug: 'shoots/round-trip', title: 'Round trip', summary: 'Test summary', kind: 'article', topic: 'shoots', category: 'experiences', createdAt: '2024-01-01T10:20:30.000Z', updatedAt: '2025-02-02T11:22:33.000Z', tags: ['ipsc'], legacyField: { nested: ['kept'] } } }
  const doc = await payload.create({ collection: 'wiki', data: { ...fromSiteDocument('wiki', entry), _status: 'published' } as RequiredDataFromCollectionSlug<'wiki'>, overrideAccess: true })
  assert.deepEqual(toSiteDocument('wiki', doc as unknown as Record<string, unknown>), entry)
})
test('unsafe filenames are rejected before they can reach a website build', async () => {
  for (const sourcePath of ['../escape.md', '/absolute.md', 'path/../escape.md', 'C:escape.md', 'bad\0.md']) {
    await assert.rejects(payload.create({ collection: 'tags', data: { sourcePath, label: 'Invalid' }, overrideAccess: true }))
  }
})
