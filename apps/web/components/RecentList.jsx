import { useState } from 'react'

import { formatRelativeTime, visibleHistory } from '../app/history.js'

function truncate(text, max = 48) {
  const trimmed = text.trim()
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed
}

export default function RecentList({ entries, onSelect, onRemove, onPin, onClear }) {
  const [query, setQuery] = useState('')

  if (!entries.length) return null

  const shown = visibleHistory(entries, query)
  const hasPinned = entries.some((entry) => entry.pinned)

  return (
    <div className="recent-list">
      <div className="recent-header">
        <span className="recent-title">Recent</span>
        {entries.some((entry) => !entry.pinned) && (
          <button type="button" className="recent-clear" onClick={onClear}>
            {hasPinned ? 'Clear unpinned' : 'Clear all'}
          </button>
        )}
      </div>

      {entries.length > 3 && (
        <input
          type="search"
          className="recent-search"
          aria-label="Search history"
          placeholder="Search history"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      )}

      <ul>
        {shown.map((entry) => (
          <li key={entry.id} className="recent-row">
            <button type="button" className="recent-row-select" onClick={() => onSelect(entry)}>
              <span className="recent-row-label">{truncate(entry.originalPrompt)}</span>
              <span className="recent-row-time">{formatRelativeTime(entry.createdAt)}</span>
            </button>
            <button
              type="button"
              className="recent-row-icon recent-row-pin"
              aria-pressed={Boolean(entry.pinned)}
              aria-label={`Pin "${truncate(entry.originalPrompt, 32)}"`}
              onClick={() => onPin(entry.id)}
            >
              {entry.pinned ? '★' : '☆'}
            </button>
            <button
              type="button"
              className="recent-row-icon"
              aria-label={`Remove "${truncate(entry.originalPrompt, 32)}" from history`}
              onClick={() => onRemove(entry.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <p className="recent-note">{shown.length ? 'Stored in your browser only.' : 'No matches.'}</p>
    </div>
  )
}
