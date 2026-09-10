import assert from 'node:assert/strict'
import test from 'node:test'

import { POST } from './route.js'

function request(body) {
  return new Request('http://localhost/api/log', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

test('logs only supported minimal events', async () => {
  const originalLog = console.log
  const logged = []
  console.log = (line) => logged.push(line)

  try {
    assert.equal((await POST(request({ event: 'prompt_copied' }))).status, 204)
    assert.equal((await POST(request({ event: 'clarification_abandoned' }))).status, 204)
  } finally {
    console.log = originalLog
  }

  assert.deepEqual(logged, [
    JSON.stringify({ event: 'prompt_copied' }),
    JSON.stringify({ event: 'clarification_abandoned' }),
  ])
})

test('rejects malformed, unsupported, and non-minimal events', async () => {
  assert.equal((await POST(request('not json'))).status, 400)
  assert.equal((await POST(request({ event: 'unknown' }))).status, 400)
  assert.equal(
    (await POST(request({ event: 'prompt_copied', prompt: 'private' }))).status,
    400,
  )
})
