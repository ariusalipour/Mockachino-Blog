'use client'
import { useEffect, useState } from 'react'
import { SelectInput, useDocumentInfo, useField } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'
import { selectedValues } from './taxonomyState'

/** Use Payload's own accessible field styling; persist the website slug, not a database ID. */
export function PolicyProject({ path, readOnly }: TextFieldClientProps) {
  const field = useField<string>({ path })
  const { id } = useDocumentInfo()
  const [options, setOptions] = useState<{ label: string; value: string }[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const projects: { label: string; value: string }[] = []
        for (let page = 1; ; page++) {
          const params = new URLSearchParams({ depth: '0', limit: '100', page: String(page), sort: 'name', draft: 'true' })
          const response = await fetch(`/api/projects?${params}`, { credentials: 'same-origin', signal: controller.signal })
          if (!response.ok) throw new Error('Project catalogue unavailable')
          const result = await response.json()
          for (const doc of result.docs) {
            const slug = String(doc.sourcePath || '').replace(/\.md$/i, '')
            if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) projects.push({ label: `${doc.name}${doc._status === 'draft' ? ' (draft)' : ''}`, value: slug })
          }
          if (!result.hasNextPage) break
        }
        setOptions(projects); setState('ready')
      } catch { if (!controller.signal.aborted) setState('error') }
    }
    void load()
    return () => controller.abort()
  }, [])
  const choices = field.value && !options.some(option => option.value === field.value) ? [...options, { label: field.value, value: field.value }] : options
  return <SelectInput path={path} name={path} label="Project" required value={field.value || ''} options={choices}
    placeholder={state === 'loading' ? 'Loading projects…' : 'Choose a project'}
    readOnly={Boolean(id || readOnly || field.disabled || state !== 'ready')} showError={field.showError}
    onChange={selection => field.setValue(selectedValues(selection)[0] || '')}
    description={state === 'error' ? 'Projects could not be loaded. Refresh this page to try again.' : id ? 'The project is fixed to preserve this policy’s address.' : 'Choose the project this policy covers. Its project page must be published before the policy.'} />
}
