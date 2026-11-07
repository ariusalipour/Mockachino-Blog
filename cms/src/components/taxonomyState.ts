export type CatalogueDocument = { sourcePath: string; topic?: string; name?: string; label?: string }
export type Choice = { label: string; value: string }
export function stem(sourcePath: string): string { return sourcePath.split('/').at(-1)!.replace(/\.md$/i, '') }
export function categoryChoices(docs: CatalogueDocument[], topic: string): Choice[] {
  return docs.filter(doc => doc.topic === topic).map(doc => {
    const key = stem(doc.sourcePath)
    return { label: doc.name || key, value: key.startsWith(`${topic}-`) ? key.slice(topic.length + 1) : key }
  }).sort((a, b) => a.label.localeCompare(b.label))
}
export function tagChoices(docs: CatalogueDocument[], selected: string[] = []): Choice[] {
  const choices = docs.map(doc => {
    const canonical = stem(doc.sourcePath).toLowerCase()
    return { label: doc.label || canonical, value: selected.find(tag => tag.toLowerCase() === canonical) || canonical }
  })
  for (const value of selected) if (!choices.some(choice => choice.value === value)) choices.push({ label: value, value })
  return choices.sort((a, b) => a.label.localeCompare(b.label))
}
export function selectedValues(value: unknown): string[] {
  const choices = Array.isArray(value) ? value : value ? [value] : []
  return choices.flatMap(choice => choice && typeof choice === 'object' && 'value' in choice ? [String(choice.value)] : [])
}
