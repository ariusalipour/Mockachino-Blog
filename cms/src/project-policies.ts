import { ValidationError, type CollectionBeforeValidateHook, type PayloadRequest } from 'payload'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
function fail(req: PayloadRequest, path: string, message: string): never {
  throw new ValidationError({ collection: 'project-policies', req, errors: [{ path, message }] })
}

/** A canonical unique filename reserves one policy of each kind per project. */
export const automateProjectPolicy: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data) return data
  const original = originalDoc as Record<string, any> | undefined
  const outgoing = { ...original, ...data }
  if (original?.id && (outgoing.project !== original.project || outgoing.type !== original.type)) fail(req, 'project', 'The project and policy type cannot change after creation. Create a separate policy instead.')
  if (typeof outgoing.project !== 'string' || !slugPattern.test(outgoing.project)) fail(req, 'project', 'Enter the project’s stable website slug, for example tarkov-time-capsule.')
  if (!['terms', 'privacy'].includes(outgoing.type)) fail(req, 'type', 'Choose Terms of Service or Privacy Policy.')
  data.sourcePath = `${outgoing.project}/${outgoing.type}.md`
  const matches = await req.payload.find({ collection: 'project-policies', where: { sourcePath: { equals: data.sourcePath } }, draft: true, pagination: false, depth: 0, overrideAccess: true, req })
  if (matches.docs.some(doc => String(doc.id) !== String(original?.id))) fail(req, 'type', 'This project already has this policy. Edit the existing policy instead.')
  if (outgoing._status === 'published') {
    const projects = await req.payload.find({ collection: 'projects', where: { and: [{ sourcePath: { equals: `${outgoing.project}.md` } }, { _status: { equals: 'published' } }] }, draft: false, depth: 0, limit: 1, overrideAccess: true, req })
    if (!projects.docs.length) fail(req, 'project', 'Publish the matching project before publishing its policy.')
    if (!outgoing.effectiveAt || !Number.isFinite(Date.parse(outgoing.effectiveAt))) fail(req, 'effectiveAt', 'Set the date this policy takes effect before publishing.')
    const hasText = (node: any): boolean => Boolean(node && (typeof node.text === 'string' && node.text.trim() || Array.isArray(node.children) && node.children.some(hasText)))
    if (!(outgoing.content ? hasText(outgoing.content.root) : typeof outgoing.body === 'string' && outgoing.body.trim())) fail(req, 'content', 'Add the policy text before publishing.')
  }
  data.revisedAt = new Date().toISOString()
  return data
}
