import assert from 'node:assert/strict'
import test from 'node:test'

import { INITIAL_STATE, PHASE, reducer } from './prompt-state.js'

test('retains original prompt and retry request through an error', () => {
  const request = { prompt: 'Make a dashboard', clarifications: [] }
  const loading = reducer(INITIAL_STATE, { type: 'START', request })
  const failed = reducer(loading, { type: 'FAIL', error: 'upstream_timeout' })
  const retrying = reducer(failed, { type: 'START', request: failed.retryRequest })

  assert.equal(loading.phase, PHASE.LOADING)
  assert.equal(failed.phase, PHASE.ERROR)
  assert.equal(retrying.phase, PHASE.LOADING)
  assert.equal(retrying.originalPrompt, request.prompt)
  assert.deepEqual(retrying.retryRequest, request)
})
