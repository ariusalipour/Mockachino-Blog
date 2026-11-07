'use client'
import { useEffect, useRef, useState } from 'react'
import { SelectInput, useField, useFormFields } from '@payloadcms/ui'
import type { JSONFieldClientProps, TextFieldClientProps } from 'payload'
import { categoryChoices, selectedValues, tagChoices, type CatalogueDocument } from './taxonomyState'

function useCatalogue(collection: 'categories' | 'tags') {
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
  }, [collection])
  return { docs, loading, error }
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
  const selected = Array.isArray(field.value) ? field.value : []
  return <SelectInput path={path} name={path} label="Tags" hasMany isSortable value={selected}
    options={tagChoices(catalogue.docs, selected)} placeholder={catalogue.loading ? 'Loading tags…' : 'Search and select tags'}
    readOnly={Boolean(readOnly || field.disabled || catalogue.loading || catalogue.error)} showError={field.showError}
    onChange={selection => field.setValue(selectedValues(selection))}
    description={catalogue.error ? 'Tags could not be loaded. Refresh this page to try again.' : 'Choose any relevant tags. Manage new tags in the Tags collection.'} />
}
