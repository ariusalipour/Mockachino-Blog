import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { getPayload, type Payload } from 'payload'
import { markdownToRichText, richTextToMarkdown } from '../src/richtext'

let payload: Payload, directory: string, editorID: number
before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'cms-scheduled-publishing-'))
  Object.assign(process.env, { PAYLOAD_SECRET: randomBytes(32).toString('hex'), CMS_DATA_DIR: directory, DATABASE_URL: `file:${path.join(directory, 'payload.db')}`, NODE_ENV: 'production' })
  delete process.env.CMS_ADMIN_EMAIL; delete process.env.CMS_ADMIN_PASSWORD
  execFileSync(process.execPath, ['node_modules/payload/bin.js', 'migrate'], { env: process.env, stdio: 'pipe' })
  const { default: config } = await import('../src/payload.config')
  payload = await getPayload({ config })
  editorID = (await payload.create({ collection: 'users', data: { email: 'scheduler@example.test', password: randomBytes(32).toString('hex') }, overrideAccess: true })).id
  await payload.create({ collection: 'categories', overrideAccess: true, data: { sourcePath: 'codes-software-tools.md', topic: 'codes', name: 'Software tools', description: 'A test category', _status: 'published' } })
})
after(async () => { if (payload) await payload.destroy(); if (directory) await rm(directory, { recursive: true, force: true }) })
const draft = (title: string) => payload.create({ collection: 'wiki', overrideAccess: true, draft: true, data: { topic: 'codes', category: 'software-tools', title, summary: 'Scheduled article summary', content: markdownToRichText('Original **formatted** content.') as any, _status: 'draft' } })
const queue = (id: number, type: 'publish' | 'unpublish', waitUntil = new Date(Date.now() - 1000)) => payload.jobs.queue({ task: 'schedulePublish', input: { type, doc: { relationTo: 'wiki', value: id }, user: { relationTo: 'users', value: editorID } }, waitUntil })
const publicDocs = () => payload.find({ collection: 'wiki', draft: false, overrideAccess: false, pagination: false })
const run = () => payload.jobs.run({ queue: 'default', sequential: true, silent: true })

test('only wiki enables scheduling, London is the default timezone, and anonymous jobs access is denied', async () => {
  for (const collection of payload.config.collections.filter(collection => ['wiki', 'tags', 'categories', 'projects'].includes(collection.slug))) {
    const drafts = collection.versions && collection.versions.drafts
    assert.equal(Boolean(drafts && drafts.schedulePublish), collection.slug === 'wiki')
  }
  assert.equal(payload.config.admin.timezones.defaultTimezone, 'Europe/London')
  await assert.rejects(payload.jobs.queue({ task: 'schedulePublish', input: {}, overrideAccess: false }))
  await assert.rejects(payload.jobs.run({ overrideAccess: false, silent: true }))
  await assert.rejects(payload.find({ collection: 'payload-jobs', overrideAccess: false }))
})

test('a future job keeps the draft private, then native publishing releases the latest visual content with stable metadata', async () => {
  const original = await draft('Scheduled wiki article')
  const job = await queue(original.id, 'publish', new Date(Date.now() + 60 * 60 * 1000))
  assert.equal(job.queue, 'default')
  await run()
  assert.ok(!(await publicDocs()).docs.some(doc => doc.id === original.id))
  const edited = await payload.update({ collection: 'wiki', id: original.id, draft: true, overrideAccess: true, data: { content: markdownToRichText('Latest **formatted** content with a [link](https://example.com).') } })
  await payload.update({ collection: 'payload-jobs', id: job.id, overrideAccess: true, data: { waitUntil: new Date(Date.now() - 1000).toISOString() } })
  await run()
  const published = (await publicDocs()).docs.find(doc => doc.id === original.id)!
  assert.ok(published)
  assert.equal(published._status, 'published')
  assert.equal(published.articleId, original.articleId); assert.equal(published.sourcePath, original.sourcePath)
  assert.equal(published.slug, original.slug); assert.equal(published.authoredAt, original.authoredAt)
  assert.equal(richTextToMarkdown(published.content), richTextToMarkdown(edited.content))
  const finished = await payload.findByID({ collection: 'payload-jobs', id: job.id, overrideAccess: true })
  assert.ok(finished.completedAt); assert.equal(finished.hasError, false)
})

test('scheduled changed publications advance the revised date, no-op publications preserve it, and unpublishing removes public content', async () => {
  const original = await draft('Published then revised')
  await queue(original.id, 'publish'); await run()
  const published = await payload.findByID({ collection: 'wiki', id: original.id, draft: false, overrideAccess: true })
  await queue(original.id, 'publish'); await run()
  const unchanged = await payload.findByID({ collection: 'wiki', id: original.id, draft: false, overrideAccess: true })
  assert.equal(unchanged.revisedAt, published.revisedAt)
  await payload.update({ collection: 'wiki', id: original.id, draft: true, overrideAccess: true, data: { summary: 'Changed summary awaiting its scheduled release' } })
  assert.equal((await payload.findByID({ collection: 'wiki', id: original.id, draft: false, overrideAccess: true })).summary, published.summary)
  await queue(original.id, 'publish'); await run()
  const revised = await payload.findByID({ collection: 'wiki', id: original.id, draft: false, overrideAccess: true })
  assert.ok(new Date(String(revised.revisedAt)).getTime() > new Date(String(published.revisedAt)).getTime())
  assert.equal(revised.authoredAt, original.authoredAt)
  await queue(original.id, 'unpublish'); await run()
  assert.ok(!(await publicDocs()).docs.some(doc => doc.id === original.id))
})

test('cancelled scheduled jobs never publish their drafts and invalid drafts fail without leaking', async () => {
  const cancelled = await draft('Cancelled scheduled article')
  const job = await queue(cancelled.id, 'publish')
  await payload.jobs.cancelByID({ id: job.id })
  await run()
  assert.ok(!(await publicDocs()).docs.some(doc => doc.id === cancelled.id))
  const invalid = await payload.create({ collection: 'wiki', overrideAccess: true, draft: true, data: { topic: 'codes', _status: 'draft' } })
  const invalidJob = await queue(invalid.id, 'publish')
  await run()
  const failed = await payload.findByID({ collection: 'payload-jobs', id: invalidJob.id, overrideAccess: true })
  assert.equal(failed.hasError, true)
  assert.ok(!(await publicDocs()).docs.some(doc => doc.id === invalid.id))
})
