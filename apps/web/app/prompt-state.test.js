import assert from 'node:assert/strict'
import test from 'node:test'

import {
  INITIAL_STATE,
  PHASE,
  clarificationAnswers,
  reducer,
} from './prompt-state.js'

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

test('keeps answers while moving between clarification questions', () => {
  const questions = [
    { id: 'q_type', type: 'single_select' },
    { id: 'q_notes', type: 'text' },
  ]
  const clarifying = reducer(INITIAL_STATE, { type: 'CLARIFY', questions })
  const answered = reducer(clarifying, {
    type: 'ANSWER',
    questionId: 'q_type',
    answer: 'Customer support',
  })
  const next = reducer(answered, { type: 'NEXT' })
  const back = reducer(next, { type: 'BACK' })

  assert.equal(clarifying.phase, PHASE.CLARIFY)
  assert.equal(clarifying.index, 0)
  assert.deepEqual(clarifying.answers, {})
  assert.equal(next.index, 1)
  assert.equal(back.index, 0)
  assert.equal(back.answers.q_type, 'Customer support')
})

test('serializes answered questions and forces a final sole-question round', () => {
  const questions = [
    { id: 'q_type', type: 'single_select' },
    { id: 'q_features', type: 'multi_select' },
  ]

  assert.deepEqual(clarificationAnswers(questions, {
    q_type: 'Customer support',
    q_features: ['Search', 'Analytics'],
  }), [
    { questionId: 'q_type', answer: 'Customer support' },
    { questionId: 'q_features', answer: ['Search', 'Analytics'] },
  ])
  assert.deepEqual(clarificationAnswers([questions[0]], {}, questions[0]), [
    { questionId: 'q_type', answer: '' },
  ])
})

test('edits result and starts over with original rough prompt', () => {
  const roughPrompt = 'Make a dashboard'
  const loading = reducer(INITIAL_STATE, {
    type: 'START',
    request: { prompt: roughPrompt, clarifications: [] },
    replaceOriginal: true,
  })
  const result = reducer(loading, { type: 'RESULT', optimizedPrompt: 'Build a dashboard.' })
  const edited = reducer(result, { type: 'EDIT_RESULT', optimizedPrompt: 'Build a clear dashboard.' })
  const restarted = reducer(edited, { type: 'START_OVER' })

  assert.equal(edited.optimizedPrompt, 'Build a clear dashboard.')
  assert.equal(restarted.phase, PHASE.INPUT)
  assert.equal(restarted.prompt, roughPrompt)
  assert.equal(restarted.originalPrompt, roughPrompt)
})
