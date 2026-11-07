import test from 'node:test'
import assert from 'node:assert/strict'
import { blockSiblingPath, blockSiblingValue } from '../src/components/previewState'

test('Lexical block previews read URL/title from the block-scoped root form', () => {
  // Lexical BlockContent renders a separate Form with parentPath="".
  const fields = {
    url: { value: 'https://www.youtube.com/embed/mT8XCFO1RPQ?feature=oembed' },
    title: { value: 'CZ Scorpion review' },
    src: { value: 'https://example.com/image.png' },
    alt: { value: 'Image description' },
  }
  assert.equal(blockSiblingPath('preview','url'),'url')
  assert.equal(blockSiblingPath(undefined,'url'),'url')
  assert.equal(blockSiblingValue(fields,'preview','url'),fields.url.value)
  assert.equal(blockSiblingValue(fields,'preview','title'),fields.title.value)
  assert.equal(blockSiblingValue(fields,'preview','src'),fields.src.value)
  assert.equal(blockSiblingValue(fields,'preview','alt'),fields.alt.value)
})
test('preview sibling lookup retains nested form prefixes and never reads another block', () => {
  const fields = {'blocks.0.url':{value:'first'},'blocks.1.url':{value:'second'},url:{value:'unrelated'}}
  assert.equal(blockSiblingValue(fields,'blocks.1.preview','url'),'second')
  assert.equal(blockSiblingValue(fields,'blocks.2.preview','url'),undefined)
})
