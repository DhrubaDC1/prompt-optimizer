const STORAGE_KEY = 'prompt-optimizer:history'
const MAX_ENTRIES = 50

function getStorage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function safeParse(json) {
  try {
    const value = JSON.parse(json)
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function saveHistory(entries) {
  const storage = getStorage()
  if (!storage) return entries

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // storage full, disabled, or unavailable (private browsing) — drop silently
  }

  return entries
}

export function loadHistory() {
  const storage = getStorage()
  if (!storage) return []

  try {
    return safeParse(storage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function makeHistoryId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// Pinned entries don't count toward the cap, so they are never pushed out.
export function addHistoryEntry(history, entry) {
  const next = [entry, ...history]
  const kept = new Set(next.filter((item) => !item.pinned).slice(0, MAX_ENTRIES))
  return saveHistory(next.filter((item) => item.pinned || kept.has(item)))
}

export function removeHistoryEntry(history, id) {
  return saveHistory(history.filter((entry) => entry.id !== id))
}

export function togglePin(history, id) {
  return saveHistory(
    history.map((entry) => (entry.id === id ? { ...entry, pinned: !entry.pinned } : entry)),
  )
}

export function clearHistory(history) {
  return saveHistory(history.filter((entry) => entry.pinned))
}

// Pinned first, each group newest first, filtered by a case-insensitive text match.
export function visibleHistory(history, query = '') {
  const needle = query.trim().toLowerCase()
  const matches = needle
    ? history.filter((entry) =>
        `${entry.originalPrompt}\n${entry.optimizedPrompt}`.toLowerCase().includes(needle),
      )
    : history
  return [...matches.filter((entry) => entry.pinned), ...matches.filter((entry) => !entry.pinned)]
}

const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const MONTH = DAY * 30

export function formatRelativeTime(timestamp, now = Date.now()) {
  const diffSeconds = Math.max(0, Math.round((now - timestamp) / 1000))

  if (diffSeconds < MINUTE) return 'now'
  if (diffSeconds < HOUR) return `${Math.round(diffSeconds / MINUTE)}m`
  if (diffSeconds < DAY) return `${Math.round(diffSeconds / HOUR)}h`
  if (diffSeconds < MONTH) return `${Math.round(diffSeconds / DAY)}d`
  return `${Math.round(diffSeconds / MONTH)}mo`
}
