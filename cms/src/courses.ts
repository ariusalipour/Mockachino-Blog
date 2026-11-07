import { randomBytes } from 'node:crypto'
import { createHash } from 'node:crypto'
import { ValidationError, type CollectionConfig, type CollectionBeforeValidateHook, type Field, type PayloadRequest } from 'payload'
import { websiteEditor } from './editor'
import { categoryIdentifier, topicOptions, titleSlug } from './wiki-authoring'
import { contentHash, markdownToRichText, richTextToMarkdown, type MediaRecord } from './richtext'

type Data = Record<string, any>
export const learningSlugs = ['courses', 'course-lessons', 'quizzes'] as const
export type LearningSlug = typeof learningSlugs[number]
const identities = { courses: ['courseId', 'CRS'], 'course-lessons': ['lessonId', 'LES'], quizzes: ['quizId', 'QIZ'] } as const
const authenticated = ({ req }: any) => Boolean(req.user)
const publishedOrAuthenticated = ({ req }: any) => req.user ? true : { _status: { equals: 'published' } }
function fail(req: PayloadRequest, collection: LearningSlug, path: string, message: string): never {
  throw new ValidationError({ collection, req, errors: [{ path, message }] })
}
function relationID(value: any): string | number | undefined { return value && typeof value === 'object' ? value.id : value ?? undefined }
const dateValue = (value: unknown) => value && Number.isFinite(Date.parse(String(value))) ? new Date(String(value)).toISOString() : value ?? null
async function semantics(data: Data, req: PayloadRequest) {
  const media = await req.payload.find({ collection: 'media', depth: 0, pagination: false, overrideAccess: true, req })
  const body = data.content ? richTextToMarkdown(data.content, { mediaByID: new Map(media.docs.map(m => [String(m.id), m as MediaRecord])) }) : ''
  return JSON.stringify({ title: data.title ?? '', summary: data.summary ?? '', topic: data.topic ?? null, category: data.category ?? null,
    tags: data.tags ?? [], body, featuredImage: data.featuredImage?.src ? {src:data.featuredImage.src,alt:data.featuredImage.alt ?? ''} : null,
    authoredAt: dateValue(data.authoredAt), lessons: (data.lessons || []).map((r: any) => ({lesson: relationID(r.lesson),quiz:relationID(r.quiz) ?? null})),
    finalQuiz: relationID(data.finalQuiz) ?? null,
    questions: (data.questions || []).map((q: any) => ({question:q.question,explanation:q.explanation,answers:(q.answers || []).map((a: any)=>({text:a.text,correct:Boolean(a.correct)}))})), extraFrontmatter:data.extraFrontmatter ?? null })
}
async function validatePublished(collection: LearningSlug, data: Data, req: PayloadRequest) {
  if (collection === 'courses') {
    if (!topicOptions.some(option=>option.value===data.topic)) fail(req, collection, 'topic', 'Choose a topic.')
    const categories = await req.payload.find({collection:'categories',where:{and:[{topic:{equals:data.topic}},{_status:{equals:'published'}}]},draft:false,depth:0,pagination:false,overrideAccess:true,req})
    if (!categories.docs.some(doc=>categoryIdentifier(doc)===data.category)) fail(req,collection,'category','Choose a published category from the selected topic.')
    const tags = await req.payload.find({collection:'tags',where:{_status:{equals:'published'}},draft:false,depth:0,pagination:false,overrideAccess:true,req})
    const knownTags = new Set(tags.docs.map(doc=>doc.sourcePath.replace(/\.md$/i,'').split('/').at(-1)!.toLowerCase()))
    if (!Array.isArray(data.tags) || data.tags.some((tag: any)=>typeof tag!=='string' || !knownTags.has(tag.toLowerCase()))) fail(req,collection,'tags','Choose published tags from the catalogue.')
    const rows = data.lessons || []
    if (!rows.length) fail(req,collection,'lessons','Add at least one published lesson before publishing the course.')
    const seen = new Set<string>()
    const requirePublished = async (target: 'course-lessons' | 'quizzes', value: any, path: string) => {
      const id = relationID(value)
      if (!id) fail(req,collection,path,'Choose a published item.')
      const targetDoc = await req.payload.findByID({collection:target,id:id!,draft:false,depth:0,overrideAccess:true,req}).catch(()=>null)
      if (!targetDoc || targetDoc._status!=='published') fail(req,collection,path,'Publish this item before publishing the course.')
    }
    for (let i=0;i<rows.length;i++) {
      const id = String(relationID(rows[i].lesson) ?? '')
      if (seen.has(id)) fail(req,collection,`lessons.${i}.lesson`,'Each lesson can appear only once in a course.')
      seen.add(id)
      await requirePublished('course-lessons', rows[i].lesson, `lessons.${i}.lesson`)
      if (rows[i].quiz) await requirePublished('quizzes', rows[i].quiz, `lessons.${i}.quiz`)
    }
    if (data.finalQuiz) await requirePublished('quizzes',data.finalQuiz,'finalQuiz')
  }
  if (collection === 'quizzes') {
    if (!Array.isArray(data.questions) || !data.questions.length) fail(req,collection,'questions','Add at least one question.')
    for (let i=0;i<data.questions.length;i++) {
      const question = data.questions[i]
      if (typeof question.question !== 'string' || !question.question.trim()) fail(req,collection,`questions.${i}.question`,'Enter a question.')
      if (typeof question.explanation !== 'string' || !question.explanation.trim()) fail(req,collection,`questions.${i}.explanation`,'Explain the correct answer.')
      if (!Array.isArray(question.answers) || question.answers.length<2 || question.answers.some((a:any)=>typeof a.text !== 'string' || !a.text.trim())) fail(req,collection,`questions.${i}.answers`,'Add at least two non-empty answers.')
      if (question.answers.filter((a:any)=>a.correct===true).length!==1) fail(req,collection,`questions.${i}.answers`,'Mark exactly one answer as correct.')
    }
  }
}
function automate(collection: LearningSlug): CollectionBeforeValidateHook {
 return async ({data,originalDoc,operation,req})=>{
  if(!data) return data
  const original=originalDoc as Data | undefined
  const [idField,prefix]=identities[collection]
  const preserve=req.context.preserveLearningMetadata || req.context.richTextMigration || req.context.isRestoringVersion
  const now=new Date().toISOString()
  if(!preserve) {
    if(operation==='create') {
      data[idField] ||= `${prefix}-${now.slice(0,10).replaceAll('-','')}-${randomBytes(8).toString('hex').toUpperCase()}`
      data.sourcePath ||= `${data[idField]}.md`
      data.authoredAt ||= now; data.revisedAt ||= data.authoredAt
      if(collection==='courses') data.tags ??= []
    } else if(original) {
      data[idField]=original[idField];data.sourcePath=original.sourcePath;data.slug=original.slug
      data.authoredAt ||= original.authoredAt;data.revisedAt=original.revisedAt
    }
    const title=String(data.title ?? original?.title ?? '')
    if(!data.slug && titleSlug(title)) {
      const identity=String(data[idField] ?? original?.[idField])
      data.slug=`${titleSlug(title)}-${identity.split('-').at(-1)!.toLowerCase()}`
    }
  }
  const outgoing={...original,...data}
  if(outgoing._status==='published') {
    if (typeof outgoing.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(outgoing.slug)) fail(req,collection,'slug','Use a safe, single-segment website address.')
    await validatePublished(collection,outgoing,req)
    if(!outgoing.slug || !outgoing.sourcePath || !outgoing[idField]) fail(req,collection,'title','Enter a title so publishing details can be generated.')
    if(!preserve && operation==='update' && original) {
      const live=await req.payload.findByID({collection,id:original.id,draft:false,depth:0,overrideAccess:true,req})
      if(live._status!=='published' || await semantics(live,req)!==await semantics(outgoing,req)) data.revisedAt=now
    }
  }
  if(collection!=='quizzes' && data.content) {
    const media=await req.payload.find({collection:'media',depth:0,pagination:false,overrideAccess:true,req})
    richTextToMarkdown(data.content,{mediaByID:new Map(media.docs.map(m=>[String(m.id),m as MediaRecord]))})
  } else if(collection!=='quizzes' && operation==='create' && data.body && !data.content) {
    const media=await req.payload.find({collection:'media',depth:0,pagination:false,overrideAccess:true,req})
    data.content=markdownToRichText(data.body,{mediaBySource:new Map(media.docs.flatMap(m=>m.sourcePath ? [[`/${m.sourcePath.replace(/^\//,'')}`,m as MediaRecord] as const] : []))})
    data.contentMigration={version:1,lexicalHash:contentHash(data.content),markdownHash:createHash('sha256').update(data.body).digest('hex')}
  }
  return data
 }
}
const title: Field={name:'title',type:'text',required:true}
const summary: Field={name:'summary',type:'textarea',required:true}
const content: Field={name:'content',type:'richText',editor:websiteEditor}
const featuredImage: Field={name:'featuredImage',type:'group',fields:[{name:'src',type:'text'},{name:'alt',type:'text'}]}
function details(collection:LearningSlug):Field {
 const [idField,label]=identities[collection]
 return {type:'collapsible',label:'Publishing details',admin:{initCollapsed:true},fields:[
  {name:'sourcePath',label:'Content filename',type:'text',unique:true,index:true,admin:{readOnly:true},validate:(v:unknown)=>!v || typeof v==='string' && /^[A-Za-z0-9_-]+\.md$/.test(v) || 'Invalid content filename.'},
  {name:idField,label:collection==='courses'?'Course ID':collection==='course-lessons'?'Lesson ID':'Quiz ID',type:'text',admin:{readOnly:true}},
  {name:'slug',label:'Website address',type:'text',unique:true,index:true,admin:{readOnly:true}},
  {name:'authoredAt',label:'Publication date',type:'date',admin:{date:{pickerAppearance:'dayAndTime'},description:'Defaults to first save; edit to backdate the publication date.'}},
  {name:'revisedAt',label:'Content updated date',type:'date',admin:{readOnly:true}},
  {name:'extraFrontmatter',label:'Additional metadata',type:'json',admin:{hidden:true}},
 ]}
}
function learningCollection(slug:LearningSlug,fields:Field[]):CollectionConfig {
 return {slug,admin:{useAsTitle:'title',group:'Courses',defaultColumns:['title','_status','slug']},access:{read:publishedOrAuthenticated,create:authenticated,update:authenticated,delete:authenticated},
 versions:{drafts:{schedulePublish:{timeFormat:'HH:mm',timeIntervals:5}},maxPerDoc:20},hooks:{beforeValidate:[automate(slug)]},fields:[...fields,details(slug),
 {name:'body',type:'textarea',admin:{hidden:true,readOnly:true},access:{create:()=>false,update:()=>false}},
 {name:'contentMigration',type:'json',admin:{hidden:true,readOnly:true},access:{create:()=>false,update:()=>false}},
 ]}
}
export const learningCollections:CollectionConfig[]=[
 learningCollection('courses',[
  {name:'topic',type:'select',required:true,options:topicOptions},
  {name:'category',type:'text',required:true,admin:{components:{Field:'./components/WikiTaxonomy#WikiCategory'}}},
  {name:'tags',type:'json',required:true,defaultValue:[],admin:{components:{Field:'./components/WikiTaxonomy#WikiTags'}}},title,summary,{...content,label:'Course introduction'},featuredImage,
  {name:'lessons',type:'array',label:'Lessons in order',admin:{description:'Publish lesson articles first, then add and drag them into course order. Quizzes are optional.'},fields:[
   {name:'lesson',type:'relationship',relationTo:'course-lessons',required:true},{name:'quiz',type:'relationship',relationTo:'quizzes'},
  ]},
  {name:'finalQuiz',type:'relationship',relationTo:'quizzes'},
 ]),
 learningCollection('course-lessons',[title,summary,content,featuredImage]),
 learningCollection('quizzes',[title,{name:'questions',type:'array',required:true,minRows:1,fields:[
  {name:'question',type:'textarea',required:true},{name:'answers',type:'array',required:true,minRows:2,fields:[{name:'text',type:'text',required:true},{name:'correct',label:'Correct answer',type:'checkbox',defaultValue:false}]},
  {name:'explanation',type:'textarea',required:true},
 ]}]),
]
