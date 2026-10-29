import assert from 'node:assert/strict'
import test from 'node:test'

import { clientKey, takeToken } from './rate-limit.js'

test('allows a burst of 20, then one request per 10 seconds', () => {
  const start = 1_000_000

  for (let index = 0; index < 20; index += 1) assert.equal(takeToken('burst', start), 0)
  assert.equal(takeToken('burst', start), 10)
  assert.equal(takeToken('burst', start + 4_000), 6)
  assert.equal(takeToken('burst', start + 10_000), 0)
  assert.equal(takeToken('burst', start + 10_000), 10)
})

test('clients are counted separately and refill to full after idling', () => {
  const start = 2_000_000

  for (let index = 0; index < 20; index += 1) takeToken('busy', start)
  assert.equal(takeToken('busy', start), 10)
  assert.equal(takeToken('other', start), 0)

  for (let index = 0; index < 20; index += 1) assert.equal(takeToken('busy', start + 300_000), 0)
})

test('keys on the first forwarded address', () => {
  const request = (headers) => new Request('http://localhost/', { headers })

  assert.equal(clientKey(request({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' })), '203.0.113.7')
  assert.equal(clientKey(request({ 'x-real-ip': '198.51.100.2' })), '198.51.100.2')
  assert.equal(clientKey(request({})), 'local')
})
