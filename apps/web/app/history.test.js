import assert from 'node:assert/strict'
import test from 'node:test'

function createMemoryStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  }
}

globalThis.localStorage = createMemoryStorage()

const { loadHistory, addHistoryEntry, removeHistoryEntry, clearHistory, formatRelativeTime } =
  await import('./history.js')

function entry(id, overrides = {}) {
  return {
    id,
    originalPrompt: 'make a dashboard',
    optimizedPrompt: 'Build a customer-support dashboard.',
    mode: 'chat',
    target: null,
    score: null,
    createdAt: Date.now(),
    ...overrides,
  }
}

test('starts empty and persists added entries across loads', () => {
  assert.deepEqual(loadHistory(), [])

  const afterAdd = addHistoryEntry(loadHistory(), entry('a'))
  assert.equal(afterAdd.length, 1)
  assert.deepEqual(loadHistory(), afterAdd)
})

test('newest entries come first and the list caps at 50', () => {
  let history = []
  for (let index = 0; index < 55; index += 1) {
    history = addHistoryEntry(history, entry(`id-${index}`))
  }

  assert.equal(history.length, 50)
  assert.equal(history[0].id, 'id-54')
  assert.equal(history.at(-1).id, 'id-5')
})

test('removes a single entry by id and leaves the rest', () => {
  let history = addHistoryEntry([], entry('a'))
  history = addHistoryEntry(history, entry('b'))

  const afterRemove = removeHistoryEntry(history, 'a')
  assert.deepEqual(
    afterRemove.map((item) => item.id),
    ['b'],
  )
  assert.deepEqual(loadHistory(), afterRemove)
})

test('clears all entries', () => {
  let history = addHistoryEntry([], entry('a'))
  history = clearHistory()

  assert.deepEqual(history, [])
  assert.deepEqual(loadHistory(), [])
})

test('formats relative time in coarsening buckets', () => {
  const now = Date.now()
  assert.equal(formatRelativeTime(now - 10_000, now), 'now')
  assert.equal(formatRelativeTime(now - 5 * 60_000, now), '5m')
  assert.equal(formatRelativeTime(now - 3 * 3_600_000, now), '3h')
  assert.equal(formatRelativeTime(now - 2 * 86_400_000, now), '2d')
  assert.equal(formatRelativeTime(now - 60 * 86_400_000, now), '2mo')
})
