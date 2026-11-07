import { createHash } from 'node:crypto'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'

type TreeNode = { type: string; [key: string]: any }
export type RichText = { root: TreeNode }
export type MediaRecord = { id: string | number; sourcePath?: string | null; url?: string | null; alt?: string | null; mimeType?: string | null; updatedAt?: string | null }
export type RichTextContext = { mediaBySource?: Map<string, MediaRecord>; mediaByID?: Map<string, MediaRecord> }
const parser = unified().use(remarkParse).use(remarkGfm)
const writer = unified().use(remarkStringify, { bullet: '-', fences: true, listItemIndent: 'one' }).use(remarkGfm)
const base = (type: string, children: TreeNode[] = [], extra: Record<string, unknown> = {}): TreeNode => ({ type, version: 1, children, direction: null, format: '', indent: 0, ...extra })
const text = (value: string, format = 0): TreeNode => ({ type: 'text', version: 1, text: value, detail: 0, format, mode: 'normal', style: '' })
const raw = (node: TreeNode, source: string) => source.slice(node.position?.start?.offset ?? 0, node.position?.end?.offset ?? source.length)
function id(value: string) { return createHash('sha256').update(value).digest('hex').slice(0, 24) }
export function parseVideoComment(value: string) {
  const match = value.trim().match(/^<!--\s*VIDEO:\s*([\s\S]*?)\s*-->$/)
  if (!match) return null
  const split = match[1].lastIndexOf(' | ')
  if (split < 0) return null
  const title = match[1].slice(0, split).trim()
  const url = match[1].slice(split + 3).trim()
  let parsed: URL
  try { parsed = new URL(url) } catch { return null }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) return null
  const host = parsed.hostname.toLowerCase().replace(/^www\./,'')
  if (!['youtube.com','youtube-nocookie.com','giphy.com'].includes(host) || !/^\/embed\/[A-Za-z0-9_-]+\/?$/.test(parsed.pathname)) return null
  return { title, url }
}
export function markdownToRichText(markdown: string, context: RichTextContext = {}): RichText {
  const ast = parser.parse(markdown) as unknown as TreeNode
  let sequence = 0
  const block = (blockType: string, fields: Record<string, unknown>): TreeNode => ({ type: 'block', version: 2, format: '', fields: { id: id(`${sequence++}:${blockType}:${JSON.stringify(fields)}`), blockType, blockName: '', ...fields } })
  const preserved = (node: TreeNode) => block('preservedMarkup', { markup: raw(node, markdown), description: `Preserved ${node.type}` })
  const inline = (nodes: TreeNode[], format = 0): TreeNode[] => nodes.flatMap((node): TreeNode[] => {
    if (node.type === 'text') return [text(node.value, format)]
    if (node.type === 'strong') return inline(node.children, format | 1)
    if (node.type === 'emphasis') return inline(node.children, format | 2)
    if (node.type === 'delete') return inline(node.children, format | 4)
    if (node.type === 'inlineCode') return [text(node.value, format | 16)]
    if (node.type === 'break') return [{ type: 'linebreak', version: 1 }]
    if (node.type === 'link') return [base('link', inline(node.children, format), { version: 3, id: id(`link:${sequence++}:${node.url}`), fields: { linkType: 'custom', url: node.url, newTab: false, title: node.title ?? '' } })]
    // Inline HTML/images/references are preserved as a whole top-level fragment.
    throw new Error(`Unsupported inline Markdown node: ${node.type}`)
  })
  const image = (node: TreeNode): TreeNode => {
    const media = context.mediaBySource?.get(node.url) || context.mediaBySource?.get(node.url.replace(/^\//, ''))
    if (media) return { type: 'upload', version: 3, format: '', id: id(`upload:${sequence++}:${node.url}`), relationTo: 'media', value: media.id, fields: { alt: node.alt ?? '', title: node.title ?? '', originalSource: node.url } }
    return block('image', { src: node.url, alt: node.alt ?? '', title: node.title ?? '' })
  }
  const convert = (node: TreeNode): TreeNode => {
    try {
      if (node.type === 'paragraph' && node.children.length === 1 && node.children[0].type === 'image') return image(node.children[0])
      if (node.type === 'paragraph') return base('paragraph', inline(node.children), { textFormat: 0, textStyle: '' })
      if (node.type === 'heading') return base('heading', inline(node.children), { tag: `h${node.depth}` })
      if (node.type === 'thematicBreak') return { type: 'horizontalrule', version: 1 }
      if (node.type === 'blockquote') return base('quote', node.children.flatMap((child: TreeNode) => {
        if (child.type !== 'paragraph') throw new Error('Complex blockquote')
        return [base('paragraph', inline(child.children), { textFormat: 0, textStyle: '' })]
      }))
      if (node.type === 'list') return base('list', node.children.map((child: TreeNode, index: number) => {
        const itemChildren: TreeNode[] = []
        for (const childNode of child.children) {
          if (childNode.type === 'paragraph') {
            if (itemChildren.length) itemChildren.push({type:'linebreak',version:1})
            itemChildren.push(...inline(childNode.children))
          }
          else if (childNode.type === 'list') itemChildren.push(convert(childNode))
          else throw new Error(`Complex list child: ${childNode.type}`)
        }
        return base('listitem', itemChildren, { value: (node.start ?? 1) + index, ...(child.checked !== null && child.checked !== undefined ? { checked: child.checked } : {}) })
      }), { listType: node.children.some((child: TreeNode) => typeof child.checked === 'boolean') ? 'check' : node.ordered ? 'number' : 'bullet', start: node.start ?? 1, tag: node.ordered ? 'ol' : 'ul' })
      if (node.type === 'code') return block('code', { language: node.lang || 'plaintext', code: node.value, meta: node.meta ?? '' })
      if (node.type === 'html') {
        const video = parseVideoComment(node.value)
        if (video) return block('video', video)
      }
      return preserved(node)
    } catch { return preserved(node) }
  }
  const children = ast.children.map(convert)
  return { root: base('root', children.length ? children : [base('paragraph',[],{textFormat:0,textStyle:''})]) }
}
function markdownTreeToString(children: TreeNode[]) { return writer.stringify({type: 'root', children} as any) }
const htmlEscape = (value: unknown) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
function assertSafeURL(value: unknown) {
  if (typeof value !== 'string' || !value || /[\u0000-\u001f]/.test(value)) throw new Error('Missing or unsafe rich text URL')
  if (/^(\/|#)/.test(value) && !value.startsWith('//')) return value
  const parsed = new URL(value)
  if (!['https:', 'http:', 'mailto:', 'tel:'].includes(parsed.protocol)) throw new Error('Unsupported rich text URL protocol')
  return value
}
export function richTextToMarkdown(content: unknown, context: RichTextContext = {}): string {
  const tree = content as RichText
  if (!tree?.root || tree.root.type !== 'root' || !Array.isArray(tree.root.children)) throw new Error('Invalid rich text document')
  const inline = (nodes: TreeNode[]): TreeNode[] => nodes.flatMap((node): TreeNode[] => {
    if (node.type === 'linebreak') return [{type: 'break'}]
    if (node.type === 'tab') return [{type:'text',value:'\t'}]
    if (node.type === 'text') {
      const flags = Number(node.format) || 0
      let wrapped: TreeNode = { type: flags & 16 ? 'inlineCode' : 'text', value: String(node.text ?? '') }
      if (flags & 1) wrapped = {type: 'strong', children: [wrapped]}
      if (flags & 2) wrapped = {type: 'emphasis', children: [wrapped]}
      if (flags & 4) wrapped = {type: 'delete', children: [wrapped]}
      let result = [wrapped]
      for (const [flag, tag] of [[8,'u'],[32,'sub'],[64,'sup'],[128,'mark']] as const) if (flags & flag) result = [{type:'html',value:`<${tag}>`}, ...result, {type:'html',value:`</${tag}>`}]
      if (node.style) result = [{type:'html',value:`<span style="${htmlEscape(node.style)}">`}, ...result, {type:'html',value:'</span>'}]
      return result
    }
    if (node.type === 'link' || node.type === 'autolink') {
      if (node.fields?.linkType === 'internal') throw new Error('Use a website URL for rich text links.')
      const url = assertSafeURL(node.fields?.url)
      const link: TreeNode = {type:'link',url,title:node.fields?.title || null,children:inline(node.children || [])}
      if (node.fields?.newTab) return [{type:'html',value:`<a href="${htmlEscape(url)}" target="_blank" rel="noopener noreferrer"${node.fields.title ? ` title="${htmlEscape(node.fields.title)}"` : ''}>`},...inline(node.children || []),{type:'html',value:'</a>'}]
      return [link]
    }
    throw new Error(`Unsupported rich text inline node: ${node.type}`)
  })
  const media = (node: TreeNode): TreeNode => {
    const mediaID = typeof node.value === 'object' && node.value ? node.value.id : node.value
    const value = context.mediaByID?.get(String(mediaID)) || (typeof node.value === 'object' && node.value ? node.value as MediaRecord : undefined)
    if (!value) throw new Error(`Rich text media ${String(node.value)} could not be resolved`)
    const legacySource = value.sourcePath ? `/${value.sourcePath.replace(/^\//, '')}` : null
    // A node may retain its occurrence fields when its selected media changes.
    // Only retain the imported URL if it still belongs to the selected asset.
    let source = node.fields?.originalSource && node.fields.originalSource === legacySource ? node.fields.originalSource : legacySource || value.url
    if (!legacySource && source) {
      const mediaURL = new URL(source, process.env.CMS_PUBLIC_URL || 'https://cms.mockachino.app')
      if(value.updatedAt)mediaURL.searchParams.set('v',value.updatedAt)
      source=mediaURL.href
    }
    const url = assertSafeURL(source)
    const alt = node.fields?.alt ?? value.alt ?? ''
    if (value.mimeType && !value.mimeType.startsWith('image/')) return {type:'paragraph',children:[{type:'link',url,title:null,children:[{type:'text',value:alt || 'Download file'}]}]}
    return {type:'paragraph',children:[{type:'image',url,alt,title:node.fields?.title || null}]}
  }
  const convert = (node: TreeNode): TreeNode[] => {
    let result: TreeNode[]
    if (node.type === 'paragraph') result = [{type:'paragraph',children:inline(node.children || [])}]
    else if (node.type === 'heading') result = [{type:'heading',depth:Number(String(node.tag).slice(1)) || 2,children:inline(node.children || [])}]
    else if (node.type === 'horizontalrule') result = [{type:'thematicBreak'}]
    else if (node.type === 'quote') {
      const children = node.children || []
      result = [{type:'blockquote',children:children.some((child: TreeNode) => ['paragraph','heading','list','block','upload'].includes(child.type)) ? children.flatMap(convert) : [{type:'paragraph',children:inline(children)}]}]
    } else if (node.type === 'list') result = [{type:'list',ordered:node.listType === 'number',start:node.start || 1,spread:false,children:(node.children || []).map((item: TreeNode) => {
      const children: TreeNode[] = []
      let run: TreeNode[] = []
      for (const child of item.children || []) {
        if (['list','paragraph','block','upload','quote','heading'].includes(child.type)) {
          if (run.length) {children.push({type:'paragraph',children:inline(run)});run=[]}
          children.push(...convert(child))
        } else run.push(child)
      }
      if(run.length)children.push({type:'paragraph',children:inline(run)})
      return {type:'listItem',spread:false,checked:node.listType === 'check' ? Boolean(item.checked) : null,children}
    })}]
    else if (node.type === 'upload') result = [media(node)]
    else if (node.type === 'block') {
      const fields = node.fields || {}
      if (fields.blockType === 'code') result = [{type:'code',lang:fields.language === 'plaintext' ? null : fields.language,meta:fields.meta || null,value:fields.code || ''}]
      else if (fields.blockType === 'image') result = [{type:'paragraph',children:[{type:'image',url:assertSafeURL(fields.src),alt:fields.alt || '',title:fields.title || null}]}]
      else if (fields.blockType === 'video') {
        const url = assertSafeURL(fields.url)
        const comment = `<!-- VIDEO: ${String(fields.title || 'Embedded video').replaceAll('-->', '—>')} | ${url} -->`
        if (!parseVideoComment(comment)) throw new Error('Video embeds must use an approved YouTube or Giphy embed URL.')
        result = [{type:'html',value:comment}]
      } else if (fields.blockType === 'preservedMarkup') result = [{type:'html',value:String(fields.markup || '')}]
      else throw new Error(`Unsupported rich text block: ${String(fields.blockType)}`)
    } else throw new Error(`Unsupported rich text node: ${node.type}`)
    if ((typeof node.format === 'string' && ['left','center','right','justify'].includes(node.format)) || node.indent) {
      const styles = [typeof node.format === 'string' && ['left','center','right','justify'].includes(node.format) ? `text-align:${node.format}` : '', node.indent ? `padding-inline-start:${Math.min(20, Math.max(0, Number(node.indent)))*2}rem` : ''].filter(Boolean).join(';')
      return [{type:'html',value:`<div style="${styles}">`}, ...result, {type:'html',value:'</div>'}]
    }
    return result
  }
  return markdownTreeToString(tree.root.children.flatMap(convert))
}
export function contentHash(content: unknown): string {
  const normalized = JSON.parse(JSON.stringify(content))
  const walk = (node: any) => {
    if (!node || typeof node !== 'object') return
    if (node.type === 'upload' && node.value && typeof node.value === 'object' && node.value.id !== undefined) node.value = node.value.id
    if (Array.isArray(node)) for (const value of node) walk(value)
    else for (const value of Object.values(node)) walk(value)
  }
  walk(normalized)
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex')
}
export function documentBody(doc: Record<string, unknown>, context: RichTextContext = {}): string {
  const migration = doc.contentMigration as { lexicalHash?: string; markdownHash?: string } | undefined
  const body = String(doc.body ?? '')
  if (!doc.content) {
    if (migration && (migration as {version?:number}).version === 1 && migration.lexicalHash !== contentHash(null))return ''
    return body
  }
  let unchangedMedia = true
  const checkMedia = (node: any) => {
    if (!node || typeof node !== 'object')return
    if (node.type === 'upload') {
      const mediaID = typeof node.value === 'object' && node.value ? node.value.id : node.value
      const media = context.mediaByID?.get(String(mediaID)) || (typeof node.value === 'object' && node.value ? node.value as MediaRecord : undefined)
      if(!media?.sourcePath || node.fields?.originalSource !== `/${media.sourcePath.replace(/^\//,'')}`)unchangedMedia=false
    }
    if(Array.isArray(node.children))node.children.forEach(checkMedia)
    if(node.root)checkMedia(node.root)
  }
  checkMedia(doc.content)
  if (unchangedMedia && migration?.lexicalHash === contentHash(doc.content) && migration.markdownHash === createHash('sha256').update(body).digest('hex')) return body
  return richTextToMarkdown(doc.content, context)
}

/** Content-only signature: ignore source syntax and retain text, formatting,
 * structure, links, image occurrences, code bytes, and raw/embed markup. */
export function markdownSignature(markdown: string): string {
  const ast=parser.parse(markdown) as unknown as TreeNode
  const events: any[]=[]
  const emit=(event:any[])=>{
    const previous=events.at(-1)
    if(event[0]==='text'&&previous?.[0]==='text'&&event[1]===previous[1])previous[2]+=event[2]
    else events.push(event)
  }
  const visit=(node:TreeNode,format=0)=>{
    if(node.type==='strong'){node.children.forEach((child:TreeNode)=>visit(child,format|1));return}
    if(node.type==='emphasis'){node.children.forEach((child:TreeNode)=>visit(child,format|2));return}
    if(node.type==='delete'){node.children.forEach((child:TreeNode)=>visit(child,format|4));return}
    if(node.type==='text'||node.type==='inlineCode'){emit(['text',format|(node.type==='inlineCode'?16:0),node.value]);return}
    if(node.type==='paragraph' && !node.children?.length)return
    const attrs:Record<string,unknown>={}
    if(node.type==='heading')attrs.depth=node.depth
    if(node.type==='list'){attrs.ordered=Boolean(node.ordered);attrs.start=node.ordered?(node.start||1):null}
    if(node.type==='listItem')attrs.checked=node.checked??null
    if(node.type==='link'||node.type==='image'){attrs.url=node.url;attrs.title=node.title||null;if(node.type==='image')attrs.alt=node.alt||''}
    if(node.type==='code'){attrs.lang=node.lang||null;attrs.meta=node.meta||null;attrs.value=node.value}
    if(node.type==='html')attrs.value=node.value
    if(node.type==='definition'){attrs.identifier=node.identifier;attrs.url=node.url;attrs.title=node.title||null}
    emit(['open',node.type,attrs])
    for(const child of node.children||[])visit(child,format)
    emit(['close',node.type])
  }
  visit(ast)
  return JSON.stringify(events)
}
