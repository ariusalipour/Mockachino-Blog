import {before,after,test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {randomBytes} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {getPayload,type Payload} from 'payload'
import {markdownToRichText} from '../src/richtext'
import {toSiteDocument} from '../src/site-content'
let payload:Payload,dir:string,editor:number
before(async()=>{
 dir=await mkdtemp(path.join(tmpdir(),'cms-courses-'))
 Object.assign(process.env,{PAYLOAD_SECRET:randomBytes(32).toString('hex'),CMS_DATA_DIR:dir,DATABASE_URL:`file:${path.join(dir,'payload.db')}`,NODE_ENV:'production'})
 delete process.env.CMS_ADMIN_EMAIL;delete process.env.CMS_ADMIN_PASSWORD
 execFileSync(process.execPath,['node_modules/payload/bin.js','migrate'],{env:process.env,stdio:'pipe'})
 const {default:config}=await import('../src/payload.config');payload=await getPayload({config})
 editor=(await payload.create({collection:'users',overrideAccess:true,data:{email:'course-editor@example.test',password:randomBytes(32).toString('hex')}})).id
 await payload.create({collection:'categories',overrideAccess:true,data:{sourcePath:'codes-software-tools.md',topic:'codes',name:'Software tools',description:'Test category',_status:'published'}})
})
after(async()=>{if(payload)await payload.destroy();if(dir)await rm(dir,{recursive:true,force:true})})
const validationMessage=(pattern:RegExp)=>(error:any)=>Boolean(error.cause?.errors?.some((field:any)=>pattern.test(field.message)))
const questions=[{question:'Which option is correct?',answers:[{text:'Correct',correct:true},{text:'Incorrect',correct:false}],explanation:'The first option is correct.'}]
const lesson=(title:string,published=true)=>payload.create({collection:'course-lessons',draft:!published,overrideAccess:true,data:{title,summary:'Lesson summary',content:markdownToRichText('# Lesson\n\nA **formatted** lesson.') as any,_status:published?'published':'draft'}})
const quiz=(title:string)=>payload.create({collection:'quizzes',overrideAccess:true,data:{title,questions,_status:'published'}})
const course=(data:any,published=true)=>payload.create({collection:'courses',draft:!published,overrideAccess:true,data:{topic:'codes',category:'software-tools',tags:[],title:'Course',summary:'Course summary',content:markdownToRichText('Course **introduction**.'),...data,_status:published?'published':'draft'}})

test('course-only articles have generated stable publishing details, visual content and private drafts',async()=>{
 const draft=await lesson('An independent course lesson',false)
 assert.match(String(draft.lessonId),/^LES-\d{8}-[A-F0-9]{16}$/)
 assert.equal(draft.sourcePath,`${draft.lessonId}.md`);assert.ok(draft.slug && draft.authoredAt)
 await assert.rejects(payload.findByID({collection:'course-lessons',id:draft.id,overrideAccess:false,draft:true}))
 await assert.rejects(payload.create({collection:'courses',draft:true,overrideAccess:false,data:{title:'Unauthorized'}}))
 const changed=await payload.update({collection:'course-lessons',id:draft.id,draft:true,overrideAccess:true,data:{title:'Renamed lesson',slug:'changed',sourcePath:'changed.md',lessonId:'CHANGED',authoredAt:'2001-01-01T00:00:00.000Z'}})
 assert.equal(changed.slug,draft.slug);assert.equal(changed.sourcePath,draft.sourcePath);assert.equal(changed.lessonId,draft.lessonId)
 assert.equal(changed.authoredAt,'2001-01-01T00:00:00.000Z')
 const published=await payload.update({collection:'course-lessons',id:draft.id,overrideAccess:true,data:{_status:'published'}})
 const exported=toSiteDocument('course-lessons',published as any)
 assert.match(exported.body,/\*\*formatted\*\*/);assert.equal(exported.data.createdAt,changed.authoredAt)
 await assert.rejects(payload.create({collection:'course-lessons',overrideAccess:true,data:{title:'Bad address',summary:'Summary',slug:'bad/path',_status:'published'}}),validationMessage(/single-segment/i))
 assert.equal((await payload.find({collection:'wiki',overrideAccess:false,pagination:false})).docs.length,0)
})

test('published quizzes require questions, two answers, exactly one correct answer and explanations',async()=>{
 await assert.rejects(payload.create({collection:'quizzes',overrideAccess:true,data:{title:'No answers',questions:[{question:'Question?',answers:[{text:'One',correct:true}],explanation:'Explanation'}],_status:'published'}}),/answer/i)
 await assert.rejects(payload.create({collection:'quizzes',overrideAccess:true,data:{title:'Two correct',questions:[{...questions[0],answers:[{text:'One',correct:true},{text:'Two',correct:true}]}],_status:'published'}}),validationMessage(/exactly one/i))
 await assert.rejects(payload.create({collection:'quizzes',overrideAccess:true,data:{title:'No explanation',questions:[{...questions[0],explanation:''}],_status:'published'}}),validationMessage(/Explain/i))
 const draft=await payload.create({collection:'quizzes',draft:true,overrideAccess:true,data:{title:'Incomplete quiz',_status:'draft'}})
 await assert.rejects(payload.findByID({collection:'quizzes',id:draft.id,draft:true,overrideAccess:false}))
 assert.ok(!(await payload.find({collection:'quizzes',draft:true,overrideAccess:false,pagination:false})).docs.some(doc=>doc.id===draft.id))
 const published=await quiz('Valid self-check')
 const exported=toSiteDocument('quizzes',published as any)
 assert.equal(exported.body,'');assert.deepEqual(exported.data.questions,questions)
 assert.ok(!JSON.stringify(exported.data.questions).includes('"id"'))
})

test('courses keep lesson order, optional quizzes and final quiz; exports prune unpublished children without leaking draft edits',async()=>{
 const a=await lesson('First ordered lesson'),b=await lesson('Second ordered lesson'),q=await quiz('Connected self-check')
 const published=await course({lessons:[{lesson:b.id,quiz:q.id},{lesson:a.id}],finalQuiz:q.id})
 await payload.update({collection:'course-lessons',id:b.id,draft:true,overrideAccess:true,data:{title:'PRIVATE lesson title'}})
 const ctx={lessonSlugsByID:new Map([[String(a.id),String(a.slug)],[String(b.id),String(b.slug)]]),quizSlugsByID:new Map([[String(q.id),String(q.slug)]])}
 const exported=toSiteDocument('courses',published as any,ctx)
 assert.deepEqual(exported.data.lessons,[{lesson:b.slug,quiz:q.slug},{lesson:a.slug}]);assert.equal(exported.data.finalQuiz,q.slug)
 assert.match(exported.body,/Course \*\*introduction\*\*/)
 await assert.rejects(course({lessons:[{lesson:a.id},{lesson:a.id}]}),validationMessage(/only once/i))
 const privateQuiz=await payload.create({collection:'quizzes',draft:true,overrideAccess:true,data:{title:'PRIVATE answers',questions,_status:'draft'}})
 await assert.rejects(course({lessons:[{lesson:a.id,quiz:privateQuiz.id}]}),validationMessage(/Publish this item/i))
 const privateLesson=await lesson('Private course lesson',false)
 await assert.rejects(course({lessons:[{lesson:privateLesson.id}]}),validationMessage(/Publish this item/i))
 await payload.update({collection:'course-lessons',id:b.id,overrideAccess:true,data:{_status:'draft'}})
 await payload.update({collection:'quizzes',id:q.id,overrideAccess:true,data:{_status:'draft'}})
 const available=await payload.find({collection:'course-lessons',where:{_status:{equals:'published'}},draft:false,overrideAccess:false,pagination:false})
 const pruned=toSiteDocument('courses',published as any,{lessonSlugsByID:new Map(available.docs.map(d=>[String(d.id),String(d.slug)])),quizSlugsByID:new Map()})
 assert.deepEqual(pruned.data.lessons,[{lesson:a.slug}]);assert.ok(!pruned.data.finalQuiz)
})

test('native scheduling publishes latest course-only article content and preserves its backdated publication identity',async()=>{
 const draft=await lesson('Scheduled lesson',false)
 const date='2002-06-01T00:00:00.000Z'
 await payload.update({collection:'course-lessons',id:draft.id,draft:true,overrideAccess:true,data:{content:markdownToRichText('Latest **scheduled** lesson.'),authoredAt:date}})
 const job=await payload.jobs.queue({task:'schedulePublish',input:{type:'publish',doc:{relationTo:'course-lessons',value:draft.id},user:{relationTo:'users',value:editor}},waitUntil:new Date(Date.now()-1000)})
 await payload.jobs.run({queue:'default',sequential:true,silent:true})
 const published=await payload.findByID({collection:'course-lessons',id:draft.id,draft:false,depth:0,overrideAccess:false})
 assert.equal(published.authoredAt,date);assert.equal(published.slug,draft.slug)
 assert.match(toSiteDocument('course-lessons',published as any).body,/Latest \*\*scheduled\*\* lesson/)
 assert.ok((await payload.findByID({collection:'payload-jobs',id:job.id,overrideAccess:true})).completedAt)
 const noOp=await payload.update({collection:'course-lessons',id:draft.id,overrideAccess:true,data:{content:published.content,authoredAt:'2002-06-01T01:00:00.000+01:00',_status:'published'}})
 assert.equal(noOp.revisedAt,published.revisedAt)
})
