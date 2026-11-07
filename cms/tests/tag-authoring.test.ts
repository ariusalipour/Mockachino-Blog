import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchingTag, newTagSlug, tagChoices } from '../src/components/taxonomyState'

test('new tag identifiers are safe filenames while labels retain punctuation and accents', () => {
  assert.equal(newTagSlug('  Café / Tools: My “Setup”  '), 'cafe-tools-my-setup')
  assert.equal(newTagSlug('../OpenAI\\Tools.md'), 'openai-tools-md')
  assert.equal(newTagSlug('“” / ..'), '')
  const long = newTagSlug('abcdefghij '.repeat(20))
  assert.ok(long.length <= 90 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(long))
})

test('inline tag creation reuses existing mixed-case source filenames and display labels', () => {
  const existing = { sourcePath: 'OpenAI.md', label: 'OpenAI' }
  const catalogue = [existing, { sourcePath: 'ai-and-coding.md', label: 'AI & Coding' }]
  assert.equal(matchingTag(catalogue, ' openai '), existing)
  assert.equal(matchingTag(catalogue, 'OPENAI'), existing)
  assert.equal(matchingTag(catalogue, 'AI & Coding'), catalogue[1])
  assert.equal(matchingTag(catalogue, 'ai-and-coding'), catalogue[1])
  assert.equal(matchingTag(catalogue, 'unrelated'), undefined)
  assert.deepEqual(tagChoices(catalogue, ['OpenAI']).find(choice => choice.label === 'OpenAI'), { label: 'OpenAI', value: 'OpenAI' })
})
