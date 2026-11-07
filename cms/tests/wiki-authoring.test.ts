import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { getPayload, type Payload, type RichTextField } from 'payload'
import { editorConfigFactory, getEnabledNodes } from '@payloadcms/richtext-lexical'
import { createHeadlessEditor } from '@payloadcms/richtext-lexical/lexical/headless'
import { generatedArticlePattern } from '../src/wiki-authoring'
import { markdownToRichText } from '../src/richtext'
import { categoryChoices, tagChoices, selectedValues } from '../src/components/taxonomyState'

let payload: Payload, directory: string
before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'cms-wiki-authoring-'))
  Object.assign(process.env, { PAYLOAD_SECRET: randomBytes(32).toString('hex'), CMS_DATA_DIR: directory, DATABASE_URL: `file:${path.join(directory, 'payload.db')}`, NODE_ENV: 'production' })
  delete process.env.CMS_ADMIN_EMAIL; delete process.env.CMS_ADMIN_PASSWORD
  execFileSync(process.execPath, ['node_modules/payload/bin.js', 'migrate'], { env: process.env, stdio: 'pipe' })
  const { default: config } = await import('../src/payload.config')
  payload = await getPayload({ config })
  for (const topic of ['shoots', 'plays', 'codes']) await payload.create({ collection: 'categories', overrideAccess: true, data: { sourcePath: `${topic}-gear-and-hardware.md`, topic: topic as 'shoots', name: 'Gear and hardware', description: 'A test category', _status: 'published' } })
  await payload.create({ collection: 'categories', overrideAccess: true, data: { sourcePath: 'codes-software-tools.md', topic: 'codes', name: 'Software tools', description: 'A test category', _status: 'published' } })
  for (const [sourcePath, label] of [['OpenAI.md', 'OpenAI'], ['ipsc.md', 'IPSC']]) await payload.create({ collection: 'tags', overrideAccess: true, data: { sourcePath, label, _status: 'published' } })
})
after(async () => { if (payload) await payload.destroy(); if (directory) await rm(directory, { recursive: true, force: true }) })
const create = (data: Record<string, unknown>, draft = true) => payload.create({ collection: 'wiki', overrideAccess: true, draft, data: { _status: draft ? 'draft' : 'published', ...data } as any })
const update = (id: number, data: Record<string, unknown>, draft = true) => payload.update({ collection: 'wiki', id, overrideAccess: true, draft, data: { _status: draft ? 'draft' : 'published', ...data } as any })

test('a topic-only draft receives a stable identity and dates without requiring technical input', async () => {
  const draft = await create({ topic: 'shoots' })
  assert.match(String(draft.articleId), generatedArticlePattern)
  assert.equal(draft.sourcePath, `shoots/${draft.articleId}.md`)
  assert.ok(draft.authoredAt && draft.revisedAt)
  assert.equal(draft.kind, 'article'); assert.deepEqual(draft.tags, [])
  assert.ok(!draft.slug)
  const titled = await update(draft.id, { title: 'A new shooting article', category: 'gear-and-hardware', tags: ['ipsc'] })
  assert.match(String(titled.slug), /^a-new-shooting-article-[a-f0-9]{16}$/)
  const moved = await update(draft.id, { topic: 'codes', category: 'software-tools', title: 'A completely different title' })
  assert.equal(moved.articleId, draft.articleId); assert.equal(moved.sourcePath, draft.sourcePath)
  assert.equal(moved.slug, titled.slug); assert.equal(moved.authoredAt, draft.authoredAt)
  const published = await update(draft.id, { summary: 'A finished summary' }, false)
  assert.equal(published._status, 'published'); assert.equal(published.slug, titled.slug)
})

test('new posts default to first-save date and published posts can be backdated', async () => {
  const beforeSave = Date.now()
  const draft = await create({ topic: 'codes' })
  const afterSave = Date.now()
  const createdDate = new Date(String(draft.authoredAt)).getTime()
  assert.ok(createdDate >= beforeSave - 1000 && createdDate <= afterSave + 1000)
  const publicationDate = '2019-04-12T00:00:00.000Z'
  const published = await update(draft.id, { category: 'software-tools', title: 'Backdated post', summary: 'Summary', authoredAt: publicationDate }, false)
  assert.equal(published.authoredAt, publicationDate)
})

test('same-title posts get collision-safe identities and URLs, including private drafts', async () => {
  const left = await create({ topic: 'codes', title: 'Same title' })
  const right = await create({ topic: 'codes', title: 'Same title' })
  assert.notEqual(left.articleId, right.articleId)
  assert.notEqual(left.sourcePath, right.sourcePath)
  assert.notEqual(left.slug, right.slug)
  const publicRead = await payload.find({ collection: 'wiki', overrideAccess: false, draft: false, pagination: false })
  assert.ok(publicRead.docs.every(doc => doc.id !== left.id && doc.id !== right.id))
})

