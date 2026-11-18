import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { getPayload, type Payload } from 'payload'
import { markdownToRichText } from '../src/richtext'
import { toSiteDocument, fromSiteDocument } from '../src/site-content'

let payload: Payload, dir: string
before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'cms-project-policies-'))
  Object.assign(process.env, { PAYLOAD_SECRET: randomBytes(32).toString('hex'), CMS_DATA_DIR: dir, DATABASE_URL: `file:${path.join(dir, 'payload.db')}`, NODE_ENV: 'production' })
  delete process.env.CMS_ADMIN_EMAIL; delete process.env.CMS_ADMIN_PASSWORD
  execFileSync(process.execPath, ['node_modules/payload/bin.js', 'migrate'], { env: process.env, stdio: 'pipe' })
  const { default: config } = await import('../src/payload.config')
  payload = await getPayload({ config })
})
after(async () => {
  if (payload) { await payload.destroy(); (payload.db as any).client?.close() }
  if (dir) await rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
})
const data = (project = 'capsule', type = 'privacy') => ({ project, type, title: 'Privacy Policy', effectiveAt: '2026-11-18T00:00:00.000Z', content: markdownToRichText('Contact **support** for deletion.') })

test('policy drafts are private, retain visual content, reserve canonical identity and reject duplicates', async () => {
  const policy = await payload.create({ collection: 'project-policies', overrideAccess: true, draft: true, data: data() as any })
  assert.equal(policy.sourcePath, 'capsule/privacy.md')
  await assert.rejects(payload.findByID({ collection: 'project-policies', id: policy.id, overrideAccess: false, draft: true }))
  await assert.rejects(payload.create({ collection: 'project-policies', overrideAccess: true, draft: true, data: data() as any }), /policy|type/i)
  await assert.rejects(payload.update({ collection: 'project-policies', id: policy.id, overrideAccess: true, draft: true, data: { type: 'terms' } }), /project/i)
  const updated = await payload.update({ collection: 'project-policies', id: policy.id, overrideAccess: true, draft: true, data: { sourcePath: 'changed.md', title: 'Changed policy' } })
  assert.equal(updated.sourcePath, policy.sourcePath)
  const exported = toSiteDocument('project-policies', updated as any)
  assert.equal(exported.data.project, 'capsule'); assert.equal(exported.data.type, 'privacy')
  assert.equal(exported.data.effectiveAt, data().effectiveAt)
  assert.match(exported.body, /\*\*support\*\*/)
  assert.equal((fromSiteDocument('project-policies', exported) as Record<string, unknown>).revisedAt, updated.revisedAt)
})

test('publication requires published matching project and does not leak later draft policy edits', async () => {
  const draft = await payload.create({ collection: 'project-policies', overrideAccess: true, draft: true, data: data('another', 'terms') as any })
  await assert.rejects(payload.update({ collection: 'project-policies', id: draft.id, overrideAccess: true, data: { _status: 'published' } }), /project/i)
  const project = await payload.create({ collection: 'projects', overrideAccess: true, draft: true, data: { sourcePath: 'another.md', name: 'Another project', summary: 'Summary', status: 'active', tags: [], revisedAt: new Date().toISOString() } })
  await assert.rejects(payload.update({ collection: 'project-policies', id: draft.id, overrideAccess: true, data: { _status: 'published' } }), /project/i)
  await payload.update({ collection: 'projects', id: project.id, overrideAccess: true, data: { _status: 'published' } })
  await assert.rejects(payload.update({ collection: 'project-policies', id: draft.id, overrideAccess: true, data: { content: markdownToRichText('') as any, _status: 'published' } }), /content/i)
  const published = await payload.update({ collection: 'project-policies', id: draft.id, overrideAccess: true, data: { _status: 'published' } })
  await payload.update({ collection: 'project-policies', id: draft.id, overrideAccess: true, draft: true, data: { title: 'PRIVATE changed title' } })
  const live = await payload.findByID({ collection: 'project-policies', id: draft.id, overrideAccess: false, draft: false })
  assert.equal(live.title, published.title)
  assert.equal((await payload.find({ collection: 'project-updates', overrideAccess: false, pagination: false })).docs.length, 0)
})
