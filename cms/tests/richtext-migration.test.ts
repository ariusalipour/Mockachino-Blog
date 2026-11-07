import {before,after,test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm} from 'node:fs/promises'
import path from 'node:path'
import {tmpdir} from 'node:os'
import {randomBytes} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {getPayload,type Payload} from 'payload'
import {sql} from '@payloadcms/db-sqlite'
import {migrateRichText} from '../src/migrate-richtext'
import {contentHash,documentBody,markdownToRichText,richTextToMarkdown} from '../src/richtext'
let payload:Payload,dir:string
before(async()=>{
 dir=await mkdtemp(path.join(tmpdir(),'cms-richtext-migration-'))
 Object.assign(process.env,{PAYLOAD_SECRET:randomBytes(32).toString('hex'),CMS_DATA_DIR:dir,DATABASE_URL:`file:${path.join(dir,'payload.db')}`,NODE_ENV:'production'})
 delete process.env.CMS_ADMIN_EMAIL;delete process.env.CMS_ADMIN_PASSWORD
 execFileSync(process.execPath,['node_modules/payload/bin.js','migrate'],{env:process.env,stdio:'pipe'})
 const {default:config}=await import('../src/payload.config');payload=await getPayload({config})
})
after(async()=>{if(payload)await payload.destroy();if(dir)await rm(dir,{recursive:true,force:true})})
const asLegacy=async(id:number)=>{
 await (payload.db as any).drizzle.run(sql`UPDATE tags SET content = NULL, content_migration = NULL WHERE id = ${id}`)
 await (payload.db as any).drizzle.run(sql`UPDATE _tags_v SET version_content = NULL, version_content_migration = NULL WHERE parent_id = ${id}`)
}
test('published and draft-only legacy documents migrate without leaking or overwriting draft edits',async()=>{
 const published=await payload.create({collection:'tags',overrideAccess:true,data:{sourcePath:'published-legacy.md',label:'Public label',body:'Public **body**',_status:'published'}})
 await payload.update({collection:'tags',id:published.id,draft:true,overrideAccess:true,data:{label:'PRIVATE draft label',body:'Private *draft* body',content:null,_status:'draft'}})
 const draftOnly=await payload.create({collection:'tags',draft:true,overrideAccess:true,data:{sourcePath:'draft-only.md',label:'Draft only',body:'Draft-only original',_status:'draft'}})
 await asLegacy(published.id);await asLegacy(draftOnly.id)
 const result=await migrateRichText(payload)
 assert.equal(result.report.tags.converted,2)
 const live=await payload.findByID({collection:'tags',id:published.id,draft:false,overrideAccess:true})
 const draft=await payload.findByID({collection:'tags',id:published.id,draft:true,overrideAccess:true})
 assert.equal(live.label,'Public label');assert.equal(live.body,'Public **body**');assert.ok(live.content)
 assert.equal(draft.label,'PRIVATE draft label');assert.equal(draft.body,'Private *draft* body');assert.ok(draft.content)
 assert.match(richTextToMarkdown(draft.content),/Private \*draft\* body/)
 const edited=markdownToRichText('New **private rich text** edit')
 await payload.update({collection:'tags',id:draftOnly.id,draft:true,overrideAccess:true,data:{content:edited,_status:'draft'}})
 const second=await migrateRichText(payload)
 assert.equal(second.report.tags.converted,0);assert.equal(second.report.tags.drafts,0)
 const stillEdited=await payload.findByID({collection:'tags',id:draftOnly.id,draft:true,overrideAccess:true})
 assert.equal(contentHash(stillEdited.content),contentHash(edited))
 const publicDocs=await payload.find({collection:'tags',overrideAccess:false,draft:false,pagination:false})
 assert.ok(publicDocs.docs.every(doc=>doc.label!=='PRIVATE draft label'&&doc.id!==draftOnly.id))
})
test('migration never merges private optional fields or JSON/group values into published content',async()=>{
 const published=await payload.create({collection:'wiki',overrideAccess:true,data:{sourcePath:'codes/optional.md',articleId:'OPTIONAL',title:'Public',summary:'Public summary',kind:'article',topic:'codes',category:'software-tools',authoredAt:'2020-01-01T00:00:00Z',revisedAt:'2020-02-01T00:00:00Z',tags:[],body:'Public body',extraFrontmatter:{nested:{public:'kept'}},_status:'published'}})
 await payload.update({collection:'wiki',id:published.id,draft:true,overrideAccess:true,data:{slug:'private-slug',summary:'PRIVATE summary',body:'PRIVATE body',content:null,featuredImage:{src:'https://example.invalid/private.png',alt:'PRIVATE alt'},extraFrontmatter:{nested:{private:'SECRET'}},_status:'draft'}})
 await (payload.db as any).drizzle.run(sql`UPDATE wiki SET content = NULL, content_migration = NULL WHERE id = ${published.id}`)
 await (payload.db as any).drizzle.run(sql`UPDATE _wiki_v SET version_content = NULL, version_content_migration = NULL WHERE parent_id = ${published.id}`)
 await migrateRichText(payload)
 const live=await payload.findByID({collection:'wiki',id:published.id,draft:false,overrideAccess:true})
 const draft=await payload.findByID({collection:'wiki',id:published.id,draft:true,overrideAccess:true})
 assert.equal(live.slug,null);assert.equal(live.summary,'Public summary');assert.equal(live.featuredImage?.src,null)
 assert.deepEqual(live.extraFrontmatter,{nested:{public:'kept'}})
 assert.equal(draft.slug,'private-slug');assert.equal(draft.featuredImage?.alt,'PRIVATE alt');assert.deepEqual(draft.extraFrontmatter,{nested:{private:'SECRET'}})
})
test('restoring a historical Markdown version initializes its visual rich text',async()=>{
 const original=await payload.create({collection:'tags',overrideAccess:true,data:{sourcePath:'historical.md',label:'Historical',body:'Historical **Markdown**',_status:'published'}})
 const versions=await payload.findVersions({collection:'tags',where:{parent:{equals:original.id}},sort:'createdAt',overrideAccess:true})
 const version=versions.docs[0]
 await (payload.db as any).drizzle.run(sql`UPDATE _tags_v SET version_content = NULL, version_content_migration = NULL WHERE id = ${version.id}`)
 await payload.update({collection:'tags',id:original.id,overrideAccess:true,data:{content:markdownToRichText('Later edit'),_status:'published'}})
 const restored=await payload.restoreVersion({collection:'tags',id:version.id,overrideAccess:true})
 assert.ok(restored.content);assert.match(richTextToMarkdown(restored.content),/Historical \*\*Markdown\*\*/)
})
test('clearing the visual editor never resurrects its Markdown backup, including after a migration rerun',async()=>{
 const original=await payload.create({collection:'tags',overrideAccess:true,data:{sourcePath:'clear-content.md',label:'Clear content',body:'Original legacy body',_status:'published'}})
 const cleared=await payload.update({collection:'tags',id:original.id,overrideAccess:true,data:{body:'Original legacy body',content:null,_status:'published'}})
 assert.equal(cleared.content,null);assert.equal(cleared.body,'Original legacy body');assert.equal(documentBody(cleared as unknown as Record<string,unknown>),'')
 await migrateRichText(payload)
 const stillClear=await payload.findByID({collection:'tags',id:original.id,draft:false,overrideAccess:true})
 assert.equal(stillClear.content,null);assert.equal(documentBody(stillClear as unknown as Record<string,unknown>),'')
})
test('a conversion failure rolls back earlier document writes',async()=>{
 const first=await payload.create({collection:'tags',overrideAccess:true,data:{sourcePath:'a-rollback.md',label:'Valid first',body:'Valid body',_status:'published'}})
 const invalid=await payload.create({collection:'tags',overrideAccess:true,data:{sourcePath:'z-rollback.md',label:'Invalid last',body:'Original',_status:'published'}})
 await asLegacy(first.id);await asLegacy(invalid.id)
 await (payload.db as any).drizzle.run(sql`UPDATE tags SET body = '![Unsafe](javascript:alert(1))' WHERE id = ${invalid.id}`)
 await assert.rejects(migrateRichText(payload),/Unsupported rich text URL/)
 const rolledBack=await payload.findByID({collection:'tags',id:first.id,draft:false,overrideAccess:true})
 assert.equal(rolledBack.content,null)
})
