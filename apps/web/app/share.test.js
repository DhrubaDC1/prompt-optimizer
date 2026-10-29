import assert from 'node:assert/strict'
import test from 'node:test'

import { readShareHash, shareUrl } from './share.js'

test('round-trips prompts, including non-ASCII text, through the fragment', () => {
  const entry = {
    originalPrompt: 'écris un haïku 🌧',
    optimizedPrompt: 'Écris un haïku sur la pluie.\n\n"Trois vers."',
    mode: 'chat',
    target: 'claude',
  }
  const url = shareUrl('https://example.com/', entry)

  assert.match(url, /^https:\/\/example\.com\/#s=[A-Za-z0-9_-]+$/)
  assert.deepEqual(readShareHash(new URL(url).hash), { ...entry, score: null, changes: null })
})

test('rejects malformed or out-of-bounds links', () => {
  const encode = (data) => new URL(shareUrl('https://x.test/', data)).hash

  assert.equal(readShareHash(''), null)
  assert.equal(readShareHash('#other=1'), null)
  assert.equal(readShareHash('#s=not*base64'), null)
  assert.equal(readShareHash('#s=bm90IGpzb24'), null)
  assert.equal(readShareHash(encode({ originalPrompt: 'a', optimizedPrompt: ' ', mode: 'chat' })), null)
  assert.equal(readShareHash(encode({ originalPrompt: 'a', optimizedPrompt: 'b', mode: 'video' })), null)
  assert.equal(
    readShareHash(encode({ originalPrompt: 'x'.repeat(8_001), optimizedPrompt: 'b', mode: 'chat' })),
    null,
  )
})
