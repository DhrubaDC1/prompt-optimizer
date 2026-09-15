import assert from 'node:assert/strict'
import test from 'node:test'

process.env.GOOGLE_API_KEY = 'test-key'

let fetchMode = 'valid'
let geminiCalls = 0
const originalFetch = globalThis.fetch

globalThis.fetch = async (url, init) => {
  geminiCalls += 1

  if (fetchMode === 'rate_limited') {
    return Response.json(
      { error: { message: 'provider detail must stay private' } },
      { status: 429 },
    )
  }

  const score = {
    before: { overall: 40, subscores: [{ label: 'Clarity', value: 40 }, { label: 'Specificity', value: 35 }, { label: 'Constraints', value: 45 }] },
    after: { overall: 90, subscores: [{ label: 'Clarity', value: 92 }, { label: 'Specificity', value: 88 }, { label: 'Constraints', value: 90 }] },
  }

  const content =
    fetchMode === 'open'
      ? {
          status: 'ready',
          questions: null,
          optimizedPrompt: 'Write a haiku about rain',
          score,
        }
      : { optimizedPrompt: 'Create a customer-support dashboard.', score }

  return Response.json({
    id: 'test',
    object: 'chat.completion',
    created: 0,
    model: 'gemini-flash-lite-latest',
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

function request(body) {
  const headers = { 'content-type': 'application/json' }

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
  geminiCalls = 0
}

test('rejects invalid prompt before Gemini', async () => {
  resetCalls()
  const response = await POST(request({ prompt: '', clarifications: [] }))

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'invalid_response' })
  assert.equal(geminiCalls, 0)
})

test('rejects oversized prompt before Gemini', async () => {
  resetCalls()
  const response = await POST(request({ prompt: 'x'.repeat(8_001), clarifications: [] }))

  assert.equal(response.status, 413)
  assert.deepEqual(await response.json(), { error: 'too_long' })
  assert.equal(geminiCalls, 0)
})

test('rejects oversized serialized body before parsing', async () => {
  resetCalls()
  const response = await POST(rawRequest(' '.repeat(20_001)))

  assert.equal(response.status, 413)
  assert.deepEqual(await response.json(), { error: 'too_long' })
  assert.equal(geminiCalls, 0)
})

test('rejects too many clarifications before Gemini', async () => {
  resetCalls()
  const clarifications = Array.from({ length: 9 }, (_, index) => ({
    questionId: `q_${index}`,
    answer: 'answer',
  }))
  const response = await POST(request({ prompt: 'Make a dashboard', clarifications }))

  assert.equal(response.status, 413)
  assert.deepEqual(await response.json(), { error: 'too_long' })
  assert.equal(geminiCalls, 0)
})

test('rejects malformed and oversized answers before Gemini', async () => {
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

  assert.equal(geminiCalls, 0)
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
  const body = await response.json()
  assert.equal(body.status, 'ready')
  assert.equal(body.optimizedPrompt, 'Create a customer-support dashboard.')
  assert.equal(body.score.before.overall, 40)
  assert.equal(body.score.after.overall, 90)
  assert.equal(geminiCalls, 1)
})

test('derives round without trusting client fields', async () => {
  resetCalls()
  fetchMode = 'open'
  const response = await POST(
    request({ prompt: 'Write a haiku about rain', clarifications: [], round: 'final' }),
  )

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.status, 'ready')
  assert.equal(body.optimizedPrompt, 'Write a haiku about rain')
  assert.equal(body.score.before.overall, 40)
  assert.equal(body.score.after.overall, 90)
  assert.equal(geminiCalls, 1)
})

test('maps optimizer failures without provider details', async () => {
  resetCalls()
  fetchMode = 'rate_limited'
  const response = await POST(request({ prompt: 'Write a haiku about rain', clarifications: [] }))

  assert.equal(response.status, 429)
  assert.deepEqual(await response.json(), { error: 'rate_limited' })
  assert.equal(geminiCalls, 1)
})
