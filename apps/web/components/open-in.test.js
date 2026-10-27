import assert from 'node:assert/strict'
import test from 'node:test'

import { openInUrl } from './open-in.js'

test('prefills supported chat sites', () => {
  assert.equal(openInUrl('claude', 'a b&c'), 'https://claude.ai/new?q=a%20b%26c')
  assert.equal(openInUrl('chatgpt', 'hi'), 'https://chatgpt.com/?q=hi')
  assert.equal(openInUrl('grok', 'hi'), 'https://grok.com/?q=hi')
})

test('opens Gemini and over-long prompts without a query', () => {
  assert.equal(openInUrl('gemini', 'hi'), 'https://gemini.google.com/app')
  assert.equal(openInUrl('claude', 'x'.repeat(6_001)), 'https://claude.ai/new')
})

test('has no link for agent tools or any model', () => {
  assert.equal(openInUrl('claude-code', 'hi'), null)
  assert.equal(openInUrl(null, 'hi'), null)
})
