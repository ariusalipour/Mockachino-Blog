'use client'
import type { UIFieldClientProps } from 'payload'
import { useFormFields } from '@payloadcms/ui'
const siblingPath = (path: string | undefined, name: string) => `${String(path || '').split('.').slice(0,-1).join('.')}.${name}`
export function VideoPreview({path}: UIFieldClientProps) {
  const value = useFormFields(([fields]) => fields[siblingPath(path,'url')]?.value)
  const title = useFormFields(([fields]) => fields[siblingPath(path,'title')]?.value)
  let safe = false
  try { const u=new URL(String(value));safe=u.protocol==='https:' && !u.username && !u.password && !u.port && ['youtube.com','youtube-nocookie.com','giphy.com'].includes(u.hostname.toLowerCase().replace(/^www\./,'')) && /^\/embed\/[A-Za-z0-9_-]+\/?$/.test(u.pathname) } catch {}
  return safe ? <div style={{aspectRatio:'16/9',maxWidth:760}}><iframe src={String(value)} title={String(title||'Video preview')} style={{width:'100%',height:'100%',border:0}} loading="lazy" allowFullScreen sandbox="allow-scripts allow-same-origin allow-presentation" /></div> : <p>Add a supported embed URL to preview the video.</p>
}
export function ImagePreview({path}: UIFieldClientProps) {
  const value = useFormFields(([fields])=>fields[siblingPath(path,'src')]?.value)
  const alt = useFormFields(([fields])=>fields[siblingPath(path,'alt')]?.value)
  let source = String(value||'')
  if(source.startsWith('/images/'))source=`https://mockachino.app${source}`
  if(!/^https?:\/\//.test(source))return <p>Add an image URL to preview it.</p>
  return <img src={source} alt={String(alt||'')} loading="lazy" style={{maxWidth:'100%',maxHeight:420,objectFit:'contain'}} />
}
