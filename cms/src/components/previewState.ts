/** Payload scopes a Lexical block to its own Form (parentPath is empty).
 * Root fields therefore use `url`, not `.url`; retain prefixes for nested forms. */
export function blockSiblingPath(path: string | undefined, name: string): string {
  const parent = String(path || '').split('.').slice(0, -1).filter(Boolean)
  return [...parent, name].join('.')
}
export function blockSiblingValue(fields: Record<string, { value?: unknown } | undefined>, path: string | undefined, name: string): unknown {
  return fields[blockSiblingPath(path, name)]?.value
}
