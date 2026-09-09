import assert from 'node:assert/strict'
import test from 'node:test'

process.env.GROQ_API_KEY = 'test-key'
process.env.UPSTASH_REDIS_REST_URL = 'https://upstash.test'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

let fetchMode = 'valid'
let limitMode = 'allow'
let groqCalls = 0
let limitCalls = 0
let lastLimitCommand
const originalFetch = globalThis.fetch

globalThis.fetch = async (url, init) => {
  if (String(url).startsWith('https://upstash.test')) {
    limitCalls += 1
    lastLimitCommand = JSON.parse(init.body)

    if (limitMode === 'error') {
      return Response.json({ error: 'private Upstash detail' }, { status: 500 })
    }

    return Response.json({ result: [limitMode === 'deny' ? -1 : 9, 10] })
  }

  groqCalls += 1

  if (fetchMode === 'rate_limited') {
    return Response.json(
      { error: { message: 'provider detail must stay private' } },
      { status: 429 },
    )
  }

  const content =
    fetchMode === 'open'
      ? {
          status: 'ready',
          questions: null,
          optimizedPrompt: 'Write a haiku about rain',
        }
      : { optimizedPrompt: 'Create a customer-support dashboard.' }

  return Response.json({
    id: 'test',
    object: 'chat.completion',
    created: 0,
    model: 'openai/gpt-oss-20b',
    choices: [
      {
        index: 0,
        finish_reason: 'stop',
        message: {
          role: 'assistant',
          content: JSON.stringify(content),
        },
      },
    ],
  })
}

const { POST } = await import('./route.js')

function request(body, forwardedFor) {
  const headers = { 'content-type': 'application/json' }
  if (forwardedFor) headers['x-forwarded-for'] = forwardedFor

  return new Request('http://localhost/api/optimize', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function rawRequest(body) {
  return new Request('http://localhost/api/optimize', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })
}

test.after(() => {
  globalThis.fetch = originalFetch
})

function resetCalls() {
  limitMode = 'allow'
  groqCalls = 0
  limitCalls = 0
  lastLimitCommand = undefined
}

test('rejects invalid prompt before Groq', async () => {
  resetCalls()
  const response = await POST(request({ prompt: '', clarifications: [] }))

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'invalid_response' })
  assert.equal(groqCalls, 0)
  assert.equal(limitCalls, 1)
})

test('rejects oversized prompt before Groq', async () => {
  resetCalls()
  const response = await POST(request({ prompt: 'x'.repeat(8_001), clarifications: [] }))

  assert.equal(response.status, 413)
  assert.deepEqual(await response.json(), { error: 'too_long' })
  assert.equal(groqCalls, 0)
})

test('rejects oversized serialized body before parsing', async () => {
  resetCalls()
  const response = await POST(rawRequest(' '.repeat(20_001)))

  assert.equal(response.status, 413)
  assert.deepEqual(await response.json(), { error: 'too_long' })
  assert.equal(groqCalls, 0)
})

test('rejects too many clarifications before Groq', async () => {
  resetCalls()
  const clarifications = Array.from({ length: 9 }, (_, index) => ({
    questionId: `q_${index}`,
    answer: 'answer',
  }))
  const response = await POST(request({ prompt: 'Make a dashboard', clarifications }))

  assert.equal(response.status, 413)
  assert.deepEqual(await response.json(), { error: 'too_long' })
  assert.equal(groqCalls, 0)
})

test('rejects malformed and oversized answers before Groq', async () => {
  resetCalls()

  for (const [answer, status, error] of [
    [{ type: 'support' }, 400, 'invalid_response'],
    ['x'.repeat(1_001), 413, 'too_long'],
    [['x'.repeat(1_001)], 413, 'too_long'],
  ]) {
    const response = await POST(
      request({
        prompt: 'Make a dashboard',
        clarifications: [{ questionId: 'q_type', answer }],
      }),
    )

    assert.equal(response.status, status)
    assert.deepEqual(await response.json(), { error })
  }

  assert.equal(groqCalls, 0)
})

test('returns ready response for valid final-round request', async () => {
  resetCalls()
  fetchMode = 'valid'
  const response = await POST(
    request({
      prompt: 'Make a dashboard',
      clarifications: [{ questionId: 'q_type', answer: 'Customer support' }],
      round: 'open',
    }),
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    status: 'ready',
    optimizedPrompt: 'Create a customer-support dashboard.',
  })
  assert.equal(groqCalls, 1)
})

test('derives round without trusting client fields', async () => {
  resetCalls()
  fetchMode = 'open'
  const response = await POST(
    request({ prompt: 'Write a haiku about rain', clarifications: [], round: 'final' }),
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    status: 'ready',
    optimizedPrompt: 'Write a haiku about rain',
  })
  assert.equal(groqCalls, 1)
})

test('maps optimizer failures without provider details', async () => {
  resetCalls()
  fetchMode = 'rate_limited'
  const response = await POST(request({ prompt: 'Write a haiku about rain', clarifications: [] }))

  assert.equal(response.status, 429)
  assert.deepEqual(await response.json(), { error: 'rate_limited' })
  assert.equal(groqCalls, 1)
})

test('uses sliding-window limit and first valid forwarded IP', async () => {
  resetCalls()
  fetchMode = 'valid'
  const response = await POST(
    request(
      {
        prompt: 'Make a dashboard',
        clarifications: [{ questionId: 'q_type', answer: 'Customer support' }],
      },
      'not-an-ip, 203.0.113.7, 10.0.0.1',
    ),
  )

  assert.equal(response.status, 200)
  assert.match(lastLimitCommand[3], /:ip:203\.0\.113\.7:/)
  assert.equal(lastLimitCommand[6], 10)
  assert.equal(lastLimitCommand[8], 3_600_000)
})

test('uses shared fallback when forwarded IP is unavailable', async () => {
  resetCalls()
  fetchMode = 'valid'
  const response = await POST(
    request({
      prompt: 'Make a dashboard',
      clarifications: [{ questionId: 'q_type', answer: 'Customer support' }],
    }),
  )

  assert.equal(response.status, 200)
  assert.match(lastLimitCommand[3], /:ip:unknown:/)
})

test('returns rate_limited without calling Groq', async () => {
  resetCalls()
  limitMode = 'deny'
  const response = await POST(request({ prompt: 'Write a haiku', clarifications: [] }))

  assert.equal(response.status, 429)
  assert.deepEqual(await response.json(), { error: 'rate_limited' })
  assert.equal(groqCalls, 0)
})

test('hides Upstash failures and fails closed', async () => {
  resetCalls()
  limitMode = 'error'
  const response = await POST(request({ prompt: 'Write a haiku', clarifications: [] }))

  assert.equal(response.status, 502)
  assert.deepEqual(await response.json(), { error: 'upstream_error' })
  assert.equal(groqCalls, 0)
})
