import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createHeadlessEditor } from '@payloadcms/richtext-lexical/lexical/headless'
import { editorConfigFactory, getEnabledNodes } from '@payloadcms/richtext-lexical'
import type { RichTextField } from 'payload'
import { contentHash, documentBody, markdownToRichText, parseVideoComment, richTextToMarkdown, type MediaRecord } from '../src/richtext'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root=fileURLToPath(new URL('../../',import.meta.url))
const walk=(node:any, callback:(node:any)=>void) => {callback(node);for(const child of node.children||[])walk(child,callback);if(node.root)walk(node.root,callback)}
test('all original content survives the real Lexical editor and forced Astro rendering, including native media', async()=>{
  process.env.PAYLOAD_SECRET='rich-text-rendering-test-secret-at-least-32-characters'
  const {default:config}=await import('../src/payload.config')
  const sanitized=await config
  const field=sanitized.collections.find(c=>c.slug==='wiki')!.fields.find(f=>'name'in f && f.name==='content') as RichTextField
  const editorConfig=editorConfigFactory.fromField({field})
  const {readRepositoryContent}=await import(new URL('../../scripts/cms-content.mjs',import.meta.url).href)
  const {compareSnapshots}=await import(new URL('../../scripts/cms-richtext-verify.mjs',import.meta.url).href)
  const before=await readRepositoryContent(root)
  const mediaBySource=new Map<string,MediaRecord>(),mediaByID=new Map<string,MediaRecord>()
  for(const docs of Object.values(before.collections) as any[])for(const doc of docs)walk(markdownToRichText(doc.body),node=>{if(node.type==='block'&&node.fields.blockType==='image'&&!mediaBySource.has(node.fields.src)){
    const record={id:mediaBySource.size+1,sourcePath:node.fields.src.replace(/^\//,''),url:`https://cms.mockachino.app/api/media/file/${mediaBySource.size+1}`,mimeType:'image/png'}
    mediaBySource.set(node.fields.src,record);mediaByID.set(String(record.id),record)
  }})
  const after=structuredClone(before)
  let uploadCount=0
  for(const docs of Object.values(after.collections) as any[])for(const doc of docs){
    const content=markdownToRichText(doc.body,{mediaBySource})
    const editor=createHeadlessEditor({nodes:getEnabledNodes({editorConfig}),onError:error=>{throw error}})
    editor.setEditorState(editor.parseEditorState(JSON.stringify(content)))
    const saved=editor.getEditorState().toJSON()
    walk(saved,node=>{if(node.type==='upload')uploadCount++})
    doc.body=richTextToMarkdown(saved,{mediaByID})
  }
  assert.equal(uploadCount,45)
  const result=await compareSnapshots(before,after)
  assert.equal(result.documents,173)
})
test('media selection replacement and file replacement never reuse a stale imported URL',()=>{
  const source='/images/original.png',body=`![Original alt](${source} "Original title")\n`
  const oldMedia={id:1,sourcePath:'images/original.png',url:'/api/media/file/original.png',mimeType:'image/png'}
  const content=markdownToRichText(body,{mediaBySource:new Map([[source,oldMedia]])})
  const record={body,content,contentMigration:{lexicalHash:contentHash(content),markdownHash:createHash('sha256').update(body).digest('hex')}}
  assert.equal(documentBody(record,{mediaByID:new Map([['1',oldMedia]])}),body)
  const replacement={id:2,sourcePath:null,url:'/api/media/file/new.png',mimeType:'image/png',updatedAt:'2026-11-07T12:00:00Z'}
  const node=content.root.children[0];node.value=2
  const rendered=richTextToMarkdown(content,{mediaByID:new Map([['2',replacement]])})
  assert.ok(rendered.includes('https://cms.mockachino.app/api/media/file/new.png?v='))
  assert.ok(!rendered.includes('/images/original.png'))
  assert.ok(rendered.includes('Original alt')&&rendered.includes('Original title'))
  node.value=1
  const fileReplacement={...replacement,id:1}
  assert.ok(documentBody(record,{mediaByID:new Map([['1',fileReplacement]])}).includes('/api/media/file/new.png?v='))
  node.value={...oldMedia}
  assert.ok(documentBody(record,{mediaByID:new Map([['1',fileReplacement]])}).includes('/api/media/file/new.png?v='))
})
test('embeds share the Astro allowlist and preserve titles containing pipes',()=>{
  assert.equal(parseVideoComment('<!-- VIDEO: A | B | https://www.youtube.com/embed/abc123?feature=oembed -->')?.title,'A | B')
  for(const url of ['https://u:p@www.youtube.com/embed/abc','https://www.youtube.com:8080/embed/abc','https://www.youtube.com/embed/abc/extra','https://evil.example/embed/abc','javascript:alert(1)']){
    assert.equal(parseVideoComment(`<!-- VIDEO: Test | ${url} -->`),null)
    const content=markdownToRichText('text');content.root.children=[{type:'block',fields:{blockType:'video',title:'Test',url}}]
    assert.throws(()=>richTextToMarkdown(content))
  }
})
test('unknown nodes fail closed and rich text formatting survives serialization',()=>{
  const content=markdownToRichText('Hello')
  content.root.children[0].children[0].format=1|2|8
  assert.match(richTextToMarkdown(content),/<u>\*\*\*Hello\*\*\*<\/u>/)
  content.root.children.push({type:'unrecognized-plugin-node'})
  assert.throws(()=>richTextToMarkdown(content),/Unsupported rich text node/)
})
