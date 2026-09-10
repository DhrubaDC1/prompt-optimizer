import assert from 'node:assert/strict'
import test from 'node:test'

import { watchClarificationAbandonment } from './clarification-abandonment.js'

function harness(status) {
  let listener
  const beacons = []
  const doc = {
    visibilityState: 'visible',
    addEventListener(_event, callback) {
      listener = callback
    },
    removeEventListener(_event, callback) {
      if (listener === callback) listener = undefined
    },
  }
  const stop = watchClarificationAbandonment(
    () => status,
    doc,
    { sendBeacon: (...args) => beacons.push(args) },
  )

  return {
    beacons,
    hide() {
      doc.visibilityState = 'hidden'
      listener?.()
    },
    stop,
  }
}

test('sends one minimal abandonment event while clarifying', () => {
  const page = harness({ phase: 'clarify', reachedResult: false })
  page.hide()
  page.hide()

  assert.deepEqual(page.beacons, [[
    '/api/log',
    JSON.stringify({ event: 'clarification_abandoned' }),
  ]])
})

test('does not report abandonment outside clarification or after result', () => {
  const input = harness({ phase: 'input', reachedResult: false })
  const completed = harness({ phase: 'clarify', reachedResult: true })
  input.hide()
  completed.hide()

  assert.deepEqual(input.beacons, [])
  assert.deepEqual(completed.beacons, [])
})
