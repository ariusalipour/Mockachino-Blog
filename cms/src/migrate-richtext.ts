import { createHash } from 'node:crypto'
import { createLocalReq, initTransaction, commitTransaction, killTransaction, type Payload, type CollectionSlug } from 'payload'
import { legacyCollectionSlugs as collectionSlugs, toSiteDocument } from './site-content'
import { contentHash, markdownSignature, markdownToRichText, richTextToMarkdown, type MediaRecord } from './richtext'

type Doc = Record<string, any> & {id:string | number}
export async function migrateRichText(payload: Payload, {dryRun = false} = {}) {
  const req = await createLocalReq({context:{richTextMigration:true}}, payload)
  const started = await initTransaction(req)
  if(!started)throw new Error('Rich text migration requires a database transaction')
  const report: Record<string, {converted:number;skipped:number;drafts:number}> = {}
  const before: Record<string, unknown[]> = {}
  const forcedAfter: Record<string, unknown[]> = {}
  try {
    const mediaResult = await payload.find({collection:'media',pagination:false,depth:0,overrideAccess:true,req})
    const mediaByID = new Map(mediaResult.docs.map(doc=>[String(doc.id),doc as MediaRecord]))
    const mediaBySource = new Map(mediaResult.docs.flatMap(doc=>doc.sourcePath ? [[`/${doc.sourcePath.replace(/^\//,'')}`,doc as MediaRecord] as const] : []))
    const context = {mediaByID,mediaBySource}
    const convert = (doc:Doc) => {
      const body = String(doc.body ?? '')
      const content = markdownToRichText(body, context)
      const serialized = richTextToMarkdown(content, context)
      if(markdownSignature(body)!==markdownSignature(serialized))throw new Error(`Rich text conversion changed content semantics: ${String(doc.sourcePath)}`)
      return {content,contentMigration:{version:1,lexicalHash:contentHash(content),markdownHash:createHash('sha256').update(body).digest('hex')}}
    }
    for (const slug of collectionSlugs) {
      report[slug]={converted:0,skipped:0,drafts:0}
      before[slug]=[];forcedAfter[slug]=[]
      const main = await payload.find({collection:slug,pagination:false,depth:0,draft:false,overrideAccess:true,sort:'sourcePath',req})
      // Capture both states before writes: publishing a migration creates a new version.
      for (const value of main.docs) {
        const doc = value as unknown as Doc
        const latest = await payload.findByID({collection:slug,id:doc.id,draft:true,depth:0,overrideAccess:true,req}) as unknown as Doc
        const published = doc._status === 'published'
        const mainMigrated = Boolean(doc.content || doc.contentMigration?.version === 1)
        const draftMigrated = Boolean(latest.content || latest.contentMigration?.version === 1)
        // Draft-only documents live primarily in the versions table. Never
        // reconvert their stale main-row body over an already edited rich draft.
        if (!published) {
          if(draftMigrated)report[slug].skipped++
          else {
            report[slug].converted++;report[slug].drafts++
            if(!dryRun){
              const converted=convert(latest)
              const draftData: Record<string,any>={...latest,...converted,_status:'draft'}
              delete draftData.id;delete draftData.createdAt;delete draftData.updatedAt
              const saved=await payload.update({collection:slug,id:doc.id,data:draftData,draft:true,depth:0,overrideAccess:true,req}) as unknown as Doc
              await payload.update({collection:slug,id:doc.id,data:{contentMigration:{...converted.contentMigration,lexicalHash:contentHash(saved.content)},_status:'draft'},draft:true,depth:0,overrideAccess:true,req})
            }
          }
          continue
        }
        before[slug].push(toSiteDocument(slug,doc,context))
        if (mainMigrated) {
          report[slug].skipped++
          forcedAfter[slug].push({...toSiteDocument(slug,doc,context),body:doc.content ? richTextToMarkdown(doc.content,context) : toSiteDocument(slug,doc,context).body})
        } else {
          const converted=convert(doc)
          forcedAfter[slug].push({...toSiteDocument(slug,doc,context),body:richTextToMarkdown(converted.content,context)})
          if(!dryRun) {
            const publishedData: Record<string,any>={...doc,...converted,_status:'published'}
            delete publishedData.id;delete publishedData.createdAt;delete publishedData.updatedAt
            const saved=await payload.update({collection:slug,id:doc.id,data:publishedData,draft:false,depth:0,overrideAccess:true,req}) as unknown as Doc
            await payload.update({collection:slug,id:doc.id,data:{contentMigration:{...converted.contentMigration,lexicalHash:contentHash(saved.content)},_status:'published'},draft:false,depth:0,overrideAccess:true,req})
          }
          report[slug].converted++
        }
        if(latest._status==='draft' && !draftMigrated) {
          report[slug].drafts++
          if(!dryRun) {
            const converted=convert(latest)
            const draftData: Record<string,any>={...latest,...converted,_status:'draft'}
            delete draftData.id;delete draftData.createdAt;delete draftData.updatedAt
            const saved=await payload.update({collection:slug,id:doc.id,data:draftData,draft:true,depth:0,overrideAccess:true,req}) as unknown as Doc
            await payload.update({collection:slug,id:doc.id,data:{contentMigration:{...converted.contentMigration,lexicalHash:contentHash(saved.content)},_status:'draft'},draft:true,depth:0,overrideAccess:true,req})
          }
        } else if(latest._status==='draft' && draftMigrated && published && !mainMigrated && !dryRun) {
          // A previously edited rich-text draft must remain the latest draft after
          // migrating an older published Markdown version of the same document.
          const draftData: Record<string,any>={...latest,_status:'draft'}
          delete draftData.id;delete draftData.createdAt;delete draftData.updatedAt
          await payload.update({collection:slug,id:doc.id,data:draftData,draft:true,depth:0,overrideAccess:true,req})
        }
      }
    }
    // In-process rendered semantic gate is supplied by the repo verifier when
    // running on the NAS or a full checkout; independently compare structural
    // content invariants inside the migration so packaged CMS images fail closed.
    for(const slug of collectionSlugs)for(let index=0;index<before[slug].length;index++){
      const left=before[slug][index] as any,right=forcedAfter[slug][index] as any
      if(JSON.stringify(left.data)!==JSON.stringify(right.data)||left.sourcePath!==right.sourcePath)throw new Error(`Metadata changed during conversion: ${slug}/${left.sourcePath}`)
    }
    const after: Record<string,unknown[]>={}
    const legacyHashes: Record<string,string>={}
    for(const slug of collectionSlugs){
      const result=await payload.find({collection:slug,pagination:false,depth:0,draft:false,overrideAccess:true,where:{_status:{equals:'published'}},sort:'sourcePath',req})
      after[slug]=result.docs.map(value=>{const doc=value as unknown as Doc;legacyHashes[`${slug}/${doc.sourcePath}`]=createHash('sha256').update(String(doc.body??'')).digest('hex');return toSiteDocument(slug,doc,context)})
    }
    if(started) {
      if(dryRun)await killTransaction(req)
      else await commitTransaction(req)
    }
    return {version:1,dryRun,report,legacyHashes,after:{version:1,complete:true,collections:after},before:{version:1,complete:true,collections:before},forcedAfter:{version:1,complete:true,collections:forcedAfter}}
  } catch(error) { if(started)await killTransaction(req);throw error }
}
