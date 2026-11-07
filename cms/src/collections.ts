import type { Access, CollectionConfig, Field, DateField, TextField, JSONField } from 'payload'
import { websiteEditor } from './editor'
import { contentHash, markdownToRichText, richTextToMarkdown, type MediaRecord } from './richtext'
import { createHash } from 'node:crypto'
import { automateWiki, topicOptions } from './wiki-authoring'

export const authenticated: Access = ({ req }) => Boolean(req.user)
export const publishedOrAuthenticated: Access = ({ req }) => req.user ? true : { _status: { equals: 'published' } }
const topics = ['shoots', 'plays', 'codes']
const text = (name: string, required = true): Field => ({ name, type: 'text', required })
const textarea = (name: string, required = true): Field => ({ name, type: 'textarea', required })
const date = (name: string, label: string): DateField => ({ name, label, type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } })
const tags: Field = { name: 'tags', type: 'json', defaultValue: [], required: true, admin: { description: 'Array of tag slugs, for example ["ipsc", "projects"].' }, validate: (value: unknown) => Array.isArray(value) && value.every(v => typeof v === 'string') || 'Enter an array of tag slugs.' }
const baseFields: Field[] = [
  { name: 'sourcePath', label: 'Content filename', type: 'text', required: true, unique: true, index: true, admin: { description: 'Stable filename within this content collection, including .md. Keep it unchanged to preserve URLs (for example shoots/SHO-EXP-001.md).' }, validate: (value: unknown) => typeof value === 'string' && value.endsWith('.md') && !value.includes('\\') && !value.includes(':') && !value.includes('\0') && !value.startsWith('/') && value.split('/').every(p => p.length > 0 && p !== '.' && p !== '..') || 'Use a relative Markdown filename without parent directories.' },
  { name: 'content', label: 'Content', type: 'richText', editor: websiteEditor },
  { name: 'body', label: 'Original Markdown backup', type: 'textarea', admin: { hidden: true, readOnly: true }, access: { create: () => false, update: () => false } },
  { name: 'contentMigration', type: 'json', admin: { hidden: true, readOnly: true }, access: { create: () => false, update: () => false } },
  { name: 'extraFrontmatter', label: 'Additional metadata', type: 'json', admin: { position: 'sidebar', description: 'Preserves metadata imported from the original Markdown files.' } },
]
function content(slug: CollectionConfig['slug'], title: string, fields: Field[]): CollectionConfig {
  return {
    slug,
    admin: { useAsTitle: title, group: 'Website content', defaultColumns: [title, '_status', 'sourcePath'] },
    access: { read: publishedOrAuthenticated, create: authenticated, update: authenticated, delete: authenticated },
    versions: { drafts: true, maxPerDoc: 20 },
    hooks: { beforeValidate: [async ({data, req, operation, originalDoc}) => {
      if (!data) return data
      const mayInitializeLegacy = operation === 'create' || req.context.isRestoringVersion || req.context.richTextMigration || (!originalDoc?.contentMigration && !originalDoc?.content)
      const needsConversion = mayInitializeLegacy && !data.content && typeof data.body === 'string' && data.body.length > 0
      if (needsConversion || data.content) {
        const media = await req.payload.find({collection:'media',pagination:false,depth:0,overrideAccess:true,req})
        const mediaByID = new Map(media.docs.map(doc=>[String(doc.id),doc as MediaRecord]))
        const mediaBySource = new Map(media.docs.flatMap(doc=>doc.sourcePath ? [[`/${doc.sourcePath.replace(/^\//,'')}`,doc as MediaRecord] as const] : []))
        if (needsConversion) {
          data.content = markdownToRichText(data.body, {mediaBySource})
          data.contentMigration = {version:1,lexicalHash:contentHash(data.content),markdownHash:createHash('sha256').update(data.body).digest('hex')}
        }
        richTextToMarkdown(data.content, {mediaByID}) // Fail before saving unsupported or broken editor nodes.
      }
      return data
    }, ...(slug === 'wiki' ? [automateWiki] : [])] },
    fields: slug === 'wiki' ? fields : [baseFields[0], ...fields, ...baseFields.slice(1)],
  }
}
export const contentCollections: CollectionConfig[] = [
  content('topics', 'name', [text('name'), text('shortName'), text('strapline'), text('accent'), text('icon'), { name: 'homeStats', type: 'group', fields: ['reviews', 'articles', 'guides'].map(name => ({ name, type: 'number', min: 0 })) }]),
  content('categories', 'name', [{name: 'topic', type: 'select', required: true, options: topics}, text('name'), textarea('description')]),
  content('tags', 'label', [text('label')]),
  content('glossary', 'term', [text('term'), textarea('definition')]),
  content('wiki', 'title', [
    { name: 'topic', label: 'Topic', type: 'select', required: true, options: topicOptions },
    { name: 'category', label: 'Category', type: 'text', required: true, admin: { components: { Field: './components/WikiTaxonomy#WikiCategory' } } },
    { ...tags, label: 'Tags', admin: { components: { Field: './components/WikiTaxonomy#WikiTags' } } },
    text('title'), textarea('summary'),
    { name: 'kind', label: 'Post type', type: 'select', required: true, defaultValue: 'article', options: [{ label: 'Article', value: 'article' }, { label: 'Review', value: 'review' }, { label: 'Guide', value: 'guide' }] },
    baseFields[1],
    { name: 'featuredImage', type: 'group', fields: [text('src', false), text('alt', false)] },
    { type: 'collapsible', label: 'Publishing details', admin: { initCollapsed: true }, fields: [
      { ...(baseFields[0] as TextField), required: false, admin: { readOnly: true, description: 'Generated on first save and kept stable when the title or topic changes.' }, validate: (value: unknown) => !value || typeof value === 'string' && value.endsWith('.md') && !value.includes('\\') && !value.includes(':') && !value.includes('\0') && !value.startsWith('/') && value.split('/').every(part => part && part !== '.' && part !== '..') || 'Invalid content filename.' },
      { name: 'articleId', label: 'Article ID', type: 'text', admin: { readOnly: true, description: 'Generated automatically on first save.' } },
      { name: 'slug', label: 'Website address', type: 'text', admin: { readOnly: true, description: 'Generated when a new post first has a title, then kept stable.' } },
      { ...date('authoredAt', 'Publication date'), required: false, admin: { readOnly: true, description: 'Set automatically; original publication dates are preserved.' } },
      { ...date('revisedAt', 'Content updated date'), required: false, admin: { readOnly: true, description: 'Updated when changed content is published.' } },
      { ...(baseFields[4] as JSONField), admin: { description: 'Additional metadata retained from the original post.' } },
    ] },
    baseFields[2], baseFields[3],
  ]),
  content('projects', 'name', [text('name'), textarea('summary'), text('status'), date('revisedAt', 'Content updated date'), text('repository', false), text('liveUrl', false), tags]),
  content('project-updates', 'title', [text('project'), text('slug', false), text('title'), textarea('summary'), date('authoredAt', 'Publication date'), date('revisedAt', 'Content updated date'), tags]),
]
export const Users: CollectionConfig = {
  slug: 'users',
  auth: { tokenExpiration: 7200, maxLoginAttempts: 5, lockTime: 10 * 60 * 1000, cookies: { sameSite: 'Lax', secure: process.env.CMS_PUBLIC_URL?.startsWith('https://') ?? false } },
  admin: { useAsTitle: 'email', group: 'Administration' },
  access: { read: authenticated, create: authenticated, update: authenticated, delete: authenticated },
  fields: [{ name: 'name', type: 'text' }],
}
export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Website content', useAsTitle: 'filename' },
  access: { read: () => true, create: authenticated, update: authenticated, delete: authenticated },
  hooks: { beforeChange: [({data,operation,req}) => { if(operation==='update' && req.file) data.sourcePath=null;return data }] },
  upload: { staticDir: `${process.env.CMS_DATA_DIR || './data'}/media`, mimeTypes: ['image/*', 'application/pdf'], imageSizes: [] },
  fields: [text('alt', false), { name: 'sourcePath', type: 'text', unique: true, index: true, admin: { description: 'Original public asset path, for imported files.' } }],
}
