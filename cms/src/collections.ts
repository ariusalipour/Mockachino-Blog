import type { Access, CollectionConfig, Field } from 'payload'

export const authenticated: Access = ({ req }) => Boolean(req.user)
export const publishedOrAuthenticated: Access = ({ req }) => req.user ? true : { _status: { equals: 'published' } }
const topics = ['shoots', 'plays', 'codes']
const text = (name: string, required = true): Field => ({ name, type: 'text', required })
const textarea = (name: string, required = true): Field => ({ name, type: 'textarea', required })
const date = (name: string, label: string): Field => ({ name, label, type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } })
const tags: Field = { name: 'tags', type: 'json', defaultValue: [], required: true, admin: { description: 'Array of tag slugs, for example ["ipsc", "projects"].' }, validate: (value: unknown) => Array.isArray(value) && value.every(v => typeof v === 'string') || 'Enter an array of tag slugs.' }
const baseFields: Field[] = [
  { name: 'sourcePath', label: 'Content filename', type: 'text', required: true, unique: true, index: true, admin: { description: 'Stable filename within this content collection, including .md. Keep it unchanged to preserve URLs (for example shoots/SHO-EXP-001.md).' }, validate: (value: unknown) => typeof value === 'string' && value.endsWith('.md') && !value.includes('\\') && !value.includes(':') && !value.includes('\0') && !value.startsWith('/') && value.split('/').every(p => p.length > 0 && p !== '.' && p !== '..') || 'Use a relative Markdown filename without parent directories.' },
  { name: 'body', label: 'Article content (Markdown)', type: 'textarea', admin: { rows: 24, description: 'Standard Markdown. Existing images use /images/...; for new uploads copy the media URL into Markdown.' } },
  { name: 'extraFrontmatter', label: 'Additional metadata', type: 'json', admin: { position: 'sidebar', description: 'Preserves metadata imported from the original Markdown files.' } },
]
function content(slug: CollectionConfig['slug'], title: string, fields: Field[]): CollectionConfig {
  return {
    slug,
    admin: { useAsTitle: title, group: 'Website content', defaultColumns: [title, '_status', 'sourcePath'] },
    access: { read: publishedOrAuthenticated, create: authenticated, update: authenticated, delete: authenticated },
    versions: { drafts: true, maxPerDoc: 20 },
    fields: [baseFields[0], ...fields, ...baseFields.slice(1)],
  }
}
export const contentCollections: CollectionConfig[] = [
  content('topics', 'name', [text('name'), text('shortName'), text('strapline'), text('accent'), text('icon'), { name: 'homeStats', type: 'group', fields: ['reviews', 'articles', 'guides'].map(name => ({ name, type: 'number', min: 0 })) }]),
  content('categories', 'name', [{name: 'topic', type: 'select', required: true, options: topics}, text('name'), textarea('description')]),
  content('tags', 'label', [text('label')]),
  content('glossary', 'term', [text('term'), textarea('definition')]),
  content('wiki', 'title', [text('articleId'), text('slug', false), text('title'), textarea('summary'), {name: 'kind', type: 'select', required: true, options: ['review', 'article', 'guide']}, {name: 'topic', type: 'select', required: true, options: topics}, text('category'), date('authoredAt', 'Publication date'), date('revisedAt', 'Content updated date'), tags, { name: 'featuredImage', type: 'group', fields: [text('src', false), text('alt', false)] }]),
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
  upload: { staticDir: `${process.env.CMS_DATA_DIR || './data'}/media`, mimeTypes: ['image/*', 'application/pdf'], imageSizes: [] },
  fields: [text('alt', false), { name: 'sourcePath', type: 'text', unique: true, index: true, admin: { description: 'Original public asset path, for imported files.' } }],
}
