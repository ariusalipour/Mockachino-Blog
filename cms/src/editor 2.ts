import { BlocksFeature, CodeBlock, FixedToolbarFeature, LinkFeature, UploadFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import type { Block } from 'payload'
const code = CodeBlock({ slug: 'code', defaultLanguage: 'plaintext', languages: { plaintext:'Plain text', bash:'Shell', css:'CSS', html:'HTML', javascript:'JavaScript', json:'JSON', jsx:'JSX', markdown:'Markdown', python:'Python', sql:'SQL', tsx:'TSX', typescript:'TypeScript', yaml:'YAML' } })
const blocks: Block[] = [
  { ...code, fields: [...code.fields, {name:'meta', type:'text', admin:{description:'Optional code fence metadata.'}}] },
  { slug:'video', labels:{singular:'Video embed',plural:'Video embeds'}, fields:[
    {name:'title',type:'text',required:true},
    {name:'url',type:'text',required:true,admin:{description:'YouTube /embed/ or Giphy /embed/ HTTPS URL.'}},
    {name:'preview',type:'ui',admin:{components:{Field:'./components/BlockPreview#VideoPreview'}}},
  ] },
  { slug:'image', labels:{singular:'External image',plural:'External images'}, fields:[
    {name:'src',type:'text',required:true}, {name:'alt',type:'text'}, {name:'title',type:'text'},
    {name:'preview',type:'ui',admin:{components:{Field:'./components/BlockPreview#ImagePreview'}}},
  ] },
  { slug:'preservedMarkup', labels:{singular:'Preserved content',plural:'Preserved content'}, fields:[
    {name:'description',type:'text',admin:{description:'Original content that does not have a native editor representation.'}},
    {name:'markup',type:'code',required:true,admin:{language:'markdown',description:'Retained losslessly. Edit only when the original markup is needed.'}},
  ] },
]
export const websiteEditor = lexicalEditor({
  features: ({defaultFeatures}) => [
    ...defaultFeatures.filter(feature => !['relationship','link','upload'].includes(feature.key)),
    LinkFeature({enabledCollections:[],fields:({defaultFields}) => [...defaultFields,{name:'title',type:'text'}]}),
    UploadFeature({enabledCollections:['media'],collections:{media:{fields:[
      {name:'alt',label:'Alternative text for this image',type:'text'},
      {name:'title',label:'Optional image title',type:'text'},
      {name:'originalSource',type:'text',admin:{hidden:true,readOnly:true}},
    ]}}}),
    BlocksFeature({blocks}), FixedToolbarFeature(),
  ],
})
