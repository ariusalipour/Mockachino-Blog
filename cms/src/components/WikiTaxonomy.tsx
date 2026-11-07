'use client'
import { useEffect, useRef, useState } from 'react'
import { SelectInput, useField, useFormFields } from '@payloadcms/ui'
import type { JSONFieldClientProps, TextFieldClientProps } from 'payload'
import { categoryChoices, matchingTag, newTagSlug, selectedValues, stem, tagChoices, type CatalogueDocument } from './taxonomyState'

function useCatalogue(collection: 'categories' | 'tags') {
  const [revision, setRevision] = useState(0)
  const [docs, setDocs] = useState<CatalogueDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => {
    let controller: AbortController | undefined
    const load = async () => {
      controller?.abort(); controller = new AbortController()
      const requestController = controller
      const result: CatalogueDocument[] = []
      setLoading(true); setError(false)
      try {
        for (let page = 1; ; page++) {
          const params = new URLSearchParams({ depth: '0', limit: '100', page: String(page), sort: collection === 'tags' ? 'label' : 'name', 'where[_status][equals]': 'published' })
          const response = await fetch(`/api/${collection}?${params}`, { signal: requestController.signal, credentials: 'same-origin' })
          if (!response.ok) throw new Error('Catalogue unavailable')
          const data = await response.json()
          result.push(...data.docs)
          if (!data.hasNextPage) break
        }
        setDocs(result)
      } catch (cause) { if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError(true) }
      finally { if (!requestController.signal.aborted) setLoading(false) }
    }
    void load()
    const refresh = () => { void load() }
    window.addEventListener('focus', refresh)
    return () => { controller?.abort(); window.removeEventListener('focus', refresh) }
  }, [collection, revision])
  return { docs, loading, error, refresh: () => setRevision(value => value + 1), add: (doc: CatalogueDocument) => setDocs(current => [...current.filter(item => item.sourcePath !== doc.sourcePath), doc]) }
}

export function WikiCategory({ path, readOnly }: TextFieldClientProps) {
  const field = useField<string>({ path })
  const topic = useFormFields(([fields]) => String(fields.topic?.value || ''))
  const catalogue = useCatalogue('categories')
  const previousTopic = useRef(topic)
  const initialized = useRef(false)
  useEffect(() => {
    if (field.formInitializing) { previousTopic.current = topic; return }
    if (!initialized.current) { initialized.current = true; previousTopic.current = topic; return }
    if (previousTopic.current !== topic) { field.setValue(''); previousTopic.current = topic }
  }, [topic, field.formInitializing, field.setValue])
  const options = categoryChoices(catalogue.docs, topic)
  if (field.value && !options.some(option => option.value === field.value)) options.push({ label: field.value, value: field.value })
  return <SelectInput path={path} name={path} label="Category" required value={field.value || ''}
    options={options} placeholder={!topic ? 'Choose a topic first' : catalogue.loading ? 'Loading categories…' : 'Choose a category'}
    readOnly={Boolean(readOnly || field.disabled || !topic || catalogue.loading || catalogue.error)} showError={field.showError}
    onChange={selection => field.setValue(selectedValues(selection)[0] || '')}
    description={catalogue.error ? 'Categories could not be loaded. Refresh this page to try again.' : 'Categories available for your selected topic.'} />
}

export function WikiTags({ path, readOnly }: JSONFieldClientProps) {
  const field = useField<string[]>({ path })
  const catalogue = useCatalogue('tags')
  const [label, setLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')
  const [creationError, setCreationError] = useState('')
  const pending = useRef(false)
  const selected = Array.isArray(field.value) ? field.value : []
  const latestSelected = useRef(selected)
  latestSelected.current = selected
  const disabled = Boolean(readOnly || field.disabled || catalogue.loading || catalogue.error || creating)
  const selectTag = (doc: CatalogueDocument) => {
    const value = stem(doc.sourcePath).toLowerCase()
    const current = latestSelected.current
    if (!current.some(tag => tag.toLowerCase() === value)) {
      latestSelected.current = [...current, value]
      field.setValue(latestSelected.current)
    }
    catalogue.add(doc)
    setLabel('')
    setMessage(`Selected tag: ${doc.label || value}. Save the post to keep this selection.`)
  }
  const createTag = async () => {
    if (pending.current || disabled) return
    setMessage(''); setCreationError('')
    const name = label.trim()
    if (!name) { setCreationError('Enter a tag name.'); return }
    const existing = matchingTag(catalogue.docs, name)
    if (existing) { selectTag(existing); return }
    const slug = newTagSlug(name)
    if (!slug) { setCreationError('Include at least one A–Z letter or number in the tag name.'); return }
    pending.current = true; setCreating(true)
    try {
      const response = await fetch('/api/tags', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePath: `${slug}.md`, label: name, _status: 'published' }),
      })
      if (!response.ok) {
        const params = new URLSearchParams({ depth: '0', limit: '1', 'where[sourcePath][equals]': `${slug}.md`, 'where[_status][equals]': 'published' })
        const lookup = await fetch(`/api/tags?${params}`, { credentials: 'same-origin' })
        if (lookup.ok) {
          const found = await lookup.json()
          if (found.docs?.length) { selectTag(found.docs[0]); catalogue.refresh(); return }
        }
        throw new Error(response.status === 401 || response.status === 403 ? 'Your session may have expired. Sign in again before creating a tag.' : 'The tag could not be created. Please try again, or check the Tags collection for an existing draft.')
      }
      const result = await response.json()
      if (!result.doc?.sourcePath) throw new Error('The tag was saved, but its details could not be loaded. Refresh before trying again.')
      selectTag(result.doc)
      catalogue.refresh()
    } catch (error) { setCreationError(error instanceof Error ? error.message : 'The tag could not be created. Please try again.') }
    finally { pending.current = false; setCreating(false) }
  }
  return <div>
    <SelectInput path={path} name={path} label="Tags" hasMany isSortable value={selected}
      options={tagChoices(catalogue.docs, selected)} placeholder={catalogue.loading ? 'Loading tags…' : 'Search and select tags'}
      readOnly={disabled} showError={field.showError}
      onChange={selection => field.setValue(selectedValues(selection))}
      description={catalogue.error ? 'Tags could not be loaded. Refresh this page to try again.' : 'Search existing tags or add a new tag below.'} />
    {!readOnly && <div className="field-type text" style={{ marginTop: '-12px', marginBottom: '24px' }}>
      <label className="field-label" htmlFor={`${path}-new-tag`}>New tag</label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input id={`${path}-new-tag`} type="text" value={label} maxLength={100} disabled={disabled}
          placeholder="Enter a new tag name" aria-describedby={`${path}-new-tag-help`}
          onChange={event => { setLabel(event.target.value); setCreationError(''); setMessage('') }}
          onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void createTag() } }}
          style={{ flex: 1, minWidth: 0 }} />
        <button type="button" className="btn btn--style-secondary btn--size-small" disabled={disabled || !label.trim()}
          style={{ margin: 0, whiteSpace: 'nowrap' }} onClick={() => { void createTag() }}>{creating ? 'Adding…' : 'Add tag'}</button>
      </div>
      <div id={`${path}-new-tag-help`} className="field-description">New tags are shared across posts. Adding a tag does not publish your post changes.</div>
      {creationError && <p role="alert">{creationError}</p>}
      {message && <p role="status">{message}</p>}
    </div>}
  </div>
}