test('category choices are scoped by topic and tag selection preserves existing case', () => {
  const categories = [
    { sourcePath: 'shoots-gear-and-hardware.md', topic: 'shoots', name: 'Shooting gear' },
    { sourcePath: 'codes-gear-and-hardware.md', topic: 'codes', name: 'Computer gear' },
  ]
  assert.deepEqual(categoryChoices(categories, 'shoots'), [{ label: 'Shooting gear', value: 'gear-and-hardware' }])
  assert.deepEqual(categoryChoices(categories, 'plays'), [])
  const options = tagChoices([{ sourcePath: 'OpenAI.md', label: 'OpenAI' }], ['OpenAI'])
  assert.equal(options[0].value, 'OpenAI')
  assert.equal(tagChoices([{ sourcePath: 'OpenAI.md', label: 'OpenAI' }])[0].value, 'openai')
  assert.deepEqual(selectedValues([{ label: 'OpenAI', value: 'OpenAI' }, { label: 'IPSC', value: 'ipsc' }]), ['OpenAI', 'ipsc'])
})

test('server rejects a category from another topic and unknown tags even when the UI is bypassed', async () => {
  await assert.rejects(create({ topic: 'shoots', category: 'software-tools' }), /category/i)
  await assert.rejects(create({ topic: 'shoots', tags: ['not-in-catalogue'] }), /tag/i)
  await assert.rejects(create({ title: 'Missing topic' }), /topic/i)
  await assert.rejects(create({ topic: 'shoots', title: 'Incomplete publication', summary: 'Summary' }, false), /category/i)
})

test('legacy IDs, source paths, explicit URLs and blank URL fallbacks remain immutable', async () => {
  const original = await create({ topic: 'codes', category: 'software-tools', articleId: 'AIC-TOK-USE', sourcePath: 'codes/AIC-TOK-USE.md', title: 'Legacy', summary: 'Legacy summary', tags: ['OpenAI'], authoredAt: '2020-01-01T00:00:00.000Z', revisedAt: '2021-01-01T00:00:00.000Z' }, false)
  assert.ok(!original.slug)
  const changed = await update(original.id, { title: 'A renamed legacy article', articleId: 'CHANGED', sourcePath: 'changed.md', slug: 'changed-address' })
  assert.equal(changed.articleId, 'AIC-TOK-USE'); assert.equal(changed.sourcePath, original.sourcePath)
  assert.ok(!changed.slug)
  assert.equal(changed.authoredAt, original.authoredAt); assert.equal(changed.revisedAt, original.revisedAt)
  assert.deepEqual(changed.tags, ['OpenAI'])
})

test('unchanged visual editor roundtrips preserve editorial dates; changed publication advances the update date', async () => {
  const original = await create({ topic: 'codes', category: 'software-tools', articleId: 'COD-OLD-001', sourcePath: 'codes/COD-OLD-001.md', slug: 'old-address', title: 'Published article', summary: 'Summary', tags: ['OpenAI'], content: markdownToRichText('# Heading\n\nA **formatted** paragraph.'), authoredAt: '2020-01-01T00:00:00.000Z', revisedAt: '2021-01-01T00:00:00.000Z' }, false)
  const collection = payload.config.collections.find(collection => collection.slug === 'wiki')!
  const field = collection.fields.find(field => 'name' in field && field.name === 'content') as RichTextField
  const editorConfig = editorConfigFactory.fromField({ field })
  const editor = createHeadlessEditor({ nodes: getEnabledNodes({ editorConfig }), onError: error => { throw error } })
  editor.setEditorState(editor.parseEditorState(JSON.stringify(original.content)))
  const unchanged = await update(original.id, { content: editor.getEditorState().toJSON(), authoredAt: original.authoredAt }, false)
  assert.equal(unchanged.revisedAt, original.revisedAt)
  const draft = await update(original.id, { content: markdownToRichText('A new private draft') })
  assert.equal(draft.revisedAt, original.revisedAt)
  const live = await payload.findByID({ collection: 'wiki', id: original.id, draft: false, overrideAccess: true })
  assert.equal(live.revisedAt, original.revisedAt)
  const published = await update(original.id, {}, false)
  assert.ok(new Date(String(published.revisedAt)).getTime() > new Date(String(original.revisedAt)).getTime())
  assert.equal(published.authoredAt, original.authoredAt)
})

test('a private publication-date edit stays private until publishing the latest draft', async () => {
  const original = await create({ topic: 'codes', category: 'software-tools', title: 'Date isolation', summary: 'Summary', tags: [], authoredAt: '2020-01-01T00:00:00.000Z' }, false)
  const privateDate = '2010-01-01T00:00:00.000Z'
  const draft = await update(original.id, { authoredAt: privateDate })
  assert.equal(draft.authoredAt, privateDate)
  const liveBeforePublish = await payload.findByID({ collection: 'wiki', id: original.id, draft: false, overrideAccess: true })
  assert.equal(liveBeforePublish.authoredAt, original.authoredAt)
  const published = await update(original.id, {}, false)
  assert.equal(published.authoredAt, privateDate)
  assert.ok(new Date(String(published.revisedAt)).getTime() > new Date(String(original.revisedAt)).getTime())
})
