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

export function addHistoryEntry(history, entry) {
  return saveHistory([entry, ...history].slice(0, MAX_ENTRIES))
}

export function removeHistoryEntry(history, id) {
  return saveHistory(history.filter((entry) => entry.id !== id))
}

export function clearHistory() {
  return saveHistory([])
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
