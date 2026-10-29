import assert from 'node:assert/strict'
import test from 'node:test'

import { diffWords } from './word-diff.js'

const join = (parts, types) =>
  parts
    .filter((part) => types.includes(part.type))
    .map((part) => part.text)
    .join('')

test('marks added and removed words and rebuilds both texts', () => {
  const before = 'write a blog post about remote work'
  const after = 'Write a 1,200-word blog post about sustainable remote work'
  const parts = diffWords(before, after)

  assert.equal(join(parts, ['same', 'add']), after)
  assert.equal(join(parts, ['same', 'del']), before)
  assert.ok(parts.some((part) => part.type === 'add' && part.text.includes('1,200-word')))
  assert.ok(parts.some((part) => part.type === 'del' && part.text.includes('write')))
})

test('identical and empty inputs', () => {
  assert.deepEqual(diffWords('same text', 'same text'), [{ type: 'same', text: 'same text' }])
  assert.deepEqual(diffWords('', 'new'), [{ type: 'add', text: 'new' }])
  assert.deepEqual(diffWords('old', ''), [{ type: 'del', text: 'old' }])
})

test('handles prompts near the size cap quickly', () => {
  const before = Array.from({ length: 1500 }, (_, index) => `w${index}`).join(' ')
  const after = Array.from({ length: 3000 }, (_, index) => `w${index * 2}`).join(' ')
  const started = performance.now()
  const parts = diffWords(before, after)

  assert.equal(join(parts, ['same', 'add']), after)
  assert.ok(performance.now() - started < 1000)
})
